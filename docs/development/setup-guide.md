---
status: "active"
last_updated: "2026-01-02"
category: "documentation"
title: "Development"
description: "Documentation and resources for documentation functionality. Located in development/."
---
# 🚀 Development Environment & Workflows

> **Windows shell requirement**: PowerShell is the default terminal (configured in `.vscode/settings.json`). Git Bash is available as an alternative profile. Run commands sequentially (no long `&&` chains).

This comprehensive guide covers environment setup, workflow accessibility, and development best practices for the Corso platform.

## 📋 Quick Reference

### Core Setup Commands (Run Sequentially)
```bash
pnpm install
pnpm run verify:ai-tools
pnpm run setup:branch
pnpm validate:env
pnpm validate:cursor-rules
pnpm typecheck
pnpm quality:local
```

### New Developer Checklist
After pulling the repository, complete this checklist to ensure full compliance with project standards:

✅ **Environment Setup**
- [ ] Run `pnpm validate:env` - validates environment variables and setup
- [ ] Add `.env.local` with required variables (see `.env.example`)
- [ ] Set `CORSO_USE_MOCK_DB=true` in `.env.local` for dashboard entity queries during development
- [ ] Set `CORSO_USE_MOCK_CMS=true` in `.env.local` for marketing content (insights) during development (enabled by default in dev/test)

✅ **Code Quality & Standards**
- [ ] Run `pnpm validate:cursor-rules` - validates custom Cursor AI rules and runtime boundaries
- [ ] Run `pnpm typecheck` - ensures TypeScript strict mode compliance
- [ ] Run `pnpm lint` - validates code quality and custom lint rules
- [ ] Run `pnpm quality:local` - full quality gates including tests and coverage

✅ **API & Documentation**
- [ ] Run `pnpm openapi:gen` if you modify API routes - generates OpenAPI spec and TypeScript types
- [ ] Run `pnpm openapi:rbac:check` after API changes - validates RBAC security compliance
- [ ] Review `.cursor/rules/` files - understand custom lint rules and coding standards
- [ ] Check `docs/development/setup-guide.md` - complete setup guide for hidden dependencies

✅ **Development Workflow**
- [ ] Use `pnpm dev` for development server
- [ ] Run commands sequentially, avoid `&&` chaining
- [ ] Never use `pnpm -s/--silent` on Windows

✅ **Windows-Specific Setup**
- [ ] Use Git Bash (not PowerShell/CMD) for all repository commands
- [ ] Run `source dev-env/bootstrap.sh` to enable bracketed-paste support
- [ ] Use Volta for Node/pnpm version management: `volta install node@20.19.4` and `volta install pnpm@10.15.0`
- [ ] If commands fail on Windows, ensure PowerShell is your default terminal in VS Code (configured automatically via `.vscode/settings.json`)
- [ ] For case-sensitive filesystem issues, consider using WSL2 or Git Bash on Windows

✅ **Required Tools & Dependencies**
- [ ] Install AI tools if `pnpm run verify:ai-tools` fails (install Spectral, Spellcheck, etc.)
- [ ] Ensure `tsx` is available (install via `pnpm add -D tsx` if needed)
- [ ] Verify pnpm version: `pnpm -v` should show 10.15.0 or compatible

✅ **Domain-Specific Setup**
- [ ] **Dashboard**: See `docs/development/dashboard-setup.md` for complete dashboard setup guide (mock DB, relaxed auth, column config, etc.)
- [ ] **Analytics Features**: Set `CLICKHOUSE_URL`, `CLICKHOUSE_DATABASE`, `CLICKHOUSE_PASSWORD` in `.env.local` for warehouse queries
- [ ] **AI Features**: Add `OPENAI_API_KEY` to `.env.local` for AI-powered features
- [ ] **Mock Database**: Set `CORSO_USE_MOCK_DB=true` in `.env.local` for dashboard entity queries (uses checked-in JSON fixtures from `public/__mockdb__/`)
- [ ] **Mock CMS**: Set `CORSO_USE_MOCK_CMS=true` in `.env.local` for marketing content (uses checked-in JSON fixtures from `public/__mockcms__/`, enabled by default in dev/test)

