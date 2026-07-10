# EventNow - Plateforme d'événements et de billetterie

[![CI Pipeline](https://github.com/nicolaspoda/EventNow/actions/workflows/ci.yml/badge.svg)](https://github.com/nicolaspoda/EventNow/actions/workflows/ci.yml)

## Description

EventNow est une plateforme d'événements avec deux usages qui cohabitent : la billetterie classique (concerts, conférences, festivals...) et les événements communautaires, où on ne paie pas mais où on demande à participer. Autour de ça s'est greffé tout un côté social - suivre des gens, voir qui va au même événement que soi, discuter en messagerie temps réel, laisser des avis après coup - plus les outils qu'un organisateur attend (tableau de bord, stats de vente, gestion du staff, remboursements) et un peu de modération côté admin.

Trois rôles cohabitent : **Utilisateur**, **Organisateur**, et **Admin**. À côté de ça, "être staff" n'est pas un rôle global mais une affectation par événement : n'importe quel compte peut se faire inviter comme staff sur un événement précis pour scanner les billets à l'entrée, sans en être l'organisateur.

---

## Ce que chaque rôle peut faire

### Organisateur

C'est le compte qui vend des billets. Il crée des événements pros (lieu, adresse, coordonnées GPS, image de couverture, date de début et de fin, catégories de billets avec prix et stock), encaisse, et gère toute la partie commerciale : suivi des ventes et revenus dans un tableau de bord dédié, statistiques par événement, invitations du staff par e-mail, traitement des demandes de remboursement.

Un organisateur reste aussi un utilisateur comme un autre : il peut acheter des billets ailleurs, suivre des gens, utiliser la messagerie, être staff sur l'événement de quelqu'un d'autre, etc. Seuls le tableau de bord côté "client" et la page participants d'un événement communautaire sont réservés au rôle Utilisateur dans l'interface.

### Utilisateur

C'est le rôle par défaut à l'inscription. Il permet d'acheter des places sur les événements pros (réservation → checkout → Stripe, avec gestion des commandes, annulations et demandes de remboursement), mais aussi de créer ses propres événements communautaires (places limitées, sans billetterie) et de demander à y participer chez les autres.

Le reste tourne autour du social : suivre des organisateurs ou d'autres utilisateurs, devenir "amis" quand le suivi est mutuel (pas de système de demande d'ami séparé), filtrer les événements par ceux auxquels vont ses amis, discuter en messagerie (conversations directes, de groupe, ou liées à un événement), laisser un avis après avoir assisté à un événement. Sur les événements communautaires, il existe aussi une petite liste d'objets à apporter (façon "qui amène quoi") et des sondages internes à l'événement.

### Admin

Rôle de modération, sans interface de création d'événements. Un admin traite les signalements (événements ou utilisateurs) déposés par les autres comptes, peut suspendre un événement problématique, et peut bannir un compte utilisateur.

### Staff (affectation, pas un rôle)

N'importe quel Utilisateur ou Organisateur peut être invité comme staff sur un événement donné. Une fois l'invitation acceptée, il obtient un menu dédié pour scanner les billets à l'entrée et consulter l'historique des validations. Un job planifié retire automatiquement le staff des événements terminés.

---

## Fonctionnalités

**Découverte** - recherche et filtres par catégorie, type, date, ville ; carte des événements (Leaflet) et autocomplétion d'adresse.

**Billetterie** - QR code unique par place, PDF téléchargeable, validation à l'entrée par le staff, statistiques de validation, codes promo.

**Communautaire** - demandes de participation, sondages et liste d'objets à apporter par événement.

**Social** - abonnements, amis (suivi mutuel), messagerie temps réel, avis sur les événements et entre participants, profils publics, notifications in-app.

**Modération** - signalements d'événements ou d'utilisateurs, suspension d'événement, bannissement de compte (rôle Admin).

**Emails et tâches planifiées** - confirmation de commande, rappels J-7/J-1, nettoyage automatique du staff après un événement.

**Sécurité** - rate limiting (renforcé sur le paiement), Helmet, sanitization anti-XSS, CORS, CSRF, validation des DTO, logs Winston, accessibilité (tests axe), mode sombre.

---

## Stack technique

**Backend** - NestJS (TypeScript), PostgreSQL via Prisma, Redis pour les locks de réservation et les codes OAuth. Auth par JWT (email/mot de passe ou Google), paiement Stripe, upload d'images Cloudinary, emails via Nodemailer/Handlebars, PDF des billets avec PDFKit, messagerie temps réel en Socket.io. Sécurité standard (Helmet, rate limiting, validation des DTO, sanitization) et logs Winston.

**Frontend** - React 19 + TypeScript sur Vite, Tailwind pour le design system et le thème sombre, React Router. Stripe.js pour le paiement côté client, Leaflet pour la carte, Chart.js pour les stats des tableaux de bord, html5-qrcode pour le scan des billets à l'entrée. Tests avec Vitest et Testing Library, accessibilité vérifiée avec jest-axe.

**Infrastructure** - tout tourne en Docker Compose (frontend, backend, PostgreSQL, Redis), CI/CD sur GitHub Actions.

## Prérequis

- Docker Desktop
- Git

### Services tiers (optionnels)

Le projet démarre et tourne avec les valeurs par défaut de `backend/.env.example`, sans aucun compte externe. Pour activer certaines fonctionnalités, il faut renseigner de vraies clés dans `backend/.env` :

| Service                                                                                                                                                               | Fonctionnalité concernée       | Sans clé configurée                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------- |
| [Stripe](https://dashboard.stripe.com/apikeys) (clés test)                                                                                                            | Paiement des billets           | Le paiement échoue à l'appel, le reste de l'app fonctionne      |
| [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (OAuth 2.0)                                                                                 | Connexion via Google           | Le bouton Google échoue, le login email/mot de passe fonctionne |
| [Cloudinary](https://console.cloudinary.com)                                                                                                                          | Upload d'images d'événement    | L'upload échoue, créer un événement sans image fonctionne       |
| SMTP (Gmail avec [mot de passe d'application](https://myaccount.google.com/apppasswords), ou [Mailtrap](https://mailtrap.io) pour tester sans envoyer de vrais mails) | Emails (confirmation, rappels) | Les emails ne partent pas, le reste fonctionne                  |

Pour une démo complète, configurer au moins Stripe (mode test) et Cloudinary.

## Lancer le projet

Tout tourne dans Docker, rien n'est censé tourner directement sur la machine.

### 1. Récupérer le projet

Depuis Git :

```bash
git clone https://github.com/nicolaspoda/EventNow.git
cd EventNow
```

Depuis l'archive ZIP fournie : décompresser puis se placer dans le dossier extrait (`EventNow/` ou `EventNow-main/` selon l'outil utilisé).

```bash
unzip EventNow.zip
cd EventNow
```

La suite est identique dans les deux cas.

### 2. Fichier .env du backend

```bash
cp backend/.env.example backend/.env
```

À éditer si besoin : `GOOGLE_CLIENT_ID`/`SECRET` pour l'auth Google, `STRIPE_SECRET_KEY`/`STRIPE_PUBLISHABLE_KEY` pour le paiement, `CLOUDINARY_*` pour l'upload. Les variables de base (`DATABASE_URL`, `REDIS_HOST`, `CORS_ORIGINS`) sont redéfinies dans `docker-compose.yml` - inutile d'y toucher pour un usage Docker.

### 3. Démarrer l'application

```bash
docker-compose up --build
```

Ou en arrière-plan : `docker-compose up -d --build`. Les migrations Prisma s'appliquent automatiquement au démarrage du backend, aucune commande manuelle à lancer.

### 4. (Optionnel) Remplir la base avec des données de démo

```bash
docker-compose exec backend npx prisma db seed
```

Ça crée 4 comptes et 6 événements à venir :

| Rôle         | Email                   | Mot de passe     |
| ------------ | ----------------------- | ---------------- |
| Admin        | `admin@eventnow.fr`     | `Admin1234!`     |
| Organisateur | `organizer@eventnow.fr` | `Organizer1234!` |
| Utilisateur  | `user@eventnow.fr`      | `User1234!`      |
| Staff        | `staff@eventnow.fr`     | `Staff1234!`     |

Le compte staff est un compte Utilisateur classique, affecté comme staff sur l'événement "Daft Punk Tribute Night" (voir [Staff](#staff-affectation-pas-un-rôle) plus haut).

### 5. Accéder à l'application

- Frontend : http://localhost:5173
- Backend API : http://localhost:3000

**Google OAuth en Docker** : dans `backend/.env`, garder `GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback` et la même URI dans la console Google (l'hôte expose le port 3000 vers le conteneur).

## Commandes Docker

| Commande                          | Description                                        |
| --------------------------------- | -------------------------------------------------- |
| `docker-compose up --build`       | Démarrer tous les services (logs dans le terminal) |
| `docker-compose up -d --build`    | Démarrer en arrière-plan                           |
| `docker-compose down`             | Arrêter tous les services                          |
| `docker-compose logs -f backend`  | Voir les logs du backend                           |
| `docker-compose logs -f frontend` | Voir les logs du frontend                          |

## Authentification

Inscription en tant qu'Utilisateur ou en tant qu'Organisateur (formulaire séparé, avec nom d'organisation), connexion par email/mot de passe (JWT) ou via Google OAuth.

## Auteur

**Nicolas Poda**
GitHub: [@nicolaspoda](https://github.com/nicolaspoda)
