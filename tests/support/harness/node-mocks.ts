import { vi } from 'vitest';

/**
 * Type definitions for Node.js mock objects
 */
export type NodeMocks = {
  req: {
    headers: Record<string, string>;
    body?: any;
    method?: string;
    url?: string;
  };
  res: {
    statusCode: number;
    headers: Record<string, string>;
    body?: any;
    setHeader(k: string, v: string): void;
    end(b?: any): void;
  };
};

/**
 * Creates a unified Node.js request/response mock pair
 */
export function createNodeMocks(init?: Partial<NodeMocks>): NodeMocks {
  const resHeaders: Record<string, string> = {};
  const res: NodeMocks['res'] = {
    statusCode: 200,
    headers: resHeaders,
    body: undefined,
    setHeader(k, v) { resHeaders[k.toLowerCase()] = v; },
    end(b) { res.body = b; },
  };
  const req: NodeMocks['req'] = {
    headers: {},
    method: 'GET',
    url: '/',
  };
  return {
    req: { ...req, ...(init?.req ?? {}) },
    res: { ...res, ...(init?.res ?? {}) }
  };
}

/**
 * Simplified helper for common request/response scaffolding
 */
export function makeReqRes(init: Partial<{ method: string; url: string; headers: Record<string,string>; body: any; }> = {}) {
  const req = { method: init.method ?? 'GET', url: init.url ?? '/', headers: init.headers ?? {}, body: init.body } as any;
  const res: any = { statusCode: 200, headers: {}, body: undefined,
    setHeader(k: string, v: string){ this.headers[k] = v; },
    end(b?: any){ this.body = b; }
  };
  return { req, res };
}

/**
 * Installs global mock utilities for consistent Node.js testing
 */
export function installNodeMocks(variant: 'full' | 'minimal' | 'fs-only' = 'full') {
  if (variant === 'full' || variant === 'minimal') {
    mockChildProcessExecSync();
    mockGlob();
  }

  if (variant === 'full' || variant === 'fs-only') {
    mockFsWithPromises();
  }
}

export function mockChildProcessExecSync() {
  vi.mock('child_process', async (importOriginal) => {
    const actual = (await importOriginal()) as any;
    return {
      ...actual,
      execSync: vi.fn(),
    };
  });
}

export function mockFsWithPromises() {
  vi.mock('fs', async (importOriginal) => {
    const actual = (await importOriginal()) as any;
    return {
      ...actual,
      promises: {
        readFile: vi.fn(),
        writeFile: vi.fn(),
        access: vi.fn(),
      },
    };
  });
}

export function mockFsExistsOnly() {
  vi.mock('fs', async (importOriginal) => {
    const actual = (await importOriginal()) as any;
    return {
      ...actual,
      existsSync: vi.fn(),
    };
  });
}

export function mockGlob() {
  vi.mock('glob', () => ({
    glob: vi.fn(),
  }));
}



