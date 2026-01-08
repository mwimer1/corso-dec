import { makeReqRes } from './node-mocks';

/**
 * Test harness for API route handlers that consolidates common testing patterns
 */
export async function testApiRoute(opts: {
  handler: (req: any, res: any) => any | Promise<any>;
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: any;
  assert: (res: { statusCode: number; body: any; headers: Record<string, string> }) => void | Promise<void>;
}) {
  const { req, res } = makeReqRes({
    method: opts.method ?? 'GET',
    url: opts.url ?? '/',
    headers: opts.headers ?? {},
    body: opts.body
  });

  await opts.handler(req, res);
  await opts.assert(res);
}

