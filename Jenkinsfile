pipeline {
    agent any

    environment {
        PROJECT_ID   = ""  // Add the GCP Project ID 
        REGION       = ""    // Cloud Run region
        REPO_NAME    = ""      // Artifact Registry repo name
        SERVICE_NAME = ""    // Cloud Run service name
        IMAGE_NAME   = ""
        GAR_IMAGE    = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:${BUILD_NUMBER}"
        // Variable to hold the name of the PREVIOUS successful revision for rollback
        PREVIOUS_REVISION = ""
    }
    
    stages {
        stage('Git-Checkout') {
            steps {
                // ... (Git checkout logic)
                checkout scmGit(branches: [[name: 'master']], extensions: [], userRemoteConfigs: [[credentialsId: 'git-password', 
                url: 'https://github.com/vink8s/react-fe-code.git']])
            }
        }
        
        stage("Authenticate GCP"){
            steps{
                script {
                    // 1. Get the name of the currently serving revision BEFORE deployment
                    // This is done to ensure the rollback targets a known stable revision.
                    env.PREVIOUS_REVISION = sh(
                        script: "gcloud run services describe ${env.SERVICE_NAME} --region ${env.REGION} --format='value(status.latestReadyRevisionName)' --project ${env.PROJECT_ID} || echo ''",
                        returnStdout: true
                    ).trim()
                    echo "Current serving revision: ${env.PREVIOUS_REVISION}"
                }
                
                withCredentials([file(credentialsId: 'GCP_KEY', variable: 'GCP_KEY')]) {
                    sh "gcloud auth activate-service-account --key-file=\$GCP_KEY"
                    sh "gcloud config set project ${env.PROJECT_ID}"
                    sh "gcloud auth configure-docker ${env.REGION}-docker.pkg.dev" // Configure Docker to use gcloud credentials
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${env.GAR_IMAGE} ."
            }
        }
        
        stage('Push to Artifact Registry') {
            steps {
                sh "docker push ${env.GAR_IMAGE}"
            }
        }
        
        stage('Deploy to Cloud Run') {
            steps {
                // Use a script block to catch the deployment failure
                script {
                    try {
                        // Deploy the new image to Cloud Run
                        sh """
                        gcloud run deploy ${env.SERVICE_NAME} \
                            --image ${env.GAR_IMAGE} \
                            --region ${env.REGION} \
                            --platform managed \
                            --allow-unauthenticated \
                            --project ${env.PROJECT_ID}
                        """
                        echo "Deployment of ${env.GAR_IMAGE} succeeded."
                    } catch (err) {
                        // If 'gcloud run deploy' fails, execute the rollback stage
                        currentBuild.result = 'UNSTABLE'
                        echo "Deployment failed! Initiating rollback..."
                        throw err // Re-throw the error to ensure the pipeline is marked as failure/unstable
                    }
                }
            }
        }
        
        // This stage will only be reached if the pipeline continues after the 'Deploy' stage (i.e., on success)
        // or if a failure is caught and handled without immediate exit.
    }
    
    post {
        always {
            // Clean up the local image to save disk space on the agent
            sh "docker rmi ${env.GAR_IMAGE} || true" 
        }
        failure {
            echo "Pipeline detected a failure in the Cloud Run deployment or a prior stage."
            
            // --- ROLLBACK LOGIC ---
            // Execute rollback only if deployment failed AND we captured a previous revision name.
            script {
                if (env.PREVIOUS_REVISION && env.PREVIOUS_REVISION != "") {
                    echo "Attempting rollback to revision: ${env.PREVIOUS_REVISION}"
                    
                    try {
                        // The 'gcloud run services update-traffic' command is the standard way to revert
                        // traffic back to a specific known-good revision.
                        sh """
                        gcloud run services update-traffic ${env.SERVICE_NAME} \
                            --to-latest=0 \
                            --to-revision=${env.PREVIOUS_REVISION}=100 \
                            --region ${env.REGION} \
                            --project ${env.PROJECT_ID}
                        """
                        echo "Rollback to ${env.PREVIOUS_REVISION} was successful."
                        // Set build to UNSTABLE instead of FAILURE if rollback succeeded
                        currentBuild.result = 'UNSTABLE'
                    } catch (rollbackErr) {
                        echo "Critical Error: Rollback to ${env.PREVIOUS_REVISION} failed!"
                        echo "Manual intervention is required to fix the Cloud Run service."
                        currentBuild.result = 'FAILURE'
                    }
                } else {
                    echo "Rollback skipped: Could not determine the previous stable revision."
                }
            }
            // --- END ROLLBACK LOGIC ---
        }
        success {
            echo "Deployment successful! Service ${env.SERVICE_NAME} updated to ${env.GAR_IMAGE}."
        }
    }
}
