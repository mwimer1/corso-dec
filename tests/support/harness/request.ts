// tests/support/harness/request.ts
import { NextRequest } from 'next/server';

type BuildRequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  ip?: string;
};

export function buildRequest(url: string, opts: BuildRequestOptions = {}): NextRequest {
  const { method = 'GET', headers = {}, ip } = opts;
  const mergedHeaders = new Headers(headers);
  if (ip && !mergedHeaders.has('x-forwarded-for')) {
    mergedHeaders.set('x-forwarded-for', ip);
  }
  return new NextRequest(url, { method, headers: mergedHeaders });
}