### Development Server Commands
- **`pnpm dev`** - Starts Next.js development server
  - **Automatic Cleanup**: Before starting, automatically:
    - Clears processes on ports 3000 and 9323 (dev server and Playwright)
    - Kills orphaned Node.js dev processes older than 30 minutes
    - Ensures clean startup without port conflicts or accumulated processes

## 🎮 Workflow Accessibility

### VS Code Tasks (Recommended)
Press `Ctrl+Shift+P` → "Tasks: Run Task" → Browse emoji-labeled tasks

### Keyboard Shortcuts

| Shortcut | Task | Description |
|----------|------|-------------|
| `Ctrl+Shift+D` | ⚡ Quick Dev Start | Start development server |
| `Ctrl+Shift+Q` | 🔍 Quality Gates | Full validation suite |
| `Ctrl+Shift+T` | ⚡ Fast TypeCheck | Quick TypeScript check |
| `Ctrl+Shift+L` | 🧹 Lint All | Run ESLint |
| `Ctrl+Shift+B` | 🔧 Build Project | Production build |

### Windows Batch Script Menu
```bash
scripts/dev-workflows.bat
```

## Volta (Windows-first; local setup)

- Install Volta: `winget install Volta.Volta`, then `volta install node@20.19.4` and `volta install pnpm@10.15.0`.
- Check locally: `node -v` should match `.node-version`; `pnpm -v` should match `volta` configuration.
- Do not enable Corepack locally (CI may use Corepack shims; local uses Volta for pnpm).

This guide provides a complete setup solution that includes:

- **Bracketed-paste support** for terminal ergonomics
- **Environment file management** with separate files for different purposes
- **Supabase CLI configuration** with the `.env` file at repo root
- **CI guardrails** and clear onboarding instructions
- **Common pitfalls** and troubleshooting guidance

---

<!-- START doctoc generated TOC please keep comment here to allow auto update -->

