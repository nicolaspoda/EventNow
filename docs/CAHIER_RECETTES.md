# Cahier de recettes

Ci-dessous les 83 fonctionnalités de l'inventaire EventNow (13 domaines), du parcours simple aux règles métier les plus sensibles (accès, paiement, modération), plus une section de tests structurels et sécurité qui traverse tout le reste. Pour chaque ligne, j'ai vérifié la référence citée en lisant le code : nom de fichier de test et méthode/`describe` quand un test automatisé existe, ou un contrôle manuel direct sur l'API/le navigateur quand ce n'était pas le cas. Les deux points qui restaient marqués "Non vérifié" (unicité du QR code par billet, parcours de paiement sécurisé complet) ont depuis été vérifiés et sont désormais conformes.

## Authentification & compte

| ID | Type | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|---|
| F-01 | Fonctionnel | Inscription participant | Un participant s'inscrit avec un email et un mot de passe valides | Un compte participant est créé et des jetons de connexion sont renvoyés | Inscription réussie, compte et jetons délivrés comme attendu | **Conforme** |
| F-02 | Fonctionnel | Inscription organisateur | Un organisateur s'inscrit via le formulaire dédié | Un compte organisateur est créé | Compte organisateur créé avec succès | **Conforme** |
| F-03 | Fonctionnel | Connexion email/mot de passe | Un utilisateur se connecte avec son email et son mot de passe | Les jetons de connexion sont renvoyés | Connexion réussie pour les différents profils testés (administrateur, organisateur, participant, staff) | **Conforme** |
| F-04 | Fonctionnel | Connexion via Google (OAuth) | Un utilisateur se connecte via son compte Google | Le compte est créé ou relié, les jetons de connexion sont renvoyés | Connexion via Google fonctionnelle | **Conforme** |
| F-05 | Fonctionnel | Rafraîchissement de session / déconnexion | Un utilisateur rafraîchit sa session ou se déconnecte | De nouveaux jetons sont délivrés, ou la session est invalidée à la déconnexion | Rafraîchissement de session et déconnexion fonctionnels | **Conforme** |
| F-06 | Fonctionnel | Consultation et édition de son profil | Un utilisateur consulte puis modifie son profil | Le profil est affiché puis mis à jour | Profil consulté et mis à jour correctement | **Conforme** |
| F-07 | Fonctionnel | Profil public d'un autre utilisateur | Un utilisateur consulte le profil public d'un autre utilisateur | Le profil public s'affiche sans exposer les données privées | Profil public renvoyé sans données privées | **Conforme** |
| F-08 | Fonctionnel | Recherche d'utilisateurs | Un utilisateur recherche d'autres utilisateurs par leur nom | La liste des utilisateurs correspondants s'affiche | Recherche fonctionnelle | **Conforme** |
| F-09 | Fonctionnel | Bannissement d'un utilisateur | Un administrateur bannit puis débannit un utilisateur | L'utilisateur est banni puis débanni, et apparaît dans la liste des utilisateurs bannis | Bannissement et débannissement effectifs, confirmés sur un compte de test | **Conforme** |

## Événements

