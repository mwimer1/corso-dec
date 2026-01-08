---
description: "Documentation and resources for documentation functionality."
last_updated: "2026-01-07"
category: "documentation"
status: "draft"
---
# Corso Development Workflow Accessibility

## 🎯 Quick Access to Development Tasks

This VS Code workspace is configured with enhanced accessibility for repetitive development tasks.

## 🎨 VS Code Task Buttons

This repo provides clickable task buttons in the VS Code status bar for quick access to common workflows.

### Install

Install the recommended extension when prompted:
- **VSCode Task Buttons** (`spencerwmiles.vscode-task-buttons`)

If buttons don't appear after install:
- Command Palette → **Developer: Reload Window**

### Hot Buttons (Compact Mode)

Single-click buttons on the left side of the status bar:
- ⚡ **Dev** → Quick Dev Start
- 🔍 **Quality** → Quality Gates
- 🧪 **Tests** → Run All Tests
- 🔧 **Build** → Build Project

### Full Task Menus

Right-side dropdown menus for all tasks:
- 🚀 **Setup⋯** — Install, verify, env checks, branch setup, cleanup
- ⚡ **Dev⋯** — Development server + watch
- 🔍 **Quality⋯** — Typecheck, lint, gates, scans
- 🧪 **Testing⋯** — Tests (full suite, file, domains, security)
- 🔧 **Build⋯** — Build / compile
- 📚 **Docs⋯** — OpenAPI + docs generation

**Note:** All tasks come from `.vscode/tasks.json` and must match labels exactly.

## 🚀 Getting Started

### Method 1: Keyboard Shortcuts (Fastest)
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Shift+D` | ⚡ Quick Dev Start | Start development server |
| `Ctrl+Shift+Q` | 🔍 Quality Gates | Full validation (TypeCheck + Lint + Test) |
| `Ctrl+Shift+T` | ⚡ Fast TypeCheck | Quick TypeScript validation |
| `Ctrl+Shift+L` | 🧹 Lint All | Run ESLint on entire codebase |
| `Ctrl+Shift+B` | 🔧 Build Project | Production build |
| `Ctrl+Shift+R` | 🧪 Run All Tests | Execute test suite |
| `Ctrl+Shift+\`` | 📁 Open Terminal in Project | New terminal in project directory |
| `Ctrl+Shift+N` | 🆕 New Terminal | Quick new terminal window |

### Method 2: Command Palette
1. Press `Ctrl+Shift+P`
2. Type "Tasks: Run Task" or just ">Tasks"
3. Browse emoji-labeled tasks
4. Select and execute

### Method 3: Windows Interactive Menu
```bash
scripts/windows/dev-workflows.bat
```

## 📋 Available Tasks

### 🚀 **Setup & Environment**
- Full Setup (Install + Verify + Setup Branch)
- Install Dependencies Only
- Environment Check
- Validate Cursor Rules

### ⚡ **Development**
- Quick Dev Start
- OpenAPI Generate/Validate

### 🔍 **Quality & Testing**
- Quality Gates (TypeCheck + Lint + Test)
- Fast TypeCheck — quick feedback using the tooling tsconfig (`pnpm typecheck:fast`).
- Lint All
- Run All Tests
- Test Security Suite

### 🎯 **Domain Testing**
- Test Analytics Domain
- Test Billing Domain
- Test Chat Domain

### 🔧 **Build & Cleanup**
- Build Project
- Clean Cache
- Clean All Caches

### 📚 **Documentation**
- Generate Docs
- AST-Grep Scan

## 📖 Full Documentation

For detailed usage instructions, keyboard shortcuts, customization options, and troubleshooting:

📖 **[Development Workflows Guide](../docs/development/setup-guide.md)**

## 🎮 Usage Tips

- **Daily Development**: Use `Ctrl+Shift+D` to start, `Ctrl+Shift+T` for quick checks
- **Pre-commit**: Always run `Ctrl+Shift+Q` for quality gates
- **New Features**: Test with `Ctrl+Shift+R` before committing
- **Build Verification**: Use `Ctrl+Shift+B` before deployments
- **Terminal Access**: Use `Ctrl+Shift+\`` for project terminal, `Ctrl+Shift+N` for new terminal
- **Auto-scroll**: All tasks now auto-scroll to show the latest output

## VS Code Tasks

- **⚡ Fast TypeCheck** — quick feedback using the tooling tsconfig (`pnpm typecheck:fast`).
- **Full TypeCheck** — project-wide typecheck.

### On-save actions
We run ESLint fixes and organize imports on explicit saves. If performance is an issue, toggle in `.vscode/settings.json`.

### Tailwind IntelliSense
Tailwind hints are enabled for `.tsx` only to reduce noise in non-UI files.

## 🔧 Customization

Tasks and shortcuts can be customized by editing:
- `tasks.json` - Task definitions
- `keybindings.json` - Keyboard shortcuts
- `settings.json` - VS Code settings

---

**Happy coding! 🎉**
