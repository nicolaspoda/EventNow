# Exemples d'utilisation de l'API de Messagerie

## Authentification

Tous les endpoints nécessitent un token JWT dans le header :
```
Authorization: Bearer <votre_token_jwt>
```

## 1. Créer une conversation directe

**Endpoint** : `POST /api/v1/messages/conversations`

**Body** :
```json
{
  "type": "DIRECT",
  "memberIds": ["user-id-123"]
}
```

**Réponse** :
```json
{
  "id": "conv-id-456",
  "type": "DIRECT",
  "name": null,
  "imageUrl": null,
  "eventId": null,
  "createdBy": "current-user-id",
  "createdAt": "2026-03-08T10:00:00.000Z",
  "updatedAt": "2026-03-08T10:00:00.000Z",
  "members": [
    {
      "id": "member-id-1",
      "conversationId": "conv-id-456",
      "userId": "current-user-id",
      "joinedAt": "2026-03-08T10:00:00.000Z",
      "lastReadAt": "2026-03-08T10:00:00.000Z",
      "user": {
        "id": "current-user-id",
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean@example.com",
        "avatarUrl": "https://..."
      }
    },
    {
      "id": "member-id-2",
      "conversationId": "conv-id-456",
      "userId": "user-id-123",
      "joinedAt": "2026-03-08T10:00:00.000Z",
      "lastReadAt": "2026-03-08T10:00:00.000Z",
      "user": {
        "id": "user-id-123",
        "firstName": "Marie",
        "lastName": "Martin",
        "email": "marie@example.com",
        "avatarUrl": "https://..."
      }
    }
  ],
  "messages": []
}
```

## 2. Créer un groupe

**Endpoint** : `POST /api/v1/messages/conversations`

**Body** :
```json
{
  "type": "GROUP",
  "name": "Équipe projet",
  "imageUrl": "https://example.com/group-image.jpg",
  "memberIds": ["user-id-123", "user-id-456", "user-id-789"]
}
```

## 3. Obtenir toutes les conversations

**Endpoint** : `GET /api/v1/messages/conversations`

**Réponse** :
```json
[
  {
    "id": "conv-id-1",
    "type": "DIRECT",
    "name": null,
    "members": [...],
    "messages": [
      {
        "id": "msg-id-1",
        "content": "Dernier message",
        "createdAt": "2026-03-08T10:30:00.000Z",
        "sender": {...}
      }
    ],
    "unreadCount": 3
  },
  {
    "id": "conv-id-2",
    "type": "GROUP",
    "name": "Équipe projet",
    "members": [...],
    "messages": [...],
    "unreadCount": 0
  }
]
```

## 4. Obtenir les messages d'une conversation

**Endpoint** : `GET /api/v1/messages/conversations/:id/messages`

**Query params** :
- `limit` (optionnel, défaut: 50) : Nombre de messages à récupérer
- `before` (optionnel) : Timestamp ISO pour pagination

**Exemples** :
```
GET /api/v1/messages/conversations/conv-id-123/messages
GET /api/v1/messages/conversations/conv-id-123/messages?limit=20
GET /api/v1/messages/conversations/conv-id-123/messages?limit=50&before=2026-03-08T10:00:00.000Z
```

**Réponse** :
```json
[
  {
    "id": "msg-id-1",
    "conversationId": "conv-id-123",
    "senderId": "user-id-456",
    "content": "Bonjour !",
    "createdAt": "2026-03-08T09:00:00.000Z",
    "updatedAt": "2026-03-08T09:00:00.000Z",
    "sender": {
      "id": "user-id-456",
      "firstName": "Marie",
      "lastName": "Martin",
      "email": "marie@example.com",
      "avatarUrl": "https://..."
    }
  },
  {
    "id": "msg-id-2",
    "conversationId": "conv-id-123",
    "senderId": "current-user-id",
    "content": "Salut Marie !",
    "createdAt": "2026-03-08T09:05:00.000Z",
    "updatedAt": "2026-03-08T09:05:00.000Z",
    "sender": {
      "id": "current-user-id",
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean@example.com",
      "avatarUrl": "https://..."
    }
  }
]
```

## 5. Envoyer un message

**Endpoint** : `POST /api/v1/messages/conversations/:id/messages`

**Body** :
```json
{
  "content": "Bonjour tout le monde !"
}
```

**Réponse** :
```json
{
  "id": "msg-id-new",
  "conversationId": "conv-id-123",
  "senderId": "current-user-id",
  "content": "Bonjour tout le monde !",
  "createdAt": "2026-03-08T10:45:00.000Z",
  "updatedAt": "2026-03-08T10:45:00.000Z",
  "sender": {
    "id": "current-user-id",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean@example.com",
    "avatarUrl": "https://..."
  }
}
```

