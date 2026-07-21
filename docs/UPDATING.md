# Manuel de mise à jour

Ce document explique comment j'ajoute ou modifie une fonctionnalité sur EventNow sans casser l'architecture en place, comment une migration de base de données se propage jusqu'en production, et ce que déclenche réellement chaque merge. C'est le manuel que je relirais moi-même en reprenant le projet après plusieurs mois de pause.

## Ajouter une fonctionnalité dans l'architecture NestJS

Le backend est découpé en modules métier sous `backend/src/` : `events`, `bookings`, `orders`, `tickets`, `staff-invitations`, `promo-codes`, etc., chacun avec la même forme, un `*.module.ts`, un `*.controller.ts`, un `*.service.ts`, un dossier `dto/`, et les fichiers `*.spec.ts` associés. Le module `promo-codes` est un bon exemple récent à prendre comme gabarit, c'est une fonctionnalité complète mais bornée (validation d'un code, CRUD côté organisateur), sans dépendances tentaculaires vers le reste du domaine.

Concrètement, ajouter une fonctionnalité suit toujours le même chemin :

1. Un nouveau modèle Prisma si besoin (voir migration plus bas), sinon extension d'un modèle existant.
2. Un module NestJS dédié si c'est un domaine à part entière, ou une extension d'un module existant si la fonctionnalité en dépend directement (un ajout dans `tickets` a plus de sens dans `tickets` que dans un nouveau module `ticket-extras`).
3. DTO avec `class-validator` pour tout ce qui vient du client, c'est systématique dans le projet, aucun endpoint ne fait confiance à un body non validé.
4. Guards existants à réutiliser plutôt qu'à dupliquer : `RolesGuard` pour restreindre par rôle (`Role.ORGANIZER`, etc.), `EventStaffGuard` pour tout ce qui touche à un accès staff sur un événement précis. Le statut staff n'étant pas un rôle Prisma global mais une ligne dans `EventStaff`, il ne peut pas passer par `RolesGuard`.
5. Tests unitaires à côté du code (`*.spec.ts`), pas dans un dossier séparé, c'est la convention du repo, Jest les ramasse automatiquement par pattern.

Pour le frontend, une nouvelle page suit le découpage de `frontend/src/pages/`, avec les appels API centralisés dans `frontend/src/services/`. Rien d'imposé au-delà de ça, le frontend est moins strictement structuré que le backend.

## Le flux de branches

Chaque fonctionnalité ou correctif part d'une branche nommée `<numéro-ticket>-<slug>`, le numéro correspondant à l'issue GitHub, par exemple `72-annulation-dévénement` ou `67-système-de-code-promo-réductions-sur-les-billets`. Cette branche part de `develop` et y revient par pull request une fois la fonctionnalité prête. `develop` accumule ainsi plusieurs tickets avant d'être elle-même mergée dans `main`, en général quand un ensemble cohérent de fonctionnalités est stabilisé plutôt qu'à chaque ticket individuel.

C'est un point important pour la CI : `.github/workflows/ci.yml` ne se déclenche que sur un push ou une pull request vers `main`, pas sur `develop`, et pas sur les branches de ticket. Ça veut dire que le lint et les tests ne tournent pas automatiquement pendant le développement d'une fonctionnalité sur sa branche ; je les lance moi-même en local (`npm run lint`, `npm run test`) avant de pousser, et c'est seulement au moment où `develop` part vers `main` que la pipeline s'exécute pour de vrai. C'est un choix assumé pour ne pas payer des minutes CI sur chaque petit commit de ticket, mais ça veut aussi dire qu'un oubli de test en local ne se voit qu'au moment du merge vers `main`, plus tard qu'idéal.

## Migration Prisma

Le schéma vit dans `backend/prisma/schema.prisma`. Pour une modification (nouveau champ, nouveau modèle, nouvel enum), la commande à lancer est, en local, à l'intérieur du conteneur backend :

```bash
docker-compose exec backend npx prisma migrate dev --name description_du_changement
```

Ça génère un dossier horodaté dans `backend/prisma/migrations/` (le projet en compte une quinzaine à ce jour, par exemple `20260701110000_add_event_status` ou `20260516120000_add_promo_codes`) avec le SQL de la migration, et régénère le client Prisma. Ce dossier est versionné comme n'importe quel fichier du repo, il fait partie du commit de la fonctionnalité, pas d'une étape séparée.

Il n'y a rien de plus à faire pour que la migration arrive en production. Le `Dockerfile` du backend (stage `prod`) exécute `npx prisma migrate deploy && npm run start:prod` comme commande de démarrage du conteneur : à chaque déploiement, les migrations non encore appliquées sur la base de prod le sont automatiquement, dans l'ordre, avant que l'application ne démarre. Aucune commande manuelle sur le serveur, aucun script d'admin à lancer à la main.

Le point de vigilance, ce n'est pas la mécanique, elle est fiable, mais le contenu de la migration elle-même sur une table qui a déjà des données en prod : ajouter une colonne `NOT NULL` sans valeur par défaut sur une table `User` ou `Event` non vide fait planter `migrate deploy` en plein démarrage du conteneur prod, avec un rollback qui ne se fait pas tout seul. Je vérifie systématiquement qu'un nouveau champ obligatoire a soit une valeur par défaut, soit un statut nullable suivi d'un second passage pour le rendre obligatoire une fois les données rétro-remplies.

## Ce que déclenche un merge

- **Push sur une branche de ticket** : rien d'automatique. Tests et lint sont à la charge du développeur en local.
- **Pull request ou push vers `main`** (que ce soit directement, ou via le merge périodique de `develop`) : la pipeline complète se déclenche, lint backend, tests backend, build backend, lint frontend, tests frontend, build frontend, chacun comme job séparé avec ses dépendances (`test-backend` attend `lint-backend`, `test-frontend` attend `lint-frontend`, `build-frontend` attend `test-frontend`, etc.).
- **Si tous les jobs passent et que c'est bien un push sur `main`** (pas juste une PR) : le job `deploy` s'exécute, se connecte en SSH au VPS et relance `docker compose -f docker-compose.prod.yml up -d --build --remove-orphans`, ce qui rebuild les images, republie les conteneurs, et rejoue les migrations Prisma en attente comme décrit plus haut.
- Un `concurrency group` (`deploy-production`) empêche deux déploiements de se chevaucher si deux push arrivent rapprochés ; un déclenchement manuel reste possible depuis l'onglet Actions de GitHub (`workflow_dispatch`), utile pour relancer un déploiement sans nouveau commit.

En cas de régression détectée après un déploiement, je ne touche jamais directement au serveur pour corriger. Le retour arrière se fait par un `git revert` du commit fautif sur `main`, qui repasse par la même pipeline (lint, tests, build) avant de redéployer. Ça coûte quelques minutes de plus qu'un correctif à la main sur le VPS, mais ça évite qu'un état du serveur diverge silencieusement de ce que raconte l'historique Git.
