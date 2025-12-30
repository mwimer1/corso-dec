#!/usr/bin/env tsx

/**
 * Domain Scaffolder
 *
 * Creates a new domain with standardized structure, barrels, and documentation.
 * Non-interactive - requires explicit flags for all configuration.
 *
 * Usage:
 *   pnpm scaffold:domain --name <domain> [--mixed] [--server-only] [--force]
 *
 * Examples:
 *   pnpm scaffold:domain --name notifications --mixed
 *   pnpm scaffold:domain --name reports --server-only
 *   pnpm scaffold:domain --name utils --force
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

interface ScaffoldOptions {
  name: string;
  mixed: boolean;
  serverOnly: boolean;
  force: boolean;
}

function parseArgs(): ScaffoldOptions {
  const args: string[] = process.argv.slice(2);
  const options: ScaffoldOptions = {
    name: '',
    mixed: false,
    serverOnly: false,
    force: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i] ?? '';
    if (!arg) continue;
    switch (arg) {
      case '--name':
        options.name = args[++i] ?? '';
        break;
      case '--mixed':
        options.mixed = true;
        break;
      case '--server-only':
        options.serverOnly = true;
        break;
      case '--force':
        options.force = true;
        break;
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  if (!options.name) {
    console.error('Error: --name is required');
    showUsage();
    process.exit(1);
  }

  if (options.mixed && options.serverOnly) {
    console.error('Error: Cannot specify both --mixed and --server-only');
    process.exit(1);
  }

  return options;
}

function showUsage(): void {
  console.log(`
Usage: pnpm scaffold:domain --name <domain> [options]

Options:
  --name <domain>     Domain name (required)
  --mixed             Create mixed domain with client and server exports
  --server-only       Create server-only domain
  --force             Overwrite existing files

Examples:
  pnpm scaffold:domain --name notifications --mixed
  pnpm scaffold:domain --name reports --server-only
  pnpm scaffold:domain --name utils
`);
}

function validateDomainName(name: string): void {
  if (!/^[a-z][a-z0-9]*$/.test(name)) {
    console.error(`Error: Domain name '${name}' must be lowercase alphanumeric, starting with a letter`);
    process.exit(1);
  }

  if (name.includes('-')) {
    console.warn(`Warning: Domain name '${name}' contains hyphens. Consider using camelCase for consistency.`);
  }
}

function createDirectory(path: string, force: boolean): void {
  if (existsSync(path) && !force) {
    console.error(`Error: Directory ${path} already exists. Use --force to overwrite.`);
    process.exit(1);
  }

  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function createDomainStructure(options: ScaffoldOptions): void {
  const { name, mixed, serverOnly, force } = options;
  const domainPath = join('lib', name);
  const validatorsPath = join('lib', 'validators', name);
  const typesPath = join('types', 'validators', name);

  console.log(`Creating domain: ${name}`);
  console.log(`Type: ${serverOnly ? 'Server-only' : mixed ? 'Mixed' : 'Client-safe'}`);

  // Create directories
  createDirectory(domainPath, force);
  createDirectory(validatorsPath, force);
  createDirectory(typesPath, force);

  // Create domain files
  createIndexFile(domainPath, name, mixed, serverOnly, force);
  if (mixed || serverOnly) {
    createServerFile(domainPath, name, force);
  }
  createReadmeFile(domainPath, name, mixed, serverOnly, force);

  // Create validator files
  createValidatorIndex(validatorsPath, name, force);
  createValidatorSchemas(validatorsPath, name, force);

  // Create type files
  createTypesIndex(typesPath, name, force);

  console.log(`✅ Domain ${name} scaffolded successfully!`);
  console.log(`📝 Remember to:`);
  console.log(`   - Update docs/architecture/domain-driven.md if this is a new pattern`);
  console.log(`   - Run 'pnpm agent:indexes' to update barrel indexes`);
  console.log(`   - Add tests in tests/unit/lib/${name}/`);
  console.log(`   - Update any relevant documentation`);
}

function createIndexFile(domainPath: string, name: string, mixed: boolean, serverOnly: boolean, force: boolean): void {
  const indexPath = join(domainPath, 'index.ts');

  if (existsSync(indexPath) && !force) {
    console.log(`Skipping existing index.ts`);
    return;
  }

  let content = `/**
 * @fileoverview ${name} Domain - ${serverOnly ? 'Server-only' : mixed ? 'Mixed' : 'Client-safe'} exports
 * @module lib/${name}
 */