## 6. Ajouter des membres à un groupe

**Endpoint** : `POST /api/v1/messages/conversations/:id/members`

**Body** :
```json
{
  "memberIds": ["user-id-999", "user-id-888"]
}
```

**Note** : Fonctionne uniquement pour les conversations de type GROUP.

## 7. Retirer un membre

**Endpoint** : `DELETE /api/v1/messages/conversations/:id/members/:memberId`

**Permissions** :
- Le créateur peut retirer n'importe quel membre
- Chaque membre peut se retirer lui-même

## 8. Modifier un groupe

**Endpoint** : `PUT /api/v1/messages/conversations/:id`

**Body** :
```json
{
  "name": "Nouveau nom du groupe",
  "imageUrl": "https://example.com/new-image.jpg"
}
```

**Note** : Seul le créateur peut modifier un groupe.

## 9. Supprimer un groupe

**Endpoint** : `DELETE /api/v1/messages/conversations/:id`

**Note** : 
- Seul le créateur peut supprimer un groupe
- Fonctionne uniquement pour les conversations de type GROUP

## 10. Marquer une conversation comme lue

**Endpoint** : `POST /api/v1/messages/conversations/:id/read`

Met à jour le timestamp `lastReadAt` pour l'utilisateur courant.

## 11. Obtenir la conversation d'un événement

**Endpoint** : `GET /api/v1/messages/events/:eventId/conversation`

**Comportement** :
- Si la conversation existe, elle est retournée
- Si elle n'existe pas et que l'utilisateur est l'organisateur, elle est créée automatiquement
- Si l'utilisateur n'est ni organisateur ni participant accepté, une erreur 403 est retournée

**Réponse** :
```json
{
  "id": "conv-id-event",
  "type": "EVENT",
  "name": "Groupe Festival de musique 2026",
  "eventId": "event-id-123",
  "createdBy": "organizer-id",
  "members": [...],
  "messages": [...]
}
```

## Codes d'erreur

### 400 Bad Request
- Conversation directe avec plus ou moins d'1 membre
- Groupe sans nom
- Conversation d'événement sans eventId
- Tentative d'ajouter des membres à une conversation directe
- Tentative de modifier une conversation directe

### 403 Forbidden
- Accès à une conversation dont on n'est pas membre
- Modification d'un groupe sans être le créateur
- Suppression d'un groupe sans être le créateur
- Retrait d'un membre sans permission

### 404 Not Found
- Conversation inexistante
- Événement inexistant

## Notifications créées

### NEW_MESSAGE
Envoyée à tous les membres (sauf l'expéditeur) lors d'un nouveau message.

**Exemple** :
```json
{
  "type": "NEW_MESSAGE",
  "title": "Nouveau message de Marie Martin",
  "body": "Bonjour tout le monde !",
  "relatedId": "conv-id-123"
}
```

### ADDED_TO_CONVERSATION
Envoyée lors de l'ajout à une conversation de groupe.

**Exemple** :
```json
{
  "type": "ADDED_TO_CONVERSATION",
  "title": "Ajouté à une conversation",
  "body": "Vous avez été ajouté à Équipe projet",
  "relatedId": "conv-id-123"
}
```

## Cas d'usage typiques

### Scénario 1 : Message direct entre deux utilisateurs
```
1. Alice crée une conversation directe avec Bob
2. Alice envoie "Salut Bob !"
3. Bob reçoit une notification
4. Bob ouvre la conversation et répond
5. La conversation apparaît dans la liste des deux utilisateurs
```

### Scénario 2 : Groupe de projet
```
1. Alice crée un groupe "Équipe projet" avec Bob et Charlie
2. Bob et Charlie reçoivent une notification
3. Alice envoie un message dans le groupe
4. Bob et Charlie reçoivent une notification de nouveau message
5. Alice ajoute David au groupe
6. David reçoit une notification et peut voir l'historique
```

### Scénario 3 : Messagerie d'événement
```
1. Alice organise un événement communautaire "Festival de musique"
2. Bob et Charlie demandent à participer
3. Alice accepte leurs demandes
4. Alice clique sur "Accéder à la messagerie de groupe" sur l'événement
5. La conversation est créée automatiquement avec Alice, Bob et Charlie
6. Tous peuvent communiquer avant l'événement
7. Si Alice accepte David plus tard, il est automatiquement ajouté
```

## Limites actuelles

- Pas de messages en temps réel (WebSocket) - rafraîchissement manuel requis
- Pas de pièces jointes (images, fichiers)
- Pas de réactions aux messages
- Pas de recherche dans les messages
- Pas d'indicateur "en train d'écrire..."
- Pas de messages vocaux

Ces fonctionnalités peuvent être ajoutées dans des versions futures.
