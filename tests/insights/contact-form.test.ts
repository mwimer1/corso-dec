import { submitContactForm } from '@/app/(marketing)/contact/actions';
import { ApplicationError } from '@/lib/actions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import mockHeaders - using relative path to avoid alias resolution issues
// The vitest alias for 'next/headers' maps to the mock file, which can interfere
// with imports. Using a relative path ensures we get the actual utility object.
import { mockHeaders } from '../support/mocks/index';

// Mock dependencies
const mockVerifyTurnstileToken = vi.fn();
const mockWithRateLimit = vi.fn();

vi.mock('@/lib/security/server', () => ({
  verifyTurnstileToken: (token: string, ip: string) => mockVerifyTurnstileToken(token, ip),
}));

vi.mock('@/lib/middleware/http/rate-limit', () => ({
  withRateLimit: (key: string, limits: any) => mockWithRateLimit(key, limits),
}));

describe('submitContactForm action', () => {
  beforeEach(() => {
    // Guard: fail fast if mockHeaders is undefined
    expect(mockHeaders).toBeDefined();
    expect(mockHeaders.setup).toBeDefined();
    
    // Reset headers mock first to ensure clean state
    mockHeaders.reset();
    
    // Clear all mocks (clears call history for other mocks)
    vi.clearAllMocks();
    
    // Setup headers mock with the expected IP
    // Must be done after clearAllMocks to ensure the mock return value is set
    mockHeaders.setup({
      headers: { 'cf-connecting-ip': '192.168.1.1' },
    });
    
    // Setup other mocks
    mockVerifyTurnstileToken.mockResolvedValue(true);
    mockWithRateLimit.mockResolvedValue(undefined);
  });

  it('validates input with Zod schema', async () => {
    await expect(
      submitContactForm({
        name: '', // Invalid: empty name
        email: 'invalid-email', // Invalid: not an email
        message: 'Test message',
        turnstileToken: 'valid-token',
      })
    ).rejects.toThrow();
  });

  it('rejects requests without turnstile token', async () => {
    await expect(
      submitContactForm({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Test message',
        // Missing turnstileToken
      })
    ).rejects.toThrow(ApplicationError);
  });

  it('rejects requests with invalid turnstile token', async () => {
    mockVerifyTurnstileToken.mockResolvedValue(false);

    await expect(
      submitContactForm({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Test message',
        turnstileToken: 'invalid-token',
      })
    ).rejects.toThrow(ApplicationError);
  });

  it('applies rate limiting after bot verification', async () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Test message',
      turnstileToken: 'valid-token',
    };

    await submitContactForm(validData);

    expect(mockVerifyTurnstileToken).toHaveBeenCalledWith('valid-token', '192.168.1.1');
    expect(mockWithRateLimit).toHaveBeenCalled();
  });

  it('returns success message for valid submission', async () => {
    const result = await submitContactForm({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Test message',
      turnstileToken: 'valid-token',
    });

    expect(result).toEqual({
      success: true,
      message: "Thank you! We'll be in touch soon.",
    });
  });

  it('handles rate limit errors', async () => {
    mockWithRateLimit.mockRejectedValue(new Error('Rate limit exceeded'));

    await expect(
      submitContactForm({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Test message',
        turnstileToken: 'valid-token',
      })
    ).rejects.toThrow();
  });
});

