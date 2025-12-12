import path from 'node:path';
import { Project } from 'ts-morph';

console.log('Testing ts-morph...');

const project = new Project({ tsConfigFilePath: path.resolve('tsconfig.json') });

console.log('Adding source files...');
project.addSourceFilesAtPaths([
  'lib/**/*.ts',
  'lib/**/*.tsx',
  'components/**/*.ts',
  'components/**/*.tsx'
]);

const files = project.getSourceFiles();
console.log(`Found ${files.length} source files`);

files.slice(0, 5).forEach(file => {
  console.log(`- ${file.getFilePath()}`);
});

console.log('Done.');
