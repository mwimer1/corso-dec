#!/usr/bin/env tsx
// scripts/maintenance/extract-docs-rules.ts
// Extracts rules from documentation for ESLint consumption

import { promises as fs } from 'fs';
// Local logger fallback
const logger = {
  info: (...a: unknown[]) => console.log('[info]', ...a),
  warn: (...a: unknown[]) => console.warn('[warn]', ...a),
  error: (...a: unknown[]) => console.error('[error]', ...a),
};

interface Rule {
    rule: string;
    why: string;
    enforcement: string;
    eslintMessage: string;
}

type Rules = Record<string, Rule>;

async function extractRulesFromBestPractices(): Promise<Rules> {
  try {
    logger.info('📋 Extracting rules from best-practices.md...');

    const bestPracticesPath = 'docs/best-practices.md';
    const content = await fs.readFile(bestPracticesPath, 'utf8');

    // Extract rules from the Core Coding Guardrails table
    const guardrailsMatch = content.match(/## 1\. Core Coding Guardrails[\s\S]*?(?=##|$)/);

    if (!guardrailsMatch) {
      logger.warn('⚠️  Could not find Essential Guardrails section');
      return {};
    }

    const guardrailsSection = guardrailsMatch[0];

    // Extract table rows
    const tableRows = guardrailsSection.match(/\|([^|]+\|[^|]+\|[^|]+)\|/g);

    if (!tableRows) {
      logger.warn('⚠️  Could not find guardrails table');
      return {};
    }

    const rules: Rules = {};

    // Skip header rows
    const dataRows = tableRows.slice(2);

    for (const row of dataRows) {
      const cells = row
        .split('|')
        .map((cell) => cell.trim())
        .filter((cell) => cell);

      if (cells.length >= 3) {
        const [rule, why, enforcement] = cells;

        if (rule && why && enforcement) {
          // Convert rule to key
          const ruleKey = rule
            .replace(/\*\*/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');

          rules[ruleKey] = {
            rule: rule.replace(/\*\*/g, ''),
            why: why.trim(),
            enforcement: enforcement.trim(),
            // Add specific ESLint-friendly messages
            eslintMessage: generateESLintMessage(rule, why),
          };
        }
      }
    }

    // Add specific rule configurations
    rules['no_process_env'] = {
      rule: 'No direct process.env access',
      why: 'Prevents environment variable leaks and improves security',
      enforcement: 'Use import { env } from "@/config" instead',
      eslintMessage: 'Use import { env } from "@/config" instead of direct process.env access',
    };

    rules['no_deep_imports'] = {
      rule: 'Use barrel imports only',
      why: 'Maintains clean dependency graph and easier refactoring',
      enforcement: 'Import from @/components/ui/atoms, @/components/ui/components/ui/components/ui/molecules/info-panel, @/organisms',
      eslintMessage: 'Use barrel imports (@/components/ui/atoms, @/components/ui/components/ui/components/ui/molecules/info-panel, @/organisms) instead of deep paths',
    };

    rules['design_tokens_only'] = {
      rule: 'Design tokens only',
      why: 'Consistent theming and dark mode support',
      enforcement: 'Use CSS custom properties and variants',
      eslintMessage: 'Use design tokens and variants instead of raw CSS values',
    };

    rules['tenant_isolation_first'] = {
      rule: 'Secure query validation',
      why: 'Prevent SQL injection and validate query safety',
      enforcement: 'All queries must use parameterized statements',
      eslintMessage: 'Ensure query safety - all database queries must be parameterized',
    };

    return rules;
  } catch (error) {
    logger.error('❌ Error extracting rules:', error);
    throw error;
  }
}

function generateESLintMessage(rule: string, why: string): string {
  const cleanRule = rule.replace(/\*\*/g, '').toLowerCase();

  if (cleanRule.includes('process.env')) {
    return 'Use import { env } from "@/config" instead of direct process.env access';
  }

  if (cleanRule.includes('barrel')) {
    return 'Use barrel imports (@/components/ui/atoms, @/molecules, @/organisms) instead of deep paths';
  }

  if (cleanRule.includes('design token')) {
    return 'Use design tokens and variants instead of raw CSS values';
  }

  if (cleanRule.includes('tenant')) {
    return 'Ensure tenant isolation - all database queries must be org-scoped';
  }

  return `${rule.replace(/\*\*/g, '')}: ${why}`;
}

async function extractRulesFromSecurityMd(): Promise<Rules> {
  try {
    logger.info('🔒 Extracting security rules from lib/security/README.md...');

    const securityPath = 'lib/security/README.md';
    const content = await fs.readFile(securityPath, 'utf8');

    const securityRules: Rules = {};

    // Extract security patterns
    const patterns = [
      {
        pattern: /rate limiting/gi,
        rule: 'rate_limiting_required',
        message: 'All API endpoints must implement rate limiting',
      },
      {
        pattern: /webhook.*signature/gi,
        rule: 'webhook_signature_verification',
        message: 'All webhooks must verify signatures before processing',
      },
      {
        pattern: /parameterized.*query/gi,
        rule: 'sql_parameterization_required',
        message: 'All database queries must use parameterized statements',
      },
      {
        pattern: /prompt.*injection/gi,
        rule: 'ai_prompt_security',
        message: 'AI prompts must be validated for injection attacks',
      },
    ];

    for (const { pattern, rule, message } of patterns) {
      if (pattern.test(content)) {
        securityRules[rule] = {
          rule: rule.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          why: 'Security requirement',
          enforcement: 'Automatic validation',
          eslintMessage: message,
        };
      }
    }

    return securityRules;
  } catch (error) {
    logger.warn(`⚠️  Could not extract security rules: ${error instanceof Error ? error.message : String(error)}`);
    return {};
  }
}

async function extractAndSaveRules() {
  try {
    logger.info('🔄 Extracting documentation rules...');

    // Extract rules from different sources
    const [bestPracticesRules, securityRules] = await Promise.all([
      extractRulesFromBestPractices(),
      extractRulesFromSecurityMd(),
    ]);

    // Combine all rules
    const allRules = {
      ...bestPracticesRules,
      ...securityRules,
      metadata: {
        generated: new Date().toISOString(),
        source: 'docs/best-practices.md, lib/security/README.md',
        version: '1.0.0',
      },
    };

    // Save to JSON file
    const outputPath = 'docs/guardrails.json';
    await fs.writeFile(outputPath, JSON.stringify(allRules, null, 2));

    logger.info(`✅ Rules extracted and saved to ${outputPath}`);
    logger.info(`📊 Extracted ${Object.keys(allRules).length - 1} rules`);

    // Also save to a location accessible by ESLint
    const eslintOutputPath = 'eslint-plugin-corso/guardrails.json';

    try {
      await fs.writeFile(eslintOutputPath, JSON.stringify(allRules, null, 2));
      logger.info(`✅ Rules also saved for ESLint at ${eslintOutputPath}`);
    } catch (error) {
      logger.warn(`⚠️  Could not save rules for ESLint: ${error instanceof Error ? error.message : String(error)}`);
    }

    return allRules;
  } catch (error) {
    logger.error('❌ Error extracting and saving rules:', error);
    process.exit(1);
  }
}

void extractAndSaveRules();

