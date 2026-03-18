# Intégration Stripe - Guide

## Configuration effectuée

### Backend

1. **Package installé** : `stripe` (SDK officiel Node.js)

2. **Variables d'environnement ajoutées** dans `.env` et `.env.example` :
   ```bash
   STRIPE_SECRET_KEY=sk_test_51SlU1e3MaAxFn6oNC4MuwsUlhob2xycPzlqnxiEjQZQtgaTZSvuXRd1uw52M19ynlv56NQ8zgiiQOAlmP9bnmzKZ00kPQIUOnC
   STRIPE_PUBLISHABLE_KEY=pk_test_51SlU1e3MaAxFn6oNJh8pzsVJdYMtErCB4IRbVP4GtNPy9B2jruIFz0C6qNfgHTfJXJXSBINViIHnJ1Uf1wfFhujR00zYAg4cF7
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

3. **PaymentService modifié** (`backend/src/payment/payment.service.ts`) :
   - Initialisation du client Stripe avec la clé secrète
   - `createPaymentIntent()` crée maintenant un vrai Payment Intent Stripe
   - Montant converti en centimes (Stripe attend les montants en centimes)
   - Métadonnées ajoutées (bookingId, userId, eventId, eventTitle)
   - Retourne le `clientSecret` nécessaire au frontend
   - Méthode `getPublishableKey()` pour exposer la clé publique

4. **Endpoint ajouté** (`backend/src/app.controller.ts`) :
   - `GET /api/v1/config/stripe` : retourne la clé publique Stripe au frontend

5. **DTO mis à jour** (`backend/src/payment/dto/payment-intent.dto.ts`) :
   - Ajout de `PaymentIntentResponseDto` avec le champ `clientSecret`

### Frontend

1. **Packages installés** :
   - `@stripe/stripe-js` : chargement de Stripe.js
   - `@stripe/react-stripe-js` : composants React pour Stripe Elements

2. **Nouveau service** (`frontend/src/services/stripeService.ts`) :
   - `getPublishableKey()` : récupère la clé publique depuis l'API

3. **Nouveau composant** (`frontend/src/components/payment/StripePaymentForm.tsx`) :
   - Formulaire de paiement avec Stripe Elements (PaymentElement)
   - Gère la confirmation du paiement côté client
   - Callbacks pour succès/erreur/annulation

4. **CheckoutPage modifiée** (`frontend/src/pages/CheckoutPage.tsx`) :
   - Charge Stripe.js avec la clé publique
   - Initialise le Payment Intent et récupère le `clientSecret`
   - Affiche le formulaire Stripe Elements
   - Confirme la commande après le paiement réussi

## Comment tester

### 1. Redémarrer les services Docker

Pour que les nouvelles variables d'environnement et packages soient pris en compte :

```bash
docker-compose down
docker-compose up --build
```

### 2. Tester un paiement

1. Connecte-toi sur http://localhost:5173
2. Choisis un événement professionnel (avec billetterie payante)
3. Réserve des billets
4. Sur la page de paiement, tu verras maintenant le **formulaire Stripe Elements**

5. **Cartes de test Stripe** :
   - **Succès** : `4242 4242 4242 4242`
   - **Échec** : `4000 0000 0000 0002`
   - **3D Secure** : `4000 0027 6000 3184`
   - Date d'expiration : n'importe quelle date future (ex: 12/28)
   - CVC : n'importe quel code 3 chiffres (ex: 123)

6. Confirme le paiement → tu seras redirigé vers la page de succès

### 3. Vérifier dans le Dashboard Stripe

- Va sur https://dashboard.stripe.com/test/payments
- Tu verras les Payment Intents créés avec les métadonnées (bookingId, eventId, etc.)

## Prochaine étape : Webhook

Pour l'instant, la confirmation de commande se fait manuellement après le paiement côté client. Pour une vraie intégration production, il faudra :

1. **Configurer le webhook Stripe** :
   - Créer un endpoint `POST /api/v1/orders/webhook`
   - Vérifier la signature du webhook avec `STRIPE_WEBHOOK_SECRET`
   - Écouter l'événement `payment_intent.succeeded`
   - Appeler automatiquement `confirmPayment()` depuis le webhook

2. **En développement local** :
   - Installer Stripe CLI : `brew install stripe/stripe-cli/stripe`
   - Se connecter : `stripe login`
   - Rediriger les webhooks : `stripe listen --forward-to localhost:3000/api/v1/orders/webhook`
   - Récupérer le webhook secret affiché et le mettre dans `.env`

## Cartes de test Stripe

| Numéro de carte | Description |
|----------------|-------------|
| `4242 4242 4242 4242` | Paiement réussi |
| `4000 0000 0000 0002` | Paiement refusé |
| `4000 0000 0000 9995` | Fonds insuffisants |
| `4000 0027 6000 3184` | Authentification 3D Secure requise |

Pour tous les tests : date future + n'importe quel CVC à 3 chiffres.

## Notes importantes

- **Mode test** : Aucun vrai argent ne transite, toutes les transactions sont simulées
- **Montants** : Stripe utilise les centimes (100 = 1€), la conversion est faite automatiquement dans le code
- **Sécurité** : La clé secrète ne doit JAMAIS être exposée au frontend, seule la clé publique est envoyée
- **Automatic payment methods** : Activé pour supporter cartes, Apple Pay, Google Pay automatiquement
