# Cahier de recettes

Ci-dessous les 83 fonctionnalités de l'inventaire EventNow (13 domaines), du parcours simple aux règles métier les plus sensibles (accès, paiement, modération), plus une section de tests structurels et sécurité qui traverse tout le reste. Pour chaque ligne, j'ai vérifié la référence citée en lisant le code : nom de fichier de test et méthode/`describe` quand un test automatisé existe, ou un contrôle manuel direct sur l'API/le navigateur quand ce n'était pas le cas. Certaines lignes restent marquées "Non vérifié" : pas de test, pas eu le temps de vérifier à la main non plus, je préfère le dire clairement plutôt que deviner.

## Authentification & compte

| ID | Fonctionnalité | Scénario → résultat attendu | Vérification |
|---|---|---|---|
| 1.1 | Inscription participant | POST /auth/register avec email/mdp valides → compte USER créé, tokens renvoyés | Automatisé : `auth.controller.spec.ts` / `auth.service.spec.ts` (`register`). **Conforme** |
| 1.2 | Inscription organisateur | POST /auth/register-organizer → compte ORGANIZER créé | Automatisé : `auth.controller.spec.ts` (`registerOrganizer`) / `auth.service.spec.ts` (`registerOrganizer`). **Conforme** |
| 1.3 | Connexion email/mot de passe | POST /auth/login avec credentials valides → tokens JWT renvoyés | Automatisé : `auth.controller.spec.ts` / `auth.service.spec.ts` (`login`) + Manuel (curl login admin/organizer/user/staff OK). **Conforme** |
| 1.4 | Connexion via Google (OAuth) | Callback/exchange applicatif après redirection Google → utilisateur créé/lié, tokens renvoyés | Automatisé : `auth.service.spec.ts` (`validateGoogleUser`), `auth.controller.spec.ts` (`googleAuthCallback`, `googleExchange`). **Conforme** |
| 1.5 | Rafraîchissement de session / déconnexion | POST /auth/refresh, /auth/logout → nouveaux tokens / token blacklisté | Automatisé : `auth.controller.spec.ts` / `auth.service.spec.ts` (`refreshTokens`, `logout`). **Conforme** |
| 1.6 | Consultation et édition de son profil | GET/PUT /auth/profile → profil renvoyé/mis à jour | Automatisé : `auth.controller.spec.ts` / `auth.service.spec.ts` (`getFullProfile`, `updateProfile`). **Conforme** |
| 1.7 | Profil public d'un autre utilisateur | GET /auth/user/:userId/public-profile → profil public renvoyé (sans données privées) | Automatisé : `auth.controller.spec.ts` / `auth.service.spec.ts` (`getUserPublicProfile`). **Conforme** |
| 1.8 | Recherche d'utilisateurs | GET /auth/users/search?q=... → liste d'utilisateurs correspondants | Automatisé : `auth.controller.spec.ts` (`searchUsers`) / `auth.service.spec.ts` (`searchUsersByUsername`). **Conforme** |
| 1.9 | Bannissement d'un utilisateur | PATCH /users/:id/ban (admin), GET /users/banned → utilisateur banni/débanni, listé | Automatisé : `users.service.spec.ts` (`banUser`, `getBannedUsers`) / `users.controller.spec.ts` + Manuel (curl admin ban/unban `user@eventnow.fr`). **Conforme** |

## Événements

