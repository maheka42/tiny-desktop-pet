#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is required. Install the current LTS version from https://nodejs.org/ and run this file again."
  read -n 1
  exit 1
fi
if [ ! -d "node_modules/electron" ]; then
  echo "First run: installing Electron. This may take a few minutes..."
  npm install --no-audit --no-fund || { read -n 1; exit 1; }
fi
npm start
