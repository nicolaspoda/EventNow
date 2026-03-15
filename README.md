# EventNow - Plateforme d'événements et de billetterie

[![CI Pipeline](https://github.com/nicolaspoda/EventNow/actions/workflows/ci.yml/badge.svg)](https://github.com/nicolaspoda/EventNow/actions/workflows/ci.yml)

> Projet de certification RNCP39583 "Expert en développement logiciel" - Niveau 7

## Description

EventNow est une **plateforme sociale centrée sur les événements** : billetterie en ligne pour les événements professionnels (concerts, conférences, festivals, etc.) et espace communautaire pour les événements sur invitation ou sur demande de participation. Au-delà de l’achat de billets, elle propose un **graphe social** (suivre des organisateurs ou d’autres utilisateurs, voir qui participe à quels événements), une **messagerie temps réel** (conversations directes, de groupe ou liées à un événement), des **avis entre participants** et des **profils publics**. La billetterie reste au cœur du produit (Stripe, QR codes, validation à l’entrée, gestion des stocks et de la concurrence), mais l’ensemble forme plutôt une plateforme « événements + communauté + billetterie » qu’une simple billetterie.

### Fonctionnalités principales

**Billetterie & événements**
- Création d’événements (titre, description, lieu, adresse, ville, CP, coordonnées GPS, image de couverture, galerie d’images)
- Catégories de billets (nom, prix, stock initial / temps réel)
- Recherche et filtres avancés (catégorie, type, date, lieu, ville), suggestions de recherche, liste des lieux/villes disponibles
- Types d’événements : Professionnel (vente de billets) / Communautaire (demandes de participation)

**Authentification & utilisateurs**
- Inscription Client et Inscription Organisateur (avec nom d’organisation)
- Connexion JWT (email/mot de passe) + **OAuth Google** (échange de code via Redis)
- Profil utilisateur (avatar, username, organisation), mise à jour du profil
- **Profil public** consultable par d’autres utilisateurs (`/user/:userId/profile`)
- Recherche d’utilisateurs (autocomplétion pour créer des conversations)

**Paiement & commandes**
- Paiement Stripe (création d’intention de paiement, confirmation)
- Historique des commandes, annulation de commande
- **Demande de remboursement** par le client ; **approbation / rejet** par l’organisateur (page Refund Requests)

**Billets & entrée**
- Billets avec **QR code** unique par place
- **Validation des billets** par le staff (scan QR), historique des validations et statistiques par événement
- Téléchargement du billet en **PDF**
- Page « Mes billets » avec affichage QR et lien téléchargement

**Staff**
- **Invitations staff** par email (lien avec token) ; acceptation / refus ; expiration ; nettoyage automatique des staff des événements terminés (job planifié)
- Pages Staff : scan QR, liste des validations, événements où l’utilisateur est staff

**Événements communautaires**
- **Demandes de participation** (message optionnel) ; l’organisateur accepte ou refuse
- Liste des demandes en attente pour l’organisateur ; « Mes événements à venir » / « Mes événements participés » pour le client
- **Avis sur les événements** (notes + commentaires) et **avis entre participants** (participant reviews) après un événement communautaire

**Dashboards**
- **Dashboard Organisateur** : vue d’ensemble (revenus, ventes), liste des événements, stats par événement (graphiques ventes/revenus), demandes de remboursement, invitations staff
- **Dashboard Client** : vue d’ensemble, événements à venir / participés, **liste des participants** par événement communautaire
- Tableau de bord unifié avec redirection selon le rôle (Organisateur / Client)

**Messagerie & social**
- **Messagerie temps réel** (Socket.io) : conversations **directes**, **groupe** et **événement** ; création de conversation, ajout de membres, modification (nom, image) ; envoi de messages ; liste des conversations avec indicateur de non-lus
- **Suivi d’utilisateurs** (follow/unfollow), liste abonnés/abonnements, activation/désactivation des notifications pour un suivi
- **Notifications in-app** (cloche, compteur non lus, marquer comme lu / tout marquer comme lu, suppression)

**Contenu & médias**
- **Upload d’images** (Cloudinary) : image unique ou galerie (jusqu’à 5 images), suppression par `publicId`
- Géolocalisation : champs latitude/longitude, **carte des événements** (Leaflet), **autocomplétion d’adresse** (géocodage)

**Emails & jobs planifiés**
- Email de **confirmation de commande**
- **Rappels par email** (J-7 et J-1) avant la date de l’événement
- Notifications in-app associées (rappels, nouveaux événements des organisateurs suivis, etc.)
- Job cron : nettoyage des affectations staff pour les événements terminés

**Calendrier**
- Page **Mon calendrier** (vue calendrier des événements à venir / participés)

**Sécurité & qualité**
- Rate limiting (global + plafond dédié paiement), Helmet, sanitization des entrées (XSS), CORS, CSRF (csurf)
- Validation des données (class-validator), gestion d’erreurs centralisée, logs (Winston)
- Accessibilité RGAA Level AA (tests axe, styles dédiés)
- **Mode sombre** (ThemeContext) et design system cohérent

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
│   │   ├── follows/            # Follow / unfollow, abonnés, abonnements, notifications
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