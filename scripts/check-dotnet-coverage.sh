#!/usr/bin/env bash
# =============================================================================
# check-dotnet-coverage.sh
#
# PURPOSE
#   Parse the line-rate from a Cobertura XML report produced by the
#   XPlat Code Coverage collector and enforce a minimum line-coverage
#   threshold. Exits 0 when coverage meets or exceeds the threshold;
#   exits 1 with a clear, human-readable error message otherwise.
#
# USAGE
#   check-dotnet-coverage.sh <cobertura-xml-path> [threshold]
#
# ARGUMENTS
#   cobertura-xml-path  Absolute or relative path to the merged
#                       coverage.cobertura.xml file.
#   threshold           (Optional) Minimum required line coverage as an
#                       integer percentage (0–100). Defaults to 80.
#
# EXAMPLES
#   check-dotnet-coverage.sh backend/TestResults/coverage/coverage.cobertura.xml
#   check-dotnet-coverage.sh backend/TestResults/coverage/coverage.cobertura.xml 90
#
# DEPENDENCIES
#   python3   (used for XML parsing — available on all modern CI agents)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Argument validation
# ---------------------------------------------------------------------------
COBERTURA_XML="${1:-}"
THRESHOLD="${2:-80}"

if [[ -z "${COBERTURA_XML}" ]]; then
    echo "[COVERAGE GATE] ERROR: No Cobertura XML path provided."
    echo "Usage: $0 <cobertura-xml-path> [threshold]"
    exit 1
fi

if [[ ! -f "${COBERTURA_XML}" ]]; then
    echo "[COVERAGE GATE] ERROR: Cobertura XML file not found: ${COBERTURA_XML}"
    echo "Ensure the 'dotnet test' step ran successfully and the reportgenerator"
    echo "produced a merged Cobertura report before calling this script."
    exit 1
fi

if ! [[ "${THRESHOLD}" =~ ^[0-9]+$ ]] || (( THRESHOLD < 0 || THRESHOLD > 100 )); then
    echo "[COVERAGE GATE] ERROR: threshold must be an integer between 0 and 100, got: ${THRESHOLD}"
    exit 1
fi

# ---------------------------------------------------------------------------
# Parse the line-rate attribute from the root <coverage> element.
#
# The Cobertura format stores line-rate as a float in [0.0, 1.0]:
#   <coverage line-rate="0.7234" ...>
#
# We multiply by 100 to convert to a percentage.
# ---------------------------------------------------------------------------
COVERAGE_PCT=$(python3 - "${COBERTURA_XML}" <<'PYEOF'
import sys
import xml.etree.ElementTree as ET

xml_path = sys.argv[1]

try:
    tree = ET.parse(xml_path)
except ET.ParseError as exc:
    print(f"ERROR: Failed to parse XML file '{xml_path}': {exc}", file=sys.stderr)
    sys.exit(1)

root = tree.getroot()

# The root element may be <coverage> directly, or wrapped in a <CoverageReport>
# depending on the reportgenerator version. Handle both cases.
coverage_elem = root if root.tag == 'coverage' else root.find('.//coverage')

if coverage_elem is None:
    print("ERROR: Could not locate <coverage> element in the Cobertura XML.", file=sys.stderr)
    sys.exit(1)

line_rate_str = coverage_elem.get('line-rate')
if line_rate_str is None:
    print("ERROR: <coverage> element has no 'line-rate' attribute.", file=sys.stderr)
    sys.exit(1)

try:
    line_rate = float(line_rate_str)
except ValueError:
    print(f"ERROR: 'line-rate' value is not a valid float: '{line_rate_str}'", file=sys.stderr)
    sys.exit(1)

# Print as a percentage with one decimal place, e.g. "72.3"
print(f"{line_rate * 100:.1f}")
PYEOF
)

# If python3 exited non-zero (an error printed to stderr), stop here.
if [[ $? -ne 0 ]]; then
    echo "[COVERAGE GATE] ERROR: Failed to extract line-rate from ${COBERTURA_XML}."
    exit 1
fi

# ---------------------------------------------------------------------------
# Compare coverage against the threshold
# ---------------------------------------------------------------------------
# Use python3 for the floating-point comparison to avoid bash arithmetic
# limitations with decimal numbers.
PASSED=$(python3 -c "
import sys
pct = float('${COVERAGE_PCT}')
threshold = float('${THRESHOLD}')
print('yes' if pct >= threshold else 'no')
")

if [[ "${PASSED}" == "yes" ]]; then
    echo "[COVERAGE GATE] PASSED: xUnit line coverage is ${COVERAGE_PCT}% — minimum required is ${THRESHOLD}.0%"
    exit 0
else
    echo ""
    echo "=============================================================="
    echo "[COVERAGE GATE] FAILED: xUnit line coverage is ${COVERAGE_PCT}% — minimum required is ${THRESHOLD}.0%"
    echo "Build aborted to enforce quality gate."
    echo ""
    echo "To resolve this failure:"
    echo "  1. Review the coverage report published as a Jenkins artifact."
    echo "  2. Identify C# classes or methods lacking xUnit test coverage."
    echo "  3. Add or expand tests in backend/Tests/ until coverage >= ${THRESHOLD}%."
    echo "  4. Re-push your branch to trigger a new build."
    echo "=============================================================="
    echo ""
    exit 1
fi
