# VS Code Task Menus

This repo exposes common workflows as **six status-bar task menus** in VS Code:

**🚀 Setup · ⚡ Dev · 🔍 Quality · 🧪 Tests · 🔧 Build · 📚 Docs**

Each menu item runs a VS Code task defined in `.vscode/tasks.json`.

## Install
1. Install recommended extensions when prompted.
2. If menus don't appear: Command Palette → **Developer: Reload Window**

## Usage
Use the status bar menus:
- **🚀 Setup**: install/verify/env/cleanup
- **⚡ Dev**: dev server + TS watch
- **🔍 Quality**: typecheck/lint/gates/AST-Grep
- **🧪 Tests**: suite + file + domain/security
- **🔧 Build**: production build
- **📚 Docs**: OpenAPI + docs generation + validation + maintenance

### 📚 Docs Menu

The Docs menu provides comprehensive documentation maintenance tools:

**Maintenance Suites:**
- **🧰 Maintenance suite**: Complete refresh + verification (generates files, then validates)
- **🧾 Refresh suite**: Regenerates docs index + README artifacts (writes files)
- **✅ Verify suite**: Runs all docs checks without generation (lint, validate, spellcheck, stale check)

**Auto-Publish (Advanced):**
- **🚀 Auto-publish docs**: Fast-forward pull `main` → refresh docs/READMEs → commit (no-verify) → push to `origin/main` (no-verify)
- **🧪 Auto-publish (dry-run)**: Preview changes without committing or pushing

> **⚠️ Warning**: Auto-publish pushes directly to `main` and bypasses local git hooks (`--no-verify`). Use with caution.
> 
> **Safety features:**
> - Automatically fast-forwards local `main` from `origin/main` (ff-only) when behind
> - Refuses to run if non-doc changes exist, staged changes present, or branch is not `main`
> - Only stages allowlisted docs/README outputs
> - Uses conventional commit message: `chore(docs): refresh generated docs`
> - Fails gracefully if branch protection blocks direct pushes (PRs may be required)

**Individual Tasks:**
- **✅ Lint markdown**: Validate markdown formatting
- **🔗 Validate links & structure**: Check links, structure, and templates
- **🔤 Spellcheck**: Check spelling across documentation
- **⏰ Stale docs check**: Identify outdated documentation
- **🧾 Generate READMEs**: Generate README artifacts
- **📁 Generate directory READMEs**: Generate directory-level READMEs
- **📚 Generate docs index**: Generate main docs index
- **📊 Generate API docs (TypeDoc)**: Generate TypeDoc API documentation
- **📊 OpenAPI generate**: Generate OpenAPI specification
- **📋 OpenAPI validate**: Validate RBAC annotations

> **⚠️ Warning**: Refresh suite and Maintenance suite tasks can modify files (README/index artifacts). Review diffs and commit changes as needed.

## Notes
Task names must match `.vscode/tasks.json` labels exactly. If you rename a task label, update the Task Menus config in `.vscode/settings.json`.
