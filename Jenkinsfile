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
                    def gitTag   = sh(script: 'git tag --points-at HEAD | grep -E "^v[0-9]+\\.[0-9]+\\.[0-9]+" | head -1', returnStdout: true).trim()
                    def shortSha = sh(script: 'git rev-parse --short=8 HEAD', returnStdout: true).trim()
                    // Normalise branch name: refs/heads/main → main, feature/foo → feature-foo
                    def branch   = (env.GIT_BRANCH ?: 'unknown').replaceAll(/^refs\/heads\//, '').replaceAll(/[^a-zA-Z0-9._-]/, '-').toLowerCase()

                    if (gitTag) {
                        // Tagged release: v1.2.3 → IMAGE_TAG=1.2.3  aliases: 1.2  1
                        def ver           = gitTag.replaceFirst(/^v/, '')
                        def parts         = ver.tokenize('.')
                        env.IMAGE_TAG     = ver                              // 1.2.3  (immutable)
                        env.TAG_MINOR     = "${parts[0]}.${parts[1]}"       // 1.2    (mutable alias)
                        env.TAG_MAJOR     = parts[0]                         // 1      (mutable alias)
                        env.IS_RELEASE    = 'true'
                    } else {
                        // CI build: main-42-a1b2c3d4
                        env.IMAGE_TAG     = "${branch}-${env.BUILD_NUMBER}-${shortSha}"
                        env.TAG_MINOR     = ''
                        env.TAG_MAJOR     = ''
                        env.IS_RELEASE    = 'false'
                    }

                    env.GIT_SHA    = shortSha
                    env.BRANCH     = branch
                    env.BUILD_DATE = sh(script: 'date -u +%Y-%m-%dT%H:%M:%SZ', returnStdout: true).trim()
                    env.REPO_API   = "${env.DOCKERHUB_CREDS_USR}/soundsphere-api"
                    env.REPO_WEB   = "${env.DOCKERHUB_CREDS_USR}/soundsphere-web"
                    echo "Branch: ${env.BRANCH}   Tag: ${env.IMAGE_TAG}   Release: ${env.IS_RELEASE}"
                }
            }
        }

        stage('Build Images') {
            steps {
                // OCI standard labels: version, git revision, build timestamp
                sh '''
                    docker build \
                        --label "org.opencontainers.image.version=${IMAGE_TAG}" \
                        --label "org.opencontainers.image.revision=${GIT_SHA}" \
                        --label "org.opencontainers.image.created=${BUILD_DATE}" \
                        --label "org.opencontainers.image.source=https://github.com/${DOCKERHUB_CREDS_USR}/soundsphere" \
                        -t $REPO_API:$IMAGE_TAG \
                        ./backend

                    docker build \
                        --label "org.opencontainers.image.version=${IMAGE_TAG}" \
                        --label "org.opencontainers.image.revision=${GIT_SHA}" \
                        --label "org.opencontainers.image.created=${BUILD_DATE}" \
                        --label "org.opencontainers.image.source=https://github.com/${DOCKERHUB_CREDS_USR}/soundsphere" \
                        -t $REPO_WEB:$IMAGE_TAG \
                        ./frontend
                '''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh 'echo "$DOCKERHUB_CREDS_PSW" | docker login -u "$DOCKERHUB_CREDS_USR" --password-stdin'
                sh '''
                    # Always push the immutable version tag
                    docker push $REPO_API:$IMAGE_TAG
                    docker push $REPO_WEB:$IMAGE_TAG

                    if [ "$IS_RELEASE" = "true" ]; then
                        # Semver mutable aliases: 1.2  →  1  →  latest
                        for REPO in $REPO_API $REPO_WEB; do
                            docker tag $REPO:$IMAGE_TAG $REPO:$TAG_MINOR
                            docker tag $REPO:$IMAGE_TAG $REPO:$TAG_MAJOR
                            docker tag $REPO:$IMAGE_TAG $REPO:latest
                            docker push $REPO:$TAG_MINOR
                            docker push $REPO:$TAG_MAJOR
                            docker push $REPO:latest
                        done
                    elif [ "$BRANCH" = "main" ]; then
                        # Untagged main builds get an 'edge' alias (latest passing CI on main)
                        docker tag $REPO_API:$IMAGE_TAG $REPO_API:edge
                        docker tag $REPO_WEB:$IMAGE_TAG $REPO_WEB:edge
                        docker push $REPO_API:edge
                        docker push $REPO_WEB:edge
                    fi
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
                            // Pipe schema.sql from Jenkins workspace — < is OUTSIDE ssh quotes
                            sh '''
                                ssh -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST \
                                    'docker exec -i soundsphere-db \
                                        mysql -u root -p"$(grep DB_ROOT_PASSWORD /opt/soundsphere/.env | cut -d= -f2)"' \
                                    < database/schema.sql
                            '''
                            echo "Schema applied."

                            // Pipe seed.sql from Jenkins workspace into container /tmp
                            sh '''
                                ssh -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST \
                                    'docker exec -i soundsphere-api sh -c "cat > /tmp/seed.sql"' \
                                    < database/seed.sql
                            '''

                            // Pipe seed-docker.js from Jenkins workspace into node stdin
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
            echo "Deployed ${env.IMAGE_TAG} to EC2 successfully (release=${env.IS_RELEASE})"
        }
        failure {
            echo "Deployment FAILED — version ${env.IMAGE_TAG ?: 'unknown'}"
        }
        always {
            script {
                try {
                    if (env.REPO_API && env.IMAGE_TAG) {
                        sh '''
                            docker rmi $REPO_API:$IMAGE_TAG 2>/dev/null || true
                            docker rmi $REPO_WEB:$IMAGE_TAG 2>/dev/null || true
                            [ -n "$TAG_MINOR" ] && docker rmi $REPO_API:$TAG_MINOR $REPO_WEB:$TAG_MINOR 2>/dev/null || true
                            [ -n "$TAG_MAJOR" ] && docker rmi $REPO_API:$TAG_MAJOR $REPO_WEB:$TAG_MAJOR 2>/dev/null || true
                            docker rmi $REPO_API:latest $REPO_WEB:latest 2>/dev/null || true
                            docker rmi $REPO_API:edge   $REPO_WEB:edge   2>/dev/null || true
                        '''
                    }
                    cleanWs()
                } catch (e) {
                    echo "Cleanup skipped: ${e.message}"
                }
            }
        }
    }
}
