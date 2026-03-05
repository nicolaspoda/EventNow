# E2E tests (Playwright)

Tests end-to-end des parcours utilisateur (landing, auth, client, organisateur, staff).

## Prérequis

- Backend et frontend tournent (ex. `docker-compose up` ou `npm run start:dev` + `npm run dev`).
- Base de données seedée : `docker-compose run --rm backend npx prisma db seed` (crée organizer@eventnow.fr, client@eventnow.fr, staff@eventnow.fr avec le mot de passe `Organizer123!`).

## Lancer les tests

Tous les scénarios sont dans un seul fichier (`flows.spec.ts`) : 3 flux en parallèle (Client, Organisateur, Staff).

```bash
cd frontend
npm install
npx playwright install chromium
npm run test:e2e
```

### Voir le workflow complet à l’écran (3 onglets Chrome)

Exécute ces commandes **dans l’ordre**, depuis la **racine du projet** (`EventNow/`). Les 3 fenêtres Chrome (Client, Organisateur, Staff) s’ouvrent en parallèle et tu peux suivre tout le déroulé.

```bash
docker-compose up -d
docker-compose run --rm backend npx prisma db seed
cd frontend
npx playwright install chromium
npm run test:e2e:flows
```

Pour vérifier que tout passe **sans** ouvrir les navigateurs (headless) :

```bash
cd frontend && npm run test:e2e:flows:headless
```

### Tout en une commande (workflow complet)

Depuis la **racine du projet** (`EventNow/`), un script démarre les services, seed la base et lance les tests headless :

```bash
bash scripts/e2e-full.sh
```

(Prérequis : Docker, `npm install` et `npx playwright install chromium` dans `frontend/`.)

### Voir l’exécution à l’écran (recommandé)

**3 fenêtres en parallèle** (Client, Organisateur, Staff) — tous les scénarios, sans ouverture/fermeture en rafale.

À lancer **dans ton terminal** (à la racine du projet) :

```bash
# 1. Démarrer Docker + seed (si pas déjà fait)
docker-compose up -d
docker-compose run --rm backend npx prisma db seed

# 2. Installer Chromium une fois (si pas déjà fait)
cd frontend && npx playwright install chromium

# 3. Lancer les 3 flux avec fenêtres visibles
npm run test:e2e:flows
```

Le frontend Docker sur `http://localhost:5173` utilise déjà l’API sur le port 3001 ; Playwright réutilise ce serveur. Si aucun frontend n’est sur 5173, Playwright démarre `npm run dev:e2e` (avec `VITE_API_URL=http://localhost:3001`).

- Une fenêtre **Client** : landing → connexion → catalogue → réservations → billets → commandes → dashboard client → création événement communautaire → réservation → checkout → paiement → succès → déconnexion.
- Une fenêtre **Organisateur** : connexion → dashboard pro → remboursements → création/édition événement → stats → déconnexion.
- Une fenêtre **Staff** : connexion → validation billets → historique → déconnexion.

Les 3 fenêtres restent ouvertes pendant toute l’exécution (ralentissement ~500 ms entre chaque action pour pouvoir suivre).

Pour une exécution rapide sans ouvrir les navigateurs : `npm run test:e2e:flows:headless`

Autres options :

- **Interface Playwright** : `npm run test:e2e:ui`
- **Rapport HTML** : après une run, `npx playwright show-report`

## Variables

- `PLAYWRIGHT_BASE_URL` : URL du frontend (défaut `http://localhost:5173`).

## Dépannage : la connexion reste sur /login

Si les tests restent sur la page de connexion après avoir cliqué sur « Se connecter », l’API n’est probablement pas joignable par le navigateur :

- **Avec Docker** : le backend est exposé sur le port **3001** (pas 3000). Le frontend doit appeler `http://localhost:3001`.
  - Soit vous utilisez le **frontend Docker** (`docker-compose up`), déjà configuré avec `VITE_API_URL=http://localhost:3001` → ouvrez `http://localhost:5173` et lancez les tests.
  - Soit vous lancez le front en local (`npm run dev`) : avant de lancer le dev server, définissez `VITE_API_URL=http://localhost:3001` (ou lancez avec `VITE_API_URL=http://localhost:3001 npm run dev`).
- Vérifiez que le backend répond : `curl -s http://localhost:3001/api/v1/health` (ou le port que vous utilisez).
- Vérifiez que la base est seedée : `docker-compose run --rm backend npx prisma db seed`.

## Structure

- `e2e/specs/flows.spec.ts` : 3 flux (Client, Organisateur, Staff), exécutés en parallèle.
- `e2e/fixtures/` : utilisateurs de test (`test-users.ts`) et helpers d’auth.
