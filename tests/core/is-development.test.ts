import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { isDevelopment } from '@/lib/shared/env/is-development';

declare global {

  var __CORSO_DEV__: boolean | undefined;
}

type MutableWindow = {
  __PUBLIC_ENV__?: Record<string, string | undefined>;
  hasOwnProperty: (key: PropertyKey) => boolean;
};

const globalRecord = globalThis as Record<string, unknown>;
const originalWindow = globalRecord.window;
const originalGlobalFlag = (globalRecord.__CORSO_DEV__ as boolean | undefined) ?? undefined;

const resetWindow = () => {
  if (typeof originalWindow === 'undefined') {
    delete globalRecord.window;
  } else {
    globalRecord.window = originalWindow;
  }
};

const resetGlobalFlag = () => {
  if (typeof originalGlobalFlag === 'undefined') {
    delete globalRecord.__CORSO_DEV__;
  } else {
    globalRecord.__CORSO_DEV__ = originalGlobalFlag;
  }
};

beforeEach(() => {
  const windowMock: Partial<MutableWindow> = {
    __PUBLIC_ENV__: {},
  };
  windowMock.hasOwnProperty = Object.prototype.hasOwnProperty;
  globalRecord.window = windowMock;
  delete globalRecord.__CORSO_DEV__;
});

afterEach(() => {
  resetWindow();
  resetGlobalFlag();
});

describe('isDevelopment', () => {
  test('returns true when NEXT_PUBLIC_STAGE is development', () => {
    const windowObj = globalRecord.window as MutableWindow;
    windowObj.__PUBLIC_ENV__ = { NEXT_PUBLIC_STAGE: 'development' };

    expect(isDevelopment()).toBe(true);
  });

  test('returns false when NEXT_PUBLIC_STAGE is production', () => {
    const windowObj = globalRecord.window as MutableWindow;
    windowObj.__PUBLIC_ENV__ = { NEXT_PUBLIC_STAGE: 'production' };

    expect(isDevelopment()).toBe(false);
  });

  test('prefers global __CORSO_DEV__ flag when present', () => {
    const windowObj = globalRecord.window as MutableWindow;
    windowObj.__PUBLIC_ENV__ = { NEXT_PUBLIC_STAGE: 'production' };
    globalRecord.__CORSO_DEV__ = true;

    expect(isDevelopment()).toBe(true);
  });

  test('respects explicit false global flag', () => {
    const windowObj = globalRecord.window as MutableWindow;
    windowObj.__PUBLIC_ENV__ = { NEXT_PUBLIC_STAGE: 'development' };
    globalRecord.__CORSO_DEV__ = false;

    expect(isDevelopment()).toBe(false);
  });
});