`;

  if (serverOnly) {
    content += `'use server';

// Server-only utilities and functions
// TODO: Add domain-specific server exports here

export const ${name}Status = 'active' as const;
`;
  } else if (mixed) {
    content += `// Client-safe utilities and types
// Server-only exports available in './server'

// TODO: Add client-safe exports here
export type ${name.charAt(0).toUpperCase() + name.slice(1)}Config = {
  enabled: boolean;
};
`;
  } else {
    content += `// Client-safe utilities and types
// TODO: Add client-safe exports here

export const ${name}Version = '1.0.0' as const;
`;
  }

  writeFileSync(indexPath, content);
  console.log(`Created ${indexPath}`);
}

function createServerFile(domainPath: string, name: string, force: boolean): void {
  const serverPath = join(domainPath, 'server.ts');

  if (existsSync(serverPath) && !force) {
    console.log(`Skipping existing server.ts`);
    return;
  }

  const content = `'use server';

/**
 * @fileoverview ${name} Domain - Server-only exports
 * @module lib/${name}/server
 */

// Server-only utilities and functions
// TODO: Add server-specific exports here

export async function ${name}ServerOperation(): Promise<void> {
  // TODO: Implement server operation
}
`;

  writeFileSync(serverPath, content);
  console.log(`Created ${serverPath}`);
}

function createReadmeFile(domainPath: string, name: string, mixed: boolean, serverOnly: boolean, force: boolean): void {
  const readmePath = join(domainPath, 'README.md');

  if (existsSync(readmePath) && !force) {
    console.log(`Skipping existing README.md`);
    return;
  }

  const runtime = serverOnly ? 'server' : mixed ? 'mixed' : 'client';
  const title = name.charAt(0).toUpperCase() + name.slice(1);

  let content = `---
title: "${title} Domain (\`lib/${name}\`)"
description: "${title} domain providing [brief description of functionality]."
last_updated: 2025-09-12
owner: "platform-team@corso"
category: "domain"
runtime: "${runtime}"
---

# ${title} Domain

## Overview

The ${name} domain provides [brief description of what this domain does].

### Key Responsibilities
- [Primary responsibility 1]
- [Primary responsibility 2]
- [Primary responsibility 3]

## Directory Structure

\`\`\`
lib/${name}/
├── index.ts                    # ${serverOnly ? 'Server-only' : mixed ? 'Client-safe' : 'Main'} barrel exports
${mixed || serverOnly ? `├── server.ts                   # Server-only barrel exports
` : ''}├── README.md                   # This documentation
└── *.ts                       # Implementation files
\`\`\`

## Public API

### ${serverOnly ? 'Server-Only' : mixed ? 'Client-Safe' : 'Main'} Exports (\`@/lib/${name}\`)

| Export | Purpose | Type |
|--------|---------|------|
| \`${name}Status\` | Domain status indicator | Constant |
| \`TODO\` | Add actual exports here | TODO |

${mixed ? `
### Server-Only Exports (\`@/lib/${name}/server\`)

| Export | Purpose | Type |
|--------|---------|------|
| \`${name}ServerOperation\` | Server-side operation | Function |
| \`TODO\` | Add server exports here | TODO |
` : ''}

## Usage Examples

${!serverOnly ? `
### Client Usage
\`\`\`typescript
import { ${name}Version } from '@/lib/${name}';

// Use in client components
console.log('Version:', ${name}Version);
\`\`\`
` : ''}

### Server Usage
\`\`\`typescript
${mixed ? `import { ${name}ServerOperation } from '@/lib/${name}/server';` : `import { ${name}Status } from '@/lib/${name}';`}

${mixed ? `await ${name}ServerOperation();` : `console.log('Status:', ${name}Status);`}
\`\`\`

## Environment Variables

### Required Variables
| Variable | Purpose | Default |
|----------|---------|---------|
| \`TODO\` | Add required env vars | N/A |

## Related Documentation

- [Domain-Driven Architecture](../../docs/architecture/domain-driven.md)
- [Import Patterns](../../docs/codebase/import-patterns.md)

---

*Generated by domain scaffolder. Customize this template for your domain's specific needs.*

**Last updated:** 2025-09-12
**Owner:** platform-team@corso
`;

  writeFileSync(readmePath, content);
  console.log(`Created ${readmePath}`);
}

