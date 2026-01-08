/**
 * Font Rendering Regression Tests
 * 
 * Guards against reintroducing text-rendering: optimizelegibility globally,
 * which can reduce text crispness on Windows for small UI text.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Font Rendering Regression', () => {
  it('should not contain text-rendering: optimizelegibility in globals.css', () => {
    const globalsPath = join(process.cwd(), 'styles', 'globals.css');
    const globalsContent = readFileSync(globalsPath, 'utf8');
    
    // Assert that optimizelegibility is not present (case-insensitive)
    const hasOptimizeLegibility = /text-rendering\s*:\s*optimizelegibility/i.test(globalsContent);
    
    expect(hasOptimizeLegibility).toBe(false);
  });
});
