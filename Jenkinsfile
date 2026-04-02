// =============================================================================
// Enterprise Campaign Analytics Platform — Jenkins Declarative Pipeline
// =============================================================================
//
// REQUIRED JENKINS CREDENTIALS (configure in Jenkins > Manage Jenkins > Credentials)
// ---------------------------------------------------------------------------
//   ID: AZURE_CLIENT_ID          — Azure Service Principal Application (Client) ID
//   ID: AZURE_CLIENT_SECRET      — Azure Service Principal Client Secret
//   ID: AZURE_TENANT_ID          — Azure Active Directory Tenant ID
//   ID: AZURE_SUBSCRIPTION_ID    — Azure Subscription ID
//   ID: AZURE_RESOURCE_GROUP     — Azure Resource Group containing the App Service
//   ID: AZURE_APP_SERVICE_NAME   — Azure App Service name (e.g. campaign-analytics-api)
//
// All six credentials must be of type "Secret text" in Jenkins Credentials store.
//
// TOOL PREREQUISITES on Jenkins agents
// ---------------------------------------------------------------------------
//   - dotnet SDK 8.x  (PATH accessible as 'dotnet')
//   - Node.js 20.x + npm  (PATH accessible as 'node' / 'npm' / 'npx')
//   - Google Chrome (headless) for Karma tests
//   - Azure CLI 2.x  (PATH accessible as 'az')
//   - reportgenerator global tool:  dotnet tool install -g dotnet-reportgenerator-globaltool
//   - zip / unzip utilities
//   - curl
//   - python3 (for coverage-summary parsing in check-karma-coverage.sh)
// =============================================================================

