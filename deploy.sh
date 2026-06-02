#!/bin/bash
# Деплой Рипария: git pull → install (если изменилось) → build → restart → healthcheck.
# Откат при провале билда или healthcheck. Запуск: /var/www/riparium/deploy.sh
set -euo pipefail

cd /var/www/riparium

echo "==> HEAD до: $(git rev-parse --short HEAD)"
BEFORE=$(git rev-parse HEAD)

git pull --ff-only origin main

AFTER=$(git rev-parse HEAD)

if [ "$BEFORE" = "$AFTER" ]; then
  echo "==> Изменений нет, выхожу без билда"
  exit 0
fi

echo "==> HEAD после: $(git rev-parse --short HEAD)"
echo "==> Что приехало:"
git log --oneline "$BEFORE..$AFTER"
echo

# npm install — только если менялись package*.json
if git diff --name-only "$BEFORE" "$AFTER" | grep -qE '^package(-lock)?\.json$'; then
  echo "==> Зависимости менялись, npm install"
  npm install --legacy-peer-deps
else
  echo "==> Зависимости не менялись, пропускаю install"
fi

echo "==> Билд"
NITRO_PRESET=node-server npm run build || {
  echo "!!! Билд упал. Откат: git reset --hard $BEFORE"
  git reset --hard "$BEFORE"
  exit 1
}

echo "==> Рестарт riparium"
systemctl restart riparium
sleep 4

# Healthcheck — апекс с follow-redirect
HTTP_CODE=$(curl -s -L -o /dev/null -w '%{http_code}' https://xn--80apbe1aed.xn--p1ai/)
if [ "$HTTP_CODE" = "200" ]; then
  echo "==> OK (HTTP $HTTP_CODE)"
  exit 0
else
  echo "!!! Healthcheck провален: HTTP $HTTP_CODE"
  echo "!!! Откат к $BEFORE"
  git reset --hard "$BEFORE"
  NITRO_PRESET=node-server npm run build
  systemctl restart riparium
  echo "!!! Откат завершён. Смотри журнал ниже:"
  journalctl -u riparium -n 30 --no-pager
  exit 1
fi
