#!/usr/bin/env bash
# One-shot: import basket + stand-congrats, then AI enrich.
# Run on the Mac that has the photos (Terminal / remote desktop from phone).
set -euo pipefail
cd "$(dirname "$0")/.."

git pull origin main
npm i

BASKET_DIR="${IMPORT_BASKET_DIR:-$PWD/import/basket}"
STAND_DIR="${IMPORT_STAND_DIR:-$PWD/import/stand for congrats}"

echo "== Basket photos: $BASKET_DIR"
ls "$BASKET_DIR" | head -5
echo "== Stand photos: $STAND_DIR"
ls "$STAND_DIR" | head -5

IMPORT_SOURCE_DIR="$BASKET_DIR" npm run catalog:import-basket
IMPORT_SOURCE_DIR="$STAND_DIR" npm run catalog:import-stand-congrats

npm run catalog:seed-attributes
ENRICH_APPLY=1 ENRICH_PRODUCT_TYPE=flower-basket npm run catalog:enrich-ai
ENRICH_APPLY=1 ENRICH_PRODUCT_TYPE=stand-congrats npm run catalog:enrich-ai

echo "ALL DONE"
