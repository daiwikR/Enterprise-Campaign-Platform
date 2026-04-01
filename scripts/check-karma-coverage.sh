#!/usr/bin/env bash
# =============================================================================
# check-karma-coverage.sh
#
# PURPOSE
#   Parse line coverage from a Karma/Istanbul lcov.info file and enforce a
#   minimum line-coverage threshold. Exits 0 when coverage meets or exceeds
#   the threshold; exits 1 with a clear, human-readable error message
#   otherwise.
#
# USAGE
#   check-karma-coverage.sh <lcov-info-path> [threshold]
#
# ARGUMENTS
#   lcov-info-path  Path to the lcov.info file emitted by karma-coverage.
#                   For this project the default location is:
#                   frontend/coverage/campaign-analytics-frontend/lcov.info
#   threshold       (Optional) Minimum required line coverage as an integer
#                   percentage (0–100). Defaults to 80.
#
# HOW LINE COVERAGE IS COMPUTED FROM LCOV
#   lcov.info contains records of the form:
#     DA:<line-number>,<execution-count>
#   A line is "covered" when execution-count > 0.
#   Line coverage % = (covered lines / total instrumented lines) * 100
#
# NOTE ON karma.conf.js
#   The karma.conf.js in this project outputs html and text-summary reporters
#   but not a JSON summary. To also emit lcov.info add { type: 'lcov' } to
#   the coverageReporter.reporters array:
#
#     reporters: [
#       { type: 'html'         },
#       { type: 'text-summary' },
#       { type: 'lcov'         }   // <-- add this line
#     ]
#
#   lcov output is placed in the same coverageReporter.dir directory.
#
# DEPENDENCIES
#   python3   (used for arithmetic — available on all modern CI agents)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Argument validation
# ---------------------------------------------------------------------------
LCOV_INFO="${1:-}"
THRESHOLD="${2:-80}"

if [[ -z "${LCOV_INFO}" ]]; then
    echo "[COVERAGE GATE] ERROR: No lcov.info path provided."
    echo "Usage: $0 <lcov-info-path> [threshold]"
    exit 1
fi

if [[ ! -f "${LCOV_INFO}" ]]; then
    echo "[COVERAGE GATE] ERROR: lcov.info file not found: ${LCOV_INFO}"
    echo ""
    echo "Possible causes:"
    echo "  1. The 'ng test --code-coverage' step failed or was skipped."
    echo "  2. The karma.conf.js coverageReporter does not include { type: 'lcov' }."
    echo "     Add it to coverageReporter.reporters to generate lcov.info output."
    echo "  3. The path argument does not match the actual output location."
    exit 1
fi

if ! [[ "${THRESHOLD}" =~ ^[0-9]+$ ]] || (( THRESHOLD < 0 || THRESHOLD > 100 )); then
    echo "[COVERAGE GATE] ERROR: threshold must be an integer between 0 and 100, got: ${THRESHOLD}"
    exit 1
fi

# ---------------------------------------------------------------------------
# Parse lcov.info to compute line coverage percentage.
#
# lcov.info format (relevant records):
#   DA:<line>,<hit-count>   — data for individual lines
#   LH:<n>                  — lines hit  (summary per source file)
#   LF:<n>                  — lines found (summary per source file)
#
# We accumulate LH and LF across all source files to get the project total.
# ---------------------------------------------------------------------------
COVERAGE_PCT=$(python3 - "${LCOV_INFO}" <<'PYEOF'
import sys

lcov_path = sys.argv[1]

total_found  = 0
total_hit    = 0

try:
    with open(lcov_path, 'r', encoding='utf-8') as fh:
        for raw_line in fh:
            line = raw_line.strip()
            if line.startswith('LF:'):
                try:
                    total_found += int(line[3:])
                except ValueError:
                    pass
            elif line.startswith('LH:'):
                try:
                    total_hit += int(line[3:])
                except ValueError:
                    pass
except OSError as exc:
    print(f"ERROR: Cannot read lcov.info: {exc}", file=sys.stderr)
    sys.exit(1)

if total_found == 0:
    print("ERROR: No instrumented lines found in lcov.info. "
          "Ensure code-coverage is enabled in karma.conf.js.", file=sys.stderr)
    sys.exit(1)

pct = (total_hit / total_found) * 100
print(f"{pct:.1f}")
PYEOF
)

if [[ $? -ne 0 ]]; then
    echo "[COVERAGE GATE] ERROR: Failed to compute line coverage from ${LCOV_INFO}."
    exit 1
fi

# ---------------------------------------------------------------------------
# Compare coverage against the threshold
# ---------------------------------------------------------------------------
PASSED=$(python3 -c "
import sys
pct = float('${COVERAGE_PCT}')
threshold = float('${THRESHOLD}')
print('yes' if pct >= threshold else 'no')
")

if [[ "${PASSED}" == "yes" ]]; then
    echo "[COVERAGE GATE] PASSED: Jasmine/Karma line coverage is ${COVERAGE_PCT}% — minimum required is ${THRESHOLD}.0%"
    exit 0
else
    echo ""
    echo "=============================================================="
    echo "[COVERAGE GATE] FAILED: Jasmine/Karma line coverage is ${COVERAGE_PCT}% — minimum required is ${THRESHOLD}.0%"
    echo "Build aborted to enforce quality gate."
    echo ""
    echo "To resolve this failure:"
    echo "  1. Open the Frontend Coverage Report Jenkins artifact (HTML)."
    echo "  2. Identify Angular components, services, or pipes with low coverage."
    echo "  3. Add or expand Jasmine specs in frontend/src/**/*.spec.ts until"
    echo "     overall line coverage reaches ${THRESHOLD}%."
    echo "  4. Re-push your branch to trigger a new build."
    echo "=============================================================="
    echo ""
    exit 1
fi