pipeline {

    agent any

    // -------------------------------------------------------------------------
    // Global environment variables
    // -------------------------------------------------------------------------
    environment {
        DOTNET_CLI_TELEMETRY_OPTOUT     = '1'
        DOTNET_SKIP_FIRST_TIME_EXPERIENCE = '1'
        NODE_ENV                        = 'production'
        COVERAGE_THRESHOLD              = '80'

        // Derived path constants kept here for readability
        BACKEND_PROJ   = 'backend/CampaignAnalytics.API.csproj'
        BACKEND_TEST   = 'backend/CampaignAnalytics.API.csproj'
        BACKEND_RESULTS= 'backend/TestResults'
        BACKEND_PUBLISH= 'backend/publish'
        BACKEND_ZIP    = 'backend/publish.zip'
        FRONTEND_DIR   = 'frontend'
        COVERAGE_XML   = 'backend/TestResults/coverage/Cobertura.xml'
        KARMA_LCOV     = 'frontend/coverage/campaign-analytics-frontend/lcov.info'
    }

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        // Keep the last 10 builds with their artifacts
        buildDiscarder(logRotator(numToKeepStr: '10', artifactNumToKeepStr: '10'))
    }

    // =========================================================================
    // STAGES
    // =========================================================================
    stages {

        // ---------------------------------------------------------------------
        // Stage 1 — Checkout
        // ---------------------------------------------------------------------
        stage('Checkout') {
            steps {
                checkout scm

                // Ensure helper scripts are executable for every subsequent stage
                sh 'chmod +x scripts/*.sh'

                echo "Build #${env.BUILD_NUMBER} — branch: ${env.BRANCH_NAME ?: env.GIT_BRANCH}"
            }
        }

        // ---------------------------------------------------------------------
        // Stage 2 — Backend: Restore & Build
        // ---------------------------------------------------------------------
        stage('Backend: Restore & Build') {
            steps {
                echo '==> Restoring NuGet packages'
                sh "dotnet restore ${env.BACKEND_PROJ}"

                echo '==> Building in Release configuration'
                sh "dotnet build ${env.BACKEND_PROJ} --configuration Release --no-restore"
            }
        }

        // ---------------------------------------------------------------------
        // Stage 3 — Backend: Test & Coverage Gate
        // ---------------------------------------------------------------------
        stage('Backend: Test & Coverage Gate') {
            steps {
                echo '==> Running xUnit tests with XPlat Code Coverage'
                sh """
                    dotnet test ${env.BACKEND_TEST} \
                        --configuration Release \
                        --no-build \
                        --collect:"XPlat Code Coverage" \
                        --results-directory ${env.BACKEND_RESULTS} \
                        --logger trx \
                        -- DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Format=cobertura
                """

                echo '==> Ensuring reportgenerator global tool is installed'
                sh """
                    export PATH="\$PATH:\$HOME/.dotnet/tools"
                    dotnet tool install -g dotnet-reportgenerator-globaltool 2>/dev/null \
                        || dotnet tool update -g dotnet-reportgenerator-globaltool 2>/dev/null \
                        || true
                """

                echo '==> Merging coverage reports into Cobertura XML via reportgenerator'
                sh """
                    export PATH="\$PATH:\$HOME/.dotnet/tools"
                    reportgenerator \
                        -reports:"${env.BACKEND_RESULTS}/**/*.cobertura.xml" \
                        -targetdir:"${env.BACKEND_RESULTS}/coverage" \
                        -reporttypes:Cobertura
                """

                echo '==> Enforcing 80% line-coverage gate'
                // Script exits 1 and prints a descriptive message on failure,
                // which causes Jenkins to mark this stage (and the build) as FAILED.
                sh "scripts/check-dotnet-coverage.sh ${env.COVERAGE_XML} ${env.COVERAGE_THRESHOLD}"
            }

            post {
                always {
                    // Publish JUnit-compatible trx results
                    junit allowEmptyResults: true,
                          testResults: "${env.BACKEND_RESULTS}/**/*.trx"

                    // Publish Cobertura HTML/XML coverage report
                    publishHTML(target: [
                        allowMissing         : false,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : "${env.BACKEND_RESULTS}/coverage",
                        reportFiles          : 'index.htm',
                        reportName           : 'Backend Coverage Report'
                    ])

                    // Archive raw coverage artifacts
                    archiveArtifacts artifacts: "${env.BACKEND_RESULTS}/**/*.xml,${env.BACKEND_RESULTS}/**/*.trx",
                                     allowEmptyArchive: true
                }
            }
        }

        // ---------------------------------------------------------------------
        // Stage 4 — Frontend: Install & Build
        // ---------------------------------------------------------------------
        stage('Frontend: Install & Build') {
            steps {
                dir("${env.FRONTEND_DIR}") {
                    echo '==> Installing npm dependencies (clean install)'
                    sh 'npm ci --include=dev'

                    echo '==> Building Angular app in production mode'
                    sh 'npx ng build --configuration production'
                }
            }
        }

        // ---------------------------------------------------------------------
        // Stage 5 — Frontend: Test & Coverage Gate
        // ---------------------------------------------------------------------
        stage('Frontend: Test & Coverage Gate') {
            steps {
                dir("${env.FRONTEND_DIR}") {
                    echo '==> Running Karma / Jasmine tests in ChromeHeadless with coverage'
                    // --no-sandbox is required on most CI agents running as root
                    // karma.conf.js already sets ChromeHeadlessCI with --no-sandbox
                    sh """
                        npx ng test \
                            --watch=false \
                            --browsers=ChromeHeadlessCI \
                            --code-coverage
                    """
                }

                echo '==> Enforcing 80% line-coverage gate on Jasmine/Karma results'
                // karma.conf.js is configured to emit coverage/campaign-analytics-frontend/
                // The check-karma-coverage script reads the lcov.info from that directory.
                sh "scripts/check-karma-coverage.sh ${env.KARMA_LCOV} ${env.COVERAGE_THRESHOLD}"
            }

            post {
                always {
                    // Publish lcov HTML coverage report
                    publishHTML(target: [
                        allowMissing         : false,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : 'frontend/coverage/campaign-analytics-frontend',
                        reportFiles          : 'index.html',
                        reportName           : 'Frontend Coverage Report'
                    ])

                    archiveArtifacts artifacts: 'frontend/coverage/**',
                                     allowEmptyArchive: true
                }
            }
        }

        // ---------------------------------------------------------------------
        // Stage 6 — Publish Artifact
        // ---------------------------------------------------------------------
        stage('Publish Artifact') {
            steps {
                echo '==> Publishing backend in Release configuration'
                sh "dotnet publish ${env.BACKEND_PROJ} --configuration Release --output ${env.BACKEND_PUBLISH}"

                echo '==> Zipping backend publish output for Azure deployment'
                sh """
                    rm -f ${env.BACKEND_ZIP}
                    cd ${env.BACKEND_PUBLISH}
                    zip -r ../publish.zip .
                """

                echo '==> Archiving build artifacts'
                archiveArtifacts artifacts: "${env.BACKEND_ZIP},frontend/dist/**",
                                 fingerprint: true,
                                 allowEmptyArchive: false
            }
        }

        // ---------------------------------------------------------------------
        // Stage 7 — Deploy to Azure App Service  (main branch only)
        // ---------------------------------------------------------------------
        stage('Deploy to Azure App Service') {
            when {
                branch 'main'
            }

            // Bind all six Azure credentials as environment variables.
            // Each references a Jenkins "Secret text" credential by its ID.
            environment {
                // Azure Service Principal — Application (Client) ID
                AZURE_CLIENT_ID       = credentials('AZURE_CLIENT_ID')
                // Azure Service Principal — Client Secret
                AZURE_CLIENT_SECRET   = credentials('AZURE_CLIENT_SECRET')
                // Azure Active Directory Tenant ID
                AZURE_TENANT_ID       = credentials('AZURE_TENANT_ID')
                // Azure Subscription ID
                AZURE_SUBSCRIPTION_ID = credentials('AZURE_SUBSCRIPTION_ID')
                // Azure Resource Group that owns the App Service
                AZURE_RESOURCE_GROUP  = credentials('AZURE_RESOURCE_GROUP')
                // Azure App Service name (hostname prefix before .azurewebsites.net)
                AZURE_APP_SERVICE_NAME = credentials('AZURE_APP_SERVICE_NAME')
            }

            steps {
                echo '==> Authenticating with Azure via Service Principal'
                sh """
                    az login --service-principal \
                        --username  "\$AZURE_CLIENT_ID" \
                        --password  "\$AZURE_CLIENT_SECRET" \
                        --tenant    "\$AZURE_TENANT_ID"

                    az account set --subscription "\$AZURE_SUBSCRIPTION_ID"
                """

                echo '==> Deploying backend zip to Azure App Service'
                sh """
                    az webapp deploy \
                        --resource-group "\$AZURE_RESOURCE_GROUP" \
                        --name           "\$AZURE_APP_SERVICE_NAME" \
                        --src-path       "${env.BACKEND_ZIP}" \
                        --type           zip
                """

                echo '==> Running post-deployment health check'
                sh """
                    scripts/health-check.sh "https://\${AZURE_APP_SERVICE_NAME}.azurewebsites.net"
                """
            }

            post {
                always {
                    // Revoke the Azure CLI session regardless of deploy outcome
                    sh 'az logout || true'
                }
            }
        }

    }   // end stages

    // =========================================================================
    // POST — Global build notifications and workspace cleanup
    // =========================================================================
    post {

        always {
            echo '==> Archiving final test results and coverage reports'
            junit allowEmptyResults: true,
                  testResults: "${env.BACKEND_RESULTS}/**/*.trx"

            archiveArtifacts artifacts: [
                "${env.BACKEND_RESULTS}/**/*.xml",
                "${env.BACKEND_RESULTS}/**/*.trx",
                "frontend/coverage/**",
                "${env.BACKEND_ZIP}"
            ].join(','),
                             allowEmptyArchive: true

            echo '==> Cleaning workspace'
            cleanWs()
        }

        success {
            echo """
===========================================================
  BUILD SUCCESS
  Build #${env.BUILD_NUMBER} completed successfully.
  Timestamp : ${new Date().format("yyyy-MM-dd'T'HH:mm:ss'Z'", TimeZone.getTimeZone('UTC'))}
  Branch    : ${env.BRANCH_NAME ?: env.GIT_BRANCH}
  All coverage gates passed (>= ${env.COVERAGE_THRESHOLD}% line coverage).
===========================================================
"""
        }

        failure {
            echo """
===========================================================
  BUILD FAILED
  Build #${env.BUILD_NUMBER} failed.
  Timestamp : ${new Date().format("yyyy-MM-dd'T'HH:mm:ss'Z'", TimeZone.getTimeZone('UTC'))}
  Branch    : ${env.BRANCH_NAME ?: env.GIT_BRANCH}

  Troubleshooting checklist:
  1. Check the stage that turned red in the Blue Ocean or Stage View.
  2. If the failure message contains "[COVERAGE GATE] FAILED", line coverage
     is below ${env.COVERAGE_THRESHOLD}%.  Add or fix tests before re-pushing.
  3. If the failure is in "Deploy to Azure App Service", verify all six
     Jenkins credentials (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, etc.)
     are correctly configured in Jenkins > Manage Jenkins > Credentials.
  4. If the failure is in the health-check step, the App Service may be
     taking longer than 75 seconds to start — check Azure portal logs.
  5. Full console log is always available at:
     ${env.BUILD_URL}console
===========================================================
"""
        }

    }   // end post

}   // end pipeline
