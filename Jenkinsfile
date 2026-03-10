pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        // Docker Hub — auto-creates DOCKERHUB_CREDS_USR and DOCKERHUB_CREDS_PSW
        DOCKERHUB_CREDS = credentials('dockerhub-credentials')

        // App EC2
        DEPLOY_HOST = credentials('soundsphere-deploy-host')
        DEPLOY_USER = 'ec2-user'
        DEPLOY_PATH = '/opt/soundsphere'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                script {
                    // Set at runtime so env block immutability is bypassed
                    env.IMAGE_TAG = sh(script: 'git rev-parse --short=8 HEAD', returnStdout: true).trim()
                    env.REPO_API  = "${env.DOCKERHUB_CREDS_USR}/soundsphere-api"
                    env.REPO_WEB  = "${env.DOCKERHUB_CREDS_USR}/soundsphere-web"
                    echo "Branch: ${env.GIT_BRANCH}   Tag: ${env.IMAGE_TAG}   Repo: ${env.REPO_API}"
                }
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    docker build -t $REPO_API:$IMAGE_TAG -t $REPO_API:latest ./backend
                    docker build -t $REPO_WEB:$IMAGE_TAG -t $REPO_WEB:latest ./frontend
                '''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh 'echo "$DOCKERHUB_CREDS_PSW" | docker login -u "$DOCKERHUB_CREDS_USR" --password-stdin'
                sh '''
                    docker push $REPO_API:$IMAGE_TAG
                    docker push $REPO_API:latest
                    docker push $REPO_WEB:$IMAGE_TAG
                    docker push $REPO_WEB:latest
                '''
                sh 'docker logout'
            }
        }

        stage('Deploy') {
            steps {
                sshagent(credentials: ['soundsphere-deploy-key']) {
                    sh 'ssh -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "mkdir -p $DEPLOY_PATH"'

                    sh '''
                        scp -o StrictHostKeyChecking=no \
                            docker-compose.prod.yml \
                            $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/docker-compose.prod.yml
                    '''

                    sh '''
                        scp -o StrictHostKeyChecking=no -r \
                            database/ \
                            $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/database/
                    '''

                    sh '''
                        ssh -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
                            set -e
                            cd $DEPLOY_PATH
                            export IMAGE_TAG=$IMAGE_TAG
                            export DOCKERHUB_USER=$DOCKERHUB_CREDS_USR
                            docker compose -f docker-compose.prod.yml pull
                            docker compose -f docker-compose.prod.yml up -d --remove-orphans
                            docker image prune -f
                        "
                    '''
                }
            }
        }

        stage('Database Setup') {
            steps {
                sshagent(credentials: ['soundsphere-deploy-key']) {
                    script {
                        // Wait for MySQL and check if schema already exists
                        def tableExists = sh(script: '''
                            ssh -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST '
                                until docker exec soundsphere-db mysqladmin ping -h localhost --silent 2>/dev/null; do sleep 3; done
                                docker exec soundsphere-db mysql -u root \
                                    -p"$(grep DB_ROOT_PASSWORD /opt/soundsphere/.env | cut -d= -f2)" \
                                    -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='"'"'soundsphere'"'"' AND table_name='"'"'users'"'"';" \
                                    --skip-column-names 2>/dev/null | tr -d "[:space:]"
                            '
                        ''', returnStdout: true).trim()

                        echo "Table exists check: '${tableExists}'"

                        if (tableExists == '0' || tableExists == '') {
                            // Apply schema — schema.sql is on EC2 via scp
                            sh '''
                                ssh -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST '
                                    docker exec -i soundsphere-db mysql -u root \
                                        -p"$(grep DB_ROOT_PASSWORD /opt/soundsphere/.env | cut -d= -f2)" \
                                        soundsphere < /opt/soundsphere/database/schema.sql
                                '
                            '''
                            echo "Schema applied."

                            // Pipe seed.sql into container /tmp first (fallback for volume mount)
                            sh '''
                                ssh -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST \
                                    'docker exec -i soundsphere-api sh -c "cat > /tmp/seed.sql"' \
                                    < database/seed.sql
                            '''
                            // Pipe seed-docker.js into node stdin inside container
                            sh '''
                                ssh -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST \
                                    'docker exec -i soundsphere-api node -' \
                                    < database/seed-docker.js
                            '''
                            echo "Seed complete."
                        } else {
                            echo "Schema already exists — skipping setup."
                        }
                    }
                }
            }
        }

        stage('Verify') {
            steps {
                sshagent(credentials: ['soundsphere-deploy-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST \
                            'sleep 5
                            STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health)
                            echo "Health check: $STATUS"
                            [ "$STATUS" = "200" ] || { echo "FAILED"; exit 1; }
                            echo "Deployment OK"'
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Deployed ${env.IMAGE_TAG} to EC2 successfully"
        }
        failure {
            echo "Deployment FAILED — commit ${env.IMAGE_TAG ?: 'unknown'}"
        }
        always {
            script {
                try {
                    if (env.REPO_API && env.IMAGE_TAG) {
                        sh 'docker rmi $REPO_API:$IMAGE_TAG $REPO_API:latest 2>/dev/null || true'
                        sh 'docker rmi $REPO_WEB:$IMAGE_TAG $REPO_WEB:latest 2>/dev/null || true'
                    }
                    cleanWs()
                } catch (e) {
                    echo "Cleanup skipped: ${e.message}"
                }
            }
        }
    }
}
