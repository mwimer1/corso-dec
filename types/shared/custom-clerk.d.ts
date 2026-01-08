declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      onboardingComplete?: boolean;
      onboardingData?: Record<string, unknown> | null;
    };
  }

  interface Window {
    analytics?: {
      track: (event: string, payload?: Record<string, unknown>) => void;
      identify?: (userId: string, traits?: Record<string, unknown>) => void;
      page?: (name?: string, properties?: Record<string, unknown>) => void;
    };
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}

export { };


