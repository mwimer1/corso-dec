#!/usr/bin/env tsx
import { existsSync, readFileSync } from 'fs';
import { glob } from 'glob';

console.log('🤖 AI SECURITY AUDIT - OpenAI Integration\n');
console.log('='.repeat(50));

const securityIssues: string[] = [];

// Helper to search for patterns in files
async function searchInFiles(
  patterns: string[],
  globPatterns: string[]
): Promise<boolean> {
  const files = await glob(globPatterns, { nodir: true });
  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      if (patterns.some((pattern) => new RegExp(pattern, 'i').test(content))) {
        return true;
      }
    } catch (error) {
      // ignore
    }
  }
  return false;
}

async function runChecks() {
  // 1. Check for prompt injection vulnerabilities - UPDATED
  console.log('\n🔍 1. Checking for prompt injection vulnerabilities...');
  const aiEndpoints = 'app/api/v1/dashboard';
  const chatComponents = 'lib/chat/query';

  // Check if sanitization is applied in AI endpoints
  const hasSanitization = await searchInFiles(
    ['sanitizeInput', 'assessInputSecurity'],
    [`${aiEndpoints}/**/*.ts`, `${chatComponents}/**/*.ts`]
  );

  if (!hasSanitization) {
    console.log('❌ No input sanitization found in AI endpoint calls');
    securityIssues.push('Missing input sanitization in OpenAI calls');
  } else {
    console.log('✅ Input sanitization detected in AI endpoints');
  }

  // 2. Check for SQL injection via AI-generated queries
  console.log(
    '\n🔍 2. Checking for SQL injection in AI-generated queries...'
  );
  const hasSqlGeneration = await searchInFiles(
    ['generateSQL', 'query.*user.*input'],
    ['lib/chat/**/*.ts', 'app/api/**/*.ts']
  );
  if (hasSqlGeneration) {
    const hasParameterization = await searchInFiles(
      ['validateAISQLSecurity', 'assessInputSecurity'],
      ['lib/chat/**/*.ts', 'app/api/**/*.ts']
    );
    if (!hasParameterization) {
      console.log('❌ SQL generation without security validation detected');
      securityIssues.push(
        'SQL injection vulnerability in AI-generated queries'
      );
    } else {
      console.log('✅ SQL security validation detected');
    }
  } else {
    console.log('ℹ️ No SQL generation found');
  }

  // 3. Check for rate limiting on AI endpoints
  console.log('\n🔍 3. Checking AI endpoint rate limiting...');
  const apiDir = 'app/api';
  if (existsSync(apiDir)) {
    const hasRateLimit = await searchInFiles(
      ['ratelimit', 'RATE_LIMIT', 'throttle'],
      [`${apiDir}/**/*.ts`]
    );
    if (!hasRateLimit) {
      console.log('❌ No rate limiting found on AI endpoints');
      securityIssues.push('Missing rate limiting on AI endpoints');
    } else {
      console.log('✅ Rate limiting detected on API routes');
    }
  } else {
    console.log('ℹ️ No API routes found');
  }

  // 4. Check for model version pinning - UPDATED
  console.log('\n🔍 4. Checking AI model version pinning...');
  const envFile = 'lib/server/env.ts';
  if (existsSync(envFile)) {
    const envContent = readFileSync(envFile, 'utf8');
    if (
      envContent.includes('OPENAI_SQL_MODEL') &&
      envContent.includes('OPENAI_CHART_MODEL')
    ) {
      console.log('✅ AI model versions are configurable');

      // Check for specific model versions in environment examples
      const envExampleFile = '.env.example';
      if (existsSync(envExampleFile)) {
        const envExample = readFileSync(envExampleFile, 'utf8');
        // Check if we have specific pinned versions (with date stamps)
        const hasPinnedVersions = /OPENAI_SQL_MODEL=.*\d{4}-\d{2}-\d{2}/.test(envExample);

        if (!hasPinnedVersions) {
          console.log(
            '⚠️ Using generic model versions detected - consider pinning to specific versions'
          );
          securityIssues.push(
            'AI model version drift risk - using generic versions instead of pinned versions'
          );
        } else {
          console.log('✅ Specific model versions are configured');
        }
      } else {
        console.log('❌ Environment example file not found');
        securityIssues.push('Missing environment configuration example');
      }
    } else {
      console.log('❌ AI model version environment variables not configured');
      securityIssues.push('Missing AI model version configuration');
    }
  } else {
    console.log('❌ Server environment configuration file not found');
    securityIssues.push('Missing environment configuration');
  }

  // 5. Check for ClickHouse query injection
  console.log(
    '\n🔍 5. Checking ClickHouse query injection vulnerabilities...'
  );
  const clickhouseFile = 'lib/integrations/clickhouse/index.ts';
  if (existsSync(clickhouseFile)) {
    const content = readFileSync(clickhouseFile, 'utf8');
    if (content.includes('validateSqlSecurity(sql)')) {
      console.log('✅ SQL security validation is properly implemented');
    } else {
      console.log(
        '⚠️ SQL security validation function not called in query execution'
      );
      securityIssues.push('Potential SQL injection in ClickHouse queries');
    }
  } else {
    console.log('ℹ️ No ClickHouse integration found');
  }

  // 6. Check for secrets in OpenAI requests
  console.log('\n🔍 6. Checking for secret exposure in AI requests...');
  const openaiIntegration = 'lib/integrations/openai';
  if (existsSync(openaiIntegration)) {
    const hasSecretMasking = await searchInFiles(
      ['maskSensitiveData', 'maskSensitive'],
      [`${openaiIntegration}/**/*.ts`, 'lib/security/**/*.ts']
    );
    if (!hasSecretMasking) {
      console.log('⚠️ No secret masking found in OpenAI integration');
      securityIssues.push('Potential secret exposure in AI requests');
    } else {
      console.log('✅ Secret masking functionality implemented');
    }
  } else {
    console.log('ℹ️ No OpenAI integration files found');
  }

  // 7. Check for security test coverage
  console.log('\n🔍 7. Checking security test coverage...');
  const securityTestDir = 'tests/security';
  if (existsSync(securityTestDir)) {
    const tests = await glob(`${securityTestDir}/**/*.test.ts`);
    const hasClickhouseTest = tests.some((t) =>
      t.includes('clickhouse-injection')
    );
    const hasAiSecretTest = tests.some((t) => t.includes('ai-secret-masking'));
    if (hasClickhouseTest) {
      console.log('✅ ClickHouse injection prevention tests found');
    }
    if (hasAiSecretTest) {
      console.log('✅ AI secret masking tests found');
    }
    if (!hasClickhouseTest || !hasAiSecretTest) {
      console.log('❌ Partial or no security tests found');
      securityIssues.push('Missing security test coverage');
    }
  } else {
    console.log('❌ Security test directory not found');
    securityIssues.push('Missing security test directory');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('🔒 AI SECURITY AUDIT SUMMARY');
  console.log('='.repeat(50));

  if (securityIssues.length === 0) {
    console.log('✅ No critical AI security issues found!');
  } else {
    console.log(`❌ Found ${securityIssues.length} security issue(s):`);
    securityIssues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
    console.log('\n🔧 RECOMMENDATIONS:');
    console.log(
      '   • Implement input sanitization for all user inputs to AI'
    );
    console.log('   • Use parameterized queries for AI-generated SQL');
    console.log('   • Implement rate limiting on all AI endpoints');
    console.log('   • Pin AI model versions to prevent drift');
    console.log(
      '   • Validate all ClickHouse queries for injection vulnerabilities'
    );
    console.log('   • Ensure no secrets are exposed in AI request logs');
  }

  process.exit(securityIssues.length > 0 ? 1 : 0);
}

runChecks().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});

