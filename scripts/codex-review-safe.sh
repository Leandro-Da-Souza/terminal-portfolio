#!/usr/bin/env bash

# Codex currently does not provide an easy way to ignore sensitive files.
# This script temporarily moves sensitive files to a temporary directory,
# runs Codex review, then restores the files afterward.

set -euo pipefail

shopt -s nullglob globstar

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

SENSITIVE_FILES=(
  ".env"
  ".env.local"
  "*.pem"
  "*.key"
)

EXCLUDED_DIRS=(
  "node_modules"
  ".git"
  "dist"
  "build"
)

TEMP_DIR=$(mktemp -d)

declare -A MOVED_FILES=()

should_exclude() {
  local path="$1"

  for excluded in "${EXCLUDED_DIRS[@]}"; do
    if [[ "$path" == "$excluded/"* ]] || [[ "$path" == */"$excluded/"* ]]; then
      return 0
    fi
  done

  return 1
}

cleanup() {
  if [ ${#MOVED_FILES[@]} -gt 0 ]; then
    echo "Restoring sensitive files..."

    for original_file in "${!MOVED_FILES[@]}"; do
      temp_file="${MOVED_FILES[$original_file]}"

      if [ -f "$temp_file" ]; then
        mv "$temp_file" "$original_file"
      fi
    done
  fi

  rm -rf "$TEMP_DIR"
}

trap cleanup EXIT SIGINT SIGTERM SIGTSTP

cd "$REPO_ROOT"

echo "Searching for sensitive files..."

for pattern in "${SENSITIVE_FILES[@]}"; do
  for file in **/$pattern; do
    if [ ! -f "$file" ]; then
      continue
    fi

    if should_exclude "$file"; then
      continue
    fi

    echo "Hiding: $file"

    original_file="$(realpath "$file")"

    temp_file="$(mktemp "$TEMP_DIR/XXXXXX")"

    mv "$file" "$temp_file"

    MOVED_FILES["$original_file"]="$temp_file"
  done
done

if [ ${#MOVED_FILES[@]} -eq 0 ]; then
  echo "No sensitive files found."
else
  echo "Protected ${#MOVED_FILES[@]} sensitive file(s)."
fi

echo "Running Codex review..."

codex review --uncommitted

echo "Review complete."
