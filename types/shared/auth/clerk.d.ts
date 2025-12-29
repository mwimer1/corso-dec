declare global {
  interface CustomJwtSessionClaims {
    metadata?: {
      onboardingComplete?: boolean;
      onboardingData?: Record<string, unknown> | null;
    };
  }
}

export { };


