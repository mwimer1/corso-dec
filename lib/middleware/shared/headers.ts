// lib/middleware/shared/headers.ts
import { NextResponse } from 'next/server';

export function exposeHeader(res: Response | NextResponse, name: string): NextResponse {
  const response = res instanceof NextResponse
    ? res
    : new NextResponse(res.body, { status: res.status, headers: res.headers });

  const existing = response.headers.get('Access-Control-Expose-Headers');
  const set = new Set((existing ?? '').split(',').map((s) => s.trim()).filter(Boolean));
  set.add(name);
  response.headers.set('Access-Control-Expose-Headers', Array.from(set).join(', '));
  return response;
}
