#!/usr/bin/env bash
# Bootstrap VM Ubuntu 22.04 para Velora (Docker Compose prod + DuckDNS + Caddy).
# Uso (en la VM):
#   export DOMAIN=velora-xxx.duckdns.org
#   export DUCKDNS_TOKEN=...
#   export DUCKDNS_SUBDOMAIN=velora-xxx   # sin .duckdns.org
#   sudo -E bash deploy/azure-vm-setup.sh
#
# Opcional: REPO_URL=https://github.com/org/velora.git  (si clonas en vez de subir archivos)

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/velora}"
DOMAIN="${DOMAIN:-}"
DUCKDNS_TOKEN="${DUCKDNS_TOKEN:-}"
DUCKDNS_SUBDOMAIN="${DUCKDNS_SUBDOMAIN:-}"
REPO_URL="${REPO_URL:-}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Ejecuta como root: sudo -E bash deploy/azure-vm-setup.sh"
  exit 1
fi

if [[ -z "$DOMAIN" ]]; then
  echo "Falta DOMAIN (ej. velora-xxx.duckdns.org)"
  exit 1
fi

echo "==> Actualizando apt e instalando dependencias"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg lsb-release git ufw

echo "==> Instalando Docker Engine + Compose plugin"
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

systemctl enable --now docker

echo "==> Firewall UFW (22/80/443)"
ufw allow OpenSSH || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw --force enable || true

echo "==> Preparando $APP_DIR"
mkdir -p "$APP_DIR"
if [[ -n "$REPO_URL" ]]; then
  if [[ ! -d "$APP_DIR/.git" ]]; then
    git clone "$REPO_URL" "$APP_DIR"
  else
    git -C "$APP_DIR" pull --ff-only || true
  fi
fi

if [[ ! -f "$APP_DIR/docker-compose.prod.yml" ]]; then
  echo "No está docker-compose.prod.yml en $APP_DIR"
  echo "Sube el proyecto (scp/rsync) o define REPO_URL."
  exit 1
fi

cd "$APP_DIR"

echo "==> .env.prod"
if [[ ! -f .env.prod ]]; then
  if [[ -f .env.prod.example ]]; then
    cp .env.prod.example .env.prod
  else
    cat > .env.prod <<EOF
DOMAIN=${DOMAIN}
MYSQL_ROOT_PASSWORD=Velora_Mysql_2026!
POSTGRES_USER=velora
POSTGRES_PASSWORD=Velora_Pg_2026!
MSSQL_SA_PASSWORD=Velora_Sql_2026!
DUCKDNS_TOKEN=${DUCKDNS_TOKEN}
DUCKDNS_SUBDOMAIN=${DUCKDNS_SUBDOMAIN}
EOF
  fi
fi
sed -i "s|^DOMAIN=.*|DOMAIN=${DOMAIN}|" .env.prod
if [[ -n "$DUCKDNS_TOKEN" ]]; then
  sed -i "s|^DUCKDNS_TOKEN=.*|DUCKDNS_TOKEN=${DUCKDNS_TOKEN}|" .env.prod || echo "DUCKDNS_TOKEN=${DUCKDNS_TOKEN}" >> .env.prod
fi
if [[ -n "$DUCKDNS_SUBDOMAIN" ]]; then
  sed -i "s|^DUCKDNS_SUBDOMAIN=.*|DUCKDNS_SUBDOMAIN=${DUCKDNS_SUBDOMAIN}|" .env.prod || echo "DUCKDNS_SUBDOMAIN=${DUCKDNS_SUBDOMAIN}" >> .env.prod
fi

echo "==> backend/.env.production"
mkdir -p backend/secrets
if [[ ! -f backend/.env.production ]]; then
  if [[ -f backend/.env.production.example ]]; then
    cp backend/.env.production.example backend/.env.production
  else
    echo "Falta backend/.env.production.example"
    exit 1
  fi
fi
# Sustituir placeholder de dominio
sed -i "s|TU-SUBDOMINIO.duckdns.org|${DOMAIN}|g" backend/.env.production

if [[ ! -f backend/secrets/firebase-adminsdk.json ]]; then
  echo "AVISO: falta backend/secrets/firebase-adminsdk.json (cópialo antes del build si usas Firebase)."
fi

echo "==> DuckDNS update + cron cada 5 min"
if [[ -n "$DUCKDNS_TOKEN" && -n "$DUCKDNS_SUBDOMAIN" ]]; then
  mkdir -p /opt/duckdns
  cat > /opt/duckdns/duck.sh <<EOF
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=${DUCKDNS_SUBDOMAIN}&token=${DUCKDNS_TOKEN}&ip=" | curl -k -o /opt/duckdns/duck.log -K -
EOF
  chmod 700 /opt/duckdns/duck.sh
  /opt/duckdns/duck.sh || true
  (crontab -l 2>/dev/null | grep -v 'duckdns/duck.sh'; echo "*/5 * * * * /opt/duckdns/duck.sh >/dev/null 2>&1") | crontab -
else
  echo "AVISO: DUCKDNS_TOKEN/SUBDOMAIN no definidos; configura DNS manualmente."
fi

echo "==> docker compose up (puede tardar varios minutos)"
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

echo ""
echo "Listo. Verifica:"
echo "  https://${DOMAIN}/"
echo "  https://${DOMAIN}/api/health?all=1"
echo "Revisa logs: docker compose -f docker-compose.prod.yml logs -f caddy backend"