| ID | Fonctionnalité | Scénario → résultat attendu | Vérification |
|---|---|---|---|
| 2.1 | Parcourir / rechercher les événements | GET /events, /search, /suggestions, /categories, /locations, /cities → résultats filtrés/paginés | Automatisé : `events.controller.spec.ts` / `events.service.spec.ts` (`findAll`, `searchEvents`, `getSearchSuggestions`, `getAvailableLocations`, `getAvailableCities`). **Conforme** |
| 2.2 | Consulter le détail d'un événement | GET /events/:id → détail événement + note moyenne | Automatisé : `events.controller.spec.ts` / `events.service.spec.ts` (`findOne`). **Conforme** |
| 2.3 | Créer un événement professionnel | POST /events, type PROFESSIONAL, par un Organisateur → événement créé | Automatisé : `events.service.spec.ts` (`create` : création + rejet CLIENT sur événement PROFESSIONAL). **Conforme** |
| 2.4 | Créer un événement communautaire | POST /events, type COMMUNITY, par un Participant ou Organisateur → événement créé | Automatisé : `events.service.spec.ts` (`create` : cas COMMUNITY pour CLIENT). **Conforme** |
| 2.5 | Modifier un événement | PATCH /events/:id par le propriétaire → événement mis à jour | Automatisé : `events.service.spec.ts` (`update` : succès + ForbiddenException si non-propriétaire). **Conforme** |
| 2.6 | Annuler un événement | PATCH /events/:id/cancel → événement annulé, remboursements et notifications déclenchés | Automatisé : `events.service.spec.ts` (`cancelEvent` : remboursements, notifications COMMUNITY vs PROFESSIONAL). **Conforme** |
| 2.7 | Supprimer un événement | DELETE /events/:id par le propriétaire → événement supprimé | Automatisé : `events.service.spec.ts` (`remove`). **Conforme** |
| 2.8 | Suspendre un événement (modération) | PATCH /events/:id/suspend par un Admin → statut basculé SUSPENDED/ACTIVE | Manuel : curl admin sur événement seedé (SUSPENDED confirmé puis restauré), 403 pour non-admin (aucune méthode `suspendEvent` couverte par un test automatisé). **Conforme** |
| 2.9 | Statistiques de ventes d'un événement professionnel | GET /dashboard/organizer/events/:id/stats → statistiques de ventes par jour | Automatisé : `dashboard.service.spec.ts` / `dashboard.controller.spec.ts` (`getEventStats`). **Conforme** |
| 2.10 | Gérer la liste "quoi apporter" (événements communautaires) | GET/POST/PATCH/DELETE /events/:eventId/items, .../claim → items ajoutés/modifiés/réclamés, accès restreint | Automatisé : `event-items.service.spec.ts` / `event-items.controller.spec.ts` (accès via `getList`, `addItem`, `updateItem`, `deleteItem`, `claimItem`, claim et unclaim). **Conforme** |
| 2.11 | Sondages internes à un événement (créer, voter, clôturer) | GET/POST /events/:eventId/polls, .../vote, .../close → sondage créé, votes enregistrés, clôture correcte | Automatisé : `polls.service.spec.ts` / `polls.controller.spec.ts` (`createPoll`, `vote`, `changeVote`, `closePoll`, `deletePoll`). **Conforme** |

## Participation & demandes (événements communautaires)

| ID | Fonctionnalité | Scénario → résultat attendu | Vérification |
|---|---|---|---|
| 3.1 | Demander à participer à un événement communautaire | POST /participation-requests → demande PENDING créée, doublon refusé | Automatisé : `participation-requests.service.spec.ts` (`create`). **Conforme** |
| 3.2 | Consulter ses demandes de participation | GET /participation-requests/my → liste des demandes de l'utilisateur | Automatisé : `participation-requests.service.spec.ts` (`getMyRequests`). **Conforme** |
| 3.3 | Gérer les demandes reçues (accepter/refuser) | GET .../pending-for-organizer, PATCH :id/respond → demande acceptée/refusée, stock décrémenté si applicable | Automatisé : `participation-requests.service.spec.ts` (`getPendingRequestsForOrganizer`, `respond`). **Conforme** |
| 3.4 | Voir la liste des participants d'un événement communautaire créé | GET /dashboard/user/events/:id/participants (rôle USER) → liste des participants | Automatisé : `dashboard.controller.spec.ts` (`getEventParticipants`) + `dashboard.service.spec.ts` (`getEventParticipants` : agrégation bookings/tickets/requests). **Conforme** |
| 3.5 | Mes événements à venir (tous types) | GET /dashboard/my-upcoming-events → événements futurs (pro + communautaires) | Automatisé : `dashboard.service.spec.ts` (`getMyUpcomingEvents`). **Conforme** |
| 3.6 | Mes événements passés (participés) | GET /dashboard/my-participated-events → événements passés triés par date | Automatisé : `dashboard.service.spec.ts` (`getMyParticipatedEvents`). **Conforme** |
| 3.7 | Mon calendrier d'événements | GET /dashboard/my-calendar-events → liste combinée événements organisés/participés | Manuel : curl `user@eventnow.fr` : "Grande fête" renvoyé avec `participationType` correct (`dashboard.controller.spec.ts` couvre uniquement la délégation mockée vers le service, aucun test `dashboard.service.spec.ts` dédié à `getMyCalendarEvents`). **Conforme** |
| 3.8 | Suivre / ne plus suivre un utilisateur | POST/DELETE /follows/user/:userId → relation follow créée/supprimée | Automatisé : `follows.service.spec.ts` / `follows.controller.spec.ts` (`follow`, `unfollow`). **Conforme** |
| 3.9 | Voir abonnés / abonnements / amis communs | GET .../followers, /following, /friends → listes renvoyées avec statut follow/ami | Automatisé : `follows.service.spec.ts` (`getFollowers`, `getFollowing`, `getFriends`, `isFriend`). **Conforme** |
| 3.10 | Activer/désactiver les notifications pour un follow | PATCH /follows/user/:userId/notifications → préférence mise à jour | Automatisé : `follows.service.spec.ts` (`setNotificationsEnabled`). **Conforme** |

