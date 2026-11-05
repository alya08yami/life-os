#!/bin/zsh
set -euo pipefail
cd "$(dirname "$0")"
if command -v node >/dev/null 2>&1; then
  lifeos_node="$(command -v node)"
else
  lifeos_node="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [[ ! -x "$lifeos_node" ]]; then
  echo "Install Node.js 24, then run this launcher again."
  exit 1
fi
export PATH="$(dirname "$lifeos_node"):$PATH"
exec "$lifeos_node" scripts/expo.cjs start --web
