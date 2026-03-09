pipeline {
    agent any

    // ── Trigger: GitHub webhook fires on every push ──────────────────
    triggers {
        githubPush()
    }

    // ── Global environment ───────────────────────────────────────────
    environment {
        // Jenkins credential IDs — configure these in:
        //   Jenkins → Manage Jenkins → Credentials
        SSH_CRED_ID      = 'soundsphere-deploy-key'   // SSH private key credential
        DEPLOY_USER      = 'deploy'                    // SSH user on target server
        DEPLOY_HOST      = 'your.server.ip.or.hostname'
        DEPLOY_PATH      = '/var/www/soundsphere'      // root on the server
        PM2_APP_NAME     = 'soundsphere-api'           // PM2 process name
        NODE_ENV         = 'production'
    }

    options {
        // Keep last 10 builds; timeout the whole pipeline after 20 min
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 20, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }

    stages {

        // ── 1. Checkout ──────────────────────────────────────────────
        stage('Checkout') {
            steps {
                checkout scm
                echo "Building branch: ${env.GIT_BRANCH}  commit: ${env.GIT_COMMIT?.take(8)}"
            }
        }

        // ── 2. Build Frontend ────────────────────────────────────────
        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm ci --prefer-offline'
                    sh 'npm run build'
                    // dist/ now contains the production static files
                }
            }
        }

        // ── 3. Prepare Backend deps (production only) ────────────────
        stage('Install Backend Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm ci --omit=dev --prefer-offline'
                }
            }
        }

        // ── 4. Deploy ────────────────────────────────────────────────
        stage('Deploy') {
            steps {
                sshagent(credentials: [SSH_CRED_ID]) {

                    // 4-a. Ensure directory structure exists on server
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                            mkdir -p ${DEPLOY_PATH}/backend/uploads/audio
                            mkdir -p ${DEPLOY_PATH}/backend/uploads/images/artists
                            mkdir -p ${DEPLOY_PATH}/backend/uploads/images/albums
                            mkdir -p ${DEPLOY_PATH}/backend/uploads/images/banners
                            mkdir -p ${DEPLOY_PATH}/backend/uploads/images/avatars
                            mkdir -p ${DEPLOY_PATH}/frontend/dist
                        '
                    """

                    // 4-b. Sync backend source (exclude uploads — user content stays)
                    sh """
                        rsync -az --delete \
                            --exclude='.env' \
                            --exclude='node_modules/' \
                            --exclude='uploads/' \
                            backend/ \
                            ${DEPLOY_HOST}:${DEPLOY_PATH}/backend/
                    """

                    // 4-c. Sync frontend build output
                    sh """
                        rsync -az --delete \
                            frontend/dist/ \
                            ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/frontend/dist/
                    """

                    // 4-d. Sync database scripts
                    sh """
                        rsync -az \
                            database/ \
                            ${DEPLOY_USER}@${DEPLOY_HOST}:${DEPLOY_PATH}/database/
                    """

                    // 4-e. Install production backend deps on server, then reload PM2
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                            set -e

                            cd ${DEPLOY_PATH}/backend

                            # Install/update production dependencies
                            npm ci --omit=dev --prefer-offline

                            # Gracefully reload if running, else start fresh
                            if pm2 list | grep -q "${PM2_APP_NAME}"; then
                                pm2 reload ${PM2_APP_NAME} --update-env
                            else
                                pm2 start src/server.js \
                                    --name ${PM2_APP_NAME} \
                                    --env production \
                                    --max-memory-restart 512M \
                                    --log ${DEPLOY_PATH}/logs/api.log
                                pm2 save
                            fi
                        '
                    """
                }
            }
        }

        // ── 5. Smoke-test ────────────────────────────────────────────
        stage('Verify') {
            steps {
                sshagent(credentials: [SSH_CRED_ID]) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${DEPLOY_USER}@${DEPLOY_HOST} '
                            sleep 3
                            STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health)
                            echo "Health check HTTP status: \$STATUS"
                            if [ "\$STATUS" != "200" ]; then
                                echo "Health check FAILED"
                                exit 1
                            fi
                            echo "Deployment verified successfully"
                        '
                    """
                }
            }
        }
    }

    // ── Post-pipeline notifications ──────────────────────────────────
    post {
        success {
            echo "Deployment succeeded — ${env.GIT_BRANCH} @ ${env.GIT_COMMIT?.take(8)}"
        }
        failure {
            echo "Deployment FAILED — check the console output above"
            // Add email/Slack notification here if needed:
            // mail to: 'team@example.com', subject: "Build failed: ${env.JOB_NAME}"
        }
        always {
            // Clean workspace to avoid stale artefacts on the Jenkins agent
            cleanWs()
        }
    }
}
