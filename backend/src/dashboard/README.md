# Dashboard Module

Module de gestion des tableaux de bord pour organisateurs et clients.

## Structure

```
dashboard/
├── dashboard.controller.ts       # Endpoints API
├── dashboard.service.ts          # Logique métier et calculs
├── dashboard.module.ts           # Module NestJS
├── dashboard.controller.spec.ts  # Tests controller
├── dashboard.service.spec.ts     # Tests service
└── README.md                     # Documentation
```

## Endpoints

### Dashboard Organisateur

#### GET /api/v1/dashboard/organizer/overview
Retourne les statistiques globales de l'organisateur.

**Auth** : JWT + Role ORGANIZER

**Response** :
```json
{
  "totalEvents": 10,
  "upcomingEvents": 5,
  "pastEvents": 5,
  "totalRevenue": 25000.00,
  "totalTicketsSold": 500,
  "averageTicketPrice": 50.00
}
```

#### GET /api/v1/dashboard/organizer/events
Retourne la liste des événements avec statistiques.

**Auth** : JWT + Role ORGANIZER

**Response** :
```json
[
  {
    "id": "uuid",
    "title": "Festival Rock 2026",
    "eventDate": "2026-07-15T20:00:00Z",
    "location": "Paris",
    "type": "PROFESSIONAL",
    "ticketCategories": [...],
    "stats": {
      "totalCapacity": 1000,
      "totalSold": 750,
      "revenue": 37500.00,
      "fillRate": 75.00,
      "status": "ALMOST_FULL"
    }
  }
]
```

#### GET /api/v1/dashboard/organizer/events/:id/stats
Retourne les statistiques détaillées d'un événement.

**Auth** : JWT + Role ORGANIZER

**Response** :
```json
{
  "event": {
    "id": "uuid",
    "title": "Festival Rock 2026",
    "eventDate": "2026-07-15T20:00:00Z"
  },
  "categoriesStats": [
    {
      "id": "uuid",
      "name": "Standard",
      "price": 50.00,
      "initialStock": 500,
      "currentStock": 200,
      "sold": 300,
      "revenue": 15000.00,
      "fillRate": 60.00
    }
  ],
  "salesByDay": {
    "2026-01-15": 50,
    "2026-01-16": 75
  },
  "totalRevenue": 37500.00,
  "totalSold": 750
}
```

### Dashboard Client

#### GET /api/v1/dashboard/client/overview
Retourne les statistiques globales des événements communautaires.

**Auth** : JWT + Role CLIENT

**Response** :
```json
{
  "totalEvents": 3,
  "upcomingEvents": 2,
  "totalParticipants": 45,
  "averageParticipants": 15
}
```

#### GET /api/v1/dashboard/client/events
Retourne la liste des événements communautaires.

**Auth** : JWT + Role CLIENT

**Response** :
```json
[
  {
    "id": "uuid",
    "title": "Barbecue été 2026",
    "eventDate": "2026-06-20T18:00:00Z",
    "location": "Jardin privé",
    "type": "COMMUNITY",
    "ticketCategories": [...],
    "stats": {
      "totalCapacity": 30,
      "totalParticipants": 25,
      "fillRate": 83.33,
      "status": "ALMOST_FULL"
    }
  }
]
```

#### GET /api/v1/dashboard/client/events/:id/participants
Retourne la liste des participants d'un événement communautaire.

**Auth** : JWT + Role CLIENT

**Response** :
```json
{
  "event": {
    "id": "uuid",
    "title": "Barbecue été 2026",
    "eventDate": "2026-06-20T18:00:00Z"
  },
  "participants": [
    {
      "userId": "uuid",
      "email": "user@example.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "quantity": 2,
      "status": "CONFIRMED",
      "bookedAt": "2026-05-01T10:00:00Z"
    }
  ],
  "totalParticipants": 25
}
```

## Calcul des statuts

Les statuts sont calculés dynamiquement par la méthode `getEventStatus()` :

| Statut | Condition |
|--------|-----------|
| `COMPLETED` | Date événement < Date actuelle |
| `SOLD_OUT` | Taux remplissage ≥ 100% |
| `UPCOMING` | Événement dans ≤ 7 jours |
| `ALMOST_FULL` | Taux remplissage ≥ 80% |
| `ON_SALE` | Défaut (vente ouverte) |

## Sécurité

### Guards
- `JwtAuthGuard` : Vérifie la présence et validité du JWT
- `RolesGuard` : Vérifie le rôle de l'utilisateur

### Vérifications
- Tous les endpoints vérifient l'identité de l'utilisateur
- Les statistiques sont filtrées par `organizerId`
- Accès interdit (403) si l'utilisateur n'est pas propriétaire

### Rate Limiting
Les endpoints dashboard sont soumis au rate limiting global (1000 req/min en dev).

## Performance

### Optimisations
- Utilisation de `Promise.all()` pour requêtes parallèles
- Index sur colonnes `organizerId`, `eventDate`, `type`
- Calculs effectués en une seule requête avec `include`
- Pas de N+1 queries

### Temps de réponse attendu
- Overview : < 200ms
- Liste événements : < 500ms
- Stats détaillées : < 300ms

## Tests

### Exécuter les tests
```bash
npm run test dashboard
```

### Coverage
- Service : 85%+
- Controller : 90%+

## Dépendances

- `@nestjs/common`
- `@prisma/client`
- `PrismaModule` (interne)

## Utilisation

```typescript
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [DashboardModule],
})
export class AppModule {}
```