| ID | Type | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|---|
| F-10 | Fonctionnel | Parcourir / rechercher les événements | Un visiteur parcourt et filtre la liste des événements (recherche, suggestions, catégories, lieux, villes) | Les résultats s'affichent filtrés et paginés | Recherche et filtres fonctionnels | **Conforme** |
| F-11 | Fonctionnel | Consulter le détail d'un événement | Un visiteur consulte le détail d'un événement | Le détail de l'événement s'affiche avec sa note moyenne | Détail de l'événement renvoyé correctement | **Conforme** |
| F-12 | Fonctionnel | Créer un événement professionnel | Un organisateur crée un événement professionnel | L'événement est créé | Événement professionnel créé avec succès ; la création est refusée à un utilisateur qui n'a pas le rôle organisateur | **Conforme** |
| F-13 | Fonctionnel | Créer un événement communautaire | Un participant ou un organisateur crée un événement communautaire | L'événement est créé | Événement communautaire créé avec succès | **Conforme** |
| F-14 | Fonctionnel | Modifier un événement | Le propriétaire d'un événement modifie ses informations | L'événement est mis à jour | Modification réussie ; l'accès est bloqué pour un utilisateur qui n'est pas propriétaire de l'événement | **Conforme** |
| F-15 | Fonctionnel | Annuler un événement | Un organisateur annule un événement | L'événement est annulé, les remboursements et les notifications sont déclenchés | Annulation effective, remboursements et notifications déclenchés | **Conforme** |
| F-16 | Fonctionnel | Supprimer un événement | Le propriétaire d'un événement le supprime | L'événement est supprimé | Suppression effective | **Conforme** |
| F-17 | Fonctionnel | Suspendre un événement (modération) | Un administrateur suspend puis réactive un événement | Le statut de l'événement bascule entre suspendu et actif | Suspension puis réactivation effectives sur un événement de test, accès refusé à un utilisateur non-administrateur | **Conforme** |
| F-18 | Fonctionnel | Statistiques de ventes d'un événement professionnel | Un organisateur consulte les statistiques de ventes d'un de ses événements professionnels | Les statistiques de ventes s'affichent par jour | Statistiques de ventes renvoyées correctement | **Conforme** |
| F-19 | Fonctionnel | Gérer la liste "quoi apporter" (événements communautaires) | Les participants d'un événement communautaire gèrent la liste des choses à apporter | Les éléments peuvent être ajoutés, modifiés et réservés, avec un accès restreint aux participants | Liste gérée correctement, accès restreint respecté | **Conforme** |
| F-20 | Fonctionnel | Sondages internes à un événement (créer, voter, clôturer) | Les participants d'un événement créent un sondage, votent puis le clôturent | Le sondage est créé, les votes sont enregistrés et la clôture fonctionne | Sondage créé, voté et clôturé correctement | **Conforme** |

## Participation & demandes (événements communautaires)

| ID | Type | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|---|
| F-21 | Fonctionnel | Demander à participer à un événement communautaire | Un utilisateur demande à participer à un événement communautaire | La demande est créée en attente, une demande en double est refusée | Demande créée, doublon bloqué | **Conforme** |
| F-22 | Fonctionnel | Consulter ses demandes de participation | Un utilisateur consulte ses demandes de participation | Ses demandes s'affichent | Demandes de l'utilisateur listées correctement | **Conforme** |
| F-23 | Fonctionnel | Gérer les demandes reçues (accepter/refuser) | Un organisateur accepte ou refuse une demande de participation reçue | La demande est traitée, le stock est ajusté si nécessaire | Demande traitée, stock ajusté si besoin | **Conforme** |
| F-24 | Fonctionnel | Voir la liste des participants d'un événement communautaire créé | Le créateur d'un événement communautaire consulte la liste de ses participants | La liste des participants s'affiche | Liste des participants renvoyée correctement | **Conforme** |
| F-25 | Fonctionnel | Mes événements à venir (tous types) | Un utilisateur consulte ses événements à venir, tous types confondus | Les événements futurs, professionnels et communautaires, s'affichent | Événements à venir renvoyés correctement | **Conforme** |
| F-26 | Fonctionnel | Mes événements passés (participés) | Un utilisateur consulte les événements auxquels il a déjà participé | Les événements passés s'affichent triés par date | Événements passés renvoyés correctement | **Conforme** |
| F-27 | Fonctionnel | Mon calendrier d'événements | Un utilisateur consulte son calendrier combinant les événements organisés et ceux où il participe | Une liste combinée s'affiche | Calendrier combiné renvoyé correctement, confirmé sur un compte de test avec un événement affichant bien son type de participation | **Conforme** |
| F-28 | Fonctionnel | Suivre / ne plus suivre un utilisateur | Un utilisateur suit puis ne suit plus un autre utilisateur | La relation de suivi est créée puis supprimée | Suivi créé puis supprimé correctement | **Conforme** |
| F-29 | Fonctionnel | Voir abonnés / abonnements / amis communs | Un utilisateur consulte ses abonnés, ses abonnements et ses amis communs | Les listes s'affichent avec le bon statut de suivi/amitié | Abonnés, abonnements et amis communs renvoyés correctement | **Conforme** |
| F-30 | Fonctionnel | Activer/désactiver les notifications pour un follow | Un utilisateur active ou désactive les notifications pour un compte qu'il suit | La préférence est mise à jour | Préférence de notification mise à jour correctement | **Conforme** |

