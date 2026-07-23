# Manuel d'utilisation

EventNow mélange deux usages qui ne se recoupent pas complètement : la billetterie classique (concerts, conférences, festivals, où on paie et on reçoit un billet) et les événements communautaires (où on ne paie pas mais où on demande à participer). Trois rôles cohabitent, Utilisateur, Organisateur, Admin, et un statut à part, Staff, qui n'est pas un rôle global mais une affectation par événement. Ce manuel suit chaque profil dans ses parcours réels, pas dans une liste de fonctionnalités hors contexte.

## Participant (rôle Utilisateur)

C'est le rôle par défaut à l'inscription (`RegisterPage`). Un participant peut se connecter par email/mot de passe ou via Google, et deux usages complètement différents s'offrent à lui.

**Acheter un billet.** Sur un événement professionnel, l'achat se fait en deux temps, ce qui est volontaire : la réservation (`POST /bookings`) bloque le stock pendant 10 minutes sans engager de paiement, le temps de remplir le formulaire de checkout. Passé ce délai sans confirmation, le stock est relâché automatiquement, ce qui évite qu'un panier abandonné bloque des places indéfiniment. Le paiement passe ensuite par Stripe Elements sur `CheckoutPage`, et une fois confirmé, le billet est généré avec un QR code unique, téléchargeable en PDF depuis `MyTicketsPage`. Un code promo peut être appliqué au moment du checkout si l'organisateur en a créé un pour l'événement.

**Créer ou rejoindre un événement communautaire.** N'importe quel utilisateur peut créer ce type d'événement, pas besoin d'être Organisateur, c'est justement pensé pour l'usage entre particuliers (soirée, sortie de groupe...). Contrairement à un événement professionnel, l'adresse exacte reste masquée tant que la demande de participation n'a pas été acceptée par le créateur (`EventDetailPage` → `POST /participation-requests`). Une fois accepté, le participant a accès à la liste "qui amène quoi" de l'événement et aux sondages internes, deux fonctionnalités qui n'existent que côté communautaire.

**Côté social.** Suivre d'autres comptes, et devenir "ami" automatiquement quand le suivi est réciproque : il n'y a pas de système de demande d'ami séparé, c'est juste le follow mutuel qui déclenche le statut. La messagerie (`MessagesPage`) fonctionne en temps réel via WebSocket, avec des conversations privées, de groupe, ou rattachées à un événement. Un avis ne peut être laissé qu'après avoir réellement assisté à l'événement, billet scanné à l'entrée pour un événement pro ou demande acceptée pour un communautaire, et seulement une fois l'événement terminé (`can-review` vérifie cette condition côté backend avant d'autoriser le formulaire).

Le compte de démo `user@eventnow.fr` / `User1234!` (créé par le seed) permet de tester ce parcours directement.

## Organisateur

Un organisateur reste un utilisateur comme un autre : il peut acheter des billets ailleurs, être staff sur l'événement de quelqu'un d'autre, utiliser la messagerie. Ce qui lui est propre, c'est la partie commerciale.

**Créer un événement professionnel** (`CreateEventPage`, type `PROFESSIONAL`) : lieu avec géocodage d'adresse, image de couverture, dates de début et de fin, et une ou plusieurs catégories de billets avec prix et stock chacune. C'est la seule voie pour vendre des billets, un compte Utilisateur ne peut créer que des événements communautaires, une `ForbiddenException` bloque la tentative inverse côté backend.

**Suivre l'activité.** Le tableau de bord organisateur (`OrganizerDashboardPage`) donne une vue d'ensemble des événements pros, et chaque événement a sa propre page de statistiques de ventes (`EventStatsPage`). Les demandes de remboursement arrivent sur `RefundRequestsPage` pour approbation ou refus au cas par cas, le remboursement n'est jamais automatique.

**Gérer le staff.** Inviter quelqu'un comme staff se fait par email depuis `StaffInvitationsPage` (`POST /staff-invitations`), et cette invitation ne concerne que les événements professionnels. Inviter du staff sur un événement communautaire renvoie une erreur, ça n'aurait pas de sens sans billetterie à contrôler. L'organisateur peut aussi révoquer une invitation à tout moment.

**Codes promo.** Créés par événement (`PromoCodesPage`), appliqués par le participant au checkout après validation.

Compte de démo : `organizer@eventnow.fr` / `Organizer1234!`.

## Staff (statut, pas un rôle)

N'importe quel Utilisateur ou Organisateur peut recevoir une invitation staff sur un événement précis. Une fois l'invitation acceptée (`AcceptStaffInvitationPage`), un menu dédié apparaît avec deux écrans : `StaffScanPage` pour scanner les billets à l'entrée via la caméra (le QR code du billet PDF), et `StaffValidationsPage` pour consulter l'historique des scans et les statistiques de validation en direct. Le statut staff est retiré automatiquement après l'événement par une tâche planifiée, il n'y a rien à faire manuellement pour "redevenir" un utilisateur normal.

Compte de démo : `staff@eventnow.fr` / `Staff1234!`, déjà affecté comme staff sur l'événement "Daft Punk Tribute Night" dans les données du seed, ce qui est pratique pour tester le scan sans repasser par tout le flux d'invitation.

## Admin

Le seul rôle sans interface de création d'événements, c'est un rôle de modération, pas de gestion métier. Les signalements déposés par les autres comptes (sur un événement ou un utilisateur) arrivent sur `AdminReportsPage`, où l'admin peut faire évoluer leur statut. À partir de là, deux actions concrètes : suspendre un événement problématique, ou bannir un compte utilisateur (avec un onglet dédié pour consulter les comptes déjà bannis).

Compte de démo : `admin@eventnow.fr` / `Admin1234!`.

## Notifications et rappels

Indépendamment du rôle, chaque compte a un centre de notifications in-app (compteur de non-lues, marquage lu/tout lire) qui couvre les événements de la vie de la plateforme : réponse à une demande de participation, invitation staff, nouveau message, etc. En plus de ça, des emails automatiques partent avant un événement à venir (rappels J-7 et J-1), gérés par une tâche planifiée côté backend et non par une action utilisateur.
