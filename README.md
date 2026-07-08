# EventNow - Plateforme d'événements et de billetterie

[![CI Pipeline](https://github.com/nicolaspoda/EventNow/actions/workflows/ci.yml/badge.svg)](https://github.com/nicolaspoda/EventNow/actions/workflows/ci.yml)

> Projet de certification RNCP39583 "Expert en développement logiciel" - Niveau 7

## Description

EventNow est une **plateforme sociale centrée sur les événements** : billetterie en ligne pour les **événements professionnels** (concerts, conférences, festivals, etc.) et **événements communautaires** sur demande de participation. Le produit combine **billetterie** (Stripe, QR codes, validation à l’entrée, stocks avec verrous Redis), **graphe social** (suivre des personnes, « amis » lorsque le suivi est mutuel, voir qui participe), **messagerie temps réel** (Socket.io), **avis** sur les événements et **avis entre participants** (après événements communautaires), **notifications in-app**, **profils publics** et **outils organisateur** (tableaux de bord, statistiques, staff, remboursements).

Deux rôles principaux existent dans l’application : **Client** et **Organisateur** (inscriptions distinctes). Un **troisième cas d’usage** concerne toute personne **invitée comme staff** sur un événement : elle peut valider des billets sans être l’organisateur du spectacle.

---

## Ce que chaque utilisateur peut faire (par rôle)

### Organisateur (`ORGANIZER`)

- **Créer et gérer des événements professionnels** : titre, description, lieu, adresse, ville, code postal, pays, coordonnées GPS, image de couverture, galerie (Cloudinary), date/heure de début et de **fin obligatoire**, catégories de billets (nom, prix minimum appliqué côté app, stock).
- **Vendre des billets** : réservation avec expiration, passage commande, **paiement Stripe** (intention de paiement), confirmation ; emails de **confirmation de commande** et **rappels J-7 / J-1**.
- **Tableau de bord organisateur** : vue d’ensemble (revenus, ventes), liste des événements, **statistiques par événement** (graphiques ventes/revenus), accès aux pages dédiées.
- **Inviter du staff** par e-mail (lien avec token), suivi des invitations ; les invités acceptent ou refusent depuis une page dédiée.
- **Traiter les demandes de remboursement** des clients (approbation / rejet).
- **Gérer les demandes de participation** sur ses **événements communautaires** (acceptation / refus) — l’organisateur est le propriétaire de l’événement concerné.
- **Modifier / supprimer** ses événements, consulter les demandes en attente sur la page prévue à cet effet.

Dans l’interface actuelle, le formulaire « Créer un événement » pour un compte organisateur est orienté **événement professionnel** (billetterie). Côté API, le modèle autorise aussi d’autres combinaisons ; le parcours client dédié aux **événements communautaires** est décrit ci-dessous.

**En tant qu’utilisateur connecté**, un organisateur peut aussi (comme tout compte authentifié le permet) : **acheter des billets** chez d’autres organisateurs, **réserver**, consulter **mes billets** (QR, PDF), **mes commandes**, **réservations** ; **demander à participer** à des événements communautaires ; **suivre / ne plus suivre** d’autres utilisateurs, voir abonnés / abonnements / **amis** (suivi mutuel) ; utiliser la **messagerie** ; être **staff** sur l’événement d’un autre organisateur ; laisser des **avis** sur un événement après y avoir assisté (billet validé pour un pro, participation acceptée pour un communautaire). Le **tableau de bord client** (`/dashboard/client`) et la page **liste des participants** d’un événement communautaire (`/dashboard/events/:id/participants`) sont réservés au rôle **Client** dans l’UI.

### Client (`CLIENT`)

- **Payer des places** sur les **événements professionnels** : parcours réservations → checkout → Stripe ; **mes billets**, **mes commandes**, **annulation** de commande lorsque c’est prévu, **demande de remboursement** côté client.
- **Créer des événements communautaires** : places limitées, type « communautaire », pas de billetterie « pro » (parcours dédié dans le formulaire de création).
- **Demander à participer** à des événements communautaires (message optionnel) ; consulter **mes événements à venir**, **mes participations**, **mon calendrier**.
- **Tableau de bord client** : vue d’ensemble et lien vers la **liste des participants** pour les événements communautaires auxquels il participe.
- **Social** : **suivre** des organisateurs ou d’autres personnes, **notifications** configurables par suivi ; les **amis** sont les personnes avec lesquelles le suivi est **mutuel** (pas d’entité « demande d’ami » séparée) ; filtre **« événements de mes amis »** dans la recherche ; indicateurs du type « X amis participent » sur les cartes d’événements ; section **activité des amis** sur le dashboard client.
- **Profil** : avatar, pseudo, mise à jour du profil ; **profil public** (`/user/:id/profile`) pour les autres utilisateurs connectés ; modales abonnés / abonnements / amis.
- **Messagerie temps réel** : conversations **directes**, **de groupe** ou **liées à un événement** ; création, ajout de membres, envoi de messages ; **recherche d’utilisateurs** pour démarrer une conversation.
- **Avis** : note + commentaire sur un **événement** après la date et après participation (billet validé ou participation acceptée) ; **avis entre participants** après un événement communautaire.
- **Être invité en staff** : accepter une invitation, puis **scanner les QR codes** à l’entrée et consulter l’**historique des validations** pour les événements où il est staff.

### Staff invité (tout compte authentifié concerné)

Indépendamment d’être Client ou Organisateur, si l’utilisateur a une **affectation staff** sur un événement :

- Menu **Staff** : **validation des billets** (scan caméra), **historique** des validations.
- Les invitations expirent ; un **job planifié** retire le staff des événements **terminés**.

---

## Fonctionnalités produit (vue d’ensemble)

**Découverte & lieux**  
Recherche et filtres (catégorie, type, date, lieu, ville), suggestions, liste des lieux/villes, **carte des événements** (Leaflet), **autocomplétion d’adresse** (géocodage).

**Billets & entrée**  
QR unique par place, PDF, validation par staff, statistiques de validation par événement.

**Contenu & médias**  
Upload / suppression d’images via Cloudinary (couverture + galerie).

**Emails & tâches planifiées**  
Confirmation commande, rappels J-7 / J-1, notifications associées ; nettoyage staff post-événement.

**Sécurité & qualité**  
Rate limiting (dont plafond paiement), Helmet, sanitization (XSS), CORS, CSRF, validation class-validator, logs Winston, accessibilité (axe, styles dédiés), **mode sombre**.

---

## Stack technique

### Backend
- **NestJS** – Framework Node.js + TypeScript
- **PostgreSQL 15** – Base de données (Prisma)
- **Redis 7** – Cache, locks (réservations), codes OAuth Google
- **JWT** – Authentification ; Passport (JWT + Google OAuth 2.0)
- **Stripe** – Paiement (payment intents)
- **Socket.io** – Messagerie temps réel
- **Cloudinary** – Hébergement d’images (upload)
- **Nodemailer** + Handlebars – Emails (confirmation commande, rappels J-7 / J-1)
- **PDFKit** – Génération des billets PDF
- **Winston** – Logs ; **@nestjs/schedule** – Jobs cron
- **Swagger** – Documentation API
- **Helmet, Throttler, class-validator, sanitize-html, csurf** – Sécurité

### Frontend
- **React 19** + TypeScript
- **Vite 7** – Build et dev
- **Tailwind CSS** – Styles ; design system et thème sombre
- **React Router 7** – Navigation
- **Axios** – Appels API
- **Socket.io-client** – Messagerie temps réel
- **Leaflet / React-Leaflet** – Carte des événements
- **Chart.js / react-chartjs-2** – Graphiques dashboards
- **react-big-calendar** – Vue calendrier
- **html5-qrcode** – Scan des billets (staff)
- **qrcode** – Affichage QR des billets
- **date-fns** – Dates
- **@axe-core/react** – Tests d’accessibilité
- **Playwright** – Tests E2E ; **Vitest** – Tests unitaires

### Infrastructure
- **Docker** + Docker Compose (frontend, backend, PostgreSQL, Redis)
- **GitHub Actions** – CI/CD

## Prérequis

- **Docker Desktop**
- Git

## Lancer le projet

Tout tourne dans Docker. Aucun service (backend, frontend, Postgres, Redis) ne tourne sur la machine : uniquement Docker.

### 1. Cloner le projet
```bash
git clone https://github.com/nicolaspoda/EventNow.git
cd EventNow
```

### 2. Fichier .env du backend
```bash
cp .env.example .env
cp .env backend/.env
```
Édite `backend/.env` si besoin (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET pour l’auth Google). Les variables de base (DATABASE_URL, REDIS_HOST) sont définies dans `docker-compose.yml` : ne pas les modifier pour l’usage Docker.

### 3. Démarrer l’application
```bash
docker-compose up --build
```
Ou en arrière-plan : `docker-compose up -d --build`.

Les **migrations Prisma** sont appliquées automatiquement au démarrage du backend (aucune commande manuelle).

### 4. (Optionnel) Remplir la base avec des données de démo
```bash
docker-compose exec backend npx prisma db seed
```
Cela crée un compte organisateur et 4 événements à venir. Compte : `organizer@eventnow.fr` / `Organizer123!`

### 5. Accéder à l’application

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000

**Google OAuth en Docker** : dans `backend/.env`, garde `GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback` et les mêmes URI dans la console Google (l’hôte expose le port 3000 vers le conteneur).

## Structure du projet
```
EventNow/
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── auth/               # Inscription, login, JWT, OAuth Google, profil, recherche users
│   │   ├── events/             # CRUD événements, recherche, filtres, catégories, lieux/villes
│   │   ├── bookings/           # Réservations (avec locks Redis)
│   │   ├── orders/             # Commandes, paiement Stripe, remboursements
│   │   ├── tickets/            # QR codes, validation, PDF, stats validations, staff events
│   │   ├── payment/            # Intégration Stripe
│   │   ├── dashboard/          # Vue organisateur (overview, events, stats) et client (overview, events, participants)
│   │   ├── upload/             # Upload / suppression d’images (Cloudinary)
│   │   ├── mail/               # Envoi d’emails (confirmation, rappels J-7 / J-1)
│   │   ├── jobs/               # Cron : rappels email, nettoyage staff événements terminés
│   │   ├── reviews/            # Avis sur les événements
│   │   ├── participant-reviews/ # Avis entre participants (événements communautaires)
│   │   ├── participation-requests/ # Demandes de participation (communautaire)
│   │   ├── notifications/     # Notifications in-app (CRUD, marquer lu, compteur)
│   │   ├── follows/            # Follow / unfollow, abonnés, abonnements, amis (mutuel)
│   │   ├── messages/           # Conversations (direct, groupe, événement), Socket.io gateway
│   │   ├── staff-invitations/  # Invitations staff par email, acceptation, expiration
│   │   ├── security/           # Helmet, rate limit, chiffrement
│   │   ├── redis/              # Service Redis (locks, OAuth codes)
│   │   ├── prisma/             # Service Prisma
│   │   ├── logger/             # Winston
│   │   └── common/             # Pipes, guards, interceptors, filters, decorators
│   └── prisma/                 # Schéma, migrations, seed
├── frontend/
│   └── src/
│       ├── components/         # UI, events, dashboard, messages, staff, reviews, etc.
│       ├── pages/              # Toutes les routes (landing, auth, events, dashboards, messages, profile…)
│       ├── services/           # API (auth, events, orders, dashboard, messages, notifications…)
│       ├── contexts/           # ThemeContext (dark mode)
│       ├── hooks/              # useAuth, useSocket, useEvents…
│       ├── utils/              # AuthContext, dates, qrCode, cloudinary, accessibilité
│       ├── types/              # Types TypeScript
│       ├── config/             # Config carte, etc.
│       ├── styles/             # design-system, accessibility, animations, map
│       └── e2e/                # Tests Playwright (specs, flows)
├── docs/                       # Documentation
└── docker-compose.yml
```

## Commandes Docker (usage classique)

| Commande | Description |
|----------|-------------|
| `docker-compose up --build` | Démarrer tous les services (logs dans le terminal) |
| `docker-compose up -d --build` | Démarrer en arrière-plan |
| `docker-compose down` | Arrêter tous les services |
| `docker-compose logs -f backend` | Voir les logs du backend |
| `docker-compose logs -f frontend` | Voir les logs du frontend |

## Authentification

- **Inscription Client** et **Inscription Organisateur** (avec nom d’organisation pour ce dernier).
- **Connexion** e-mail / mot de passe (JWT) et **OAuth Google** (échange de code via Redis).

## Compétences RNCP Couvertes

- **Bloc 1** : Cadrage et architecture du projet
- **Bloc 2** : Développement avec NestJS/React, tests, sécurité OWASP
  - C2.2.1 : Prototype ergonomique (Dashboard UX)
  - C2.2.3 : Sécurité OWASP Top 10
- **Bloc 3** : Pilotage de projet, gestion d'équipe
  - C3.4.2 : Démonstration fonctionnalités (Dashboard analytics)
- **Bloc 4** : Maintenance et monitoring

## Documentation

- [DASHBOARD.md](./DASHBOARD.md) - Documentation technique dashboards
- [GUIDE_DASHBOARD.md](./GUIDE_DASHBOARD.md) - Guide utilisateur
- [ACCESSIBILITE.md](./ACCESSIBILITE.md) - Conformité RGAA
- [SECURITY_BEST_PRACTICES.md](./SECURITY_BEST_PRACTICES.md) - Sécurité OWASP

## Auteur

**Nicolas Poda** - Projet RNCP39583  
GitHub: [@nicolaspoda](https://github.com/nicolaspoda)
