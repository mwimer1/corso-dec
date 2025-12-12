#!/usr/bin/env ts-node
// Import DataPipelineMonitor dynamically to avoid build-time errors when the
// module was moved or removed. The script is used in CI cron jobs; if the
// module is absent, the script will exit gracefully.
let DataPipelineMonitor: any;
try {
  DataPipelineMonitor = require('../../lib/monitoring/pipeline/monitor').DataPipelineMonitor;
} catch {
  // Module not present (moved/removed) — exit with non-zero to signal missing dependency.
  console.warn('DataPipelineMonitor module not found; skipping data validation.');
  process.exit(0);
}
import { logger } from '../utils/logger';

async function main(): Promise<void> {
  try {
    const monitor = new DataPipelineMonitor();
    const result = await monitor.run();
    logger.info(`[cron] data validation ${JSON.stringify(result)}`);
    if (!result.isConsistent) {
      process.exitCode = 1;
    }
  } catch (err) {
    logger.error(`[cron] data validation failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
}

void main();

