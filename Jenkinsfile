pipeline {
    agent any
    options {
        buildDiscarder(logRotator(numToKeepStr: '5'))
    }
    environment {
        REGISTRY_CREDENTIALS = credentials('8e4baf84-b181-4bca-a6ec-28739676813e    ')
        MAIN_VERSION = '1.0'
        REPO_NAME = 'discord-bot'
        REG_NAME = 'reg.pabr.de'
    }
    stages {
        stage('Login') {
            steps {
                sh 'echo $REGISTRY_CREDENTIALS_PSW | docker login $REG_NAME -u $REGISTRY_CREDENTIALS_USR --password-stdin'
            }
        }
        stage('Build') {
            steps {
                script {
                    env.BUILD_NUMBER = env.BUILD_NUMBER ?: '0'
                    env.NEW_TAG = "${env.MAIN_VERSION}.${env.BUILD_NUMBER}"
                }
                sh "docker build -t ${REG_NAME}/${REPO_NAME}:latest ."
                sh "docker tag ${REG_NAME}/${REPO_NAME}:latest ${REG_NAME}/${REPO_NAME}:${env.NEW_TAG}"
            }
        }
        stage('Push') {
            steps {
                sh "docker push ${REG_NAME}/${REPO_NAME}:latest"
                sh "docker push ${REG_NAME}/${REPO_NAME}:${env.NEW_TAG}"
            }
        }
    }
    post {
        always {
            sh 'docker logout $REG_NAME'
        }
    }
}