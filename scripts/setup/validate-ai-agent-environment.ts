#!/usr/bin/env tsx
// scripts/setup/validate-ai-agent-environment.ts
// Validates AI agent development environment setup using consolidated utilities

import { runConsolidatedValidation } from '@/scripts/utils/env';
import { formatValidationResult, runValidationScript } from '../utils/validation-common';

async function main() {
  console.log('🤖 Validating AI Agent Development Environment...\n');

  // Run AI agent specific validation using consolidated utilities
  const result = await runConsolidatedValidation([
    {
      name: 'AI Agent Tools',
      description: 'Validates AI agent development tools and environment',
      validator: async () => {
        const { validateAIAgentTools } = await import('../utils/env');
        return validateAIAgentTools();
      },
      required: false
    },
    {
      name: 'Project Structure',
      description: 'Validates required project files and structure',
      validator: async () => {
        const { validateProjectStructure } = await import('../utils/env');
        return validateProjectStructure();
      },
      required: false
    }
  ]);

  formatValidationResult(result, 'AI Agent environment validation');
}

runValidationScript(main, 'AI Agent environment validation');

