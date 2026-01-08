/**
 * @module types/security/policy.types
 * @description Security policy type definitions for enterprise-grade security
 * @security Comprehensive types for security policies
 */

import type { SecurityThreatType } from '@/types/config/threat/types';
import type { ISODateString } from '../../shared/utils/dates/types';

/* ─────────────────────── Security Configuration Types ──────────────────────── */

/**
 * Security policy configuration
 * @security Defines how security rules and thresholds are configured
 */
export interface SecurityPolicy {
  /** Unique identifier for this policy */
  id: string;
  /** Human-readable name of the policy */
  name: string;
  /** Detailed description of what this policy enforces */
  description?: string | undefined;
  /** Whether this policy is currently active */
  enabled: boolean;
  /** Security rules that make up this policy */
  rules: SecurityRule[];
  /** When this policy was created */
  created_at: ISODateString;
  /** When this policy was last modified */
  updated_at: ISODateString;
}

/**
 * Individual security rule within a policy
 * @security Defines specific security checks and their thresholds
 */
export interface SecurityRule {
  /** Unique identifier for this rule */
  id: string;
  /** Type of security check this rule performs */
  type: SecurityThreatType;
  /** Action to take when this rule is triggered */
  action?: 'log' | 'warn' | 'block' | 'escalate' | 'throttle' | 'queue';
  /** Threshold configuration for triggering this rule */
  threshold: {
    /** Minimum confidence level required to trigger (0-1) */
    confidence: number;
    /** Minimum severity level required to trigger */
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
  /** Whether this rule is currently active */
  enabled: boolean;
}

