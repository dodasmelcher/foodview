#!/usr/bin/env bash
# Assemble the web bundle Capacitor ships inside the iOS app.
# Copies ONLY the public front-end (no api/, db/, scripts/, node_modules) into
# www/, which capacitor.config.json points to as webDir. Re-run on every web
# change before `cap sync` (the npm "ios:sync" script does this for you).
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf www
mkdir -p www
cp index.html privacidade.html manifest.json sw.js www/
cp -R js styles assets www/

echo "www/ built ($(find www -type f | wc -l | tr -d ' ') files)"
