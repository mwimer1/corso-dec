// scripts/utils/frontmatter/index.ts
export * from './parsing';
export * from './validation';
export * from './writing';

// Convenience aliases for common operations
export { readFrontmatter as parseFrontmatter } from './parsing';
export { normalizeFrontmatter as validateFrontmatter } from './validation';
export { stringifyMd as stringifyFrontmatter } from './writing';