## Billetterie & réservation (événements professionnels)

| ID | Fonctionnalité | Scénario → résultat attendu | Vérification |
|---|---|---|---|
| 4.1 | Réserver temporairement des billets (blocage 10 min) | POST /bookings → réservation PENDING créée, stock décrémenté, expiration 10 min | Automatisé : `bookings.service.spec.ts` (`createBooking`) + Manuel (`expiresAt` = +10 min confirmé via API). **Conforme** |
| 4.2 | Consulter / confirmer / annuler une réservation en attente | GET /bookings, PATCH :id/confirm, DELETE :id → réservation listée/confirmée/annulée, stock restauré si annulation | Automatisé : `bookings.service.spec.ts` (`getUserBookings`, `confirmBooking`, `cancelBooking`, `expireOldBookings`). **Conforme** |
| 4.3 | Payer et finaliser la commande (checkout) | POST /orders/payment/initiate puis /confirm → intention de paiement Stripe créée, commande confirmée | Automatisé : `orders.service.spec.ts` (`initiatePayment`, `confirmPayment`) + Manuel (booking payant → `clientSecret` Stripe test réel). **Conforme** |
| 4.4 | Consulter ses commandes | GET /orders, /orders/:id → liste et détail de commande | Automatisé : `orders.service.spec.ts` (`getUserOrders`, `getOrderById`) + Manuel (commande gratuite relue via `GET /orders/:id`). **Conforme** |
| 4.5 | Confirmation de commande réussie | Affichage de `OrderSuccessPage` après paiement → page de confirmation avec récapitulatif | Automatisé : `frontend/src/__tests__/OrderSuccessPage.test.tsx` (chargement, erreur backend, succès + récapitulatif de commande). **Conforme** |
| 4.6 | Consulter et télécharger ses billets (QR code) | GET /tickets/my-tickets, /qr/:qrCode, /download/:id → billets listés, QR code lisible, PDF téléchargeable | Automatisé : `tickets.service.spec.ts` (`getUserTickets`, `getTicketByQRCode`) / `tickets.controller.spec.ts` (`getMyTickets`, `getTicketByQRCode`, `downloadTicket`) + Manuel (achat gratuit → `GET /tickets/download/:id` renvoie un PDF valide de 1 page). **Conforme** |
| 4.7 | Appliquer un code promo à l'achat | POST /promo-codes/validate → réduction calculée, montant final renvoyé | Automatisé : `promo-codes.service.spec.ts` (`validatePromoCode`) + Manuel (code `RECETTE10` : -10 % sur 35 € → 31,50 €). **Conforme** |
| 4.8 | Créer / lister / supprimer des codes promo pour un événement | POST /promo-codes, GET .../event/:eventId, DELETE :id → code créé/listé/désactivé, réservé à l'organisateur | Automatisé : `promo-codes.service.spec.ts` (`createPromoCode`, `getEventPromoCodes`, `deletePromoCode`) + Manuel (cycle complet create/list/delete). **Conforme** |

## Paiement & remboursement (événements professionnels)

