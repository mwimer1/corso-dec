/**
 * Security configuration type definitions
 * @module types/config/security
 * @description Security-specific configuration schemas for CSP and rate limits
 */

export interface SecurityConfig {
  enablePromptGuard: boolean;
  sqlScopeEnforcement: 'strict' | 'permissive';
  maxUploadSize: number;
  allowedFileTypes: string[];
  enableTurnstile: boolean;
  enableExternalSSO: boolean;
  corsOrigins: string[];
  cspSettings: CSPConfig;
  rateLimits: RateLimitConfig;
}

interface CSPConfig {
  enabled: boolean;
  reportOnly: boolean;
  scriptDomains: string[];
  styleDomains: string[];
  fontDomains: string[];
  imgDomains: string[];
  connectDomains: string[];
  frameDomains: string[];
  reportUri?: string;
}

interface RateLimitConfig {
  openai: {
    perMinute: number;
    timeout: number;
    maxRetries: number;
    slowThreshold: number;
    tokensWarnThreshold: number;
  };
  clickhouse: {
    perMinute: number;
    slowQueryMs: number;
  };
  auth: {
    idleTimeoutMin: number;
  };
  api: {
    perMinute: number;
    burstLimit: number;
  };
}

