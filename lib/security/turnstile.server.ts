// lib/security/turnstile.server.ts
import { getEnv } from '@/lib/server/env';
import 'server-only';

type VerifyResp = { success: boolean; 'error-codes'?: string[] };

export async function verifyTurnstileToken(token: string, remoteip?: string): Promise<boolean> {
  const { TURNSTILE_SECRET_KEY } = getEnv();
  if (!TURNSTILE_SECRET_KEY || !token) return false;

  const body = new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token });
  if (remoteip) body.set('remoteip', remoteip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  if (!res.ok) return false;

  const json = (await res.json()) as VerifyResp;
  return !!json.success;
}

