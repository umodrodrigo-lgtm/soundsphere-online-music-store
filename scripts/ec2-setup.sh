#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# SoundSphere — One-time EC2 setup script

# Run as    : sudo bash ec2-setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/opt/soundsphere"
DEPLOY_USER="ec2-user"   # change if using a custom user

echo "==> Installing Docker..."
dnf update -y
dnf install -y docker
systemctl enable --now docker
usermod -aG docker "$DEPLOY_USER"

echo "==> Installing Docker Compose v2 plugin..."
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
     -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
docker compose version

echo "==> Creating app directory structure..."
mkdir -p "$APP_DIR/database"
mkdir -p "$APP_DIR/backend"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

# ── .env files (fill in real values after running this script) ────────────────
cat > "$APP_DIR/.env" <<'EOF'
# docker-compose.prod.yml variables
DOCKERHUB_USER=your-dockerhub-username
IMAGE_TAG=latest

DB_ROOT_PASSWORD=CHANGE_THIS_ROOT_PASSWORD
DB_NAME=soundsphere
DB_USER=soundsphere_user
DB_PASSWORD=CHANGE_THIS_DB_PASSWORD
EOF

cat > "$APP_DIR/backend/.env" <<'EOF'
PORT=5000
NODE_ENV=production

DB_HOST=db
DB_PORT=3306
DB_NAME=soundsphere
DB_USER=soundsphere_user
DB_PASSWORD=CHANGE_THIS_DB_PASSWORD

JWT_SECRET=CHANGE_THIS_TO_A_LONG_RANDOM_STRING
JWT_EXPIRES_IN=7d

UPLOAD_PATH=./uploads
MAX_FILE_SIZE=52428800
FRONTEND_URL=http://YOUR_EC2_PUBLIC_IP_OR_DOMAIN
APP_NAME=SoundSphere
APP_URL=http://YOUR_EC2_PUBLIC_IP_OR_DOMAIN
EOF

echo ""
echo "✅ EC2 setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit $APP_DIR/.env         — set DOCKERHUB_USER, DB passwords"
echo "  2. Edit $APP_DIR/backend/.env — set DB passwords, JWT_SECRET, FRONTEND_URL"
echo "  3. Log out and back in so docker group takes effect (or run: newgrp docker)"
echo ""
