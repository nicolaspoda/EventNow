# Module de Messagerie

Ce module implémente un système de messagerie privée complet pour EventNow, permettant aux utilisateurs de communiquer via des messages directs, des groupes, et des conversations d'événements.

## Fonctionnalités

### Types de conversations

1. **Messages directs (DIRECT)** : Conversations entre deux utilisateurs
2. **Groupes (GROUP)** : Conversations avec plusieurs membres, créées manuellement
3. **Événements (EVENT)** : Conversations automatiques pour les événements communautaires

### Endpoints API

#### Conversations

- `POST /api/v1/messages/conversations` - Créer une nouvelle conversation
- `GET /api/v1/messages/conversations` - Obtenir toutes les conversations de l'utilisateur
- `GET /api/v1/messages/conversations/:id` - Obtenir une conversation spécifique
- `PUT /api/v1/messages/conversations/:id` - Modifier une conversation (nom, image)
- `DELETE /api/v1/messages/conversations/:id` - Supprimer une conversation de groupe

#### Messages

- `GET /api/v1/messages/conversations/:id/messages` - Obtenir les messages d'une conversation
  - Query params : `limit` (défaut: 50), `before` (timestamp pour pagination)
- `POST /api/v1/messages/conversations/:id/messages` - Envoyer un message
- `POST /api/v1/messages/conversations/:id/read` - Marquer une conversation comme lue

#### Membres

- `POST /api/v1/messages/conversations/:id/members` - Ajouter des membres (groupes uniquement)
- `DELETE /api/v1/messages/conversations/:id/members/:memberId` - Retirer un membre

#### Événements

- `GET /api/v1/messages/events/:eventId/conversation` - Obtenir ou créer la conversation d'un événement

## Modèles de données

### Conversation

```typescript
{
  id: string;
  type: 'DIRECT' | 'GROUP' | 'EVENT';
  name?: string;
  imageUrl?: string;
  eventId?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Message

```typescript
{
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### ConversationMember

```typescript
{
  id: string;
  conversationId: string;
  userId: string;
  joinedAt: Date;
  lastReadAt: Date;
}
```

## Règles métier

### Messages directs
- Exactement 2 membres
- Si une conversation directe existe déjà entre deux utilisateurs, elle est réutilisée
- Ne peuvent pas être modifiés ou supprimés
- Les membres ne peuvent pas être ajoutés ou retirés

### Groupes
- Minimum 2 membres (créateur + au moins 1 autre)
- Nom obligatoire
- Seul le créateur peut modifier le nom/image
- Seul le créateur peut supprimer le groupe
- Le créateur peut retirer n'importe quel membre
- Chaque membre peut se retirer lui-même
- Si tous les membres quittent, le groupe est automatiquement supprimé

### Conversations d'événements
- Créées automatiquement pour les événements communautaires
- Accessibles uniquement à l'organisateur et aux participants acceptés
- L'organisateur peut créer la conversation
- Les participants acceptés sont automatiquement ajoutés
- Nom par défaut : "Groupe [Nom de l'événement]"

## Notifications

Le système envoie des notifications pour :
- `NEW_MESSAGE` : Nouveau message reçu
- `ADDED_TO_CONVERSATION` : Ajouté à une conversation de groupe

## Sécurité

- Toutes les routes nécessitent une authentification JWT
- Les utilisateurs ne peuvent accéder qu'aux conversations dont ils sont membres
- Les actions de modification sont limitées aux créateurs (pour les groupes)
- Les messages sont validés et nettoyés côté serveur

## Pagination

Les messages sont paginés avec :
- Limite par défaut : 50 messages
- Tri : du plus ancien au plus récent
- Paramètre `before` pour charger les messages plus anciens

## Frontend

### Pages
- `/messages` - Liste des conversations
- `/messages/:conversationId` - Vue de conversation avec chat
- `/messages/:conversationId/members` - Liste des membres

### Composants
- `ConversationList` - Liste des conversations avec aperçu
- `ChatWindow` - Fenêtre de chat avec messages
- `ConversationHeader` - En-tête avec actions
- `CreateConversationModal` - Créer une conversation
- `AddMembersModal` - Ajouter des membres
- `EditConversationModal` - Modifier une conversation
- `ConversationMembersModal` - Voir/gérer les membres
- `MessageBell` - Indicateur de messages non lus dans la navbar
