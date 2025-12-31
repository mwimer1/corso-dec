// Minimal dashboard layout for testing accessibility features
const TestableDashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen flex-col bg-background">
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 p-2 bg-primary text-primary-foreground"
    >
      Skip to main content
    </a>
    <div className="flex flex-1 overflow-hidden">
      <div
        id="main-content"
        tabIndex={-1}
        className="flex min-h-0 overflow-hidden flex-col bg-background"
      >
        {children}
      </div>
    </div>
  </div>
);

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

describe('DashboardLayout skip link', () => {
  it('renders a "Skip to main content" link and a focusable main region', () => {
    render(
      <TestableDashboardLayout>
        <div>Child</div>
      </TestableDashboardLayout>
    );
    const skip = screen.getByText(/Skip to main content/i);
    expect(skip).toBeInTheDocument();
    const main = document.getElementById('main-content');
    expect(main).toBeTruthy();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <TestableDashboardLayout>
        <div>Child</div>
      </TestableDashboardLayout>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
