#!/usr/bin/env sh
# Certificats auto-signés pour Nest en HTTPS (dev local). Ignorés par git (voir .gitignore).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
mkdir -p certs
if [ ! -f certs/localhost-key.pem ]; then
  openssl req -x509 -newkey rsa:2048 \
    -keyout certs/localhost-key.pem \
    -out certs/localhost-cert.pem \
    -days 365 -nodes \
    -subj "/CN=localhost"
  echo "Certificats dev créés dans backend/certs/"
fi
