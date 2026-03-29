#!/usr/bin/env bash
# Workflow E2E complet : démarre les services, seed la base, lance les tests Playwright.
# À exécuter depuis la racine du projet (EventNow/).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Démarrage des services (postgres, redis, backend)..."
docker-compose up -d postgres redis backend

echo "==> Attente du backend (HTTPS) sur le port 3000..."
for i in $(seq 1 30); do
  code=$(curl -sk -o /dev/null -w "%{http_code}" --connect-timeout 2 https://localhost:3000/ 2>/dev/null || echo "000")
  if [[ "$code" =~ ^[0-9]{3}$ ]]; then
    echo "    Backend prêt (HTTP $code)."
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "    Timeout: le backend n'a pas répondu. Vérifiez: docker-compose logs backend"
    exit 1
  fi
  sleep 2
done

echo "==> Seed de la base de données..."
docker-compose run --rm backend npx prisma db seed

echo "==> Lancement des tests E2E (headless)..."
cd frontend && npm run test:e2e:flows:headless
