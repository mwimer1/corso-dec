#!/usr/bin/env tsx
// scripts/setup/recommend-docs-environment.ts
// Prints recommendations for optimal VS Code settings for documentation development
// Note: This script does not modify files; it only prints recommendations.

import { logger } from '../utils/logger';

async function recommendDocsEnvironment() {
  logger.info('📚 Documentation Development Environment Recommendations\n');
  logger.info('This script prints recommended VS Code settings and keybindings.');
  logger.info('You can copy these into your .vscode/settings.json and .vscode/keybindings.json files.\n');

  const recommendedSettings = {
    'markdown.showPreviewToSide': true,
    'markdown.preview.openMarkdownLinks': 'inEditor',
    'files.associations': {
      '*.md': 'markdown',
    },
    'markdown.extension.quickStrikethrough': true,
    'markdown.extension.tableFormatter.enable': true,
    'workbench.editorAssociations': {
      '*.md': 'default',
    },
    'workbench.startupEditor': 'readme',
    'files.defaultLanguage': 'markdown',
    'markdown.extension.toc.updateOnSave': true,
    'markdown.extension.toc.levels': '2..6',
    'markdown.extension.bold.indicator': '**',
    'markdown.extension.italic.indicator': '*',
  };

  const recommendedKeybindings = [
    {
      key: 'ctrl+shift+d',
      command: 'vscode.open',
      args: 'docs/README.md',
      when: 'editorTextFocus',
    },
    {
      key: 'ctrl+shift+h',
      command: 'vscode.open',
      args: 'README.md',
      when: 'editorTextFocus',
    },
    {
      key: 'ctrl+shift+b',
      command: 'vscode.open',
      args: 'docs/BESTPRACTICES.md',
      when: 'editorTextFocus',
    },
  ];

  logger.info('📋 VS Code Settings Recommendations:');
  logger.info('==========================================');
  logger.info('Add these to your .vscode/settings.json:');
  console.log(JSON.stringify(recommendedSettings, null, 2));

  logger.info('\n🔨 VS Code Keybindings Recommendations:');
  logger.info('==========================================');
  logger.info('Add these to your .vscode/keybindings.json:');
  console.log(JSON.stringify(recommendedKeybindings, null, 2));

  logger.info('\n⚡ Quick Documentation Commands:');
  logger.info('==========================================');
  logger.info('Ctrl+Shift+D - Open docs index');
  logger.info('Ctrl+Shift+H - Open main README');
  logger.info('Ctrl+Shift+B - Open best practices');

  logger.info('\n🛠️ Available Scripts:');
  logger.info('==========================================');
  logger.info('pnpm docs:index  - Regenerate docs index');
  logger.info('pnpm docs:validate  - Validate docs freshness');
  logger.info('pnpm docs:extract - Extract rules to JSON');
  logger.info('pnpm docs:fresh  - Test if docs are up-to-date');

  logger.success('\n✅ Documentation recommendations displayed!');
  logger.info('📖 The documentation system is now active and will:');
  logger.info('  • Auto-update the docs index on postinstall');
  logger.info('  • Validate docs freshness in CI');
  logger.info('  • Check docs before commits');
  logger.info('  • Provide AI-agent hints in barrel files');
}

recommendDocsEnvironment().catch((error) => {
  console.error('❌ Error displaying documentation recommendations:', error);
  process.exitCode = 1;
});
