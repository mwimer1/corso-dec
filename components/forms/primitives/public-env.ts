'use client';
/**
 * Forms-local client env facade to avoid importing env via @/components or server-only modules.
 * Keeps domain boundaries clean and client-safe.
 */
import { publicEnv } from '@/lib/shared';

export { publicEnv };



