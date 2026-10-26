#!/bin/bash
cd "$(dirname "$0")"
if [ ! -d "node_modules/electron" ]; then npm install --no-audit --no-fund || exit 1; fi
npx electron . --bring-on-screen
