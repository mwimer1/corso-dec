#!/usr/bin/env tsx
/**
 * HTML Report Generator
 *
 * Generates an HTML report from the JSON audit report.
 * Optional nice-to-have for better visualization of findings.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { AuditReport } from './report';

const SEVERITY_COLORS = {
  error: '#dc2626', // red
  warn: '#f59e0b',  // amber
  info: '#3b82f6',  // blue
};

const SEVERITY_ICONS = {
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
};

/**
 * Generate HTML report from JSON report
 */
export function generateHtmlReport(jsonReportPath: string, outputPath: string): void {
  if (!existsSync(jsonReportPath)) {
    throw new Error(`Report file not found: ${jsonReportPath}`);
  }

  const report: AuditReport = JSON.parse(readFileSync(jsonReportPath, 'utf8'));

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSS Audit Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 2rem;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      padding: 2rem;
    }
    h1 {
      color: #111827;
      margin-bottom: 0.5rem;
      font-size: 2rem;
    }
    .timestamp {
      color: #6b7280;
      font-size: 0.875rem;
      margin-bottom: 2rem;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .summary-card {
      padding: 1rem;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      background: #f9fafb;
    }
    .summary-card h3 {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .summary-card .value {
      font-size: 2rem;
      font-weight: bold;
      color: #111827;
    }
    .severity-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-right: 0.5rem;
    }
    .severity-error { background: #fee2e2; color: #991b1b; }
    .severity-warn { background: #fef3c7; color: #92400e; }
    .severity-info { background: #dbeafe; color: #1e40af; }
    .findings-section {
      margin-top: 2rem;
    }
    .findings-section h2 {
      color: #111827;
      margin-bottom: 1rem;
      font-size: 1.5rem;
    }
    .finding {
      padding: 1rem;
      margin-bottom: 1rem;
      border-left: 4px solid;
      border-radius: 4px;
      background: #f9fafb;
    }
    .finding-error { border-color: ${SEVERITY_COLORS.error}; }
    .finding-warn { border-color: ${SEVERITY_COLORS.warn}; }
    .finding-info { border-color: ${SEVERITY_COLORS.info}; }
    .finding-header {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .finding-message {
      font-weight: 600;
      color: #111827;
      margin-bottom: 0.25rem;
    }
    .finding-file {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.875rem;
      color: #6b7280;
    }
    .finding-hint {
      margin-top: 0.5rem;
      padding: 0.75rem;
      background: white;
      border-radius: 4px;
      font-size: 0.875rem;
      color: #4b5563;
    }
    .tool-section {
      margin-top: 2rem;
    }
    .tool-section h2 {
      color: #111827;
      margin-bottom: 1rem;
      font-size: 1.25rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e5e7eb;
    }
    .top-files, .top-rules {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .top-item {
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 4px;
      border: 1px solid #e5e7eb;
    }
    .top-item .name {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .top-item .count {
      color: #6b7280;
      font-size: 0.875rem;
    }
    .metadata {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
      font-size: 0.875rem;
      color: #6b7280;
    }
    .metadata-item {
      margin-bottom: 0.5rem;
    }
    .no-findings {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }
    .no-findings-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>CSS Audit Report</h1>
    <div class="timestamp">Generated: ${new Date(report.generatedAt).toLocaleString()}</div>

    <div class="summary">
      <div class="summary-card">
        <h3>Total Findings</h3>
        <div class="value">${report.summary.totalFindings}</div>
      </div>
      <div class="summary-card">
        <h3>New Findings</h3>
        <div class="value">${report.summary.new}</div>
      </div>
      <div class="summary-card">
        <h3>Suppressed</h3>
        <div class="value">${report.summary.suppressed}</div>
      </div>
      <div class="summary-card">
        <h3>Errors</h3>
        <div class="value" style="color: ${SEVERITY_COLORS.error}">${report.summary.bySeverity.error}</div>
      </div>
      <div class="summary-card">
        <h3>Warnings</h3>
        <div class="value" style="color: ${SEVERITY_COLORS.warn}">${report.summary.bySeverity.warn}</div>
      </div>
      <div class="summary-card">
        <h3>Info</h3>
        <div class="value" style="color: ${SEVERITY_COLORS.info}">${report.summary.bySeverity.info}</div>
      </div>
    </div>

    ${report.summary.topRuleIds.length > 0 ? `
    <div class="tool-section">
      <h2>Top Rule Violations</h2>
      <div class="top-rules">
        ${report.summary.topRuleIds.map(({ ruleId, count }) => `
          <div class="top-item">
            <div class="name">${escapeHtml(ruleId)}</div>
            <div class="count">${count} finding(s)</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${report.summary.topFiles.length > 0 ? `
    <div class="tool-section">
      <h2>Files with Most Issues</h2>
      <div class="top-files">
        ${report.summary.topFiles.map(({ file, count }) => `
          <div class="top-item">
            <div class="name">${escapeHtml(file)}</div>
            <div class="count">${count} finding(s)</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${report.findings.length > 0 ? `
    <div class="findings-section">
      <h2>Findings (${report.findings.length})</h2>
      ${report.findings.map(finding => `
        <div class="finding finding-${finding.severity}">
          <div class="finding-header">
            <span class="severity-badge severity-${finding.severity}">
              ${SEVERITY_ICONS[finding.severity]} ${finding.severity.toUpperCase()}
            </span>
            ${finding.file ? `<span class="finding-file">${escapeHtml(finding.file)}${typeof finding.line === 'number' ? `:${finding.line}${typeof finding.col === 'number' ? `:${finding.col}` : ''}` : ''}</span>` : ''}
          </div>
          <div class="finding-message">${escapeHtml(finding.message)}</div>
          <div class="finding-file" style="margin-top: 0.25rem; font-size: 0.75rem; color: #9ca3af;">
            ${escapeHtml(finding.ruleId)} • ${escapeHtml(finding.tool)}
          </div>
          ${finding.hint ? `
          <div class="finding-hint">
            <strong>Hint:</strong> ${escapeHtml(finding.hint)}
          </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    ` : `
    <div class="no-findings">
      <div class="no-findings-icon">✅</div>
      <h2>No New Findings</h2>
      <p>All CSS files pass the audit checks!</p>
    </div>
    `}

    <div class="metadata">
      <div class="metadata-item"><strong>Mode:</strong> ${report.metadata.mode}</div>
      ${report.metadata.sinceRef ? `<div class="metadata-item"><strong>Since:</strong> ${escapeHtml(report.metadata.sinceRef)}</div>` : ''}
      <div class="metadata-item"><strong>Changed Files:</strong> ${report.metadata.changedFilesCount}</div>
      <div class="metadata-item"><strong>Tools Run:</strong> ${report.metadata.toolsRun.join(', ')}</div>
    </div>
  </div>
</body>
</html>`;

  // Ensure output directory exists
  const outputDir = dirname(outputPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(outputPath, html, 'utf8');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