function createValidatorIndex(validatorsPath: string, name: string, force: boolean): void {
  const indexPath = join(validatorsPath, 'index.ts');

  if (existsSync(indexPath) && !force) {
    console.log(`Skipping existing validators index.ts`);
    return;
  }

  const content = `/**
 * @fileoverview ${name} Domain Validators
 * @module lib/validators/${name}
 */

import { z } from 'zod';

// TODO: Add domain-specific validation schemas
export const ${name}Schema = z.object({
  // TODO: Define validation schema
  id: z.string().min(1, '${name} ID is required'),
});

// Export validation functions
export function validate${name.charAt(0).toUpperCase() + name.slice(1)}Input(input: unknown) {
  return ${name}Schema.parse(input);
}
`;

  writeFileSync(indexPath, content);
  console.log(`Created ${indexPath}`);
}

function createValidatorSchemas(validatorsPath: string, name: string, force: boolean): void {
  const schemasPath = join(validatorsPath, 'schemas.ts');

  if (existsSync(schemasPath) && !force) {
    console.log(`Skipping existing validators schemas.ts`);
    return;
  }

  const content = `/**
 * @fileoverview ${name} Domain Validation Schemas
 * @module lib/validators/${name}/schemas
 */

import { z } from 'zod';

// TODO: Define comprehensive validation schemas for ${name} domain
export const base${name.charAt(0).toUpperCase() + name.slice(1)}Schema = z.object({
  id: z.string().uuid('${name} ID must be a valid UUID'),
  name: z.string().min(1, '${name} name is required').max(100, '${name} name too long'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const create${name.charAt(0).toUpperCase() + name.slice(1)}Schema = base${name.charAt(0).toUpperCase() + name.slice(1)}Schema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const update${name.charAt(0).toUpperCase() + name.slice(1)}Schema = base${name.charAt(0).toUpperCase() + name.slice(1)}Schema.partial().omit({
  createdAt: true,
});
`;

  writeFileSync(schemasPath, content);
  console.log(`Created ${schemasPath}`);
}

function createTypesIndex(typesPath: string, name: string, force: boolean): void {
  const indexPath = join(typesPath, 'index.ts');

  if (existsSync(indexPath) && !force) {
    console.log(`Skipping existing types index.ts`);
    return;
  }

  const content = `/**
 * @fileoverview ${name} Domain Type Definitions
 * @module types/shared/validation/types (for validation types) or domain-specific type files
 */

// TODO: Import and re-export inferred types from validators
// export type { Create${name.charAt(0).toUpperCase() + name.slice(1)}, Update${name.charAt(0).toUpperCase() + name.slice(1)} } from '@/lib/validators/${name}/schemas';

// Placeholder types - replace with actual inferred types
export type ${name.charAt(0).toUpperCase() + name.slice(1)}Entity = {
  id: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Create${name.charAt(0).toUpperCase() + name.slice(1)}Input = Omit<${name.charAt(0).toUpperCase() + name.slice(1)}Entity, 'id' | 'createdAt' | 'updatedAt'>;

export type Update${name.charAt(0).toUpperCase() + name.slice(1)}Input = Partial<Create${name.charAt(0).toUpperCase() + name.slice(1)}Input>;
`;

  writeFileSync(indexPath, content);
  console.log(`Created ${indexPath}`);
}

function updateAgentIndexes(): void {
  try {
    console.log('Updating agent barrel indexes...');
    execSync('pnpm agent:indexes', { stdio: 'inherit' });
    console.log('✅ Agent indexes updated');
  } catch (error) {
    const msg = (error as any)?.message ?? String(error);
    console.warn('⚠️  Failed to update agent indexes:', msg);
    console.warn('Run "pnpm agent:indexes" manually after scaffolding');
  }
}

function main(): void {
  const options = parseArgs();

  validateDomainName(options.name);

  createDomainStructure(options);

  updateAgentIndexes();

  console.log(`
🎉 Domain scaffolding complete!

Next steps:
1. Customize the generated files for your domain's specific needs
2. Add implementation logic to the TODO placeholders
3. Create tests in tests/unit/lib/${options.name}/
4. Update this README with accurate API documentation
5. Run "pnpm guard:structure" to validate the new domain structure
`);
}

// Check if this is the main module (ES module equivalent of require.main === module)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as scaffoldDomain };

