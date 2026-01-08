import RouteThemeProvider from '@/app/providers/route-theme-provider';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// Mock document for testing
const mockDocumentElement = {
  dataset: {},
};

Object.defineProperty(document, 'documentElement', {
  value: mockDocumentElement,
  writable: true,
});

describe('RouteThemeProvider', () => {
  it('sets the correct theme on documentElement', () => {
    // Clear any existing theme
    delete mockDocumentElement.dataset.routeTheme;

    render(
      <RouteThemeProvider theme="auth">
        <div>Test content</div>
      </RouteThemeProvider>
    );

    expect(mockDocumentElement.dataset.routeTheme).toBe('auth');
  });

  it('is an invisible component that returns null', () => {
    const { container } = render(
      <RouteThemeProvider theme="marketing" />
    );

    // The provider returns null, so container should be empty
    expect(container.firstChild).toBeNull();
  });
});