## Billetterie & réservation (événements professionnels)

| ID | Type | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|---|
| F-31 | Fonctionnel | Réserver temporairement des billets (blocage 10 min) | Un participant réserve temporairement des billets | La réservation est créée en attente, le stock est décrémenté, et elle expire au bout de 10 minutes | Réservation créée, stock décrémenté, expiration à 10 minutes confirmée | **Conforme** |
| F-32 | Fonctionnel | Consulter / confirmer / annuler une réservation en attente | Un participant consulte, confirme ou annule une réservation en attente | La réservation s'affiche, se confirme ou s'annule, avec restauration du stock en cas d'annulation | Réservation listée, confirmée et annulée correctement, stock restauré | **Conforme** |
| F-33 | Fonctionnel | Payer et finaliser la commande (checkout) | Un participant paie et finalise sa commande de billets | Le paiement est initié puis la commande est confirmée | Paiement initié et commande confirmée avec succès | **Conforme** |
| F-34 | Fonctionnel | Consulter ses commandes | Un participant consulte la liste puis le détail de ses commandes | La liste et le détail de commande s'affichent | Commandes listées et détail renvoyé correctement | **Conforme** |
| F-35 | Fonctionnel | Confirmation de commande réussie | Un participant arrive sur la page de confirmation après un paiement réussi | La page affiche un récapitulatif de la commande | Page de confirmation affichée avec récapitulatif correct | **Conforme** |
| F-36 | Fonctionnel | Consulter et télécharger ses billets (QR code) | Un participant consulte et télécharge ses billets, QR code inclus | Les billets s'affichent, le QR code est lisible et le PDF se télécharge | Billets listés, QR code lisible, PDF téléchargeable, confirmé sur un achat de test | **Conforme** |
| F-37 | Fonctionnel | Appliquer un code promo à l'achat | Un participant applique un code promo lors de l'achat | La réduction est calculée et le montant final s'affiche | Réduction appliquée correctement, vérifiée sur un exemple concret | **Conforme** |
| F-38 | Fonctionnel | Créer / lister / supprimer des codes promo pour un événement | Un organisateur crée, liste puis supprime des codes promo pour son événement | Le code est créé, listé puis désactivé, cette action étant réservée à l'organisateur | Cycle complet de création, listing et suppression du code promo réussi | **Conforme** |

## Paiement & remboursement (événements professionnels)

| ID | Type | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|---|
| F-39 | Fonctionnel | Paiement en ligne (Stripe) | Un participant paie en ligne son billet par carte | L'intention de paiement est créée puis la commande est confirmée après succès | Paiement en ligne initié et confirmé avec succès | **Conforme** |
| F-40 | Fonctionnel | Retour de paiement (redirection Stripe) | Un participant est redirigé vers la page de retour après son passage par la page de paiement sécurisée | Le statut du paiement s'affiche correctement | Logique d'affichage de la page de retour validée dans les différents cas (paramètres manquants, échec de chargement, confirmation réussie, écran de succès, erreur, paiement en cours, échec de paiement). Parcours complet rejoué avec une carte de test 3D Secure : authentification validée, paiement confirmé, page de succès affichée avec le récapitulatif de commande | **Conforme** |
| F-41 | Fonctionnel | Demander un remboursement | Un participant demande le remboursement de sa commande | La commande passe en attente de remboursement et l'organisateur est notifié | Remboursement demandé, organisateur notifié correctement | **Conforme** |
| F-42 | Fonctionnel | Approuver / refuser une demande de remboursement | Un organisateur approuve ou refuse une demande de remboursement | Le remboursement est déclenché ou rejeté, et l'utilisateur est notifié | Remboursement approuvé ou rejeté correctement, utilisateur notifié | **Conforme** |

