// ─────────────────────────────────────────────────────────────────────────────
// SoundSphere — Jenkinsfile
// Jenkins agent : Amazon Linux 2023 EC2
// Flow          : GitHub push → Jenkins (AL2023) → build images
//                 → push to Docker Hub → SSH deploy to app EC2 (AL2023)
//
// Jenkins credentials (Manage Jenkins → Credentials → Global):
//   dockerhub-credentials  : Username with password  (Docker Hub username + password/token)
//   soundsphere-deploy-host: Secret text             (app EC2 public IP or domain)
//   soundsphere-deploy-key : SSH Username with private key  (app EC2 .pem)
// ─────────────────────────────────────────────────────────────────────────────

pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        // ── Docker Hub (binds DOCKERHUB_CREDS_USR and DOCKERHUB_CREDS_PSW) ──
        DOCKERHUB_CREDS = credentials('dockerhub-credentials')
        REPO_API        = "${DOCKERHUB_CREDS_USR}/soundsphere-api"
        REPO_WEB        = "${DOCKERHUB_CREDS_USR}/soundsphere-web"

        // ── App EC2 ──────────────────────────────────────────────────────────
        DEPLOY_HOST     = credentials('soundsphere-deploy-host')  // secret text: IP or domain
        DEPLOY_USER     = 'ec2-user'
        DEPLOY_PATH     = '/opt/soundsphere'

        // ── Image tag ─────────────────────────────────────────────────────────
        IMAGE_TAG       = "${env.GIT_COMMIT?.take(8) ?: 'latest'}"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }

    stages {

        // ── 1. Checkout ───────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                echo "Branch: ${env.GIT_BRANCH}   Tag: ${IMAGE_TAG}"
            }
        }

        // ── 2. Build Docker images ────────────────────────────────────
        stage('Build Images') {
            steps {
                sh "docker build -t ${REPO_API}:${IMAGE_TAG} -t ${REPO_API}:latest ./backend"
                sh "docker build -t ${REPO_WEB}:${IMAGE_TAG} -t ${REPO_WEB}:latest ./frontend"
            }
        }

        // ── 3. Push to Docker Hub ─────────────────────────────────────
        stage('Push to Docker Hub') {
            steps {
                sh "echo \"${DOCKERHUB_CREDS_PSW}\" | docker login -u \"${DOCKERHUB_CREDS_USR}\" --password-stdin"
                sh "docker push ${REPO_API}:${IMAGE_TAG}"
                sh "docker push ${REPO_API}:latest"
                sh "docker push ${REPO_WEB}:${IMAGE_TAG}"
                sh "docker push ${REPO_WEB}:latest"
                sh "docker logout"
            }
        }

        // ── 4. Deploy on app EC2 ──────────────────────────────────────
        stage('Deploy') {
            steps {
                sshagent(credentials: ['soundsphere-deploy-key']) {

                    // Copy compose file and database scripts to app server
                    sh """
                        scp -o StrictHostKeyChecking=no \
                            docker-compose.prod.yml \
                            ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/docker-compose.prod.yml
                    """
                    sh """
                        scp -o StrictHostKeyChecking=no -r \
                            database/ \
                            ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/database/
                    """

                    // SSH → pull new images → restart stack
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                            set -e

                            cd ${DEPLOY_PATH}

                            IMAGE_TAG=${IMAGE_TAG} \
                            DOCKERHUB_USER=${DOCKERHUB_CREDS_USR} \
                            docker compose -f docker-compose.prod.yml pull

                            IMAGE_TAG=${IMAGE_TAG} \
                            DOCKERHUB_USER=${DOCKERHUB_CREDS_USR} \
                            docker compose -f docker-compose.prod.yml up -d --remove-orphans

                            docker image prune -f
                        '
                    """
                }
            }
        }

        // ── 5. Smoke test ─────────────────────────────────────────────
        stage('Verify') {
            steps {
                sshagent(credentials: ['soundsphere-deploy-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                            sleep 5
                            STATUS=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health)
                            echo "Health check: \$STATUS"
                            [ "\$STATUS" = "200" ] || { echo "FAILED"; exit 1; }
                            echo "Deployment OK"
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Deployed ${IMAGE_TAG} to EC2 successfully"
        }
        failure {
            echo "Deployment FAILED — commit ${IMAGE_TAG}"
        }
        always {
            sh "docker rmi ${REPO_API}:${IMAGE_TAG} ${REPO_API}:latest 2>/dev/null || true"
            sh "docker rmi ${REPO_WEB}:${IMAGE_TAG} ${REPO_WEB}:latest 2>/dev/null || true"
            cleanWs()
        }
    }
}
