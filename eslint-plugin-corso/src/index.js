// Basic ESLint plugin for Corso with boundary enforcement
import fs from 'node:fs';
import path from 'node:path';
export default {
  rules: {
    'no-cross-domain-imports': {
      meta: {
        schema: [
          {
            type: 'object',
            properties: {
              configPath: { type: 'string' },
              allowList: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            additionalProperties: false
          }
        ]
      },
      create(context) {
        const options = context.options?.[0] ?? {};
        const configPath = options.configPath || 'eslint-plugin-corso/rules/domain-config.json';

        // Lightweight domain deep-import/public-surface enforcement also catches most cross-domain misuse
        let domainConfig = {};
        try {
          // Resolve relative to project root
          const absPath = path.isAbsolute(configPath) ? configPath : path.join(process.cwd(), configPath);
          const raw = fs.readFileSync(absPath, 'utf8');
          domainConfig = JSON.parse(raw)?.domains ?? {};
        } catch {
          // If config cannot be read, do not crash ESLint – simply skip enforcement
          domainConfig = {};
        }

        function isAliasImport(importPath, domain) {
          return typeof importPath === 'string' && importPath.startsWith(`@/${domain}`);
        }

        function isAllowedSurface(importPath, domain, publicSurface) {
          if (importPath === `@/${domain}` || importPath === `@/${domain}/index`) return true;
          return publicSurface?.some((segment) => importPath === `@/${domain}/${segment}` || importPath.startsWith(`@/${domain}/${segment}/`));
        }

        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;
            if (typeof importPath !== 'string') return;

            for (const [domain, cfg] of Object.entries(domainConfig)) {
              if (!isAliasImport(importPath, domain)) continue;

              const allowDeep = !!cfg.allowDeepImports;
              const publicSurface = Array.isArray(cfg.publicSurface) ? cfg.publicSurface : [];

              if (!allowDeep && !isAllowedSurface(importPath, domain, publicSurface)) {
                context.report({
                  node: node.source,
                  message: `Deep or cross-domain import detected into "${domain}". Allowed public surfaces: ${publicSurface.length ? publicSurface.join(', ') : 'index only'}. Use the domain barrel instead (e.g., @/${domain}).`,
                });
              }
            }
          },
        };
      },
    },
    'no-deep-imports': {
      meta: {
        schema: [
          {
            type: 'object',
            properties: {
              configPath: { type: 'string' }
            },
            additionalProperties: false
          }
        ]
      },
      create(context) {
        const options = context.options?.[0] ?? {};
        const configPath = options.configPath || 'eslint-plugin-corso/rules/domain-config.json';

        let domainConfig = {};
        try {
          const absPath = path.isAbsolute(configPath) ? configPath : path.join(process.cwd(), configPath);
          const raw = fs.readFileSync(absPath, 'utf8');
          domainConfig = JSON.parse(raw)?.domains ?? {};
        } catch {
          domainConfig = {};
        }

        function isAliasImport(importPath, domain) {
          return typeof importPath === 'string' && importPath.startsWith(`@/${domain}`);
        }

        function isAllowedSurface(importPath, domain, publicSurface) {
          if (importPath === `@/${domain}` || importPath === `@/${domain}/index`) return true;
          return publicSurface?.some((segment) => importPath === `@/${domain}/${segment}` || importPath.startsWith(`@/${domain}/${segment}/`));
        }

        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;
            if (typeof importPath !== 'string') return;

            for (const [domain, cfg] of Object.entries(domainConfig)) {
              if (!isAliasImport(importPath, domain)) continue;

              const allowDeep = !!cfg.allowDeepImports;
              const publicSurface = Array.isArray(cfg.publicSurface) ? cfg.publicSurface : [];

              if (!allowDeep && !isAllowedSurface(importPath, domain, publicSurface)) {
                context.report({
                  node: node.source,
                  message: `Deep import into "${domain}" is disallowed. Allowed public surfaces: ${publicSurface.length ? publicSurface.join(', ') : 'index only'}.`,
                });
              }
            }
          },
        };
      },
    },
    'no-client-apis-in-server-components': {
      create(context) {
        const filename = context.getFilename();
        if (/[/\\](tests?|__tests__|scripts)[/\\]/.test(filename) || /\.(spec|test)\.[tj]sx?$/.test(filename)) {
          return {};
        }
        const source = context.getSourceCode();
        const ast = source.ast;
        const hasUseClient = ast.body.some(
          (s) => s.type === 'ExpressionStatement' && s.expression.type === 'Literal' && s.expression.value === 'use client'
        );
        const hasClientOnlyImport = ast.body.some(
          (s) => s.type === 'ImportDeclaration' && s.source.value === 'client-only'
        );

        if (hasUseClient || hasClientOnlyImport) {
          return {};
        }

        const CLIENT_GLOBALS = new Set(['window', 'document', 'localStorage', 'sessionStorage']);

        return {
          MemberExpression(node) {
            if (node.object && node.object.type === 'Identifier' && CLIENT_GLOBALS.has(node.object.name)) {
              context.report({ node, message: `Client API '${node.object.name}' used in server component. Add 'use client' directive or refactor.` });
            }
          },
          Identifier(node) {
            if (!CLIENT_GLOBALS.has(node.name)) return;
            const parent = node.parent;
            // Ignore typeof window/document checks
            if (parent && parent.type === 'UnaryExpression' && parent.operator === 'typeof') return;
            // Ignore when used as property in MemberExpression (handled by MemberExpression visitor)
            if (parent && parent.type === 'MemberExpression' && parent.property === node) return;
            context.report({ node, message: `Client API '${node.name}' used in server component. Add 'use client' directive or refactor.` });
          }
        };
      }
    },
    'no-client-logger-import': {
      create(context) {
        const source = context.getSourceCode();
        const ast = source.ast;
        const hasUseClient = ast.body.some(
          (s) => s.type === 'ExpressionStatement' && s.expression.type === 'Literal' && s.expression.value === 'use client'
        );

        return {
          ImportDeclaration(node) {
            if (!hasUseClient) return;

            const importPath = node.source && node.source.value;
            if (importPath === '@/lib/monitoring') {
              context.report({ node: node.source, message: "Client components must not import '@/lib/monitoring'. Use clientLogger from '@/lib/shared' instead." });
              return;
            }

            for (const spec of node.specifiers || []) {
              if (spec.type === 'ImportDefaultSpecifier' && spec.local && spec.local.name === 'logger') {
                context.report({ node: spec, message: "Default import 'logger' is not allowed in client components; use clientLogger from '@/lib/shared'." });
              }
              if (spec.type === 'ImportSpecifier' && spec.imported && spec.imported.name === 'logger') {
                context.report({ node: spec, message: "Named import 'logger' is not allowed in client components; use clientLogger from '@/lib/shared'." });
              }
            }
          },
        };
      }
    },
    'require-client-directive-for-client-code': {
      create(context) {
        const filename = context.getFilename();
        if (/[/\\](tests?|__tests__|scripts)[/\\]/.test(filename) || /\.(spec|test)\.[tj]sx?$/.test(filename)) {
          return {};
        }
        const source = context.getSourceCode();
        const ast = source.ast;
        const hasUseClient = ast.body.some(
          (s) => s.type === 'ExpressionStatement' && s.expression.type === 'Literal' && s.expression.value === 'use client'
        );
        const hasClientOnlyImport = ast.body.some(
          (s) => s.type === 'ImportDeclaration' && s.source.value === 'client-only'
        );

        if (hasUseClient || hasClientOnlyImport) {
          return {};
        }

        let hasReactHook = false;
        const HOOK_NAMES = new Set([
          'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useReducer', 'useContext', 'useSyncExternalStore', 'useLayoutEffect'
        ]);

        return {
          CallExpression(node) {
            const callee = node.callee;
            if (callee && callee.type === 'Identifier') {
              if (HOOK_NAMES.has(callee.name) || callee.name.startsWith('use')) {
                hasReactHook = true;
              }
            }
          },
          'Program:exit'(node) {
            if (hasReactHook) {
              context.report({ node, message: 'Interactive JSX or React hook detected without \'use client\' directive.' });
            }
          }
        };
      }
    },
    'no-mixed-runtime-exports': {
      create(context) {
        const serverExports = new Set();
        const clientExports = new Set();

        return {
          ExportNamedDeclaration(node) {
            if (node.source) {
              const exportPath = node.source.value;
              if (typeof exportPath === 'string') {
                if (exportPath.includes('.server.')) {
                  serverExports.add(exportPath);
                } else if (exportPath.includes('.client.')) {
                  clientExports.add(exportPath);
                }
              }
            }
          },
          'Program:exit'() {
            if (serverExports.size > 0 && clientExports.size > 0) {
              context.report({
                node: context.getSourceCode().ast,
                message: 'Mixed client/server re-exports detected. Separate client and server exports.'
              });
            }
          }
        };
      }
    },
    'use-server-directive': {
      create() {
        return {
          Program(_node) {
            // Basic stub - no-op for now
          }
        };
      }
    },
    'enforce-action-validation': {
      create() {
        return {
          FunctionDeclaration(_node) {
            // Basic stub - no-op for now
          }
        };
      }
    },
    'require-action-readme': {
      create() {
        return {
          Program(_node) {
            // Basic stub - no-op for now
          }
        };
      }
    },
    'no-root-lib-imports': {
      create(context) {
        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;
            if (typeof importPath === 'string' && importPath.startsWith('@/lib/') && !importPath.includes('/')) {
              context.report({
                node: node.source,
                message: 'Direct import from @/lib/ root. Use specific subpaths (e.g., @/lib/shared/env).'
              });
            }
          }
        };
      }
    },
    'legacy-shared-import': {
      create(context) {
        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;
            if (typeof importPath === 'string' && importPath === '@/lib/shared') {
              context.report({
                node: node.source,
                message: 'Legacy @/lib/shared import. Use specific subpaths (e.g., @/lib/shared/env, @/lib/shared/analytics).'
              });
            }
          }
        };
      }
    },
    'no-lib-imports-in-types': {
      create(context) {
        const filename = context.getFilename();
        if (!filename.includes('/types/')) return {};

        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;
            if (typeof importPath === 'string' && importPath.startsWith('@/lib/')) {
              context.report({
                node: node.source,
                message: 'Type files should not import from @/lib/. Move logic to appropriate domain.'
              });
            }
          }
        };
      }
    },

    // New rule for server-only directive enforcement
    'require-server-only-directive': {
      create(context) {
        const filename = context.getFilename();
        const isServerFile = filename.includes('/server/') ||
                           filename.includes('/app/') ||
                           filename.includes('/lib/') ||
                           filename.includes('/scripts/');

        if (!isServerFile) return {};

        return {
          Program(node) {
            const hasServerOnly = node.body.some(
              (statement) =>
                statement.type === 'ImportDeclaration' &&
                statement.source.value === 'server-only'
            );

            if (!hasServerOnly) {
              context.report({
                node,
                message: 'Server files must import \'server-only\' to prevent client-side imports.'
              });
            }
          }
        };
      }
    },

    // New rule for security barrel usage
    'no-security-barrel-in-client': {
      create(context) {
        return {
          Program(node) {
            const hasUseClient = node.body.some(
              (statement) =>
                statement.type === 'ExpressionStatement' &&
                statement.expression.type === 'Literal' &&
                statement.expression.value === 'use client'
            );

            if (hasUseClient) return {};
          },
          ImportDeclaration(node) {
            const importPath = node.source.value;
            if (typeof importPath === 'string' && importPath === '@/lib/security') {
              context.report({
                node: node.source,
                message: 'Client files must not import @/lib/security barrel. Use specific subpaths.'
              });
            }
          }
        };
      }
    },
    'no-alias-imports-in-tests': {
      create() {
        return {
          ImportDeclaration(_node) {
            // Basic stub - no-op for now
          }
        };
      }
    },
    'no-random-test-directories': {
      create() {
        return {
          ImportDeclaration(_node) {
            // Basic stub - no-op for now
          }
        };
      }
    },
    'require-supabase-scope': {
      create() {
        return {
          ImportDeclaration(_node) {
            // Basic stub - no-op for now
          }
        };
      }
    },
    'storybook-auto-generation': {
      create() {
        return {
          Program(_node) {
            // Basic stub - no-op for now
          }
        };
      }
    },
    // Phase 1 — Import boundaries
    'force-root-imports': {
      meta: { type: 'suggestion', docs: { description: 'Prefer alias imports over long relative paths' }, fixable: 'code' },
      create(context) {
        const filename = context.getFilename();
        const cwd = typeof context.getCwd === 'function' ? context.getCwd() : process.cwd();
        return {
          ImportDeclaration(node) {
            const s = node.source && node.source.value;
            if (typeof s !== 'string') return;
            if (!s.startsWith('./') && !s.startsWith('../')) return;
            try {
              const path = require('node:path');
              const abs = path.normalize(path.resolve(path.dirname(filename), s));
              const relToRoot = path.relative(cwd, abs).replace(/\\/g, '/');
              // Only suggest for app code, not for node_modules or relative that points outside repo
              if (relToRoot.startsWith('..')) return;
              const alias = `@/${relToRoot}`;
              context.report({ node: node.source, message: `Use the alias "${alias}" instead of relative path "${s}".`, fix(fixer) { return fixer.replaceText(node.source, `'${alias}'`); } });
            } catch {}
          }
        };
      }
    },
    'forbid-ui-self-barrel': {
      meta: { type: 'problem', docs: { description: 'Do not import @/components/ui from inside components/ui' } },
      create(context) {
        const file = context.getFilename().replace(/\\/g, '/');
        if (!/\/components\/ui\//.test(file)) return {};
        return {
          ImportDeclaration(node) {
            const s = node.source && node.source.value;
            if (s === '@/components/ui' || s === '@/components/ui/index') {
              context.report({ node: node.source, message: 'Do not import "@/components/ui" from inside components/ui. Import a specific submodule.' });
            }
          }
        };
      }
    },
    'no-underscore-dirs': {
      meta: { type: 'problem', docs: { description: 'Underscore-prefixed directories are forbidden under components/' } },
      create(context) {
        const file = context.getFilename().replace(/\\/g, '/');
        if (/\/components\/.*\/_/.test(file)) {
          return {
            Program(node) { context.report({ node, message: 'Underscore-prefixed directories are forbidden under components/. Rename or remove.' }); }
          };
        }
        return {};
      }
    },
    'no-widgets-from-outside': {
      meta: { type: 'problem', docs: { description: 'components/*/widgets is internal. Import via root barrel; never from outside.' } },
      create(context) {
        const file = context.getFilename().replace(/\\/g, '/');
        const isInsideComponents = /(^|\/)components\//.test(file);
        if (isInsideComponents) return {};
        return {
          ImportDeclaration(node) {
            const s = node.source && node.source.value;
            if (typeof s !== 'string') return;
            if (/^@\/components\/[^/]+\/widgets(\/|$)/.test(s)) {
              context.report({ node: node.source, message: "components/*/widgets is internal. Import via '@/components/<domain>' root barrel." });
            }
          }
        };
      }
    },
    'no-ad-hoc-navbars': {
      meta: { type: 'suggestion', docs: { description: 'Prefer shared Navbar; avoid ad-hoc navbar implementations' } },
      create(context) {
        const file = context.getFilename().replace(/\\/g, '/');
        const isNavbarFile = /components\/(landing|marketing)\/.*\/navbar.*\.tsx$/.test(file);
        if (!isNavbarFile) return {};
        let hasSharedNavbar = false;
        let hasNavItem = false;
        return {
          ImportDeclaration(node) {
            const s = node.source && node.source.value;
            if (s === '@/components/ui/organisms') hasSharedNavbar = true;
            if (s === '@/components/ui/molecules') hasNavItem = true;
          },
          'Program:exit'(node) {
            if (!hasSharedNavbar && !hasNavItem) {
              context.report({ node, message: 'Ad-hoc navbar detected. Use shared Navbar from @/components/ui/organisms.' });
            }
          }
        };
      }
    },

    // Phase 2 — Runtime boundaries
    'no-server-in-client': {
      meta: { type: 'problem', docs: { description: 'Disallow server-only modules and Node builtins in client files' } },
      create(context) {
        const source = context.getSourceCode();
        const hasUseClient = source.ast.body.some(
          (s) => s.type === 'ExpressionStatement' && s.expression.type === 'Literal' && s.expression.value === 'use client'
        );
        if (!hasUseClient) return {};
        const nodeBuiltins = new Set(['fs','path','crypto','os','child_process','net','tls','stream','zlib','http','https']);
        return {
          ImportDeclaration(node) {
            const s = node.source && node.source.value;
            if (typeof s !== 'string') return;
            if (nodeBuiltins.has(s) || s.startsWith('node:')) {
              context.report({ node: node.source, message: `Node builtin cannot be used in client code: "${s}"` });
              return;
            }
            if (/\/server\//.test(s) || /\.server(\.|$)/.test(s) || s === '@clerk/nextjs/server' || /^next\/(headers|server|cache)$/.test(s)) {
              context.report({ node: node.source, message: `Server-only module cannot be imported in client code: ${s}` });
            }
          }
        };
      }
    },
    'no-server-in-edge': {
      meta: { type: 'problem', docs: { description: 'Disallow server-only modules and Node builtins in Edge runtime files' } },
      create(context) {
        const source = context.getSourceCode();
        const isEdge = source.text.includes("export const runtime = 'edge'") || source.text.includes('export const runtime = "edge"');
        if (!isEdge) return {};
        const nodeBuiltins = new Set(['fs','path','crypto','os','child_process','net','tls','stream','zlib','http','https']);
        return {
          ImportDeclaration(node) {
            const s = node.source && node.source.value;
            if (typeof s !== 'string') return;
            if (nodeBuiltins.has(s) || s.startsWith('node:')) {
              context.report({ node: node.source, message: `Node builtin cannot be used in Edge runtime: "${s}"` });
              return;
            }
            if (s.startsWith('@/lib/server') || s === '@clickhouse/client') {
              context.report({ node: node.source, message: `Edge runtime must not import server-only module: ${s}` });
            }
          }
        };
      }
    },
    'forbid-security-barrel-in-client-or-edge': {
      meta: { type: 'problem', docs: { description: 'Disallow @/lib/security barrel in client or edge files' } },
      create(context) {
        const source = context.getSourceCode();
        const isClient = source.ast.body.some((s) => s.type === 'ExpressionStatement' && s.expression.type === 'Literal' && s.expression.value === 'use client');
        const isEdge = source.text.includes("export const runtime = 'edge'") || source.text.includes('export const runtime = "edge"');
        if (!isClient && !isEdge) return {};
        return {
          ImportDeclaration(node) {
            const s = node.source && node.source.value;
            if (s === '@/lib/security') {
              context.report({ node: node.source, message: 'Client/Edge files must not import @/lib/security barrel. Use specific subpaths.' });
            }
          }
        };
      }
    },
    'no-server-only-directive-in-shared': {
      meta: { type: 'problem', docs: { description: "Use 'server-only' only in server-dedicated modules (lib/server/** or app/**)" } },
      create(context) {
        const file = context.getFilename().replace(/\\/g, '/');
        const allowed = /(^|\/)lib\/server\//.test(file) || /(^|\/)app\//.test(file);
        if (allowed) return {};
        return {
          ImportDeclaration(node) {
            const s = node.source && node.source.value;
            if (s === 'server-only') {
              context.report({ node: node.source, message: "Use 'server-only' only in lib/server/** or app/**." });
            }
          }
        };
      }
    },
    'dashboard-import-guard': {
      meta: { type: 'problem', docs: { description: 'Guard dashboard server imports in client and block legacy dashboard chat paths' } },
      create(context) {
        const source = context.getSourceCode();
        const isClient = source.ast.body.some((s) => s.type === 'ExpressionStatement' && s.expression.type === 'Literal' && s.expression.value === 'use client');
        return {
          ImportDeclaration(node) {
            const s = node.source && node.source.value;
            if (typeof s !== 'string') return;
            if (isClient && s === '@/lib/server/dashboard') {
              context.report({ node: node.source, message: "Client files must not import the dashboard server barrel ('@/lib/server/dashboard')." });
            }
            if (/^@\/components\/dashboard\/chat\/(full|shared)\//.test(s)) {
              context.report({ node: node.source, message: "Chat components have been removed from the MVP codebase. Use table-based UI instead." });
            }
          }
        };
      }
    },

    // Phase 3 — API/fetch rules + Next <Script> nonce
    'no-raw-internal-fetch': {
      meta: { type: 'suggestion', docs: { description: 'Use lib/api wrappers instead of raw fetch to internal /api routes' }, fixable: 'code' },
      create(context) {
        return {
          CallExpression(node) {
            try {
              if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'fetch') {
                const arg = node.arguments?.[0];
                if (arg && arg.type === 'Literal' && typeof arg.value === 'string' && arg.value.startsWith('/api/')) {
                  const src = context.getSourceCode();
                  context.report({ node: arg, message: 'Use "@/lib/api/http" wrapper instead of raw fetch to internal API.', fix(fixer) {
                    // naive transform: http.get('/api/...')
                    return fixer.replaceTextRange([node.range[0], node.range[1]], `http.get(${src.getText(arg)})`);
                  }});
                }
              }
            } catch {}
          }
        };
      }
    },
    'ensure-api-wrappers': {
      meta: { type: 'suggestion', docs: { description: 'Prefer internal API client wrappers over axios/http for app code' } },
      create(context) {
        const file = context.getFilename().replace(/\\/g, '/');
        const isIgnored = /lib\/.*\/api(-client)?\.ts$/.test(file) || /lib\/.*\/api\//.test(file) || /scripts\//.test(file) || /tests?\//.test(file);
        if (isIgnored) return {};
        return {
          CallExpression(node) {
            const callee = node.callee;
            if (callee.type === 'Identifier' && callee.name === 'axios') {
              context.report({ node: callee, message: 'Use internal API wrappers instead of axios in app code.' });
            }
            if (callee.type === 'MemberExpression' && callee.object && callee.object.type === 'Identifier') {
              const obj = callee.object.name;
              if (obj === 'http' || obj === 'https') {
                context.report({ node: callee, message: 'Use internal API wrappers instead of http/https in app code.' });
              }
            }
          }
        };
      }
    },
    'next-script-no-empty-nonce': {
      meta: { type: 'problem', docs: { description: 'Avoid passing empty nonce to <Script>' } },
      create(context) {
        return {
          JSXOpeningElement(node) {
            const name = node.name && (node.name.name || (node.name.property && node.name.property.name));
            if (name !== 'Script') return;
            const attr = (node.attributes || []).find((a) => a.type === 'JSXAttribute' && a.name && a.name.name === 'nonce');
            if (!attr || !attr.value) return;
            if (attr.value.type === 'Literal' && attr.value.value === '') {
              context.report({ node: attr, message: 'Avoid empty nonce on <Script>; use conditional spread instead.' });
              return;
            }
            if (attr.value.type === 'JSXExpressionContainer') {
              const src = context.getSourceCode().getText(attr.value.expression);
              if (/^''$/.test(src) || /(\?|\|\|)\s*''\s*\}?$/.test(src)) {
                context.report({ node: attr, message: 'Avoid empty/constant nonce on <Script>; use conditional spread instead.' });
              }
            }
          }
        };
      }
    },
    'no-edge-runtime-on-pages': {
      meta: { type: 'problem', docs: { description: 'Disallow Edge runtime in pages/layouts (use default runtime for SSG/ISR)' } },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        if (!/app\/.*\/(page|layout)\.tsx$/.test(filename)) return {};
        return {
          Program(node) {
            const source = context.getSourceCode();
            if (/export\s+const\s+runtime\s*=\s*['"]edge['"]/.test(source.text)) {
              context.report({ node, message: 'Pages/layouts must not specify runtime="edge". Use default (node) runtime.' });
            }
          }
        };
      }
    },
    // CTA-focused rules ported from scripts/rules/ast-grep/cta
    'cta-require-linktrack-or-tracking': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Require LinkTrack or trackNavClick for landing CTAs',
        },
      },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        if (!/components\/landing\//.test(filename)) return {};

        return {
          JSXOpeningElement(node) {
            try {
              const name = node.name && (node.name.name || (node.name.property && node.name.property.name));
              if (!name) return;
              if (name === 'Link' || name === 'a') {
                // check ancestors for LinkTrack
                let parent = node.parent;
                while (parent) {
                  if (parent.type === 'JSXElement' && parent.openingElement && parent.openingElement.name) {
                    const pName = parent.openingElement.name.name || (parent.openingElement.name.property && parent.openingElement.name.property.name);
                    if (pName === 'LinkTrack') return;
                  }
                  parent = parent.parent;
                }

                // check onClick attr for trackNavClick
                const hasTrackedOnClick = (node.attributes || []).some((attr) => {
                  if (!attr || attr.type !== 'JSXAttribute' || !attr.name) return false;
                  if (attr.name.name !== 'onClick') return false;
                  if (!attr.value || attr.value.type !== 'JSXExpressionContainer' || !attr.value.expression) return false;
                  const src = context.getSourceCode().getText(attr.value.expression);
                  return /trackNavClick\s*\(/.test(src);
                });

                if (!hasTrackedOnClick) {
                  context.report({ node, message: 'CTA links in landing should use LinkTrack or call trackNavClick on click.' });
                }
              }
            } catch {
              // noop
            }
          }
        };
      }
    },
    'cta-internal-link-to-link': {
      meta: {
        type: 'suggestion',
        docs: { description: 'Suggest using Next.js <Link> for internal URLs inside <Button asChild>' },
        fixable: 'code'
      },
      create(context) {
        const source = context.getSourceCode();
        return {
          JSXElement(node) {
            try {
              const opening = node.openingElement;
              if (!opening || opening.name.name !== 'Button') return;
              const anchor = (node.children || []).find((c) => c.type === 'JSXElement' && c.openingElement && (c.openingElement.name.name === 'a'));
              if (!anchor) return;
              const hrefAttr = (anchor.openingElement.attributes || []).find(a => a.type === 'JSXAttribute' && a.name && a.name.name === 'href');
              if (!hrefAttr || !hrefAttr.value) return;
              if (hrefAttr.value.type === 'Literal' || hrefAttr.value.type === 'JSXText') {
                const raw = source.getText(hrefAttr.value).replace(/[`\"']/g, '');
                if (/^\//.test(raw)) {
                  context.report({ node: anchor, message: 'Use <Link> for internal URLs inside <Button asChild>', fix(fixer) {
                    const aText = source.getText(anchor);
                    const fixed = aText.replace(/^<a\s+([^>]*)>([\s\S]*)<\/a>$/i, '<Link $1>$2</Link>');
                    return fixer.replaceText(anchor, fixed);
                  }});
                }
              }
            } catch {}
          }
        };
      }
    },
    'cta-external-anchor-hardening': {
      meta: { type: 'problem', docs: { description: 'Ensure external anchors opened in Button asChild have target and rel attributes' }, fixable: 'code' },
      create(context) {
        const source = context.getSourceCode();
        return {
          JSXElement(node) {
            try {
              const opening = node.openingElement;
              if (!opening || opening.name.name !== 'Button') return;
              const anchor = (node.children || []).find((c) => c.type === 'JSXElement' && c.openingElement && c.openingElement.name.name === 'a');
              if (!anchor) return;
              const hrefAttr = (anchor.openingElement.attributes || []).find(a => a.type === 'JSXAttribute' && a.name && a.name.name === 'href');
              if (!hrefAttr || !hrefAttr.value) return;
              const hrefText = source.getText(hrefAttr.value);
              if (!/^"https?:\/\//.test(hrefText) && !/^'https?:\/\//.test(hrefText) && !/^`https?:\/\//.test(hrefText)) return;

              const hasTarget = (anchor.openingElement.attributes || []).some(a => a.type === 'JSXAttribute' && a.name && a.name.name === 'target');
              const hasRel = (anchor.openingElement.attributes || []).some(a => a.type === 'JSXAttribute' && a.name && a.name.name === 'rel');

              if (!hasTarget || !hasRel) {
                context.report({ node: anchor, message: 'External anchor should include target="_blank" and rel="noopener noreferrer"', fix(fixer) {
                  const insertPos = anchor.openingElement.range[1] - 1; // before >
                  const insertText = `${hasTarget ? '' : ' target="_blank"'}${hasRel ? '' : ' rel="noopener noreferrer"'}`;
                  return fixer.insertTextBeforeRange([insertPos, insertPos], insertText);
                }});
              }
            } catch {}
          }
        };
      }
    },
    'cta-add-link-import': {
      meta: { type: 'suggestion', docs: { description: 'Auto-add next/link import when <Link> is used without import' }, fixable: 'code' },
      create(context) {
        const source = context.getSourceCode();
        let usesLink = false;
        let hasImport = false;

        return {
          Program() {
            const ast = source.ast;
            for (const node of ast.body) {
              if (node.type === 'ImportDeclaration' && node.source && node.source.value === 'next/link') {
                hasImport = true;
                break;
              }
            }
          },
          JSXOpeningElement(node) {
            const name = node.name && (node.name.name || (node.name.property && node.name.property.name));
            if (name === 'Link') usesLink = true;
          },
          'Program:exit'(node) {
            if (usesLink && !hasImport) {
              context.report({ node, message: 'Add next/link import', fix(fixer) {
                return fixer.insertTextBeforeRange([0, 0], 'import Link from "next/link";\n');
              }});
            }
          }
        };
      }
    },
    'no-inline-color-literals': {
      meta: { type: 'suggestion', docs: { description: 'Prevent inline color literals in JSX style objects' } },
      create(context) {
        return {
          JSXAttribute(node) {
            try {
              if (!node.name || node.name.name !== 'style') return;
              if (!node.value || node.value.type !== 'JSXExpressionContainer') return;
              const expr = node.value.expression;
              if (expr.type !== 'ObjectExpression') return;

              for (const prop of expr.properties) {
                if (prop.type !== 'Property' || !prop.key || prop.key.type !== 'Identifier') continue;
                const key = prop.key.name;
                if (!['color', 'backgroundColor', 'borderColor', 'border'].includes(key)) continue;

                if (prop.value.type === 'Literal' && typeof prop.value.value === 'string') {
                  const val = prop.value.value;
                  // Check for hex colors or rgb/rgba
                  if (/^#[0-9a-f]{3,8}$/i.test(val) || /^rgb/.test(val)) {
                    context.report({ node: prop.value, message: `Inline color literal '${val}' detected. Use CSS variables from @/styles/tokens instead.` });
                  }
                }
              }
            } catch (e) {
              // Be safe
            }
          }
        };
      }
    },
    'no-hardcoded-links': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow hardcoded internal links; use APP_LINKS from lib/shared/constants/links',
          recommended: true,
        },
        messages: {
          hardcoded:
            "Hardcoded internal link '{{value}}' detected. Use APP_LINKS from '@/lib/shared/constants/links' instead.",
        },
        schema: [
          {
            type: 'object',
            properties: {
              allowPatterns: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');

        // Ignore generated, dist, docs, stories, tests, CorsoAI subtree
        if (
          /(node_modules|dist|build|storybook-static|CorsoAI)\//.test(filename) ||
          /(\.stories\.(t|j)sx?|\.mdx|\.md)$/.test(filename) ||
          /(^|\/)tests\//.test(filename)
        ) {
          return {};
        }

        // Allow defining constants in the canonical file
        if (/lib\/shared\/constants\/links\.ts$/.test(filename)) {
          return {};
        }

        const options = context.options?.[0] || {};
        const allowExtra = (options.allowPatterns || []).map((s) => new RegExp(s));

        const isAllowedValue = (value) => {
          if (typeof value !== 'string') return true;
          // External/allowed protocols
          if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return true;
          // Hash links
          if (value.startsWith('#') || value.startsWith('/#')) return true;
          // Home
          if (value === '/') return true;
          // Allow additional user-supplied patterns
          if (allowExtra.some((re) => re.test(value))) return true;
          return false;
        };

        const isInternalPathLiteral = (value) => {
          if (typeof value !== 'string') return false;
          if (isAllowedValue(value)) return false;
          // Internal path heuristic: starts with '/' and not protocol/hash/mailto/tel
          return /^\//.test(value);
        };

        return {
          JSXAttribute(node) {
            try {
              if (!node.name || node.name.name !== 'href') return;
              // Only literal strings
              const valNode = node.value;
              if (!valNode) return;
              if (valNode.type === 'Literal') {
                const value = valNode.value;
                if (isInternalPathLiteral(value)) {
                  context.report({ node: valNode, messageId: 'hardcoded', data: { value } });
                }
              }
              // Disallow template literals with static content like href={`/pricing`}
              if (valNode.type === 'JSXExpressionContainer' && valNode.expression) {
                const expr = valNode.expression;
                if (expr.type === 'TemplateLiteral' && expr.expressions.length === 0) {
                  const raw = expr.quasis?.[0]?.value?.cooked;
                  if (isInternalPathLiteral(raw)) {
                    context.report({ node: expr, messageId: 'hardcoded', data: { value: raw } });
                  }
                }
              }
            } catch {
              // be safe
            }
          },
        };
      },
    },
    'no-server-only-in-client': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent server-only imports in client components and edge routes',
          recommended: true,
        },
        messages: {
          serverOnlyInClient: 'Server-only import "{{importPath}}" detected in client code. Use client-safe alternatives like @/lib/shared/config/client or @/lib/shared/server for server-only code.',
          serverOnlyInEdge: 'Server-only import "{{importPath}}" detected in edge route. Use edge-safe alternatives or move to Node.js runtime.',
        },
      },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        const source = context.getSourceCode();

        // Check if this is a client component
        const hasUseClient = source.ast.body.some(
          (s) => s.type === 'ExpressionStatement' && s.expression.type === 'Literal' && s.expression.value === 'use client'
        );

        // Check if this is an edge route (only in app directory route files)
        const isAppRoute = /\/app\/.*\/(page|layout|route|error|loading|not-found|global-error)\.(ts|tsx)$/.test(filename);
        const isEdge = isAppRoute && (source.text.includes("export const runtime = 'edge'") || source.text.includes('export const runtime = "edge"'));

        // Skip if not client or edge
        if (!hasUseClient && !isEdge) return {};

        // Server-only import patterns
        const serverOnlyPatterns = [
          // Server-only modules
          /\/server\//,
          /\.server(\.|$)/,
          /server-only/,
          // Node.js builtins
          /^(fs|path|crypto|os|child_process|net|tls|stream|zlib|http|https)$/,
          /^node:/,
          // Server-only libraries
          /@clerk\/nextjs\/server/,
          /^next\/(headers|server|cache)$/,
          // Server-only environment access
          /@\/lib\/shared\/env\/server/,
          /@\/lib\/shared\/feature-flags/,
          /@\/lib\/shared\/validation\/domain-configs/,
          // Server-only utilities
          /@\/lib\/server/,
          /@clickhouse\/client/,
          /@\/lib\/ratelimiting/,
        ];

        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;
            if (typeof importPath !== 'string') return;

            // Check if this is a server-only import
            const isServerOnly = serverOnlyPatterns.some(pattern => pattern.test(importPath));

            if (!isServerOnly) return;

            if (hasUseClient) {
              context.report({
                node: node.source,
                messageId: 'serverOnlyInClient',
                data: { importPath },
              });
            } else if (isEdge) {
              context.report({
                node: node.source,
                messageId: 'serverOnlyInEdge',
                data: { importPath },
              });
            }
          },
        };
      },
    },
    // Phase 4 — AST-Grep Migration (2025-01-XX)
    'dashboard-literal-entity-keys': {
      meta: { type: 'problem', docs: { description: 'Enforce shared helper for entity query keys in dashboard' } },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        if (!/components\/dashboard\//.test(filename) || /\.d\.ts$/.test(filename)) return {};

        return {
          Property(node) {
            if (node.key && node.key.type === 'Identifier' && node.key.name === 'queryKey') {
              if (node.value && node.value.type === 'ArrayExpression') {
                const elements = node.value.elements || [];
                if (elements.length > 0 && elements[0] &&
                    elements[0].type === 'Literal' &&
                    elements[0].value === 'entityData') {
                  context.report({
                    node: node.value,
                    message: 'Use entityTableKey() instead of literal ["entityData", ...] array'
                  });
                }
              }
            }
          }
        };
      }
    },
    'no-client-in-icons': {
      meta: { type: 'problem', docs: { description: 'Icon modules must be SSR-safe' } },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        if (!/components\/ui\/atoms\/icon\//.test(filename)) return {};

        let hasUseClient = false;
        let hasBrowserGlobals = false;

        return {
          ExpressionStatement(node) {
            if (node.expression.type === 'Literal' && node.expression.value === 'use client') {
              hasUseClient = true;
            }
          },
          Identifier(node) {
            const BROWSER_GLOBALS = ['window', 'document', 'matchMedia', 'navigator', 'getComputedStyle'];
            if (BROWSER_GLOBALS.includes(node.name)) {
              hasBrowserGlobals = true;
            }
          },
          'Program:exit'(node) {
            if (hasUseClient || hasBrowserGlobals) {
              context.report({
                node,
                message: 'Icon modules must be SSR-safe: no "use client" and no browser globals'
              });
            }
          }
        };
      }
    },
    'nextjs15-route-params-async': {
      meta: { type: 'problem', docs: { description: 'Next.js 15 requires async route params' } },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        if (!/app\/api\//.test(filename) || !/route\.ts$/.test(filename)) return {};

        return {
          Property(node) {
            if (node.key && node.key.type === 'Identifier' && node.key.name === 'params') {
              const parent = node.parent;
              if (parent && parent.type === 'FunctionDeclaration' &&
                  parent.async === false) {
                context.report({
                  node: parent,
                  message: 'Route handlers must be async when using params in Next.js 15'
                });
              }
            }
          }
        };
      }
    },

    // Phase 6 — AST-Grep Migration (Phase 6 - Environment & Import Rules)
    'require-env-utilities': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Use env utilities instead of direct process.env access',
          recommended: true,
        },
        messages: {
          requireUtility: 'Use env utilities (getEnv/requireServerEnv/publicEnv) instead of direct process.env access.',
          invalidFile: 'process.env access is not allowed in this file type. Use env utilities or approved patterns.',
        },
        schema: [
          {
            type: 'object',
            properties: {
              allowFiles: {
                type: 'array',
                items: { type: 'string' },
              },
              allowPatterns: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        const options = context.options?.[0] || {};
        const allowFiles = options.allowFiles || [];
        const allowPatterns = (options.allowPatterns || []).map(p => new RegExp(p));

        // Check if file is explicitly allowed
        const isAllowedFile = allowFiles.some(pattern => {
          if (typeof pattern === 'string') {
            return filename.endsWith(pattern) || filename.includes(pattern);
          }
          return pattern.test(filename);
        });

        // Check if file matches allow patterns
        const isAllowedPattern = allowPatterns.some(pattern => pattern.test(filename));

        if (isAllowedFile || isAllowedPattern) return {};

        // Only enforce in runtime code surfaces
        if (!/^(app|components|lib)\//.test(filename)) return {};

        return {
          MemberExpression(node) {
            // Check for process.env.* patterns
            if (node.object && node.object.type === 'MemberExpression' &&
                node.object.object && node.object.object.type === 'Identifier' &&
                node.object.object.name === 'process' &&
                node.object.property && node.object.property.type === 'Identifier' &&
                node.object.property.name === 'env') {

              const prop = node.property;
              if (prop && prop.type === 'Identifier') {
                const envVar = prop.name;

                // Allow NODE_ENV everywhere
                if (envVar === 'NODE_ENV') return;

                // Allow NEXT_RUNTIME only in instrumentation.ts
                if (envVar === 'NEXT_RUNTIME' && !filename.endsWith('instrumentation.ts')) {
                  context.report({
                    node,
                    messageId: 'invalidFile',
                  });
                  return;
                }

                // Allow NEXT_PUBLIC_* in client config
                if (envVar.startsWith('NEXT_PUBLIC_') && filename.endsWith('lib/shared/config/client.ts')) return;

                context.report({
                  node,
                  messageId: 'requireUtility',
                });
              }
            }
          }
        };
      }
    },
    'no-direct-process-env': {
      meta: { type: 'problem', docs: { description: 'Use env utilities instead of direct process.env access' } },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        // Only enforce in runtime code surfaces
        if (!/^(app|components|lib)\//.test(filename)) return {};

        // Allow certain files that need direct access
        const allowedFiles = [
          'instrumentation.ts',
          'lib/shared/config/client.ts'
        ];

        if (allowedFiles.some(f => filename.endsWith(f))) return {};

        return {
          MemberExpression(node) {
            // Check for process.env.* patterns
            if (node.object && node.object.type === 'MemberExpression' &&
                node.object.object && node.object.object.type === 'Identifier' &&
                node.object.object.name === 'process' &&
                node.object.property && node.object.property.type === 'Identifier' &&
                node.object.property.name === 'env') {

              const prop = node.property;
              if (prop && prop.type === 'Identifier') {
                const envVar = prop.name;

                // Allow NODE_ENV everywhere
                if (envVar === 'NODE_ENV') return;

                // Allow NEXT_RUNTIME only in instrumentation.ts
                if (envVar === 'NEXT_RUNTIME' && !filename.endsWith('instrumentation.ts')) {
                  context.report({
                    node,
                    message: 'process.env.NEXT_RUNTIME is only allowed in instrumentation.ts'
                  });
                  return;
                }

                // Allow NEXT_PUBLIC_* in client config
                if (envVar.startsWith('NEXT_PUBLIC_') && filename.endsWith('lib/shared/config/client.ts')) return;

                context.report({
                  node,
                  message: `Use env utilities (getEnv/requireServerEnv/publicEnv) instead of process.env.${envVar}. Direct process.env access is forbidden outside approved files.`
                });
              }
            }
          }
        };
      }
    },
    'require-server-env-imports': {
      meta: { type: 'problem', docs: { description: 'Server-only helpers must be imported from server env module' } },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        // Only enforce in lib and app directories
        if (!/^(lib|app)\//.test(filename)) return {};

        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;
            if (typeof importPath !== 'string') return;

            // Check if importing from shared/env
            if (importPath === '@/lib/shared/env' || importPath === '@/lib/shared/env/') {
              // Check if any imported specifiers are server-only helpers
              const serverOnlyHelpers = ['requireServerEnv', 'getServerEnv'];

              for (const spec of node.specifiers || []) {
                if (spec.type === 'ImportSpecifier' && spec.imported) {
                  if (serverOnlyHelpers.includes(spec.imported.name)) {
                    context.report({
                      node: spec,
                      message: `Server-only helper '${spec.imported.name}' must be imported from '@/lib/server/env' instead of '@/lib/shared/env'`
                    });
                  }
                }
              }
            }
          }
        };
      }
    },
    'no-server-reexports': {
      meta: { type: 'problem', docs: { description: 'Prevent re-exporting server modules from client/shared barrels' } },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        // Only enforce in components and shared lib
        if (!/^(components|lib\/shared)\//.test(filename)) return {};

        return {
          ExportAllDeclaration(node) {
            const exportPath = node.source.value;
            if (typeof exportPath !== 'string') return;

            // Check for server module exports
            if (exportPath === './server' || exportPath === './server/' ||
                exportPath.endsWith('.server') || exportPath.endsWith('.server/')) {
              context.report({
                node,
                message: "Do not re-export './server' or '*.server' from client/shared barrels. Move server exports to an index.server.ts barrel."
              });
            }
          }
        };
      }
    },
    'no-deprecated-lib-imports': {
      meta: { type: 'problem', docs: { description: 'Use domain barrels instead of deprecated lib paths' } },
      create(context) {
        const deprecatedPaths = [
          '@/lib/actions/rate-limiting',
          '@/lib/api/response/handlers',
          '@/lib/api/env',
          '@/lib/shared/assets.ts',
          '@/lib/shared/env.ts',
          '@/lib/shared/validation.ts',
          '@/lib/validators/chat.ts',
          '@/lib/validators/marketing.ts'
        ];

        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;
            if (typeof importPath !== 'string') return;

            if (deprecatedPaths.includes(importPath)) {
              context.report({
                node: node.source,
                message: `Import path '${importPath}' is deprecated. Use the domain barrel instead (see README).`
              });
            }
          }
        };
      }
    },

    // Phase 7 — AST-Grep Migration (Phase 7 - Types & API Rules)
    'no-runtime-in-types': {
      meta: { type: 'problem', docs: { description: 'Prevent runtime exports in types directory' } },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        // Only enforce in types directory
        if (!/types\//.test(filename)) return {};

        return {
          ExportNamedDeclaration(node) {
            // Check for runtime exports (const, let, var)
            if (node.declaration && node.declaration.type === 'VariableDeclaration') {
              const kind = node.declaration.kind; // 'const', 'let', or 'var'
              if (kind === 'const' || kind === 'let' || kind === 'var') {
                context.report({
                  node,
                  message: "Runtime exports are disallowed in types/. Define this in lib/ or use 'export declare' if it's for typing only."
                });
              }
            }
          }
        };
      }
    },
    'no-await-headers': {
      meta: { type: 'problem', docs: { description: 'Prevent awaiting synchronous Next.js headers/cookies APIs' } },
      create(context) {
        return {
          CallExpression(node) {
            if (node.callee && node.callee.type === 'AwaitExpression') {
              const arg = node.callee.argument;
              if (arg && arg.type === 'CallExpression') {
                const callee = arg.callee;
                if (callee && callee.type === 'Identifier') {
                  if (callee.name === 'headers' || callee.name === 'cookies') {
                    context.report({
                      node: arg,
                      message: "next/headers APIs are synchronous; remove 'await headers()' or 'await cookies()'."
                    });
                  }
                }
              }
            }
          }
        };
      }
    },
    'no-clerkclient-invoke': {
      meta: { type: 'problem', docs: { description: 'Prevent clerkClient() function calls' } },
      create(context) {
        return {
          CallExpression(node) {
            if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'clerkClient') {
              context.report({
                node,
                message: "Do not call clerkClient(); import from @clerk/nextjs/server and use the object directly."
              });
            }
          }
        };
      }
    },
    'contexts-barrel-usage': {
      meta: { type: 'problem', docs: { description: 'Import contexts via barrel instead of deep subpath imports' } },
      create(context) {
        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;
            if (typeof importPath !== 'string') return;

            // Note: contexts/ directory was removed - providers are now in app/providers/
          }
        };
      }
    },
    'rate-limits-bracket-access': {
      meta: { type: 'suggestion', docs: { description: 'Use bracket access for RATE_LIMITS with dynamic keys' } },
      create(context) {
        return {
          MemberExpression(node) {
            // Check for RATE_LIMITS dot access
            if (node.object && node.object.type === 'Identifier' && node.object.name === 'RATE_LIMITS') {
              const prop = node.property;
              if (prop && prop.type === 'Identifier') {
                const propertyName = prop.name;
                // Check if it's a static property that should use bracket access
                if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(propertyName)) {
                  context.report({
                    node,
                    message: `Use bracket access for RATE_LIMITS with dynamic keys: RATE_LIMITS['${propertyName}']`
                  });
                }
              }
            }
          }
        };
      }
    },

    // Phase 8 — AST-Grep Migration (Phase 8 - Final Optimization Rules)
    'forbid-header-spacing-in-dashboard': {
      meta: { type: 'problem', docs: { description: 'Dashboard must not import shared header spacing utilities' } },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        // Only enforce in dashboard directory
        if (!/components\/dashboard\//.test(filename)) return {};

        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;
            if (typeof importPath !== 'string') return;

            // Check for forbidden imports
            if (importPath === '@/styles/ui/organisms/navbar' ||
                importPath.startsWith('@/styles/ui/organisms/navbar/')) {
              context.report({
                node: node.source,
                message: "Dashboard must not import shared header spacing utilities (use dashboardNavbar)."
              });
            }
          }
        };
      }
    },
    'no-clerkprovider-outside-root': {
      meta: { type: 'problem', docs: { description: 'Use centralized ClerkProvider in app/providers.tsx only' } },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        // Allow in app/providers.tsx file
        if (filename.includes('app/providers.tsx')) return {};

        return {
          ImportDeclaration(node) {
            const importPath = node.source.value;
            if (typeof importPath !== 'string') return;

            // Check if importing from Clerk
            if (importPath === '@clerk/nextjs' || importPath.startsWith('@clerk/')) {
              // Check if any imported specifiers include ClerkProvider
              for (const spec of node.specifiers || []) {
                if (spec.type === 'ImportSpecifier' && spec.imported) {
                  if (spec.imported.name === 'ClerkProvider') {
                    context.report({
                      node: spec,
                      message: "Use the centralized ClerkProvider in app/providers.tsx only. Do not import ClerkProvider directly elsewhere."
                    });
                  }
                }
              }
            }
          }
        };
      }
    },
    'api-edge-barrel-no-server-exports': {
      meta: { type: 'problem', docs: { description: 'Edge barrel should not re-export server-only modules' } },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        // Only enforce in lib/api directory but not in server subdirectory
        if (!/lib\/api\//.test(filename) || /lib\/api\/server\//.test(filename)) return {};

        return {
          ExportAllDeclaration(node) {
            const exportPath = node.source.value;
            if (typeof exportPath !== 'string') return;

            // Check for server module exports
            if (exportPath === '../server' || exportPath.startsWith('../server/') ||
                exportPath.includes('/server') || exportPath.endsWith('.server') ||
                exportPath.endsWith('.server/')) {
              context.report({
                node,
                message: "Edge barrel should not re-export server-only modules. Move server exports to @/lib/api/server."
              });
            }
          }
        };
      }
    },
    'nextjs15-route-params-optimization': {
      meta: { type: 'problem', docs: { description: 'Optimize Next.js 15 route params for better performance' } },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        // Only enforce in API route files
        if (!/app\/api\//.test(filename) || !/route\.ts$/.test(filename)) return {};

        return {
          FunctionDeclaration(node) {
            // Check for async route handlers
            if (node.async && node.params.length > 0) {
              const params = node.params;
              let hasParamsObject = false;
              let hasAwaitParams = false;

              // Check function body for params access
              if (node.body && node.body.type === 'BlockStatement') {
                for (const stmt of node.body.body) {
                  if (stmt.type === 'VariableDeclaration') {
                    for (const decl of stmt.declarations) {
                      if (decl.init && decl.init.type === 'AwaitExpression' &&
                          decl.init.argument && decl.init.argument.type === 'MemberExpression' &&
                          decl.init.argument.object && decl.init.argument.object.type === 'Identifier' &&
                          decl.init.argument.object.name === 'ctx' &&
                          decl.init.argument.property && decl.init.argument.property.name === 'params') {
                        hasAwaitParams = true;
                      }
                    }
                  }
                }
              }

              // Check for params object with non-Promise type
              for (const param of params) {
                if (param.type === 'Identifier' && param.name === 'ctx') {
                  hasParamsObject = true;
                }
              }

              if (hasParamsObject && !hasAwaitParams) {
                context.report({
                  node,
                  message: "Next.js 15 route handler has params object but doesn't await ctx.params. Add 'const params = await ctx.params;'"
                });
              }
            }
          }
        };
      }
    },
    'require-zod-strict': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require Zod object schemas to use .strict() mode to reject unexpected properties',
          recommended: true,
        },
        messages: {
          missingStrict: 'Zod object schema must use .strict() to reject unexpected properties. Add .strict() to the schema.',
        },
        schema: [],
      },
      create(context) {
        return {
          CallExpression(node) {
            // Check for z.object() calls
            if (node.callee &&
                node.callee.type === 'MemberExpression' &&
                node.callee.object &&
                node.callee.object.type === 'Identifier' &&
                node.callee.object.name === 'z' &&
                node.callee.property &&
                node.callee.property.name === 'object') {

              // Check if this z.object() call has .strict() method
              let parent = node.parent;
              let hasStrict = false;

              // Walk up the AST to check for .strict() call
              while (parent) {
                if (parent.type === 'CallExpression' &&
                    parent.callee &&
                    parent.callee.type === 'MemberExpression' &&
                    parent.callee.property &&
                    parent.callee.property.name === 'strict') {
                  hasStrict = true;
                  break;
                }

                // Stop if we hit a variable declaration or assignment
                if (parent.type === 'VariableDeclarator' ||
                    parent.type === 'AssignmentExpression' ||
                    parent.type === 'ReturnStatement' ||
                    parent.type === 'ExportDefaultDeclaration' ||
                    parent.type === 'ExportNamedDeclaration') {
                  break;
                }

                parent = parent.parent;
              }

              if (!hasStrict) {
                context.report({
                  node,
                  messageId: 'missingStrict',
                });
              }
            }
          }
        };
      }
    },
    'require-runtime-exports': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Require runtime export declarations in API route files',
          recommended: true,
        },
        messages: {
          missingRuntimeExport: 'API route file must export runtime configuration (runtime, dynamic, revalidate, preferredRegion, maxDuration).',
          invalidRuntimeValue: 'Runtime must be "edge" or "nodejs".',
        },
        schema: [
          {
            type: 'object',
            properties: {
              files: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            additionalProperties: false,
          },
        ],
      },
      create(context) {
        const options = context.options?.[0] ?? {};
        const targetFiles = options.files || ['app/api/**/*.ts'];

        const filename = context.getFilename().replace(/\\/g, '/');
        const isTargetFile = targetFiles.some(pattern => {
          // Simple glob matching
          if (pattern.includes('**')) {
            const regex = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
            return new RegExp(regex).test(filename);
          }
          return filename.includes(pattern.replace('**/', ''));
        });

        if (!isTargetFile) return {};

        const source = context.getSourceCode();
        const hasRuntimeExport = source.text.includes('export const runtime');
        const hasDynamicExport = source.text.includes('export const dynamic');
        const hasRevalidateExport = source.text.includes('export const revalidate');
        const hasPreferredRegionExport = source.text.includes('export const preferredRegion');
        const hasMaxDurationExport = source.text.includes('export const maxDuration');

        // Check if any runtime export is present
        const hasAnyRuntimeExport = hasRuntimeExport || hasDynamicExport || hasRevalidateExport ||
                                  hasPreferredRegionExport || hasMaxDurationExport;

        return {
          'Program:exit'(node) {
            if (!hasAnyRuntimeExport) {
              context.report({
                node,
                messageId: 'missingRuntimeExport',
              });
            }

            // If runtime export exists, validate its value
            if (hasRuntimeExport) {
              const runtimeMatch = source.text.match(/export const runtime\s*=\s*['"]([^'"]+)['"]/);
              if (runtimeMatch && !['edge', 'nodejs'].includes(runtimeMatch[1])) {
                context.report({
                  node,
                  messageId: 'invalidRuntimeValue',
                });
              }
            }
          }
        };
      }
    },
    'no-direct-supabase-admin': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Prevent direct usage of getSupabaseAdmin. Use tenant-scoped client wrapper instead.',
          recommended: true,
        },
        messages: {
          directUsage: 'Direct usage of getSupabaseAdmin() is forbidden. Use getTenantScopedSupabaseClient() or withTenantClient() from @/lib/server/db/supabase-tenant-client to ensure RLS context is set.',
        },
      },
      create(context) {
        const filename = context.getFilename().replace(/\\/g, '/');
        
        // Allow in the tenant client wrapper itself and the server module that defines it
        if (filename.includes('lib/server/db/supabase-tenant-client.ts') ||
            filename.includes('lib/integrations/supabase/server.ts') ||
            filename.includes('lib/integrations/supabase/api.ts')) {
          return {};
        }

        // Allow in tests
        if (/(tests?|__tests__|\.(spec|test)\.)/.test(filename)) {
          return {};
        }

        return {
          CallExpression(node) {
            // Check for getSupabaseAdmin() calls
            if (node.callee && node.callee.type === 'Identifier' && node.callee.name === 'getSupabaseAdmin') {
              context.report({
                node,
                messageId: 'directUsage',
              });
            }
            // Check for getSupabaseAdmin imported and called
            if (node.callee && node.callee.type === 'MemberExpression' &&
                node.callee.property && node.callee.property.type === 'Identifier' &&
                node.callee.property.name === 'getSupabaseAdmin') {
              context.report({
                node,
                messageId: 'directUsage',
              });
            }
          },
          ImportDeclaration(node) {
            const importPath = node.source.value;
            if (typeof importPath !== 'string') return;

            // Check if importing getSupabaseAdmin from integrations
            if (importPath === '@/lib/integrations' || importPath === '@/lib/integrations/supabase/server') {
              for (const spec of node.specifiers || []) {
                if (spec.type === 'ImportSpecifier' && spec.imported && spec.imported.name === 'getSupabaseAdmin') {
                  context.report({
                    node: spec,
                    messageId: 'directUsage',
                  });
                }
                if (spec.type === 'ImportDefaultSpecifier' || spec.type === 'ImportNamespaceSpecifier') {
                  // Check if default/namespace import might contain getSupabaseAdmin
                  // This is a best-effort check
                }
              }
            }
          }
        };
      }
    }
  },
  configs: {
    recommended: {
      rules: {}
    }
  }
};

