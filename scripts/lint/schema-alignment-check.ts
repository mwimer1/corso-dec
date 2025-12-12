import * as fs from 'fs';
import { Node, type InterfaceDeclaration, type SourceFile, type TypeAliasDeclaration, type VariableDeclaration } from 'ts-morph';
import { createLintProject } from '../codemods/ts-project';

const project = createLintProject();

interface SchemaAlignmentIssue {
  type: string;
  file: string;
  issue: string;
}

const issues: SchemaAlignmentIssue[] = [];
const zodSchemaNames = new Set<string>();

// 1. Collect all Zod schema names
const schemaFiles: SourceFile[] = project.getSourceFiles('**/*.schema.ts');
project.getSourceFiles('lib/validators/**/*.ts').forEach((f: SourceFile) => schemaFiles.push(f));

for (const sourceFile of schemaFiles) {
  sourceFile.getVariableDeclarations().forEach((varDecl: VariableDeclaration) => {
    if (varDecl.getName().endsWith('Schema')) {
      zodSchemaNames.add(varDecl.getName());
    }
  });
}

const domainDirs = ['auth', 'billing', 'chat', 'dashboard', 'marketing', 'landing'];

for (const domain of domainDirs) {
  const sourceFiles: SourceFile[] = project.getSourceFiles(`types/${domain}/**/*.ts`);

  for (const sourceFile of sourceFiles) {
    sourceFile.getInterfaces().forEach((interfaceDecl: InterfaceDeclaration) => {
      findMismatches(interfaceDecl);
    });
    sourceFile.getTypeAliases().forEach((typeAliasDecl: TypeAliasDeclaration) => {
      findMismatches(typeAliasDecl);
    });
  }
}

function findMismatches(node: Node) {
  if (!Node.isInterfaceDeclaration(node) && !Node.isTypeAliasDeclaration(node)) {
    return;
  }
  
  if (!node.isExported()) {
    return;
  }
  
  const typeName = node.getName();
  const typeText = node.getText();

  if (typeText.includes('z.infer')) {
    return; // Already aligned
  }
  
  const potentialSchemaName = typeName.charAt(0).toLowerCase() + typeName.slice(1) + 'Schema';
  const potentialSchemaNamePascal = typeName + 'Schema';

  let issueMessage = '';

  if (zodSchemaNames.has(potentialSchemaName)) {
    issueMessage = `Type not inferred from schema. A matching \`${potentialSchemaName}\` exists.`;
  } else if (zodSchemaNames.has(potentialSchemaNamePascal)) {
    issueMessage = `Type not inferred from schema. A matching \`${potentialSchemaNamePascal}\` exists.`;
  } else if (isDataShape(node)) {
    issueMessage = 'Defined as interface/type but likely should align with a Zod schema (no z.infer). No matching schema found – consider adding a schema if this is validated at runtime.';
  }

  if (issueMessage) {
    issues.push({
      type: typeName,
      file: node.getSourceFile().getFilePath(),
      issue: issueMessage,
    });
  }
}

function isDataShape(node: Node): boolean {
  if (Node.isInterfaceDeclaration(node)) {
    return node.getProperties().every(prop => {
      const type = prop.getType();
      return type && (type.isAny() || type.isArray() || type.isUnion());
    });
  }
  if(Node.isTypeAliasDeclaration(node)){
    const typeNode = node.getType();
    if(typeNode && typeNode.isObject()){
        return typeNode.getProperties().every(member => {
            const type = member.getValueDeclarationOrThrow().getType();
            return type && (type.isAny() || type.isArray() || type.isUnion());
        });
    }
  }

  return false;
}

const report = {
  schemaAlignmentIssues: issues,
};

fs.writeFileSync('docs/audits/types-domain-audit-report.json', JSON.stringify(report, null, 2));

console.log('Schema alignment check complete. Report generated at docs/audits/types-domain-audit-report.json');

