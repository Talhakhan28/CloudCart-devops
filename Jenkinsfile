
pipeline {
    agent any

    options {
        skipDefaultCheckout(true)
    }

    environment {
        AWS_REGION = 'ap-south-1'
        AWS_ACCOUNT_ID = '106217160922'
        ECR_REGISTRY = '106217160922.dkr.ecr.ap-south-1.amazonaws.com'
        FRONTEND_REPO = 'cloudcart-frontend'
        BACKEND_REPO = 'cloudcart-backend'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Frontend') {
            steps {
                sh '''
                    docker build \
                      --build-arg VITE_API_URL=/api \
                      -f nginx/Dockerfile \
                      -t $FRONTEND_REPO:$BUILD_NUMBER .
                '''
            }
        }

        stage('Build Backend') {
            steps {
                sh '''
                    docker build \
                      -f server/Dockerfile \
                      -t $BACKEND_REPO:$BUILD_NUMBER server
                '''
            }
        }

        stage('Login to ECR') {
            steps {
                sh '''
                    aws ecr get-login-password \
                      --region $AWS_REGION | \
                    docker login \
                      --username AWS \
                      --password-stdin $ECR_REGISTRY
                '''
            }
        }

        stage('Push Images to ECR') {
            steps {
                sh '''
                    docker tag $FRONTEND_REPO:$BUILD_NUMBER \
                      $ECR_REGISTRY/$FRONTEND_REPO:$BUILD_NUMBER

                    docker tag $BACKEND_REPO:$BUILD_NUMBER \
                      $ECR_REGISTRY/$BACKEND_REPO:$BUILD_NUMBER

                    docker push \
                      $ECR_REGISTRY/$FRONTEND_REPO:$BUILD_NUMBER

                    docker push \
                      $ECR_REGISTRY/$BACKEND_REPO:$BUILD_NUMBER
                '''
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                sh '''
                    export IMAGE_TAG="$BUILD_NUMBER"

                    docker compose \
                      --env-file /etc/cloudcart/cloudcart.env \
                      -f /opt/cloudcart/docker-compose.deploy.yml \
                      pull

                    docker compose \
                      --env-file /etc/cloudcart/cloudcart.env \
                      -f /opt/cloudcart/docker-compose.deploy.yml \
                      up -d
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    docker compose \
                      --env-file /etc/cloudcart/cloudcart.env \
                      -f /opt/cloudcart/docker-compose.deploy.yml \
                      ps

                    curl --fail --silent --show-error \
                      --retry 5 --retry-delay 3 \
                      http://localhost/
                '''
            }
        }
    }

    post {
        success {
            echo 'CloudCart CI/CD and deployment completed successfully!'
        }
        failure {
            echo 'Pipeline failed. Check the Jenkins Console Output.'
        }
    }
}
