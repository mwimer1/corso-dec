/**
 * Unit tests for CSS audit baseline refresh semantics
 *
 * Tests that --update-baseline correctly refreshes baseline entries
 * for tools that ran, including proper pruning behavior.
 */

import { describe, expect, it } from 'vitest';
import type { Baseline, Finding, CssAuditTool, ToolContext } from '../../scripts/audit/types';
import { updateBaseline, filterAgainstBaseline } from '../../scripts/audit/baseline';

describe('CSS Audit Baseline Refresh Semantics', () => {
  const mockCtx: ToolContext = {
    rootDir: '/fake/repo',
    config: {},
    cli: {
      updateBaseline: true,
      changed: false,
      since: undefined,
      include: [],
      exclude: [],
      tools: [],
      skipTools: [],
      baselinePath: '',
      noBaseline: false,
      force: false,
      strict: false,
      failOn: 'error',
      output: '',
      format: 'json',
      ci: false,
    },
    targets: {
      mode: 'full',
      sinceRef: undefined,
      changedFiles: [],
      allFiles: [],
      cssFiles: [],
      cssModuleFiles: [],
      tsFiles: [],
      tsxFiles: [],
    },
    index: {
      cssModules: new Map(),
      impactedCssModules: undefined,
    },
    log: () => {},
    warn: () => {},
  };

  const mockTool: CssAuditTool = {
    id: 'test-tool',
    title: 'Test Tool',
    scope: { kind: 'files', kinds: ['css'] },
    defaultEnabled: true,
    category: 'audit',
    run: async () => ({ findings: [] }),
  };

  describe('updateBaseline - refresh semantics', () => {
    it('should not prune baselined-but-still-present findings', () => {
      // Scenario: Baseline contains FP1, tool run produces FP1 again
      // Expected: FP1 remains in baseline (not pruned)
      
      const fingerprint1 = 'test-tool:rule1:fp1';
      const existingBaseline: Baseline = {
        version: '1.0',
        generatedAt: '2024-01-01T00:00:00.000Z',
        entries: [
          {
            fingerprint: fingerprint1,
            tool: 'test-tool',
            ruleId: 'rule1',
            severity: 'warn',
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      };

      // Tool run produces the same finding (still present)
      const allFindings: Finding[] = [
        {
          fingerprint: fingerprint1,
          tool: 'test-tool',
          ruleId: 'rule1',
          severity: 'warn',
          file: 'test.css',
          message: 'Test finding',
          line: 10,
          column: 5,
        },
      ];

      // Filter would yield newFindings = [] (already in baseline)
      const filtered = filterAgainstBaseline(allFindings, existingBaseline);
      expect(filtered.new).toHaveLength(0); // Confirms it's already baselined

      // updateBaseline should receive ALL findings, not just newFindings
      const updated = updateBaseline(existingBaseline, allFindings, [mockTool], mockCtx);

      // FP1 should remain in baseline (not pruned)
      expect(updated.entries).toHaveLength(1);
      expect(updated.entries[0]?.fingerprint).toBe(fingerprint1);
    });

    it('should prune fixed findings for tools that ran', () => {
      // Scenario: Baseline contains FP2, current run does NOT contain FP2
      // Expected: FP2 is removed from baseline (issue fixed)
      
      const fingerprint2 = 'test-tool:rule2:fp2';
      const existingBaseline: Baseline = {
        version: '1.0',
        generatedAt: '2024-01-01T00:00:00.000Z',
        entries: [
          {
            fingerprint: fingerprint2,
            tool: 'test-tool',
            ruleId: 'rule2',
            severity: 'warn',
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      };

      // Tool run produces different finding (FP2 is fixed, no longer appears)
      const allFindings: Finding[] = [
        {
          fingerprint: 'test-tool:rule3:fp3',
          tool: 'test-tool',
          ruleId: 'rule3',
          severity: 'warn',
          file: 'test.css',
          message: 'Different finding',
          line: 20,
          column: 10,
        },
      ];

      const updated = updateBaseline(existingBaseline, allFindings, [mockTool], mockCtx);

      // FP2 should be pruned (no longer in findings)
      const fp2Entry = updated.entries.find(e => e.fingerprint === fingerprint2);
      expect(fp2Entry).toBeUndefined();
      
      // New finding should be added
      expect(updated.entries).toHaveLength(1);
      expect(updated.entries[0]?.fingerprint).toBe('test-tool:rule3:fp3');
    });

    it('should preserve entries for tools that did not run', () => {
      // Scenario: Baseline contains entries for toolA and toolB
      // Only toolA runs
      // Expected: toolB entries preserved, toolA entries refreshed
      
      const fingerprintA = 'tool-a:rule1:fp1';
      const fingerprintB = 'tool-b:rule1:fp1';
      
      const existingBaseline: Baseline = {
        version: '1.0',
        generatedAt: '2024-01-01T00:00:00.000Z',
        entries: [
          {
            fingerprint: fingerprintA,
            tool: 'tool-a',
            ruleId: 'rule1',
            severity: 'warn',
            addedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            fingerprint: fingerprintB,
            tool: 'tool-b',
            ruleId: 'rule1',
            severity: 'warn',
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      };

      const toolA: CssAuditTool = {
        ...mockTool,
        id: 'tool-a',
        title: 'Tool A',
      };

      // Only toolA runs, produces new finding
      const allFindings: Finding[] = [
        {
          fingerprint: 'tool-a:rule2:fp2',
          tool: 'tool-a',
          ruleId: 'rule2',
          severity: 'warn',
          file: 'test.css',
          message: 'New finding from toolA',
          line: 30,
          column: 15,
        },
      ];

      const updated = updateBaseline(existingBaseline, allFindings, [toolA], mockCtx);

      // toolB entry should be preserved (tool didn't run)
      const toolBEntry = updated.entries.find(e => e.fingerprint === fingerprintB);
      expect(toolBEntry).toBeDefined();
      expect(toolBEntry?.tool).toBe('tool-b');
      
      // toolA old entry should be pruned (no longer in findings)
      const toolAOldEntry = updated.entries.find(e => e.fingerprint === fingerprintA);
      expect(toolAOldEntry).toBeUndefined();
      
      // toolA new entry should be added
      const toolANewEntry = updated.entries.find(e => e.fingerprint === 'tool-a:rule2:fp2');
      expect(toolANewEntry).toBeDefined();
    });

    it('should preserve addedAt timestamp for unchanged entries', () => {
      // Scenario: Entry already exists in baseline with specific addedAt
      // Tool run produces same finding again
      // Expected: addedAt preserved (not updated to current time)
      
      const originalAddedAt = '2024-01-01T00:00:00.000Z';
      const fingerprint = 'test-tool:rule1:fp1';
      
      const existingBaseline: Baseline = {
        version: '1.0',
        generatedAt: '2024-01-01T00:00:00.000Z',
        entries: [
          {
            fingerprint,
            tool: 'test-tool',
            ruleId: 'rule1',
            severity: 'warn',
            addedAt: originalAddedAt,
          },
        ],
      };

      // Same finding appears again
      const allFindings: Finding[] = [
        {
          fingerprint,
          tool: 'test-tool',
          ruleId: 'rule1',
          severity: 'warn',
          file: 'test.css',
          message: 'Same finding',
          line: 10,
          column: 5,
        },
      ];

      const updated = updateBaseline(existingBaseline, allFindings, [mockTool], mockCtx);

      // addedAt should be preserved (not updated)
      const entry = updated.entries.find(e => e.fingerprint === fingerprint);
      expect(entry).toBeDefined();
      expect(entry?.addedAt).toBe(originalAddedAt);
    });

    it('should set addedAt to current time for new entries', () => {
      // Scenario: New finding not in baseline
      // Expected: addedAt set to current time
      
      const existingBaseline: Baseline = {
        version: '1.0',
        generatedAt: '2024-01-01T00:00:00.000Z',
        entries: [],
      };

      const fingerprint = 'test-tool:rule1:fp1';
      const allFindings: Finding[] = [
        {
          fingerprint,
          tool: 'test-tool',
          ruleId: 'rule1',
          severity: 'warn',
          file: 'test.css',
          message: 'New finding',
          line: 10,
          column: 5,
        },
      ];

      const before = new Date().toISOString();
      const updated = updateBaseline(existingBaseline, allFindings, [mockTool], mockCtx);
      const after = new Date().toISOString();

      const entry = updated.entries.find(e => e.fingerprint === fingerprint);
      expect(entry).toBeDefined();
      expect(entry?.addedAt).toBeDefined();
      
      // addedAt should be between before and after
      expect(entry?.addedAt >= before).toBe(true);
      expect(entry?.addedAt <= after).toBe(true);
    });

    it('should respect baselineInclude semantics', () => {
      // Scenario: Finding is present but baselineInclude returns false
      // Expected: Finding not added to baseline
      
      const toolWithCustomInclude: CssAuditTool = {
        ...mockTool,
        baselineInclude: (finding) => {
          // Only include findings with severity 'error'
          return finding.severity === 'error';
        },
      };

      const existingBaseline: Baseline = {
        version: '1.0',
        generatedAt: '2024-01-01T00:00:00.000Z',
        entries: [],
      };

      const allFindings: Finding[] = [
        {
          fingerprint: 'test-tool:rule1:fp1',
          tool: 'test-tool',
          ruleId: 'rule1',
          severity: 'warn', // Not error, should be excluded
          file: 'test.css',
          message: 'Warning finding',
          line: 10,
          column: 5,
        },
        {
          fingerprint: 'test-tool:rule2:fp2',
          tool: 'test-tool',
          ruleId: 'rule2',
          severity: 'error', // Should be included
          file: 'test.css',
          message: 'Error finding',
          line: 20,
          column: 10,
        },
      ];

      const updated = updateBaseline(existingBaseline, allFindings, [toolWithCustomInclude], mockCtx);

      // Only error finding should be in baseline
      expect(updated.entries).toHaveLength(1);
      expect(updated.entries[0]?.severity).toBe('error');
      expect(updated.entries[0]?.fingerprint).toBe('test-tool:rule2:fp2');
    });

    it('should handle mixed scenario: some findings baselined, some new, some fixed', () => {
      // Scenario: Baseline has FP1 (still present), FP2 (fixed)
      // Run produces: FP1 (existing), FP3 (new)
      // Expected: FP1 kept, FP2 pruned, FP3 added
      
      const fp1 = 'test-tool:rule1:fp1';
      const fp2 = 'test-tool:rule2:fp2';
      const fp3 = 'test-tool:rule3:fp3';
      
      const existingBaseline: Baseline = {
        version: '1.0',
        generatedAt: '2024-01-01T00:00:00.000Z',
        entries: [
          {
            fingerprint: fp1,
            tool: 'test-tool',
            ruleId: 'rule1',
            severity: 'warn',
            addedAt: '2024-01-01T00:00:00.000Z',
          },
          {
            fingerprint: fp2,
            tool: 'test-tool',
            ruleId: 'rule2',
            severity: 'warn',
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      };

      // Run produces FP1 (still present) and FP3 (new), but not FP2 (fixed)
      const allFindings: Finding[] = [
        {
          fingerprint: fp1,
          tool: 'test-tool',
          ruleId: 'rule1',
          severity: 'warn',
          file: 'test.css',
          message: 'Still present',
          line: 10,
          column: 5,
        },
        {
          fingerprint: fp3,
          tool: 'test-tool',
          ruleId: 'rule3',
          severity: 'warn',
          file: 'test.css',
          message: 'New finding',
          line: 20,
          column: 10,
        },
      ];

      // Verify filtering behavior
      const filtered = filterAgainstBaseline(allFindings, existingBaseline);
      expect(filtered.new).toHaveLength(1); // Only FP3 is new
      expect(filtered.new[0]?.fingerprint).toBe(fp3);

      // updateBaseline receives ALL findings (not just filtered)
      const updated = updateBaseline(existingBaseline, allFindings, [mockTool], mockCtx);

      // FP1 should remain (still present)
      expect(updated.entries.some(e => e.fingerprint === fp1)).toBe(true);
      
      // FP2 should be pruned (fixed)
      expect(updated.entries.some(e => e.fingerprint === fp2)).toBe(false);
      
      // FP3 should be added (new)
      expect(updated.entries.some(e => e.fingerprint === fp3)).toBe(true);
      
      // Total should be 2 (FP1 + FP3)
      expect(updated.entries).toHaveLength(2);
    });
  });

  describe('Call site verification', () => {
    it('should verify updateBaseline receives all findings, not just newFindings', () => {
      // This test documents the expected behavior: updateBaseline should receive
      // ALL findings from the run, not just the ones that passed baseline filtering
      
      const fp1 = 'test-tool:rule1:fp1';
      const fp2 = 'test-tool:rule2:fp2';
      
      const existingBaseline: Baseline = {
        version: '1.0',
        generatedAt: '2024-01-01T00:00:00.000Z',
        entries: [
          {
            fingerprint: fp1,
            tool: 'test-tool',
            ruleId: 'rule1',
            severity: 'warn',
            addedAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      };

      // All findings from tool run (both baselined and new)
      const allFindings: Finding[] = [
        {
          fingerprint: fp1, // Already in baseline
          tool: 'test-tool',
          ruleId: 'rule1',
          severity: 'warn',
          file: 'test.css',
          message: 'Baselined finding',
          line: 10,
          column: 5,
        },
        {
          fingerprint: fp2, // New finding
          tool: 'test-tool',
          ruleId: 'rule2',
          severity: 'warn',
          file: 'test.css',
          message: 'New finding',
          line: 20,
          column: 10,
        },
      ];

      // Simulate what happens at call site:
      // 1. Filter against baseline
      const filtered = filterAgainstBaseline(allFindings, existingBaseline);
      const newFindings = filtered.new; // Would only contain fp2
      
      // 2. Call updateBaseline with ALL findings (correct behavior)
      const updated = updateBaseline(existingBaseline, allFindings, [mockTool], mockCtx);

      // Both findings should be in baseline
      expect(updated.entries).toHaveLength(2);
      expect(updated.entries.some(e => e.fingerprint === fp1)).toBe(true);
      expect(updated.entries.some(e => e.fingerprint === fp2)).toBe(true);

      // If updateBaseline was called with newFindings instead (wrong behavior),
      // fp1 would be pruned incorrectly
      const wrongUpdated = updateBaseline(existingBaseline, newFindings, [mockTool], mockCtx);
      expect(wrongUpdated.entries.some(e => e.fingerprint === fp1)).toBe(false); // Wrongly pruned!
      expect(wrongUpdated.entries).toHaveLength(1); // Only fp2 remains
    });
  });
});
