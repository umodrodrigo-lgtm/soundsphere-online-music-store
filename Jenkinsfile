pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        // Docker Hub
        DOCKERHUB_CREDS = credentials('dockerhub-credentials')
        REPO_API        = "${DOCKERHUB_CREDS_USR}/soundsphere-api"
        REPO_WEB        = "${DOCKERHUB_CREDS_USR}/soundsphere-web"

        // App EC2
        DEPLOY_HOST     = credentials('soundsphere-deploy-host')
        DEPLOY_USER     = 'ec2-user'
        DEPLOY_PATH     = '/opt/soundsphere'

        // Default image tag before checkout
        IMAGE_TAG       = 'latest'
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
                    env.IMAGE_TAG = sh(script: "git rev-parse --short=8 HEAD", returnStdout: true).trim()
                }
                echo "Branch: ${env.GIT_BRANCH}   Tag: ${env.IMAGE_TAG}"
            }
        }

        stage('Build Images') {
            steps {
                sh "docker build -t ${env.REPO_API}:${env.IMAGE_TAG} -t ${env.REPO_API}:latest ./backend"
                sh "docker build -t ${env.REPO_WEB}:${env.IMAGE_TAG} -t ${env.REPO_WEB}:latest ./frontend"
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh 'echo "${DOCKERHUB_CREDS_PSW}" | docker login -u "${DOCKERHUB_CREDS_USR}" --password-stdin'
                sh "docker push ${env.REPO_API}:${env.IMAGE_TAG}"
                sh "docker push ${env.REPO_API}:latest"
                sh "docker push ${env.REPO_WEB}:${env.IMAGE_TAG}"
                sh "docker push ${env.REPO_WEB}:latest"
                sh 'docker logout'
            }
        }

        stage('Deploy') {
            steps {
                sshagent(credentials: ['soundsphere-deploy-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${env.DEPLOY_USER}@${env.DEPLOY_HOST} "mkdir -p ${env.DEPLOY_PATH}"
                    """

                    sh """
                        scp -o StrictHostKeyChecking=no \
                        docker-compose.prod.yml \
                        ${env.DEPLOY_USER}@${env.DEPLOY_HOST}:${env.DEPLOY_PATH}/docker-compose.prod.yml
                    """

                    sh """
                        scp -o StrictHostKeyChecking=no -r \
                        database/ \
                        ${env.DEPLOY_USER}@${env.DEPLOY_HOST}:${env.DEPLOY_PATH}/database/
                    """

                    sh """
                        ssh -o StrictHostKeyChecking=no ${env.DEPLOY_USER}@${env.DEPLOY_HOST} '
                            set -e
                            cd ${env.DEPLOY_PATH}

                            export IMAGE_TAG=${env.IMAGE_TAG}
                            export DOCKERHUB_USER=${env.DOCKERHUB_CREDS_USR}

                            docker compose -f docker-compose.prod.yml pull
                            docker compose -f docker-compose.prod.yml up -d --remove-orphans
                            docker image prune -f
                        '
                    """
                }
            }
        }

        stage('Verify') {
            steps {
                sshagent(credentials: ['soundsphere-deploy-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${env.DEPLOY_USER}@${env.DEPLOY_HOST} '
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
            echo "Deployed ${env.IMAGE_TAG} to EC2 successfully"
        }
        failure {
            echo "Deployment FAILED — commit ${env.IMAGE_TAG}"
        }
        always {
            sh "docker rmi ${env.REPO_API}:${env.IMAGE_TAG} ${env.REPO_API}:latest 2>/dev/null || true"
            sh "docker rmi ${env.REPO_WEB}:${env.IMAGE_TAG} ${env.REPO_WEB}:latest 2>/dev/null || true"
            cleanWs()
        }
    }
}