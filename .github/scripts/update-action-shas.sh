#!/bin/bash
# Script to update GitHub Action SHA pins

set -euo pipefail

echo "🔄 Updating GitHub Action SHA pins..."

# Function to get latest SHA for an action
get_latest_sha() {
  local action=$1
  local tag=$2
  
  # Extract owner and repo from action
  IFS='/' read -r owner repo <<< "$action"
  
  # Get SHA for tag using GitHub API
  SHA=$(gh api repos/$owner/$repo/git/ref/tags/$tag --jq '.object.sha' 2>/dev/null || echo "")
  
  if [ -z "$SHA" ]; then
    echo "Warning: Could not find SHA for $action@$tag" >&2
    return 1
  fi
  
  echo "$SHA"
}

# Update SHA in file
update_sha_in_file() {
  local file=$1
  local action=$2
  local old_version=$3
  local new_sha=$4
  local new_version=$5
  
  sed -i "s|uses: $action@$old_version|uses: $action@$new_sha # $new_version|g" "$file"
}

# Find all workflow files
find .github/workflows -name "*.yml" -o -name "*.yaml" | while read -r file; do
  echo "Processing: $file"
  
  # Find all uses: statements
  grep -E "uses: [^@]+@[^#]+" "$file" | while read -r line; do
    if [[ $line =~ uses:\ ([^@]+)@([^#[:space:]]+) ]]; then
      action="${BASH_REMATCH[1]}"
      version="${BASH_REMATCH[2]}"
      
      # Skip local actions
      if [[ $action == ./* ]]; then
        continue
      fi
      
      # Get latest SHA
      if sha=$(get_latest_sha "$action" "$version"); then
        echo "  ✅ $action@$version → $action@$sha"
        update_sha_in_file "$file" "$action" "$version" "$sha" "$version"
      fi
    fi
  done
done

echo "✅ SHA pinning update complete!" 