## Staff (contrôle d'accès événement, événements professionnels)

| ID | Type | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|---|
| F-43 | Fonctionnel | Inviter un membre du staff pour un événement | Un organisateur invite un membre du staff pour un événement professionnel | L'invitation est créée, elle est refusée pour un événement communautaire | Invitation créée avec succès, refus confirmé pour un événement communautaire | **Conforme** |
| F-44 | Fonctionnel | Accepter / décliner une invitation staff | Un utilisateur accepte ou décline une invitation à rejoindre le staff | Le statut de participation au staff est créé ou l'invitation est refusée | Invitation acceptée ou déclinée correctement | **Conforme** |
| F-45 | Fonctionnel | Révoquer une invitation staff | Un organisateur révoque une invitation staff | L'invitation est annulée | Invitation révoquée correctement | **Conforme** |
| F-46 | Fonctionnel | Scanner les billets à l'entrée (QR code) | Un membre du staff scanne les billets à l'entrée | Le billet est validé, les cas de doublon, d'annulation ou d'événement pas encore commencé sont détectés | Billet validé, tous les cas d'erreur correctement détectés | **Conforme** |
| F-47 | Fonctionnel | Consulter l'historique des validations d'entrée | Un membre du staff consulte l'historique des validations d'entrée | La liste des scans et les statistiques s'affichent | Historique des scans et statistiques renvoyés correctement, confirmé sur un compte de test | **Conforme** |
| F-48 | Fonctionnel | Lister les événements où l'utilisateur est staff | Un utilisateur consulte la liste des événements où il est membre du staff | Les événements où son statut staff est actif s'affichent | Événements où l'utilisateur est staff renvoyés correctement, confirmé sur un compte de test | **Conforme** |

## Messagerie

| ID | Type | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|---|
| F-49 | Fonctionnel | Consulter ses conversations | Un utilisateur consulte la liste de ses conversations | Les conversations s'affichent avec un compteur de messages non lus | Conversations listées avec compteur correct | **Conforme** |
| F-50 | Fonctionnel | Ouvrir/créer une conversation (privée ou liée à un événement) | Un utilisateur ouvre ou crée une conversation, privée ou liée à un événement | La conversation est créée ou réutilisée selon son type | Conversation créée ou réutilisée correctement | **Conforme** |
| F-51 | Fonctionnel | Envoyer / lire des messages en temps réel | Un utilisateur envoie et reçoit des messages en temps réel | Le message est envoyé et diffusé instantanément aux autres participants | Message envoyé et diffusé en temps réel correctement | **Conforme** |
| F-52 | Fonctionnel | Gérer les membres d'une conversation de groupe | Un utilisateur ajoute ou retire des membres d'une conversation de groupe | Les membres sont ajoutés ou retirés, la conversation est supprimée si elle devient vide | Membres ajoutés et retirés correctement | **Conforme** |
| F-53 | Fonctionnel | Renommer / supprimer une conversation | Un utilisateur renomme ou supprime une conversation | La conversation de groupe est renommée, ou supprimée par son créateur | Conversation renommée et supprimée correctement | **Conforme** |
| F-54 | Fonctionnel | Marquer une conversation comme lue | Un utilisateur marque une conversation comme lue | Le compteur de messages non lus revient à zéro | Compteur de non-lus remis à zéro correctement | **Conforme** |

## Avis & évaluations

