#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d node_modules/concurrently ]; then
  echo "Installing root dev dependencies..."
  npm install
fi

npm run dev