| ID | Fonctionnalité | Scénario → résultat attendu | Vérification |
|---|---|---|---|
| 5.1 | Paiement en ligne (Stripe) | POST /orders/payment/initiate, /confirm, webhook Stripe → intention créée, commande confirmée après succès | Automatisé : `payment.service.spec.ts` (`createPaymentIntent`) / `orders.service.spec.ts` (`handleStripeWebhook`) + Manuel (`clientSecret` Stripe réel obtenu en mode test). **Conforme** |
| 5.2 | Retour de paiement (redirection Stripe) | Redirection vers `PaymentReturnPage` après Stripe Checkout → statut de paiement affiché | Automatisé : `frontend/src/__tests__/PaymentReturnPage.test.tsx` (paramètres manquants, échec de chargement Stripe, confirmation + redirection vers order-success, écran de succès sans bookingId, erreur backend, écran "processing", échec de paiement) pour la logique de la page. Non vérifié pour le parcours Stripe Checkout complet avec carte 3-D Secure réelle, non exécutable dans le temps imparti. **Conforme (page) / Non vérifié (parcours Stripe complet)** |
| 5.3 | Demander un remboursement | PATCH /orders/:id/refund → commande en REFUND_REQUESTED, organisateur notifié | Automatisé : `orders.service.spec.ts` (`requestRefund`). **Conforme** |
| 5.4 | Approuver / refuser une demande de remboursement | GET /orders/refund-requests, PATCH :id/refund/approve, /reject → remboursement Stripe déclenché ou rejeté, utilisateur notifié | Automatisé : `orders.service.spec.ts` (`getRefundRequests`, `approveRefund`, `rejectRefund`). **Conforme** |

## Staff (contrôle d'accès événement, événements professionnels)

| ID | Fonctionnalité | Scénario → résultat attendu | Vérification |
|---|---|---|---|
| 6.1 | Inviter un membre du staff pour un événement | POST /staff-invitations (Organisateur, événement PROFESSIONAL) → invitation créée, refusée si événement COMMUNITY | Automatisé : `staff-invitations.service.spec.ts` (`createInvitation` : création + rejet si événement non PROFESSIONAL). **Conforme** |
| 6.2 | Accepter / décliner une invitation staff | GET /token/:token, POST /accept, /decline, GET /pending → statut de participation staff créé/refusé | Automatisé : `staff-invitations.service.spec.ts` / `.controller.spec.ts` (`acceptInvitation`, `declineInvitation`, `getInvitationByToken`). **Conforme** |
| 6.3 | Révoquer une invitation staff | DELETE /staff-invitations/:id → invitation annulée par l'organisateur | Automatisé : `staff-invitations.service.spec.ts` (`cancelInvitation`). **Conforme** |
| 6.4 | Scanner les billets à l'entrée (QR code) | POST /tickets/validate → billet validé, doublon/annulé/hors-créneau détectés | Automatisé : `tickets.service.spec.ts` (`validateTicket` : succès, ALREADY_VALIDATED, ORDER_CANCELLED, EVENT_NOT_STARTED). **Conforme** |
| 6.5 | Consulter l'historique des validations d'entrée | GET /tickets/validations, /validations/stats → liste des scans + statistiques | Automatisé : `tickets.service.spec.ts` (`getStaffValidations`, `getValidationStats`) + Manuel (curl `staff@eventnow.fr` sur "Daft Punk Tribute Night"). **Conforme** |
| 6.6 | Lister les événements où l'utilisateur est staff | GET /tickets/staff-events → liste des événements avec statut staff actif | Automatisé : `tickets.service.spec.ts` / `.controller.spec.ts` (`getStaffEvents`) + Manuel (curl `staff@eventnow.fr` → "Tech Summit Paris 2026", "Daft Punk Tribute Night"). **Conforme** |

## Messagerie

