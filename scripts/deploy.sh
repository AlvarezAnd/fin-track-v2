#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

KEY="$ROOT/scripts/deploy/id_ed25519"
PUB="$KEY.pub"
KNOWN="$ROOT/scripts/deploy/known_hosts"

die() {
  printf '%s\n' "$*" >&2
  exit 1
}

command -v ssh >/dev/null || die "Hace falta OpenSSH (ssh)."
command -v ssh-keygen >/dev/null || die "Hace falta ssh-keygen."
command -v tar >/dev/null || die "Hace falta tar."

if [[ ! -f "$ROOT/.env.deploy" ]]; then
  die "Falta .env.deploy. Copiá .env.deploy.example a .env.deploy y completá DEPLOY_HOST y DEPLOY_USER."
fi

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%$'\r'}"
  [[ -z "$line" || "$line" == \#* ]] && continue
  [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || die "Línea inválida en .env.deploy: $line"
  key="${BASH_REMATCH[1]}"
  value="${BASH_REMATCH[2]}"
  if [[ "$value" == \"*\" && "$value" == *\" ]]; then
    value="${value:1:${#value}-2}"
  fi
  case "$key" in
    DEPLOY_HOST) DEPLOY_HOST="$value" ;;
    DEPLOY_USER) DEPLOY_USER="$value" ;;
    DEPLOY_PORT) DEPLOY_PORT="$value" ;;
    REMOTE_DIR) REMOTE_DIR="$value" ;;
    *) die "Variable desconocida en .env.deploy: $key" ;;
  esac
done < "$ROOT/.env.deploy"

: "${DEPLOY_PORT:=22}"
: "${REMOTE_DIR:=apps/fin-track}"

[[ "${DEPLOY_HOST:-}" =~ ^[A-Za-z0-9._-]+$ ]] || die "DEPLOY_HOST tiene que ser un host o una IP."
[[ "${DEPLOY_USER:-}" =~ ^[A-Za-z0-9._-]+$ ]] || die "DEPLOY_USER tiene que ser el usuario SSH del servidor."
[[ "$DEPLOY_PORT" =~ ^[0-9]+$ ]] || die "DEPLOY_PORT tiene que ser un número."
[[ "$REMOTE_DIR" =~ ^[A-Za-z0-9._/-]+$ && "$REMOTE_DIR" != /* && "$REMOTE_DIR" != *..* ]] || die "REMOTE_DIR tiene que ser una ruta relativa al home, sin .."

mkdir -p "$ROOT/scripts/deploy"

mostrar_clave_publica() {
  printf '\nCopiá esta clave pública al servidor, en ~/.ssh/authorized_keys de %s:\n\n%s\n\n' \
    "$DEPLOY_USER" "$(cat "$PUB")"
  printf "En el servidor:\n\nmkdir -p ~/.ssh && chmod 700 ~/.ssh\necho '%s' >> ~/.ssh/authorized_keys\nchmod 600 ~/.ssh/authorized_keys\n\nCuando esté, volvé a ejecutar make deploy.\n" \
    "$(<"$PUB")"
}

if [[ ! -f "$KEY" ]]; then
  umask 077
  ssh-keygen -t ed25519 -f "$KEY" -N "" -C "fin-track-deploy" >/dev/null
  chmod 600 "$KEY"
  printf 'Se creó la clave privada en scripts/deploy/id_ed25519.\n'
  mostrar_clave_publica
  exit 1
fi

[[ -f "$PUB" ]] || die "Falta la clave pública scripts/deploy/id_ed25519.pub."

SSH=(
  ssh
  -i "$KEY"
  -p "$DEPLOY_PORT"
  -o IdentitiesOnly=yes
  -o BatchMode=yes
  -o StrictHostKeyChecking=accept-new
  -o "UserKnownHostsFile=$KNOWN"
  -o ConnectTimeout=15
  "$DEPLOY_USER@$DEPLOY_HOST"
)

if ! probe="$("${SSH[@]}" true 2>&1)"; then
  printf '%s\n' "$probe" >&2
  if [[ "$probe" == *"Permission denied"* ]]; then
    mostrar_clave_publica
  fi
  exit 1
fi

printf 'Conectado a %s@%s.\n' "$DEPLOY_USER" "$DEPLOY_HOST"

if ! "${SSH[@]}" "docker compose version" >/dev/null; then
  die "El servidor no tiene Docker Compose. Hace falta el plugin docker compose para el usuario $DEPLOY_USER."
fi

printf 'Copiando la app a ~/%s.\n' "$REMOTE_DIR"
tar -C "$ROOT" -czf - \
  --exclude=scripts/deploy \
  --exclude=.env.deploy \
  --exclude=.git \
  --exclude=.prompts \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=dist \
  --exclude=coverage \
  --exclude=test-results \
  --exclude=playwright-report \
  --exclude=blob-report \
  . | "${SSH[@]}" "mkdir -p \"\$HOME/$REMOTE_DIR\" && tar -xzf - -C \"\$HOME/$REMOTE_DIR\""

printf 'Reconstruyendo las imágenes y levantando los servicios.\n'
"${SSH[@]}" sh -s -- "$REMOTE_DIR" <<'EOF'
set -eu
dir="$1"
cd "$HOME/$dir"
if [ ! -f .env.ngrok ]; then
  printf 'Falta .env.ngrok. Completá NGROK_AUTHTOKEN y NGROK_DOMAIN antes de desplegar.\n' >&2
  exit 1
fi
compose() {
  docker compose --env-file .env.ngrok "$@"
}
compose build --pull
compose rm -sf frontend backend || true
name=$(compose config 2>/dev/null | awk '/^name:/ { print $2; exit }')
if [ -z "$name" ]; then
  name=$(basename "$PWD")
fi
docker volume rm -f \
  "${name}_frontend_node_modules" \
  "${name}_frontend_next" \
  "${name}_backend_node_modules"
compose up -d --force-recreate --remove-orphans
intentos=0
while [ "$intentos" -lt 30 ]; do
  estados="$(compose ps --all --format '{{.Service}} {{.State}} {{.Health}}')"
  listo=1
  case "$estados" in
    *"frontend running"*) ;;
    *) listo=0 ;;
  esac
  case "$estados" in
    *"backend running"*) ;;
    *) listo=0 ;;
  esac
  case "$estados" in
    *"db running starting"*|*"db running unhealthy"*) listo=0 ;;
    *"db running"*) ;;
    *) listo=0 ;;
  esac
  case "$estados" in
    *"ngrok running"*) ;;
    *) listo=0 ;;
  esac
  if [ "$listo" -eq 1 ]; then
    compose ps
    exit 0
  fi
  if [ "$intentos" -eq 0 ]; then
    printf 'Esperando a que frontend, backend, db y ngrok queden en marcha.\n'
  fi
  intentos=$((intentos + 1))
  sleep 2
done
printf 'Los servicios no quedaron en marcha.\n' >&2
compose ps >&2 || true
compose logs --tail 80 >&2 || true
exit 1
EOF

printf 'Fin Track está en marcha.\nFrontend: http://%s:3010\nBackend: http://%s:4010\n' \
  "$DEPLOY_HOST" "$DEPLOY_HOST"
