pipeline {
    agent any
    options {
        buildDiscarder(logRotator(numToKeepStr: '5'))
        gitLabConnection('PaBr-GitLab')
        gitlabBuilds(builds: ['Login', 'Build', 'Push'])
    }
    environment {
        REGISTRY_CREDENTIALS = credentials('8e4baf84-b181-4bca-a6ec-28739676813e')
        MAIN_VERSION = '1.0'
        REPO_NAME = 'discord-bot'
        REG_NAME = 'reg.pabr.de'
    }
    stages {
        stage('Build') {
            steps {

                gitlabCommitStatus(name: 'Login') {
                    updateGitlabCommitStatus(name: 'Login', state: 'running')
                    sh 'echo $REGISTRY_CREDENTIALS_PSW | docker login $REG_NAME -u $REGISTRY_CREDENTIALS_USR --password-stdin'
                    updateGitlabCommitStatus(name: 'Login', state: 'success')
                }

                gitlabCommitStatus(name: 'Build') {
                    updateGitlabCommitStatus(name: 'Build', state: 'running')
                        script {
                            try {
                                def latestTagOutput = sh(script: "curl -X 'GET' -u ${REGISTRY_CREDENTIALS_USR.replace('$', '\\$')}:${REGISTRY_CREDENTIALS_PSW} \
                                    'https://${REG_NAME}/api/v2.0/projects/${REPO_NAME}/repositories/${env.BRANCH_NAME}-build/artifacts/latest/tags' \
                                    -H 'accept: application/json'", returnStdout: true).trim()

                                def parsedJson = readJSON text: latestTagOutput
                                def matchingTags = parsedJson.findAll { it.name.startsWith(env.MAIN_VERSION) }
                                def latestDockerTag = '0.0.0'

                                if (matchingTags.size() > 0) {
                                    latestDockerTag = matchingTags[-1].name
                                }

                                if (latestDockerTag == '0.0.0') {
                                    env.NEW_TAG = "${env.MAIN_VERSION}.0"
                                } else {
                                    def dockerVersion = latestDockerTag.tokenize('.')
                                    def newTag = "${dockerVersion[0]}.${dockerVersion[1]}.${dockerVersion[2].toInteger() + 1}"
                                    env.NEW_TAG = newTag
                                }
                            } catch (Exception e) {
                                echo "Failed to execute curl command: ${e.message}"
                                env.NEW_TAG = "${env.MAIN_VERSION}.0"
                            }
                        }
                    sh "docker build -t ${REG_NAME}/${REPO_NAME}/${env.BRANCH_NAME}-build:latest ."
                    sh "docker tag ${REG_NAME}/${REPO_NAME}/${env.BRANCH_NAME}-build:latest ${REG_NAME}/${REPO_NAME}/${env.BRANCH_NAME}-build:${env.NEW_TAG}"
                    updateGitlabCommitStatus(name: 'Build', state: 'success')
                }
            }
        }
        stage('Push') {
            steps {
                gitlabCommitStatus(name: 'Push') {
                    updateGitlabCommitStatus(name: 'Push', state: 'running')
                    sh "docker push ${REG_NAME}/${REPO_NAME}/${env.BRANCH_NAME}-build:latest"
                    sh "docker push ${REG_NAME}/${REPO_NAME}/${env.BRANCH_NAME}-build:${env.NEW_TAG}"
                    updateGitlabCommitStatus(name: 'Push', state: 'success')
                }
            }
        }
    }
}
