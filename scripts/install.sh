#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# SoundSphere — Standalone install from Docker Hub
# No GitHub clone required. Everything is pulled from Docker Hub.
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/<you>/soundsphere/main/scripts/install.sh | bash
#   -- or --
#   bash install.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

INSTALL_DIR="${INSTALL_DIR:-$HOME/soundsphere}"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GREEN}==>${NC} $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC} $*"; }
error() { echo -e "${RED}[error]${NC} $*" >&2; exit 1; }

# ── Dependency check ──────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || error "Docker is not installed. Run: curl -fsSL https://get.docker.com | sh"
docker compose version >/dev/null 2>&1 || error "Docker Compose v2 plugin is not installed."

# ── Collect configuration ─────────────────────────────────────────────────────
echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║     SoundSphere — Docker Hub Install  ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

read -rp "Docker Hub username (image publisher): " DOCKERHUB_USER
[[ -z "$DOCKERHUB_USER" ]] && error "Docker Hub username is required."

read -rp "Image tag [latest]: " INPUT_TAG
IMAGE_TAG="${INPUT_TAG:-latest}"

read -rp "Install directory [$INSTALL_DIR]: " INPUT_DIR
INSTALL_DIR="${INPUT_DIR:-$INSTALL_DIR}"

echo ""
info "Database credentials (press Enter to use defaults for local testing)"
read -rp "  DB root password [rootpass123]: "   INPUT_ROOT_PASS
read -rp "  DB user password [dbpass123]:   "   INPUT_DB_PASS
read -rp "  JWT secret (leave blank to auto-generate): " INPUT_JWT

DB_ROOT_PASSWORD="${INPUT_ROOT_PASS:-rootpass123}"
DB_PASSWORD="${INPUT_DB_PASS:-dbpass123}"
JWT_SECRET="${INPUT_JWT:-$(LC_ALL=C tr -dc 'A-Za-z0-9!@#$%^&*' </dev/urandom | head -c 48 || true)}"
[[ -z "$JWT_SECRET" ]] && JWT_SECRET="change-this-secret-$(date +%s)"

read -rp "Public hostname / IP [http://localhost]: " INPUT_HOST
APP_URL="${INPUT_HOST:-http://localhost}"

# ── Create directory layout ───────────────────────────────────────────────────
info "Creating $INSTALL_DIR ..."
mkdir -p "$INSTALL_DIR/backend"

# ── Write docker-compose.yml ──────────────────────────────────────────────────
info "Writing docker-compose.yml ..."
cat > "$INSTALL_DIR/docker-compose.yml" <<COMPOSE
name: soundsphere

services:

  db:
    image: mysql:8.0
    container_name: soundsphere-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: \${DB_ROOT_PASSWORD}
      MYSQL_DATABASE:      \${DB_NAME}
      MYSQL_USER:          \${DB_USER}
      MYSQL_PASSWORD:      \${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - soundsphere-net
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost",
             "-u", "\${DB_USER}", "-p\${DB_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

  backend:
    image: \${DOCKERHUB_USER}/soundsphere-api:\${IMAGE_TAG}
    container_name: soundsphere-api
    restart: unless-stopped
    env_file: ./backend/.env
    environment:
      DB_HOST: db
    volumes:
      - uploads_data:/app/uploads
    networks:
      - soundsphere-net
    depends_on:
      db:
        condition: service_healthy

  frontend:
    image: \${DOCKERHUB_USER}/soundsphere-web:\${IMAGE_TAG}
    container_name: soundsphere-web
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    networks:
      - soundsphere-net
    depends_on:
      - backend

volumes:
  db_data:
    driver: local
  uploads_data:
    driver: local

networks:
  soundsphere-net:
    driver: bridge
COMPOSE

# ── Write .env (compose-level) ────────────────────────────────────────────────
info "Writing .env ..."
cat > "$INSTALL_DIR/.env" <<ENV
DOCKERHUB_USER=${DOCKERHUB_USER}
IMAGE_TAG=${IMAGE_TAG}

DB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}
DB_NAME=soundsphere
DB_USER=soundsphere_user
DB_PASSWORD=${DB_PASSWORD}
ENV

# ── Write backend/.env ────────────────────────────────────────────────────────
info "Writing backend/.env ..."
cat > "$INSTALL_DIR/backend/.env" <<BENV
PORT=5000
NODE_ENV=production

DB_HOST=db
DB_PORT=3306
DB_NAME=soundsphere
DB_USER=soundsphere_user
DB_PASSWORD=${DB_PASSWORD}

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

UPLOAD_PATH=./uploads
MAX_FILE_SIZE=52428800
FRONTEND_URL=${APP_URL}
APP_NAME=SoundSphere
APP_URL=${APP_URL}
BENV

# ── Pull images ───────────────────────────────────────────────────────────────
info "Pulling images from Docker Hub ..."
cd "$INSTALL_DIR"
docker compose pull

# ── Start services ────────────────────────────────────────────────────────────
info "Starting services ..."
docker compose up -d

# ── Wait for DB to be healthy ─────────────────────────────────────────────────
info "Waiting for database to be ready ..."
RETRIES=30
until docker exec soundsphere-db mysqladmin ping -h localhost --silent 2>/dev/null; do
    RETRIES=$((RETRIES - 1))
    [[ $RETRIES -eq 0 ]] && error "Database did not become healthy in time."
    sleep 3
done

# ── Apply schema (first-time only) ────────────────────────────────────────────
TABLE_COUNT=$(docker exec soundsphere-db mysql -u root -p"${DB_ROOT_PASSWORD}" \
    -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='soundsphere';" \
    --skip-column-names 2>/dev/null | tr -d '[:space:]' || echo "0")

if [[ "$TABLE_COUNT" == "0" || -z "$TABLE_COUNT" ]]; then
    info "Applying database schema from image ..."
    # schema.sql is baked into the backend image at /app/database/schema.sql
    docker exec soundsphere-api sh -c \
        "mysql -h db -u root -p'${DB_ROOT_PASSWORD}' < /app/database/schema.sql"
    info "Schema applied."
else
    info "Schema already exists ($TABLE_COUNT tables) — skipping."
fi

# ── Health check ──────────────────────────────────────────────────────────────
info "Running health check ..."
sleep 5
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/api/health" 2>/dev/null || echo "000")
if [[ "$STATUS" == "200" ]]; then
    echo ""
    echo -e "${GREEN}  ✓ SoundSphere is running at ${APP_URL}${NC}"
else
    warn "Health check returned HTTP $STATUS — services may still be starting."
    echo "  Check logs: docker compose -f $INSTALL_DIR/docker-compose.yml logs"
fi

echo ""
echo "  Useful commands:"
echo "    docker compose -f $INSTALL_DIR/docker-compose.yml logs -f"
echo "    docker compose -f $INSTALL_DIR/docker-compose.yml down"
echo "    docker compose -f $INSTALL_DIR/docker-compose.yml pull && docker compose -f $INSTALL_DIR/docker-compose.yml up -d"
echo ""
