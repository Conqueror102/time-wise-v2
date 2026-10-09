#!/usr/bin/env bash
# Creates a CompreFace admin account, application and recognition service,
# then adds COMPREFACE_API_KEY to .env. Run once after:
#   docker compose --profile face up -d
set -euo pipefail

URL="${COMPREFACE_ADMIN_URL:-http://localhost:8001}"
EMAIL="${COMPREFACE_ADMIN_EMAIL:-admin@timewise.local}"
ENV_FILE="${ENV_FILE:-.env}"

if grep -q '^COMPREFACE_API_KEY=.\+' "$ENV_FILE" 2>/dev/null; then
  echo "COMPREFACE_API_KEY is already set in $ENV_FILE"; exit 0
fi

echo "Waiting for CompreFace at $URL ..."
for _ in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$URL/admin/user/me" || true)
  [ "$code" = "401" ] || [ "$code" = "200" ] && break
  sleep 5
done

PASS="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)"
JAR="$(mktemp)"; trap 'rm -f "$JAR"' EXIT
json() { python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }

curl -sf -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"firstName\":\"TimeWise\",\"lastName\":\"Admin\",\"isAllowStatistics\":false}" \
  "$URL/admin/user/register" >/dev/null
curl -sf -c "$JAR" -o /dev/null -u CommonClientId:password \
  -d "grant_type=password&scope=all&username=$EMAIL&password=$PASS" "$URL/admin/oauth/token"
APP_ID=$(curl -sf -b "$JAR" -H "Content-Type: application/json" -d '{"name":"TimeWise"}' "$URL/admin/app" | json id)
API_KEY=$(curl -sf -b "$JAR" -H "Content-Type: application/json" -d '{"name":"Staff Faces","type":"RECOGNITION"}' \
  "$URL/admin/app/$APP_ID/model" | json apiKey)

printf '\n# Face recognition (CompreFace). Admin UI: %s\nCOMPREFACE_ADMIN_EMAIL=%s\nCOMPREFACE_ADMIN_PASSWORD=%s\nCOMPREFACE_API_KEY=%s\n' \
  "$URL" "$EMAIL" "$PASS" "$API_KEY" >> "$ENV_FILE"
echo "Added COMPREFACE_API_KEY to $ENV_FILE. Restart the app: docker compose --profile face up -d app"
