# Manuel de déploiement

Ce manuel décrit comment faire tourner EventNow en local et comment je le déploie réellement en production, avec les vrais fichiers et les vraies commandes du dépôt. Rien de générique : ce sont les étapes que je suis moi-même, avec les points qui m'ont fait perdre du temps au passage.

## Prérequis

En local, il ne faut que **Docker Desktop** et **Git**. Le backend, le frontend, PostgreSQL et Redis tournent chacun dans leur conteneur, je n'installe rien directement sur ma machine (pas de Node local nécessaire, même si le projet cible Node 20 dans les images).

En production, il faut un serveur Linux avec Docker + Docker Compose (v2, la syntaxe `docker compose` sans tiret), un nom de domaine, un reverse proxy Nginx et un certificat Let's Encrypt. J'utilise un VPS Hostinger.

Quatre services tiers interviennent, et tous sont optionnels au sens où l'application démarre et tourne sans eux : seule la fonctionnalité concernée échoue proprement.

- **Stripe** (clés test en dev, clés live en prod) pour le paiement des billets
- **Cloudinary** pour l'upload des images d'événements
- **Google OAuth** (Google Cloud Console) pour la connexion via Google
- **SMTP** : Gmail avec un mot de passe d'application, ou Mailtrap en dev pour ne pas envoyer de vrais mails

## Déploiement en local

Le fichier `docker-compose.yml` définit quatre services : `postgres`, `redis`, `backend`, `frontend`. Chacun a son `Dockerfile` avec un stage `dev` et un stage `prod`, et c'est le stage `dev` qui est utilisé en local, avec le code monté en volume pour le hot-reload.

```bash
git clone https://github.com/nicolaspoda/EventNow.git && cd EventNow
cp backend/.env.example backend/.env
docker-compose up --build
```

Le fichier `backend/.env` sert surtout pour les clés tierces (`STRIPE_*`, `CLOUDINARY_*`, `GOOGLE_*`, `MAIL_*`) : les variables réseau et base de données (`DATABASE_URL`, `REDIS_HOST`, `CORS_ORIGINS`, `FRONTEND_URL`) sont redéfinies directement dans `docker-compose.yml`, donc inutile d'y toucher pour un usage Docker classique. Il y a d'ailleurs un `.env` à la racine du dépôt, vestige d'un usage sans Docker en tout début de projet. Je ne l'utilise plus, c'est `backend/.env` qui compte maintenant.

Les migrations Prisma s'appliquent toutes seules : la commande du conteneur backend est `npm install && npx prisma generate && npx prisma migrate deploy && npm run start:dev`, donc à chaque démarrage. Pas de commande manuelle à lancer pour une base à jour.

Pour peupler la base avec des données de démo (4 comptes de test, 6 événements) :

```bash
docker-compose exec backend npx prisma db seed
```

Frontend sur `http://localhost:5173`, API sur `http://localhost:3000`.

## Déploiement en production

Le fichier `docker-compose.prod.yml` est distinct de celui de dev, ce n'est pas une variante avec des flags mais un fichier séparé. Les images utilisent le stage `prod` de chaque Dockerfile (`npm ci` + build, sans volumes), et le backend expose en plus un healthcheck HTTP sur `/api/v1/health` qui conditionne le démarrage du frontend (`depends_on: condition: service_healthy`).

Les secrets et l'URL de base de données ne sont plus dans le compose file mais dans un fichier d'environnement chargé via `env_file`, par défaut `.env.production` à la racine (à côté de `docker-compose.prod.yml`) :

```bash
cp .env.production.example .env.production   # puis éditer les vraies valeurs
docker compose -f docker-compose.prod.yml up -d --build
```

Si le fichier s'appelle autrement, la variable `EVENTNOW_ENV_FILE` permet de le pointer ailleurs (`export EVENTNOW_ENV_FILE=/chemin/vers/.env`), c'est d'ailleurs ce que fait le déploiement automatisé décrit plus bas.

Le déploiement continu passe par GitHub Actions (`.github/workflows/ci.yml`, job `deploy`) : à chaque push sur `main`, une fois lint + tests + build passés sur backend et frontend, une connexion SSH exécute sur le serveur :

```bash
git fetch origin main && git reset --hard origin/main
docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE" up -d --build --remove-orphans
```

Les secrets SSH (`DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_APP_PATH`, `DEPLOY_PORT` en option) sont stockés côté GitHub, dans l'environnement `production` du dépôt, jamais dans le code. Le job commence par une vérification que ces secrets existent et un test de connectivité TCP, pour échouer proprement avec un message clair plutôt qu'un timeout SSH opaque si le serveur est down ou le pare-feu mal configuré.

Devant les conteneurs, Nginx route les requêtes : `/api/` et `/socket.io/` vers le backend (port 3000), le reste vers le frontend (port 5173), avec le certificat Let's Encrypt sur le 443 et une redirection HTTP → HTTPS. La config prête à déployer est dans `deploy/nginx-eventnow-complete.conf`.

## Ce qui a vraiment posé problème

La CI/CD est en place depuis quasiment le début du projet, avant même la première fonctionnalité métier, mais le déploiement en continu, lui, est resté désactivé un bon moment : tant que l'application n'était pas fonctionnellement stable, mettre en prod à chaque push aurait juste automatisé la mise en ligne de bugs. Le job `deploy` n'a été activé qu'une fois le socle fonctionnel solide.

Le premier vrai déploiement a révélé un problème que le dev en local ne pouvait pas montrer : le backend avait des fallbacks sur `localhost` un peu partout (CORS, URL de callback OAuth), qui passaient inaperçus tant qu'on testait sur sa machine mais cassaient tout dès que le frontend et le backend tournaient sur un vrai domaine. Le commit `fix(deploy): add dedicated production compose and remove localhost fallbacks` a introduit `docker-compose.prod.yml` séparé précisément pour ça, afin de forcer chaque variable réseau à être explicite en prod plutôt que de compter sur une valeur par défaut qui n'a de sens qu'en local.

Le deuxième point, plus tardif, concernait Stripe et la Content Security Policy. Le formulaire de paiement (`PaymentElement`) injecte des styles inline pour son thème et charge des ressources depuis `js.stripe.com`, or la CSP par défaut (`style-src 'self'`) les bloquait silencieusement, avec un formulaire de paiement qui s'affichait cassé sans erreur explicite en dehors de la console. Il a fallu ouvrir `style-src` à `https://js.stripe.com` et `'unsafe-inline'` spécifiquement pour ce cas. Quelques jours plus tard, l'authentification 3D Secure a posé le même genre de souci avec des domaines bancaires supplémentaires à autoriser en `frame-src`, d'où la variable `STRIPE_CSP_EXTRA_HOSTS` dans `.env.production`, histoire de ne pas avoir à modifier le code à chaque nouvelle banque qui déclenche du 3DS. Le `Permissions-Policy` généré par défaut par Helmet posait aussi des warnings navigateur sur des features expérimentales non reconnues (`window-placement`) ; je le désactive côté Helmet et je le redéfinis moi-même avec uniquement les directives standards.

Une chose que je changerais si c'était à refaire : le stage `prod` du frontend sert l'application avec `vite preview`. Ça fonctionne, mais Vite le dit lui-même dans sa doc, cette commande n'est pas prévue pour de la production, c'est un serveur de prévisualisation locale. Un vrai serveur statique (Nginx servant directement le dossier `dist/`, ou même `serve`) serait plus approprié et éviterait de faire tourner un processus Node inutile juste pour distribuer des fichiers statiques déjà buildés.
