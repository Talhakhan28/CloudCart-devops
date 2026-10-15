pipeline {
    agent any

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
    }

    post {
        success {
            echo 'CloudCart images pushed to ECR successfully!'
        }
        failure {
            echo 'Pipeline failed. Check Console Output.'
        }
    }
}
