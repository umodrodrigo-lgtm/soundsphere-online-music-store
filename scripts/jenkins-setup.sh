#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo "=========================================="
echo " SoundSphere Jenkins Setup — Amazon Linux 2023"
echo "=========================================="

# ── 1. System update ──────────────────────────────────────────────
echo ""
echo "==> Updating system packages..."
dnf update -y

# ── 2. Install Java 17 (required by Jenkins) ──────────────────────
echo ""
echo "==> Installing Java 17 (Amazon Corretto)..."
dnf install -y java-17-amazon-corretto
java -version

# ── 3. Install Jenkins ────────────────────────────────────────────
echo ""
echo "==> Adding Jenkins repository..."
wget -O /etc/yum.repos.d/jenkins.repo \
    https://pkg.jenkins.io/redhat-stable/jenkins.repo
rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key

echo "==> Installing Jenkins..."
dnf install -y jenkins

echo "==> Enabling and starting Jenkins..."
systemctl enable jenkins
systemctl start jenkins
systemctl status jenkins --no-pager

# ── 4. Install Git ────────────────────────────────────────────────
echo ""
echo "==> Installing Git..."
dnf install -y git
git --version

# ── 5. Install Docker ─────────────────────────────────────────────
echo ""
echo "==> Installing Docker..."
dnf install -y docker
systemctl enable --now docker

# Add jenkins user to docker group so Jenkins can run docker commands
usermod -aG docker jenkins
usermod -aG docker ec2-user

echo "==> Installing Docker Compose v2 plugin..."
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
     -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
docker compose version

# ── 6. Install AWS CLI v2 ─────────────────────────────────────────
echo ""
echo "==> Installing AWS CLI v2..."
curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp
/tmp/aws/install
rm -rf /tmp/aws /tmp/awscliv2.zip
aws --version

# ── 7. Open firewall port 8080 for Jenkins ────────────────────────
echo ""
echo "==> Opening port 8080 in firewalld (if active)..."
if systemctl is-active --quiet firewalld; then
    firewall-cmd --permanent --add-port=8080/tcp
    firewall-cmd --reload
else
    echo "  firewalld not active — ensure EC2 Security Group allows port 8080 inbound"
fi

# ── 8. Restart Jenkins so docker group takes effect ───────────────
echo ""
echo "==> Restarting Jenkins..."
systemctl restart jenkins
sleep 5
systemctl status jenkins --no-pager

# ── 9. Print initial admin password ──────────────────────────────
echo ""
echo "=========================================="
echo " Jenkins is ready!"
echo "=========================================="
echo ""
echo "  URL           : http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8080"
echo ""
echo "  Initial admin password:"
cat /var/lib/jenkins/secrets/initialAdminPassword
echo ""
echo "  Next steps:"
echo "  1. Open the URL above and paste the password"
echo "  2. Install suggested plugins"
echo "  3. Create your admin user"
echo "  4. Install extra plugins:"
echo "       - SSH Agent Plugin"
echo "       - GitHub Integration Plugin"
echo "       - Amazon ECR Plugin (optional — pipeline handles ECR auth)"
echo "       - Pipeline"
echo "  5. Add credentials:"
echo "       - AWS Credentials  (ID: aws-credentials)"
echo "       - SSH Private Key  (ID: soundsphere-deploy-key) → your deploy server EC2 key"
echo "  6. Create a Pipeline job pointing to your GitHub repo"
echo ""
echo "  EC2 Security Group — make sure these ports are open:"
echo "       8080  (Jenkins UI)"
echo "       22    (SSH — your IP only)"
echo ""
