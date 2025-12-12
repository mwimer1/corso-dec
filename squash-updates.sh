#!/bin/bash
# Script to automatically squash "Updates" commits during rebase

# This script will be used as the editor for git rebase
# It will automatically change "pick" to "squash" for commits with "Updates" in the message

# Read the rebase todo file
TODOFILE="$1"

# Create a backup
cp "$TODOFILE" "$TODOFILE.backup"

# Process the file to squash "Updates" commits
awk '
/^pick.*Updates/ {
    # Change pick to squash for Updates commits
    gsub(/^pick/, "squash")
}
{ print }
' "$TODOFILE.backup" > "$TODOFILE"

echo "Automatically squashed Updates commits. Continuing rebase..."
