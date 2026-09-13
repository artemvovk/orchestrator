#!/usr/bin/env bash

set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
WORKFLOW="${ROOT}/.github/workflows/release.yml"

require_text() {
  local text=$1
  grep -Fq -- "${text}" "${WORKFLOW}" || {
    printf 'release workflow is missing: %s\n' "${text}" >&2
    return 1
  }
}

reject_text() {
  local text=$1
  if grep -Fq -- "${text}" "${WORKFLOW}"; then
    printf 'release workflow still contains forbidden publication step: %s\n' "${text}" >&2
    return 1
  fi
}

require_text 'actions/upload-artifact@v4'
require_text 'name: orchestrator-packages-${{ matrix.goarch }}'
require_text 'validate-package-stage:'
require_text 'script/release-artifacts validate-unsigned'
require_text 'script/release-artifacts write-unsigned-checksums'
require_text 'name: orchestrator-unsigned-manifest'

reject_text 'softprops/action-gh-release'
reject_text 'draft: false'
reject_text 'gh release create'
reject_text 'docker buildx imagetools create'

echo 'release workflow tests: PASS'
