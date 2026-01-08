---
description: "Documentation and resources for documentation functionality. Located in commands/."
last_updated: "2026-01-07"
category: "documentation"
status: "draft"
title: "Commands"
---
# Cursor Project Commands

This directory contains project-specific commands for the Corso codebase that can be executed directly from Cursor IDE.

## Overview

Project commands provide quick access to common development workflows, quality gates, and validation tasks. These commands are available in Cursor's "Rules and Commands" settings panel.

## Command Structure

Commands are defined in `project-commands.json` with the following structure:

```json
{
  "name": "Command Name",
  "command": "pnpm <script-name>",
  "description": "What this command does",
  "category": "Quality|Development|Setup|API|Testing|Documentation|Build",
  "priority": "high|medium|low"
}
```

## Available Commands

### High Priority Commands

#### Quality Gates
- **Quality Gates (Full)**: Run all quality gates (typecheck, lint, test, cursor rules)
- **Pre-Commit Checks**: Run pre-commit validation (package, env, typecheck, lint)
- **Quality: Local (Full)**: Comprehensive local quality gates including bundle size
- **Validate Runtime Boundaries**: Validate server/Edge import boundaries
- **Validate Cursor Rules**: Validate Cursor AI rules compliance

#### Development
- **Quick TypeCheck**: Fast TypeScript validation for quick feedback
- **Start Dev Server**: Start Next.js development server

#### Setup
- **Full Setup**: Complete project setup (install, verify tools, setup branch, validate env)

#### API
- **OpenAPI Generate & Validate**: Generate OpenAPI spec and validate RBAC compliance

#### Build
- **Clean & Rebuild**: Clean TypeScript cache and rebuild project

### Medium Priority Commands

#### Development
- **Lint & Auto-Fix**: Run ESLint with auto-fix enabled

#### Testing
- **Run Tests**: Run Vitest test suite
- **Security Tests**: Run security test suite

#### Quality
- **AST-Grep Scan**: Run AST-Grep pattern validation

#### Documentation
- **Validate Documentation**: Validate documentation links and structure

## Usage

### In Cursor IDE

1. Open Cursor Settings (Ctrl+,)
2. Navigate to "Rules and Commands"
3. Find "Project Commands" section
4. Click on any command to execute it

### Command Execution

Commands are executed in the project root directory using the configured shell (PowerShell on Windows). All commands use `pnpm` as the package manager.

## Adding New Commands

To add a new command:

1. Edit `project-commands.json`
2. Add a new command object following the structure above
3. Choose an appropriate category and priority
4. Save the file
5. Commands will be available in Cursor after refresh

## Command Categories

- **Quality**: Code quality, linting, validation
- **Development**: Development workflow commands
- **Setup**: Initial setup and environment configuration
- **API**: API-related commands (OpenAPI, etc.)
- **Testing**: Test execution commands
- **Documentation**: Documentation validation and generation
- **Build**: Build and compilation commands

## Notes

- Commands are executed sequentially (use `&&` for chaining)
- All commands run from the project root directory
- Commands use `pnpm` as the package manager
- Windows-first: Commands are designed to work on Windows PowerShell
- Commands should not require user interaction (non-interactive flags used)

## Related Documentation

- [Development Environment Setup](../rules/ai-agent-development-environment.mdc)
- [Quality Gates Documentation](../../docs/quality/quality-gates.md)
- [Development Tools](../../docs/development/development-tools.md)
