import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Project, SyntaxKind } from 'ts-morph';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repo = path.resolve(__dirname, '..', '..');
const tsconfig = path.join(repo, 'tsconfig.json');

const project = new Project({
  tsConfigFilePath: tsconfig,
  skipAddingFilesFromTsConfig: false,
});

type Rule =
  | { from: string; to: string; kind: 'named'; name: string }
  | { from: string; to: string; kind: 'passthrough' };

const rules: Rule[] = [
  { from: '@/components/ui/organisms/footer-system/footer', to: '@/components/ui/organisms', kind: 'named', name: 'Footer' },
  { from: '@/components/ui/organisms/footer-system/footer-cta', to: '@/components/ui/organisms', kind: 'named', name: 'FooterCTA' },
  { from: '@/components/ui/organisms/footer-system/footer-legal', to: '@/components/ui/organisms', kind: 'named', name: 'FooterLegal' },
  { from: '@/components/ui/organisms/footer-system/footer-main', to: '@/components/ui/organisms', kind: 'named', name: 'FooterMain' },

  { from: '@/components/ui/atoms/vertical-guidelines', to: '@/components/ui/atoms', kind: 'named', name: 'VerticalGuidelines' },

  { from: '@/components/ui/atoms/icon/icons/layout-panel-left-icon', to: '@/components/ui/atoms', kind: 'named', name: 'LayoutPanelLeftIcon' },

  { from: '../icon-base', to: '@/components/ui/shared/icon-base', kind: 'passthrough' },
  { from: '@/components/ui/atoms/icon/icon-base', to: '@/components/ui/shared/icon-base', kind: 'passthrough' },
];

let touched = 0;

for (const sf of project.getSourceFiles()) {
  let changed = false;
  for (const imp of sf.getImportDeclarations()) {
    const ms = imp.getModuleSpecifierValue();
    const rule = rules.find(r => r.from === ms);
    if (!rule) continue;
    if (rule.kind === 'named') {
      const def = imp.getDefaultImport();
      if (def) {
        // ts-morph Identifier does not expose remove() in some versions; remove via parent binding
        try {
          // some ts-morph versions expose remove(); fall back if not
          (def as any).remove?.();
        } catch {
          try { def.replaceWithText(''); } catch {};
        }
      }
      const has = imp.getNamedImports().some(n => n.getName() === rule.name);
      if (!has) imp.addNamedImport(rule.name);
      imp.setModuleSpecifier(rule.to);
      changed = true;
    } else {
      imp.setModuleSpecifier(rule.to);
      changed = true;
    }
  }

  // update require calls
  sf.getDescendantsOfKind(SyntaxKind.CallExpression).forEach(call => {
    const expr = call.getExpression().getText();
    const arg = call.getArguments()[0];
    if (expr === 'require' && arg && arg.getKind() === SyntaxKind.StringLiteral) {
      const val = (arg as any).getLiteralText();
      const rule = rules.find(r => r.from === val);
      if (rule) {
        (arg as any).setLiteralValue(rule.to);
        changed = true;
      }
    }
  });

  if (changed) {
    sf.fixMissingImports();
    touched++;
  }
}

if (touched > 0) project.saveSync();
console.log(`migrate-ui-origins: updated ${touched} files`);



