#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js 18 ou superior e necessario para iniciar o site." >&2
  exit 1
fi

node -e "if (Number(process.versions.node.split('.')[0]) < 18) process.exit(1)" || {
  echo "Esta versao do Node.js e antiga. Instale a versao 18 ou superior." >&2
  exit 1
}

if [ ! -d "node_modules/dotenv" ]; then
  npm install
fi

exec npm start