| ID | Fonctionnalité | Scénario → résultat attendu | Vérification |
|---|---|---|---|
| 7.1 | Consulter ses conversations | GET /messages/conversations → liste des conversations avec compteur de non-lus | Automatisé : `messages.service.spec.ts` (`getUserConversations`) / `messages.controller.spec.ts` (gestion de l'erreur P2021). **Conforme** |
| 7.2 | Ouvrir/créer une conversation (privée ou liée à un événement) | POST /messages/conversations, GET /messages/events/:eventId/conversation → conversation DIRECT/GROUP/EVENT créée ou réutilisée | Automatisé : `messages.service.spec.ts` (`createConversation`, `getEventConversation`). **Conforme** |
| 7.3 | Envoyer / lire des messages en temps réel | GET/POST /conversations/:id/messages, WebSocket `messages.gateway.ts` → message envoyé, diffusé en temps réel | Automatisé : `messages.service.spec.ts` (`sendMessage`, `getMessages`) + `messages.gateway.spec.ts` (`handleConnection`, `handleJoinConversation`, `handleSendMessage`, notify methods). **Conforme** |
| 7.4 | Gérer les membres d'une conversation de groupe | POST/DELETE .../members → membres ajoutés/retirés, conversation supprimée si vide | Automatisé : `messages.service.spec.ts` (`addMembers`, `removeMember`). **Conforme** |
| 7.5 | Renommer / supprimer une conversation | PUT/DELETE /conversations/:id → conversation renommée (GROUP) / supprimée par le créateur | Automatisé : `messages.service.spec.ts` (`updateConversation`, `deleteConversation`). **Conforme** |
| 7.6 | Marquer une conversation comme lue | POST .../read → compteur de non-lus remis à zéro | Automatisé : `messages.service.spec.ts` (`markAsRead`). **Conforme** |

## Avis & évaluations

| ID | Fonctionnalité | Scénario → résultat attendu | Vérification |
|---|---|---|---|
| 8.1 | Laisser un avis sur un événement | POST /reviews/events/:eventId, GET .../can-review → avis créé uniquement si participation confirmée et événement terminé | Automatisé : `reviews.service.spec.ts` (`create` : COMMUNITY/PROFESSIONAL, non-participant refusé, doublon refusé). **Conforme** |
| 8.2 | Consulter les avis d'un événement | GET /reviews/events/:eventId → avis paginés, email masqué, tri par note | Automatisé : `reviews.service.spec.ts` (`findAllByEvent` : pagination, masquage email, tri). **Conforme** |
| 8.3 | Modifier / supprimer son avis | PATCH/DELETE /reviews/:id → avis modifié/supprimé par son auteur uniquement | Automatisé : `reviews.service.spec.ts` (`update`, `delete`, ForbiddenException si non-auteur). **Conforme** |
| 8.4 | Consulter ses propres avis laissés | GET /reviews/my-reviews → liste des avis de l'utilisateur | Automatisé : `reviews.service.spec.ts` (`findAllByUser`). **Conforme** |
| 8.5 | Évaluer d'autres participants après un événement | POST /participant-reviews, GET .../participant/:id, .../event/:eventId → évaluation créée par l'organisateur uniquement, événement COMMUNITY terminé, participant accepté | Automatisé : `participant-reviews.service.spec.ts` (`create` : tous les cas de refus, création réussie). **Conforme** |
| 8.6 | Modifier / supprimer une évaluation de participant | PATCH/DELETE /participant-reviews/:id → évaluation modifiée/supprimée par son auteur uniquement | Automatisé : `participant-reviews.service.spec.ts` (`update`, `delete`, ForbiddenException si non-auteur). **Conforme** |

## Notifications

| ID | Fonctionnalité | Scénario → résultat attendu | Vérification |
|---|---|---|---|
| 9.1 | Consulter ses notifications (avec compteur non lues) | GET /notifications, /unread-count → liste (filtrable non-lues) + compteur exact | Automatisé : `notifications.service.spec.ts` / `.controller.spec.ts` (`getForUser`, `getUnreadCount`). **Conforme** |
| 9.2 | Marquer comme lue / tout marquer comme lu | PATCH :id/read, /read-all → statut lu mis à jour (une ou toutes) | Automatisé : `notifications.service.spec.ts` (`markAsRead`, `markAllAsRead`). **Conforme** |
| 9.3 | Supprimer une notification | DELETE /notifications/:id → notification supprimée, refusé si autre utilisateur | Automatisé : `notifications.service.spec.ts` (`delete`, ForbiddenException si autre utilisateur). **Conforme** |

## Modération & signalements

| ID | Fonctionnalité | Scénario → résultat attendu | Vérification |
|---|---|---|---|
| 10.1 | Signaler un événement ou un utilisateur | POST /reports → signalement créé, doublon refusé, auto-signalement refusé | Automatisé : `reports.service.spec.ts` (`createReport` : validations, doublon P2002) + Manuel (signalement sur "Festival des Lumières"). **Conforme** |
| 10.2 | Consulter ses propres signalements | GET /reports/my → liste des signalements de l'utilisateur | Automatisé : `reports.service.spec.ts` (`getMyReports`). **Conforme** |
| 10.3 | Consulter tous les signalements et traiter leur statut | GET /reports, PATCH :id/status (Admin) → liste complète renvoyée, statut mis à jour | Manuel : curl admin : `GET /reports` renvoie le signalement créé, `PATCH :id/status` (RESOLVED) confirmé (aucun test automatisé sur ces deux endpoints ; seuls `createReport`/`getMyReports` sont couverts). **Conforme** |

## Tableaux de bord

| ID | Fonctionnalité | Scénario → résultat attendu | Vérification |
|---|---|---|---|
| 11.1 | Dashboard générique (redirection selon rôle) | Accès à `/dashboard` → redirection `DashboardRedirectPage` vers `/dashboard/organizer`, `/dashboard/user` ou `/events` selon le rôle | Automatisé : `frontend/src/__tests__/DashboardRedirectPage.test.tsx` (non authentifié → /events, ORGANIZER → dashboard organisateur, USER → dashboard participant, autre rôle → /events). **Conforme** |
| 11.2 | Dashboard organisateur (vue d'ensemble événements professionnels) | GET /dashboard/organizer/overview, /organizer/events → statistiques et événements PROFESSIONAL de l'organisateur | Automatisé : `dashboard.service.spec.ts` (`getOrganizerOverview`, `getOrganizerEvents`) + Manuel (curl `organizer@eventnow.fr` : 2 événements PROFESSIONAL). **Conforme** |
| 11.3 | Dashboard participant (vue d'ensemble événements communautaires créés) | GET /dashboard/user/overview, /user/events → statistiques et événements COMMUNITY créés par le participant | Automatisé : `dashboard.service.spec.ts` (`getClientOverview`, `getClientEvents`) + Manuel (curl `user@eventnow.fr`). **Conforme** |

## Divers

| ID | Fonctionnalité | Scénario → résultat attendu | Vérification |
|---|---|---|---|
| 12.1 | Upload d'images (événements, avatar) | POST /upload/image, /images, DELETE /upload/image → image(s) uploadée(s) sur Cloudinary, validation type/taille, suppression | Automatisé : `upload.service.spec.ts` / `.controller.spec.ts` (`uploadImage`, `uploadMultipleImages`, `validateImageFile`, `deleteImage`). **Conforme** |
| 12.2 | Géocodage d'adresses (recherche de lieu à la création d'événement) | Appel `geocodingService.ts` → API adresse.data.gouv.fr → suggestions d'adresses avec coordonnées GPS | Automatisé : `frontend/src/__tests__/geocodingService.test.ts` (`searchAddress`, `reverseGeocode`, requête courte/vide, réponse mappée, erreur réseau, réponse non-ok). **Conforme** |
| 12.3 | Rappels par email automatiques avant un événement | Tâche planifiée `email-reminders.job.ts` (J-7, J-1) → emails de rappel envoyés, agrégés par commande | Automatisé : `email-reminders.job.spec.ts` (`sendReminders7Days`, `sendReminders1Day`). **Conforme** |
| 12.4 | Nettoyage automatique des statuts staff expirés | Tâche planifiée `staff-cleanup.job.ts` → statuts staff supprimés pour les événements terminés | Automatisé : `staff-cleanup.job.spec.ts` + `tickets.service.spec.ts` (`removeStaffForEndedEvents`). **Conforme** |
| 12.5 | Envoi d'emails transactionnels | Backend `mail` (confirmation commande, rappels J-7/J-1, annulation, email de test) → email envoyé avec le bon contenu, échec géré sans interrompre le flux | Automatisé : `mail.service.spec.ts` / `.controller.spec.ts` (`sendOrderConfirmation`, `sendEventReminder7Days`, `sendEventReminder1Day`, `sendEventCancellation`, `sendTestEmail`) + Manuel (log "Email confirmation envoyé à user@eventnow.fr" lors de l'achat gratuit du domaine 4). Note : l'invitation staff passe par une notification in-app (`notifications.service.ts`) et non par le module `mail`. **Conforme** |

## Tests structurels et sécurité

| ID | Fonctionnalité | Scénario → résultat attendu | Vérification |
|---|---|---|---|
| 13.1 | Réservation avec stock insuffisant | POST /bookings avec quantité > stock disponible → exception levée, aucune écriture en base | Automatisé : `bookings.service.spec.ts` (`createBooking`, `should throw BadRequestException if insufficient stock`). **Conforme** |
| 13.2 | Stock épuisé pendant la transaction (race condition) | Le verrou Redis passe mais la mise à jour du stock en transaction échoue (stock déjà épuisé par une réservation concurrente) → exception levée | Automatisé : `bookings.service.spec.ts` (`createBooking`, `should throw if stock depleted during transaction`). **Conforme** |
| 13.3 | Expiration des réservations en attente | Job `expireOldBookings` sur une réservation PENDING dont `expiresAt` est dépassé → réservation passée EXPIRED, stock restauré | Automatisé : `bookings.service.spec.ts` (`expireOldBookings`, `should expire old pending bookings and restore stock`). **Conforme** |
| 13.4 | Génération d'un QR code valide et lié à un billet unique | Génération de l'image QR à partir de la valeur stockée sur le billet → image QR valide | Automatisé (partiel) : `tickets/qr-generator.service.spec.ts` (`generateQRImage`) couvre la génération de l'image. La génération de la valeur unique par billet (méthode privée `generateQRCode` dans `orders.service.ts`, appelée par `confirmPayment`) n'est couverte par aucun test dédié. `orders.service.spec.ts` mocke directement `ticket.create` avec un `qrCode` fixe (`'QR1'`). **Non vérifié pour le volet unicité : test à ajouter (assertion que deux billets d'une même commande reçoivent des `qrCode` distincts)** |
| 13.5 | Validation des données à la création d'un événement | POST /events avec titre/lieu manquant, date invalide, type/catégorie invalide, ou `ticket_categories` vide → requête rejetée (400) | Automatisé : `events/dto/create-event.dto.spec.ts` (`should reject a missing title`, `should reject a missing location`, `should reject an invalid event_date`, `should reject an invalid type`, `should reject an invalid category`, `should reject an empty ticket_categories array`). **Conforme** |
| 13.6 | Hashage des mots de passe (jamais stocké en clair) | Inscription d'un utilisateur → mot de passe haché via bcrypt avant persistance | Automatisé : `auth/auth.service.spec.ts` (`register`, `should successfully register a new client user` : vérifie l'appel `bcrypt.hash(password, 10)` avant `user.create`). **Conforme** |
| 13.7 | Protection XSS (contenu avec balise `<script>` neutralisé) | Corps de requête contenant `<script>alert("xss")</script>` → tags neutralisés avant traitement | Automatisé : `common/interceptors/sanitize.interceptor.spec.ts` (`should sanitize HTML from string body`, `should sanitize nested objects`) + `security/security.spec.ts` (`should sanitize XSS attempts`). **Conforme** |
| 13.8 | Rate limiting (6 tentatives de connexion en moins de 60s → la 6ᵉ rejetée en 429) | 6 appels à POST /auth/login en moins de 60s → le 6ᵉ appel renvoie 429 | Automatisé (config) : `security/rate-limit.config.spec.ts` teste la configuration (`should be defined`, `should be a module`) sans exercer le comportement + Manuel : rafale de requêtes déclenchée en local sur /auth/login, événement `RATE_LIMIT` confirmé dans les logs de sécurité (capture conservée, dossier principal p.21). Aucun test automatisé (unitaire ou e2e) n'exerce ce comportement dans le repo. **Conforme** |
| 13.9 | Contrôle d'accès (endpoint admin appelé sans authentification → 401) | Appel d'un endpoint protégé par `JwtAuthGuard`/`RolesGuard` sans token → requête rejetée | Automatisé (niveau guards) : `auth/guards/jwt-auth.guard.spec.ts` et `auth/guards/roles.guard.spec.ts` testent la logique des guards sur un `ExecutionContext` mocké + Manuel : requête POST sans token sur /api/v1/mail/test via Postman, 401 "Unauthorized" confirmé (capture conservée, dossier principal p.29). **Conforme** |
