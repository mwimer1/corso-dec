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
- **📚 Docs**: OpenAPI + docs index

## Notes
Task names must match `.vscode/tasks.json` labels exactly. If you rename a task label, update the Task Menus config in `.vscode/settings.json`.
