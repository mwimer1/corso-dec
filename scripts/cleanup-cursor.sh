#!/usr/bin/env bash

set -euo pipefail

# This script previews or deletes .cursor directories older than 1 day under the user's home directory
# Usage: ./scripts/cleanup-cursor.sh [--delete] [--archive DIR]

DELETE=false
ARCHIVE_DIR=""

for arg in "$@"; do
  case "$arg" in
    --delete) DELETE=true ;;
    --archive) shift; ARCHIVE_DIR="$1" ;;
    --help) echo "Usage: $0 [--delete] [--archive DIR]"; exit 0 ;;
    *) echo "Unknown arg: $arg"; echo "Usage: $0 [--delete] [--archive DIR]"; exit 1 ;;
  esac
done

echo "Scanning for .cursor directories older than 1 day under $HOME..."

mapfile -t results < <(find "$HOME" -type d -name ".cursor" -mtime +0 2>/dev/null || true)

if [ ${#results[@]} -eq 0 ]; then
  echo "No .cursor directories older than 1 day found."
  exit 0
fi

echo "Found ${#results[@]} .cursor directories:" 
for d in "${results[@]}"; do
  du -sh "$d" 2>/dev/null || true
done

if [ "$DELETE" = true ]; then
  if [ -n "$ARCHIVE_DIR" ]; then
    mkdir -p "$ARCHIVE_DIR"
    echo "Archiving to $ARCHIVE_DIR"
    for d in "${results[@]}"; do
      mv "$d" "$ARCHIVE_DIR/" || rm -rf "$d"
    done
  else
    echo "Deleting ${#results[@]} directories..."
    for d in "${results[@]}"; do
      rm -rf -- "$d"
    done
  fi
  echo "Done."
else
  echo "Preview only. Rerun with --delete to remove or --archive DIR to move them to an archive directory."
fi