<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [🚀 Development Environment Setup](#-development-environment-setup)
  - [📋 Quick Reference](#-quick-reference)
  - [🔐 Environment Files \& Secrets](#-environment-files--secrets)
    - [File Roles \& Naming](#file-roles--naming)
    - [Templates](#templates)
    - [Supabase CLI usage](#supabase-cli-usage)
    - [Common pitfalls (and how to avoid them)](#common-pitfalls-and-how-to-avoid-them)
    - [CI quality gates (heads‑up)](#ci-quality-gates-headsup)
  - [🐚 Bracketed-Paste Support](#-bracketed-paste-support)
    - [What is Bracketed-Paste?](#what-is-bracketed-paste)
    - [Why Do `[200~...201~` Errors Happen?](#why-do-200201-errors-happen)
    - [How Corso Fixes This](#how-corso-fixes-this)
  - [🔧 Setup Methods](#-setup-methods)
    - [Option 1: Local Development (Recommended)](#option-1-local-development-recommended)
    - [Option 2: Local Development](#option-2-local-development)
  - [⚙️ Configuration Details](#️-configuration-details)
    - [`.inputrc` Settings](#inputrc-settings)
    - [VS Code Integration](#vs-code-integration)
  - [🖥️ Platform Support](#️-platform-support)
    - [Windows (PowerShell/Git Bash)](#windows-powershellgit-bash)
    - [Linux/Container](#linuxcontainer)
    - [macOS](#macos)
  - [🧪 Testing \& Validation](#-testing--validation)
    - [Test Bracketed-Paste Setup](#test-bracketed-paste-setup)
    - [Validation Script](#validation-script)
  - [🛠️ Troubleshooting](#️-troubleshooting)
    - [Common Issues](#common-issues)
    - [Windows-Specific Issues](#windows-specific-issues)
  - [📚 Additional Resources](#-additional-resources)
    - [Related Documentation](#related-documentation)
    - [External References](#external-references)
  - [🎯 Key Takeaways](#-key-takeaways)
  - [🏷️ Tags](#️-tags)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## 🚀 Development Environment Setup

This guide covers the complete developer setup for Corso: **environment files & secrets**,
**Supabase CLI**, **shell/terminal ergonomics**, and **VS Code integration**. It’s designed
to be copy‑paste friendly and CI‑ready.

## 📋 Environment Setup Summary

- **Separate env files, by responsibility**

  - `.env` → **Supabase CLI only** (repo root, ASCII‑only, no decorations)
  - `.env.local` → **Next.js local dev**
  - `.env.test` → **Tests/CI**
  - `.env.example` → **Template** (no secrets)
- **Supabase CLI** → always pass the file:
  `pnpm dlx supabase start --env-file .env`
- **No Unicode art / fancy comments** in `.env` (prevents parsing errors)
- **Bracketed‑paste enabled** via `dev-env/.inputrc` + bootstrap
- **VS Code** workspace settings included for consistent terminals
- **Cleanup script**: `pnpm run cleanup:all` for complete cache/node_modules rebuild

> Mock Mode (JSON-backed tables)
>
> - Set `CORSO_USE_MOCK_DB=true` in `.env.local` to serve dashboard entity tables from JSON files in `public/__mockdb__/`.
> - JSON fixtures are checked into the repo under `public/__mockdb__/` (no generation step required).
> - Set `CORSO_USE_MOCK_CMS=true` in `.env.local` to serve marketing content (insights) from JSON files in `public/__mockcms__/`.
> - Mock CMS fixtures are checked into the repo under `public/__mockcms__/` (generated via `pnpm port:mockcms:insights`).
> - Edge-compatible (uses `fetch()` to load JSON, no Node `fs`). Supports
> eq/contains/gt/lt/gte/lte/in/between/bool filters, global search, sorting (numbers/strings/dates),
> and pagination via `getEntityPage()` service.
> - No UI changes required; routes automatically use mock data when flag is enabled. Not used in production.

- **Lightweight clones (save disk/RAM on dev/CI)**

  - Shallow clone (latest commit only):

    ```bash
    git clone --depth 1 https://github.com/Corso222/corso-app.git
    ```

  - Partial clone (skip blobs until needed) + sparse checkout (only key folders):

    ```bash
    git clone --filter=blob:none --no-checkout https://github.com/Corso222/corso-app.git corso-app
    cd corso-app
    git sparse-checkout init --cone
    git sparse-checkout set app lib hooks types components
    git checkout main
    ```

  - GitHub Actions (Windows-friendly) minimal checkout:

    ```yaml
    - uses: actions/checkout@v4
      with:
        fetch-depth: 1
        filter: blob:none
        sparse-checkout: |
          app
          lib
          hooks
          types
          components
    ```

---

## 🔐 Environment Files & Secrets

### File Roles & Naming

| File           | Tracked | Purpose                                  | Notes                                                           |
| -------------- | ------- | ---------------------------------------- | --------------------------------------------------------------- |
| `.env`         | ❌       | **Supabase CLI runtime**                 | Root of repo; plain ASCII; **no decorative headings**.          |
| `.env.local`   | ❌       | **Next.js local dev**                    | Your personal dev keys; can include comments/emojis for humans. |
| `.env.test`    | ❌       | **Automated tests / CI**                 | Test/staging credentials; loaded in CI jobs.                    |
| `.env.example` | ✅       | **Template** for new devs & CI scaffolds | **Never** real secrets. Mirrors required keys.                  |

> **Why separate?** Supabase CLI's dotenv parser is strict. We keep a lean, ASCII‑only `.env`
> for it, while Next.js gets the more human‑friendly `.env.local`. This prevents the
> "`unexpected character '#'`" failure and keeps tools from stepping on each other.

**.gitignore (excerpt)**
Make sure we never commit real secrets:

```gitignore
.env
.env.local
.env.test
# allow the template
!.env.example
```

### Templates

**`.env.example` (drop-in template; safe to commit)**

```bash
# ▶️ Runtime Stage
NODE_ENV=development
NEXT_PUBLIC_STAGE=development
APP_VERSION=0.0.0

# 🏗️ Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 🔐 Auth (example placeholders)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-key
CLERK_SECRET_KEY=sk_test_your-secret

# 💳 Stripe (example placeholders)
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret

# 🧠 OpenAI (example placeholders)
OPENAI_API_KEY=sk-your-openai-key
OPENAI_SQL_MODEL=gpt-4o-mini

# 🗄️ ClickHouse (if used locally)
CLICKHOUSE_URL=https://your-clickhouse-url
CLICKHOUSE_DATABASE=dev
CLICKHOUSE_READONLY_USER=dev
CLICKHOUSE_PASSWORD=dev
CLICKHOUSE_TIMEOUT=30000

# 🔒 Security & CSP
CSP_SCRIPT_DOMAINS='self',js.stripe.com,js.clerk.dev
CSP_STYLE_DOMAINS='self',fonts.googleapis.com
CSP_FONT_DOMAINS='self',fonts.gstatic.com
CSP_IMG_DOMAINS='self',images.clerk.dev,js.stripe.com
CSP_CONNECT_DOMAINS='self',api.openai.com,api.stripe.com
CSP_FRAME_DOMAINS='self',js.stripe.com,accounts.clerk.dev
CSP_REPORT_URI=http://localhost:3000/api/public/csp-report
CSP_REPORT_ONLY=false
```

**`.env` (Supabase CLI only; root of repo; ASCII, minimal comments)**

```bash
# Supabase runtime (ASCII-only; keep comments simple)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**`.env.local` (Next.js local; your real dev values)**

```bash
# Corso — Local Environment
NODE_ENV=development
NEXT_PUBLIC_STAGE=development
APP_VERSION=1.0.0

# Supabase configuration (see .env.example for full setup)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Other services: Clerk, Stripe, OpenAI, etc. (see .env.example)

# 🔒 Security & CSP (reports sent to local endpoint)
CSP_REPORT_URI=http://localhost:3000/api/public/csp-report
```

**`.env.test` (Test/CI; loaded by pipeline)**

```bash
NODE_ENV=test
NEXT_PUBLIC_STAGE=test
APP_VERSION=1.0.0

NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-anon-key
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ci-service-role-key

# 🔒 Security & CSP (reports sent to local endpoint for testing)
CSP_REPORT_URI=http://localhost:3000/api/public/csp-report
```

### Supabase CLI usage

Always point CLI to the root `.env`:

```bash
pnpm dlx supabase start --env-file .env
pnpm dlx supabase db diff --schema public --env-file .env
pnpm dlx supabase gen types typescript --project-ref <ref> --env-file .env > types/supabase/supabase.types.ts
```

> **Tip:** keep `.env` **boring** (ASCII, `KEY=VALUE`). If you want header art or rich comments, put them in `.env.local` only.

### Common pitfalls (and how to avoid them)

- **Error:** `failed to parse environment file: .env.local (unexpected character '#')`
  **Fix:** Don’t point Supabase CLI at `.env.local`. Use the root `.env` and `--env-file .env`.
  Also ensure `.env` comments are simple ASCII (`# text`), no box‑drawing or special glyphs.

- **Mismatch between schema and types**
  **Fix:** After any DB migration, regenerate types and commit:

  ```bash
  pnpm dlx supabase gen types typescript --env-file .env > types/supabase/supabase.types.ts
  pnpm typecheck
  pnpm lint
  ```

- **Accidentally committing secrets**
  **Fix:** Keep `.env*` ignored, commit only `.env.example`. Rotate any leaked keys immediately.

### CI quality gates (heads‑up)

Your pipeline should run (example names only):

```bash
pnpm tsc --noEmit
pnpm lint  # Auto-rebuilds @corso/eslint-plugin
pnpm dlx supabase db diff --schema public --env-file .env || true  # local or ephemeral DB in CI
pnpm dlx supabase gen types typescript --env-file .env > types/supabase/supabase.types.ts
git diff --exit-code -- types/supabase/supabase.types.ts
```

Fail CI if types drift, lint fails, or `tsc` isn’t clean. See the repo’s CI docs for the exact workflow.

---

## 🐚 Bracketed-Paste Support

### What is Bracketed-Paste?

Bracketed‑paste wraps pasted content in escape sequences so shells/editors don’t misinterpret multi‑line input.

### Why Do `[200~...201~` Errors Happen?

- Terminal supports bracketed‑paste but readline isn’t configured
- Mismatch between terminal and shell paste handling
- Git Bash/MSYS2 defaults

### How Corso Fixes This

1. **Repo `.inputrc`** → `dev-env/.inputrc`
2. **Bootstrap** → `dev-env/bootstrap.sh` (links `~/.inputrc`)
3. **DevContainer** → mounts & auto‑runs bootstrap
4. **VS Code workspace** → consistent terminal behavior

---

## 🔧 Setup Methods

### Option 1: Local Development (Recommended)

```bash
# Open in VS Code
code .

# Install dependencies
pnpm install

# Verify environment
pnpm run verify:ai-tools
pnpm validate:env

# Optional: enable sparse-checkout locally to keep working tree small
git sparse-checkout init --cone
git sparse-checkout set app lib hooks types components
```

### Benefits

- Consistent across OS
- `.inputrc` auto‑setup
- No Windows edge cases
- Tooling parity (AI agents, CLI, etc.)

### Option 2: Local Development

```bash
git clone https://github.com/Corso222/corso-app.git
cd corso-app
source dev-env/bootstrap.sh
# Restart shell or:
source ~/.bashrc   # or ~/.zshrc
```

### Bootstrap does

- Backs up and links `~/.inputrc` → `repo/dev-env/.inputrc`
- Detects OS/shell
- Prints next steps & sanity checks

### Option 3: Manual Setup

```bash
cp dev-env/.inputrc ~/.inputrc
# or append:
cat dev-env/.inputrc >> ~/.inputrc
bind -f ~/.inputrc
```

---

## ⚙️ Configuration Details

### `.inputrc` Settings

```bash
set enable-bracketed-paste on
set completion-ignore-case on
set show-all-if-ambiguous on
set colored-completion-prefix on
set colored-stats on
set visible-stats on
set history-preserve-point on
set editing-mode emacs
set keymap emacs
```

### VS Code Integration

`.vscode/settings.json` is pre-configured with:

- **PowerShell as default terminal** (prevents Cursor Agent Mode bash integration issues)
- **Automation profile** set to PowerShell for tasks and automation
- **Shell integration disabled** to avoid terminal noise
- **Bracketed paste mode** enabled for better terminal ergonomics

```json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.automationProfile.windows": {
    "path": "powershell.exe",
    "args": ["-NoLogo"]
  },
  "terminal.integrated.shellIntegration.enabled": false,
  "terminal.integrated.bracketedPasteMode": true,
  "terminal.integrated.enableMultiLinePasteWarning": "auto",
  "terminal.integrated.rightClickBehavior": "paste"
}
```

**Note**: Git Bash profiles are still available for manual use if needed, but PowerShell is recommended for Cursor Agent Mode to avoid `dump_bash_state` errors.

Disable per‑user if needed:

```json
{ "terminal.integrated.bracketedPasteMode": false }
```

---

## 🖥️ Platform Support

### Windows (PowerShell/Git Bash)

- ✅ **PowerShell is the default** — Configured in `.vscode/settings.json` to prevent Cursor Agent Mode terminal issues
- ✅ Git Bash available as alternative profile — Use if you prefer bash syntax
- ✅ MSYS2 ok with `.inputrc` — For advanced users
- ✅ WSL recommended for native Linux behavior — Best for Linux-like development experience
- ✅ PowerShell is the default terminal (configured in `.vscode/settings.json`). Git Bash is available as an alternative profile if needed.

#### Shell requirements and usage (Windows)

```bash
# Always run commands in Git Bash (not PowerShell/CMD)
# Run commands sequentially; avoid chaining with &&
pnpm install
pnpm run verify:ai-tools
pnpm run setup:branch
pnpm validate:env
```

### Linux/Container

- ✅ Bash/Zsh native readline
- ✅ DevContainer mounts `.inputrc`

### macOS

- ✅ Terminal.app / iTerm2 / VS Code all supported

---

## 🧪 Testing & Validation

### Test Bracketed-Paste Setup

```bash
# Paste multi-line (should NOT show [200~ codes)
echo "line 1
line 2
line 3"

git status
git add .
git commit -m "test"

curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": "value"}' \
  https://api.example.com/test
```

### Validation Script

```bash
source dev-env/bootstrap.sh
ls -la ~/.inputrc
bind -v | grep bracket
```

---

## 🛠️ Troubleshooting

### Common Issues

**Seeing `[200~...201~`?**

```bash
bind -f ~/.inputrc
exec $SHELL -l
ls -la ~/.inputrc
```

### VS Code terminal oddities

```bash
cat .vscode/settings.json | grep bracket
# Adjust user settings if needed
```

### Supabase CLI: "unexpected character '#' in variable name"

- Ensure you’re using: `--env-file .env`
- Keep `.env` ASCII‑only; no box‑drawing / emojis
- Remove inline comments or keep them simple (`# text`)

### Windows-Specific Issues

#### Common Windows Setup Problems

**Problem**: Commands fail or behave unexpectedly on Windows
```bash
# ✅ Solution: Use Git Bash for all repository commands
# ❌ Don't use PowerShell or CMD
# ❌ Don't use Windows Command Prompt

# If using VS Code:
# 1. Open Settings (Ctrl+,)
# 2. Search "terminal.integrated.shell.windows"
# 3. Set to: "C:\\Program Files\\Git\\bin\\bash.exe"
# 4. Restart VS Code
```

**Problem**: `pnpm dev` doesn't reflect file changes
```bash
# ✅ Solution: Ensure case-sensitive filesystem
# On Windows, some filesystems are case-insensitive
# This can cause issues with Next.js hot reloading

# Option 1: Use WSL2 for development
wsl --install

# Option 2: Use Git Bash and ensure proper file watching
pnpm dev --turbo  # If available
```

**Problem**: `verify:ai-tools` fails
```bash
# ✅ Solution: Install required CLI tools
# The script checks for: Spectral, Spellcheck, and other AI tools

# Install Spectral (OpenAPI linter)
pnpm add -g @stoplight/spectral

# Install Spellcheck (markdown spell checking)
pnpm add -g spellchecker-cli

# Alternative: Let the script install them automatically
pnpm run verify:ai-tools --force
```

**Problem**: Environment variable issues
```bash
# ✅ Solution: Use .env.local for Next.js dev vars
# ❌ Don't put Next.js vars in .env (reserved for Supabase CLI)

# Copy the template
cp .env.example .env.local

# Edit .env.local with your real values
code .env.local
```

**Problem**: Case sensitivity issues
```bash
# ✅ Solution: Use Git Bash which handles case sensitivity better
# Windows NTFS is case-insensitive by default
# Git Bash provides Unix-like case-sensitive behavior

# If you must use CMD/PowerShell, consider:
# 1. Using WSL2 for development
# 2. Ensuring consistent file naming
# 3. Using lowercase for all files/directories
```

#### Git Bash version

```bash
git --version  # Prefer 2.14+
```

#### MSYS2 path sanity

```bash
echo $MSYSTEM
which bash
```

---

## 📚 Additional Resources

### Related Documentation

- Development Tools – `docs/tools-scripts/development-tools.md`
- DevContainer Setup – `.devcontainer/README.md`
- Pattern Library – `docs/pattern-library.md`
- Database Setup – See Supabase configuration in setup sections above

### External References

- GNU Readline: [https://www.gnu.org/software/bash/manual/html\_node/Readline-Init-File.html](https://www.gnu.org/software/bash/manual/html_node/Readline-Init-File.html)
- Bracketed Paste Mode: [https://cirw.in/blog/bracketed-paste](https://cirw.in/blog/bracketed-paste)
- XTerm Control Sequences: [https://invisible-island.net/xterm/ctlseqs/ctlseqs.html](https://invisible-island.net/xterm/ctlseqs/ctlseqs.html)

---

## 🎯 Key Takeaways

- Use a **lean, ASCII‑only `.env`** at repo root **for Supabase CLI**.
- Keep **Next.js dev** vars in `.env.local`; keep **tests** in `.env.test`; commit **`.env.example`** only.
- Always run Supabase CLI with `--env-file .env`.
- Bracketed‑paste is preconfigured; bootstrap or DevContainer handles it.
- CI should enforce **type/lint clean** and **typegen freshness**.

## 🔒 Security & Validation Standards

### Environment Usage Validation
The project enforces strict environment variable access patterns:

- **Server-only**: Import `getEnv()` from `@/lib/server/env` - returns full `ValidatedEnv`
- **Edge handlers**: Import `getEnvEdge()` from `@/lib/api` - returns minimal, Edge-safe subset
- **Client/Universal**: Import `publicEnv()` from `@/lib/shared/config/client` - only `NEXT_PUBLIC_*` keys
- **NEVER**: Access `process.env` directly in app code - use centralized config patterns

### Runtime Boundaries & Edge Safety
- **Edge-compatible**: `@/lib/api` exports only Edge-safe utilities
- **Server-only**: Import directly from service subdirectories for server operations
- **Context-aware**: Functions that adapt to client/server environments automatically

### Custom Lint Rules & Standards
The project uses custom ESLint rules and Cursor AI rules:

- **Runtime Boundaries**: Enforced via `@corso/eslint-plugin` - prevents server code in client bundles
- **Import Patterns**: Validates barrel imports and prevents deep imports
- **Environment Usage**: Ensures proper environment variable access patterns
- **Security Standards**: Validates authentication, validation, and rate limiting patterns

### OpenAPI & RBAC Validation
After modifying API routes:
1. Run `pnpm openapi:gen` - bundles YAML → JSON → TypeScript types
2. Run `pnpm openapi:rbac:check` - validates RBAC security annotations
3. All bearer-authenticated operations require `x-corso-rbac` or `x-public` extension
4. All bearer operations must include `OrgIdHeader` parameter for tenant isolation

## 🔍 Dead Code & Unused Exports Audits

### Source of Truth: CI (Linux)

**Canonical audit results come from GitHub Actions (Linux runners).** This ensures consistent, reproducible results across the team and prevents "works on my machine" issues.

### Windows Limitations

Some audit tools have known Windows compatibility issues:

- **Knip** (`pnpm validate:dead-code`): Fails on Windows due to native bindings blocked by Windows Application Control policy
- **ts-prune** (`pnpm deadcode:test-only`): Has path issues with `pnpm exec` on Windows

**Workaround for Windows developers:**
- Use `pnpm validate:dead-code:optimized` (Madge-based, Windows-compatible)
- Use `pnpm audit:orphans` (ts-morph-based, Windows-compatible)
- For full analysis, check CI artifacts from the `dead-code-audit` workflow

### Available Audit Commands

#### Cross-Platform (Windows-compatible)

```bash
# Dead code check (orphans + circular dependencies)
pnpm validate:dead-code:optimized

# Detailed orphan audit (ts-morph-based)
pnpm audit:orphans --out reports/orphan/orphan-report.json

# High-signal orphan candidates only
pnpm audit:orphans:high-signal
```

#### Linux/CI Only (May fail on Windows)

```bash
# Full Knip analysis (dead code + unused exports)
pnpm validate:dead-code

# Unused exports check (Knip-based)
pnpm quality:exports:check

# Test-only exports check (ts-prune-based)
pnpm deadcode:test-only
```

### CI Workflow

The `dead-code-audit` workflow runs automatically on:
- Pull requests (when code paths change)
- Pushes to `main`
- Weekly schedule (Mondays at 2 AM UTC)
- Manual trigger (`workflow_dispatch`)

**Artifacts:**
- `reports/orphan/orphan-report.json` - Detailed orphan file analysis
- `reports/exports/unused-exports.report.json` - Unused exports JSON report
- `reports/exports/unused-exports.summary.md` - Human-readable summary

Download artifacts from the workflow run to review findings.

### Audit Report Locations

All audit reports are generated in the `reports/` directory:

```
reports/
├── orphan/
│   └── orphan-report.json          # Orphaned files analysis
└── exports/
    ├── unused-exports.report.json  # Unused exports (JSON)
    └── unused-exports.summary.md   # Unused exports (Markdown)
```

**Note:** Reports are not committed to the repository. They are:
- Generated locally when running audit commands
- Uploaded as CI artifacts for each workflow run
- Available for 30 days in GitHub Actions

### Understanding Audit Results

#### Orphaned Files

Files that are not imported or referenced anywhere in the codebase. The audit tool:
- Excludes Next.js convention files (`page.tsx`, `layout.tsx`, `route.ts`, etc.)
- Excludes generated files (`.d.ts`, OpenAPI types)
- Respects allowlist in `scripts/audit/orphans.allowlist.json`

**Decision tree:**
1. Is it a Next.js convention file? → Should be excluded (fix tooling config if it appears)
2. Is it generated/tool-consumed? → Keep + document + allowlist
3. Is it a barrel file? → Verify if part of public API before deleting
4. Is it referenced dynamically? → Manual verification required
5. Otherwise → Candidate for deletion (after typecheck/build/tests pass)

#### Unused Exports

Exports that are never imported. Treat as API surface hygiene:

- **Internal-only exports**: Remove and simplify import sites
- **Public API exports**: Either keep (with allowlist) or move to appropriate module
- **Type-only exports**: Easy to clean, low risk
- **Barrel inconsistencies**: Often create most of the "unused exports" noise

#### Test-Only Exports

Exports only referenced in test files. **Recommended action:**
- Move helpers to `test-utils/` or colocated test helper modules
- Stop exporting from production modules
- Only allowlist if there's a deliberate policy for downstream users

### Contributing Guidelines

When working on dead code cleanup:

1. **Check CI artifacts first** - Review the latest audit results from the workflow
2. **Run local checks** - Use Windows-compatible commands for quick feedback
3. **Verify before deleting** - Run `pnpm typecheck`, `pnpm build`, `pnpm test` after deletions
4. **Update allowlists** - If keeping a file, add it to `scripts/audit/orphans.allowlist.json` with a reason
5. **Small PRs** - Keep cleanup PRs focused and easy to review

## 🏷️ Tags

`#development-environment` `#env-files` `#supabase` `#terminal` `#bracketed-paste` `#devcontainer` `#nextjs` `#ci` `#dead-code` `#code-quality`

---

## Line endings (Windows/macOS/Linux)

We enforce LF line endings for all text files via `.gitattributes`. This keeps CI, macOS, and Windows builds consistent and avoids noisy diffs.

Summary:
- `.gitattributes` maps common text extensions to `text eol=lf`.
- Binary assets are marked `binary`.
- Developers on Windows may keep `core.autocrlf=input` (optional) to avoid local CRLF conversions.

One-time normalization after policy changes:
```bash
git add --renormalize .
git commit -m "chore: normalize line endings"
```

Suppress local warnings:
```bash
# Repo-local (recommended)
git config core.autocrlf input
# Or Windows-style checkout with LF commit
# git config core.autocrlf true
```

## 🚨 Troubleshooting & Cleanup

### Complete Cache & Node Modules Cleanup

If you encounter persistent build issues, dependency conflicts, or performance problems, use the comprehensive cleanup script:

```bash
# Complete cleanup and rebuild (Windows-first, safe for uncommitted changes)
pnpm run cleanup:all
```

**What it does:**
- 🗑️ Removes `node_modules`, `.next`, `types`, `.cache`, `.eslintcache`
- 🧹 Clears TypeScript build info files
- 🗂️ Prunes pnpm store cache
- 🔄 Reinstalls dependencies
- 🏗️ Rebuilds the application

**When to use:**
- Persistent build errors
- Dependency conflicts
- Performance slowdowns
- After major dependency updates
- Corrupted cache issues

**Safe for:**
- ✅ Uncommitted changes (only removes build artifacts)
- ✅ Git state (no impact on working directory)
- ✅ Windows environments (cross-platform commands)
- ✅ Large projects (efficient cleanup sequence)
