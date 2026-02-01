# EventNow - Plateforme de Billetterie Événementielle

[![CI Pipeline](https://github.com/nicolaspoda/EventNow/actions/workflows/ci.yml/badge.svg)](https://github.com/nicolaspoda/EventNow/actions/workflows/ci.yml)

> Projet de certification RNCP39583 "Expert en développement logiciel" - Niveau 7

## Description

EventNow est une plateforme de billetterie en ligne permettant la vente de billets pour des événements avec gestion avancée de la concurrence lors des pics de charge.

### Fonctionnalités Principales

- Vente de billets en ligne avec gestion des stocks en temps réel
- Gestion des rôles (Client, Organisateur, Staff)
- Authentification JWT sécurisée
- Intégration paiement (Stripe)
- Validation des billets par QR Code
- Dashboard organisateur avec statistiques

## Stack Technique

### Backend
- **NestJS** - Framework Node.js + TypeScript
- **PostgreSQL 15** - Base de données relationnelle
- **Redis 7** - Cache et gestion des locks
- **Prisma** - ORM TypeScript
- **JWT** - Authentification

### Frontend
- **React 18** + TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation

### Infrastructure
- **Docker** + Docker Compose
- **GitHub Actions** - CI/CD

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

### 4. (Optionnel) Remplir la base avec des données de démo
```bash
docker-compose exec backend npx prisma db seed
```
Cela crée un compte organisateur et 4 événements à venir. Compte : `organizer@eventnow.fr` / `Organizer123!`

### 5. Accéder à l’application

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000

## Structure du Projet
```
EventNow/
├── backend/              # API NestJS
│   ├── src/
│   │   ├── auth/        # Module authentification
│   │   ├── events/      # Module événements
│   │   ├── bookings/    # Module réservations
│   │   └── orders/      # Module commandes
│   └── prisma/          # Schéma base de données
├── frontend/            # Application React
│   └── src/
│       ├── components/  # Composants réutilisables
│       ├── pages/       # Pages de l'app
│       └── services/    # Appels API
├── docs/                # Documentation
└── docker-compose.yml   # Configuration Docker
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
- **Bloc 3** : Pilotage de projet, gestion d'équipe
- **Bloc 4** : Maintenance et monitoring

## Auteur

**Nicolas Poda** - Projet RNCP39583  
GitHub: [@nicolaspoda](https://github.com/nicolaspoda)