| ID | Type | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|---|
| F-55 | Fonctionnel | Laisser un avis sur un événement | Un participant laisse un avis sur un événement | L'avis est créé uniquement si la participation est confirmée et l'événement terminé | Avis créé dans le respect des conditions, tous les cas testés | **Conforme** |
| F-56 | Fonctionnel | Consulter les avis d'un événement | Un visiteur consulte les avis laissés sur un événement | Les avis s'affichent paginés, triés par note, sans exposer l'email de leurs auteurs | Avis paginés et triés correctement, email masqué | **Conforme** |
| F-57 | Fonctionnel | Modifier / supprimer son avis | Un utilisateur modifie ou supprime son propre avis | L'avis est modifié ou supprimé, uniquement par son auteur | Avis modifié et supprimé correctement, action refusée à un autre utilisateur | **Conforme** |
| F-58 | Fonctionnel | Consulter ses propres avis laissés | Un utilisateur consulte les avis qu'il a lui-même laissés | Ses avis s'affichent | Avis de l'utilisateur listés correctement | **Conforme** |
| F-59 | Fonctionnel | Évaluer d'autres participants après un événement | Un organisateur évalue les participants après un événement communautaire | L'évaluation est créée uniquement par l'organisateur, une fois l'événement terminé et le participant accepté | Évaluation créée dans le respect de toutes les conditions | **Conforme** |
| F-60 | Fonctionnel | Modifier / supprimer une évaluation de participant | Un organisateur modifie ou supprime une évaluation de participant | L'évaluation est modifiée ou supprimée, uniquement par son auteur | Évaluation modifiée et supprimée correctement, action refusée à un autre utilisateur | **Conforme** |

## Notifications

| ID | Type | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|---|
| F-61 | Fonctionnel | Consulter ses notifications (avec compteur non lues) | Un utilisateur consulte ses notifications avec le compteur de non-lues | La liste s'affiche, filtrable sur les non-lues, avec un compteur exact | Notifications listées avec compteur exact | **Conforme** |
| F-62 | Fonctionnel | Marquer comme lue / tout marquer comme lu | Un utilisateur marque une notification, ou toutes ses notifications, comme lues | Le statut lu est mis à jour | Statut lu mis à jour correctement, pour une notification comme pour toutes | **Conforme** |
| F-63 | Fonctionnel | Supprimer une notification | Un utilisateur supprime une de ses notifications | La notification est supprimée, l'action est refusée pour une notification appartenant à un autre utilisateur | Notification supprimée, accès protégé correctement | **Conforme** |

## Modération & signalements

| ID | Type | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|---|
| F-64 | Fonctionnel | Signaler un événement ou un utilisateur | Un utilisateur signale un événement ou un autre utilisateur | Le signalement est créé, un doublon ou un auto-signalement est refusé | Signalement créé, doublon et auto-signalement bloqués, confirmé sur un exemple concret | **Conforme** |
| F-65 | Fonctionnel | Consulter ses propres signalements | Un utilisateur consulte les signalements qu'il a effectués | Ses signalements s'affichent | Signalements de l'utilisateur listés correctement | **Conforme** |
| F-66 | Fonctionnel | Consulter tous les signalements et traiter leur statut | Un administrateur consulte l'ensemble des signalements et met à jour leur statut | La liste complète s'affiche, le statut est mis à jour | Liste complète et mise à jour du statut confirmées sur un compte administrateur | **Conforme** |

## Tableaux de bord

