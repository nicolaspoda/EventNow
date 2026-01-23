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

- Node.js 20+
- Docker Desktop
- Git

## Installation

### 1. Cloner le projet
```bash
git clone https://github.com/nicolaspoda/EventNow.git
cd EventNow
```

### 2. Créer le fichier .env
```bash
cp .env.example .env
```

### 3. Lancer avec Docker
```bash
docker-compose up -d
```

### 4. Accéder à l'application

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3000
- **PostgreSQL** : localhost:5432
- **Redis** : localhost:6379

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

## Développement

### Lancer en mode dev (sans Docker)

**Backend** :
```bash
cd backend
npm install
npm run start:dev
```

**Frontend** :
```bash
cd frontend
npm install
npm run dev
```

### Arrêter Docker
```bash
docker-compose down
```

### Voir les logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Compétences RNCP Couvertes

- **Bloc 1** : Cadrage et architecture du projet
- **Bloc 2** : Développement avec NestJS/React, tests, sécurité OWASP
- **Bloc 3** : Pilotage de projet, gestion d'équipe
- **Bloc 4** : Maintenance et monitoring

## Auteur

**Nicolas Poda** - Projet RNCP39583  
GitHub: [@nicolaspoda](https://github.com/nicolaspoda)