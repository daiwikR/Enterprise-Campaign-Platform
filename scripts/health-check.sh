#!/usr/bin/env bash
# =============================================================================
# health-check.sh
#
# PURPOSE
#   Poll the /health endpoint of a deployed Azure App Service (or any HTTP
#   service) and verify it returns HTTP 200 within a set number of attempts.
#   Used as a post-deployment smoke test in the Jenkins pipeline.
#
# USAGE
#   health-check.sh <base-url>
#
# ARGUMENTS
#   base-url  The base URL of the deployed application, without a trailing
#             slash. The script appends /health automatically.
#             Example: https://campaign-analytics-api.azurewebsites.net
#
# BEHAVIOUR
#   - Polls <base-url>/health up to MAX_ATTEMPTS times.
#   - Waits SLEEP_SECONDS seconds between each attempt.
#   - Exits 0 immediately on the first HTTP 200 response.
#   - Exits 1 with a descriptive message if all attempts are exhausted.
#
# DEPENDENCIES
#   curl   (standard on all CI agents)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration constants
# ---------------------------------------------------------------------------
readonly MAX_ATTEMPTS=5
readonly SLEEP_SECONDS=15

# ---------------------------------------------------------------------------
# Argument validation
# ---------------------------------------------------------------------------
BASE_URL="${1:-}"

if [[ -z "${BASE_URL}" ]]; then
    echo "[HEALTH CHECK] ERROR: No base URL provided."
    echo "Usage: $0 <base-url>"
    echo "Example: $0 https://campaign-analytics-api.azurewebsites.net"
    exit 1
fi

# Strip any trailing slash from the base URL for consistent construction
BASE_URL="${BASE_URL%/}"
HEALTH_URL="${BASE_URL}/health"
TOTAL_WAIT=$(( (MAX_ATTEMPTS - 1) * SLEEP_SECONDS ))

echo "[HEALTH CHECK] Target: ${HEALTH_URL}"
echo "[HEALTH CHECK] Will poll up to ${MAX_ATTEMPTS} times with ${SLEEP_SECONDS}s between attempts."

# ---------------------------------------------------------------------------
# Polling loop
# ---------------------------------------------------------------------------
ATTEMPT=0

while (( ATTEMPT < MAX_ATTEMPTS )); do
    ATTEMPT=$(( ATTEMPT + 1 ))
    echo "[HEALTH CHECK] Attempt ${ATTEMPT}/${MAX_ATTEMPTS} — polling ${HEALTH_URL} ..."

    # curl flags:
    #   -s         silent (no progress meter)
    #   -o /dev/null  discard response body
    #   -w "%{http_code}"  write only the HTTP status code to stdout
    #   --max-time 10      fail after 10 seconds if no response
    #   --connect-timeout 10  fail if connection not established in 10 s
    HTTP_STATUS=$(curl -s \
                       -o /dev/null \
                       -w "%{http_code}" \
                       --max-time 10 \
                       --connect-timeout 10 \
                       "${HEALTH_URL}" 2>/dev/null || echo "000")

    echo "[HEALTH CHECK] HTTP status: ${HTTP_STATUS}"

    if [[ "${HTTP_STATUS}" == "200" ]]; then
        echo "[HEALTH CHECK] PASSED: ${HEALTH_URL} returned HTTP 200 on attempt ${ATTEMPT}."
        exit 0
    fi

    if (( ATTEMPT < MAX_ATTEMPTS )); then
        echo "[HEALTH CHECK] Non-200 response (${HTTP_STATUS}). Waiting ${SLEEP_SECONDS}s before next attempt..."
        sleep "${SLEEP_SECONDS}"
    fi
done

# ---------------------------------------------------------------------------
# All attempts exhausted — fail the build
# ---------------------------------------------------------------------------
echo ""
echo "=============================================================="
echo "[HEALTH CHECK] FAILED: ${HEALTH_URL} did not return HTTP 200 after ${MAX_ATTEMPTS} attempts (${TOTAL_WAIT} seconds)"
echo ""
echo "Troubleshooting steps:"
echo "  1. Open the Azure portal and check App Service logs:"
echo "     Azure Portal > App Services > <name> > Log stream"
echo "  2. Verify the /health endpoint is implemented and mapped in Program.cs:"
echo "     app.MapHealthChecks(\"/health\");"
echo "  3. Check that the deployment zip was correctly structured and all"
echo "     dependencies (e.g., appsettings.json) are included."
echo "  4. The App Service may require more than ${TOTAL_WAIT}s to cold-start."
echo "     Consider increasing MAX_ATTEMPTS or SLEEP_SECONDS in this script."
echo "=============================================================="
echo ""
exit 1