| ID | Type | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|---|
| F-67 | Fonctionnel | Dashboard générique (redirection selon rôle) | Un utilisateur accède au tableau de bord générique | Il est redirigé vers l'espace organisateur, participant, ou vers la liste des événements selon son rôle | Redirection correcte selon le rôle, tous les cas testés (non connecté, organisateur, participant, autre rôle) | **Conforme** |
| F-68 | Fonctionnel | Dashboard organisateur (vue d'ensemble événements professionnels) | Un organisateur consulte la vue d'ensemble de ses événements professionnels | Les statistiques et ses événements professionnels s'affichent | Vue d'ensemble organisateur renvoyée correctement, confirmée sur un compte de test avec ses événements | **Conforme** |
| F-69 | Fonctionnel | Dashboard participant (vue d'ensemble événements communautaires créés) | Un participant consulte la vue d'ensemble des événements communautaires qu'il a créés | Les statistiques et les événements créés s'affichent | Vue d'ensemble participant renvoyée correctement, confirmée sur un compte de test | **Conforme** |

## Divers

| ID | Type | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|---|
| F-70 | Fonctionnel | Upload d'images (événements, avatar) | Un utilisateur téléverse une ou plusieurs images pour un événement ou son avatar | L'image est stockée, son type et sa taille sont validés, et elle peut être supprimée | Téléversement, validation et suppression des images fonctionnels | **Conforme** |
| F-71 | Fonctionnel | Géocodage d'adresses (recherche de lieu à la création d'événement) | Un organisateur recherche une adresse lors de la création d'un événement | Des suggestions d'adresses avec coordonnées GPS s'affichent | Suggestions d'adresses avec coordonnées GPS renvoyées correctement | **Conforme** |
| F-72 | Fonctionnel | Rappels par email automatiques avant un événement | Le système envoie automatiquement des rappels par email avant un événement | Les emails de rappel sont envoyés, regroupés par commande | Rappels envoyés et regroupés par commande correctement | **Conforme** |
| F-73 | Fonctionnel | Nettoyage automatique des statuts staff expirés | Le système nettoie automatiquement les statuts staff expirés | Les statuts staff des événements terminés sont supprimés | Statuts staff expirés nettoyés correctement | **Conforme** |
| F-74 | Fonctionnel | Envoi d'emails transactionnels | Le système envoie les emails transactionnels (confirmation de commande, rappels, annulation) | L'email est envoyé avec le bon contenu, un échec d'envoi n'interrompt pas le parcours | Emails envoyés avec le bon contenu, confirmé notamment lors d'un achat gratuit de test. L'invitation staff, elle, passe par une notification dans l'application plutôt que par un email | **Conforme** |

## Tests structurels et sécurité

| ID | Type | Fonctionnalité | Scénario | Résultat attendu | Résultat obtenu | Statut |
|---|---|---|---|---|---|---|
| S-01 | Structurel | Réservation avec stock insuffisant | Un participant tente de réserver plus de billets qu'il n'en reste en stock | La réservation est refusée, rien n'est enregistré | Réservation refusée, aucune écriture en base confirmée | **Conforme** |
| S-02 | Structurel | Stock épuisé pendant la transaction (race condition) | Le stock s'épuise au moment précis où la réservation est validée, à cause d'une réservation concurrente | La réservation est refusée | Réservation refusée dans ce cas de figure | **Conforme** |
| S-03 | Structurel | Expiration des réservations en attente | Une réservation en attente dépasse son délai sans être confirmée | Elle passe automatiquement en expirée et le stock est restauré | Réservation expirée automatiquement, stock restauré | **Conforme** |
| S-04 | Structurel | Génération d'un QR code valide et lié à un billet unique | Génération du QR code associé à un billet, et vérification qu'il reste unique pour chaque billet | L'image du QR code est valide et sa valeur est unique pour chaque billet | Image générée correctement ; unicité confirmée par un test dédié | **Conforme** |
| S-05 | Structurel | Validation des données à la création d'un événement | Création d'un événement avec des données invalides (titre ou lieu manquant, date invalide, type ou catégorie incorrects, ou aucune catégorie de billet) | La création est rejetée dans chacun de ces cas | Rejet confirmé pour chacun des cas de données invalides testés | **Conforme** |
| SEC-01 | Sécurité | Hashage des mots de passe (jamais stocké en clair) | Un utilisateur s'inscrit avec un mot de passe en clair | Le mot de passe est haché avant d'être stocké, jamais conservé en clair | Hachage du mot de passe confirmé avant son enregistrement | **Conforme** |
| SEC-02 | Sécurité | Protection XSS (contenu avec balise `<script>` neutralisé) | Une requête contient une tentative d'injection de script dans son contenu | Le contenu est neutralisé avant tout traitement | Tentatives d'injection de script neutralisées correctement | **Conforme** |
| SEC-03 | Sécurité | Rate limiting (6 tentatives de connexion en moins de 60s → la 6ᵉ rejetée en 429) | Un même utilisateur tente de se connecter six fois en moins d'une minute | La sixième tentative est bloquée | Blocage confirmé en manuel ; pas de test automatisé du comportement, seule la config l'est | **Conforme** |
| SEC-04 | Sécurité | Contrôle d'accès (endpoint admin appelé sans authentification → 401) | Un utilisateur non connecté tente d'accéder à une fonctionnalité réservée aux administrateurs | L'accès est refusé | Refus confirmé en manuel ; logique des guards testée isolément | **Conforme** |
