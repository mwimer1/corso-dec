import fs from 'fs';
import path from 'path';
import { logger } from './logger';

const filePath = path.join('lib', 'auth', 'external-token.ts');
let content: string;
try {
  content = fs.readFileSync(filePath, 'utf8');
} catch (err) {
  logger.error(`Failed to read ${filePath}:`, err);
  process.exit(1);
}

// Fix the unnecessary conditional warning on line 101
// Change from:
// if (supabaseApi.exchangeExternalJwt && typeof supabaseApi.exchangeExternalJwt === 'function') {
// To:
// if (typeof supabaseApi.exchangeExternalJwt === 'function') {
const updatedContent = content.replace(
  /if \(supabaseApi\.exchangeExternalJwt && typeof supabaseApi\.exchangeExternalJwt === 'function'\) {/,
  "if (typeof supabaseApi.exchangeExternalJwt === 'function') {"
);

try {
  fs.writeFileSync(filePath, updatedContent);
  logger.success('Updated lib/auth/external-token.ts to fix the unnecessary conditional warning.');
} catch (err) {
  logger.error(`Failed to write ${filePath}:`, err);
  process.exit(1);
}

