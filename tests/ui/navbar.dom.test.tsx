import { Navbar } from '@/components/ui/organisms/navbar/navbar';
import * as clerkModule from '@clerk/nextjs';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock APP_LINKS - mock both @/components and @/lib/shared since Navbar imports from @/components
vi.mock('@/components', () => ({
  APP_LINKS: {
    NAV: {
      HOME: '/',
      SIGNIN: '/sign-in',
      SIGNUP: '/sign-up',
      INSIGHTS: '/insights',
    },
    DASHBOARD: {
      PROJECTS: '/dashboard/projects',
    },
  },
}));

vi.mock('@/lib/shared', () => ({
  APP_LINKS: {
    NAV: {
      HOME: '/',
      SIGNIN: '/sign-in',
      SIGNUP: '/sign-up',
      INSIGHTS: '/insights',
    },
    DASHBOARD: {
      PROJECTS: '/dashboard/projects',
    },
  },
}));

// Mock Clerk's useAuth hook
vi.mock('@clerk/nextjs', () => ({
  useAuth: vi.fn(),
  UserButton: ({ afterSignOutUrl }: { afterSignOutUrl: string }) => (
    <div data-testid="user-button" data-after-sign-out-url={afterSignOutUrl}>
      User Button
    </div>
  ),
}));

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() { return []; }
  unobserve() {}
} as any;

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CTA rendering logic', () => {
    it('shows CTAs in landing mode when user is signed out', () => {
      vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
        isSignedIn: false,
      } as any);

      render(<Navbar mode="landing" />);

      // Should show Sign in and Sign up buttons
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
      expect(screen.getByText(/sign up|start for free/i)).toBeInTheDocument();
      expect(screen.queryByTestId('user-button')).not.toBeInTheDocument();
    });

    it('shows CTAs in landing mode even when user is signed in (forceShowCTAs behavior)', () => {
      vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
        isSignedIn: true,
      } as any);

      render(<Navbar mode="landing" />);

      // Landing mode always shows CTAs regardless of auth state
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
      expect(screen.getByText(/sign up|start for free/i)).toBeInTheDocument();
      expect(screen.queryByTestId('user-button')).not.toBeInTheDocument();
    });

    it('shows CTAs in insights mode when user is signed out', () => {
      vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
        isSignedIn: false,
      } as any);

      render(<Navbar mode="insights" />);

      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
      expect(screen.getByText(/sign up|start for free/i)).toBeInTheDocument();
      expect(screen.queryByTestId('user-button')).not.toBeInTheDocument();
    });

    it('shows CTAs in insights mode even when user is signed in', () => {
      vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
        isSignedIn: true,
      } as any);

      render(<Navbar mode="insights" />);

      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
      expect(screen.getByText(/sign up|start for free/i)).toBeInTheDocument();
      expect(screen.queryByTestId('user-button')).not.toBeInTheDocument();
    });

    it('shows UserButton in app mode when user is signed in', () => {
      vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
        isSignedIn: true,
      } as any);

      render(<Navbar mode="app" />);

      expect(screen.getByTestId('user-button')).toBeInTheDocument();
      expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
    });

    it('shows CTAs in app mode when user is signed out', () => {
      vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
        isSignedIn: false,
      } as any);

      render(<Navbar mode="app" />);

      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
      expect(screen.getByText(/sign up|start for free/i)).toBeInTheDocument();
      expect(screen.queryByTestId('user-button')).not.toBeInTheDocument();
    });

    it('shows CTAs in minimal mode', () => {
      vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
        isSignedIn: false,
      } as any);

      render(<Navbar mode="minimal" />);

      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
      expect(screen.getByText(/sign up|start for free/i)).toBeInTheDocument();
    });

    it('respects forceShowCTAs prop to override default behavior', () => {
      vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
        isSignedIn: true,
      } as any);

      // In app mode with signed in user, normally shows UserButton
      // But forceShowCTAs=true should show CTAs instead
      render(<Navbar mode="app" forceShowCTAs={true} />);

      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
      expect(screen.getByText(/sign up|start for free/i)).toBeInTheDocument();
      expect(screen.queryByTestId('user-button')).not.toBeInTheDocument();
    });
  });

  describe('Mobile menu toggle', () => {
    it('toggles mobile menu when menu button is clicked', async () => {
      vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
        isSignedIn: false,
      } as any);

      const { container } = render(<Navbar mode="landing" />);

      // Find the mobile menu button by aria-controls attribute
      const menuButton = container.querySelector('[aria-controls="mobile-menu"]') as HTMLButtonElement;
      expect(menuButton).toBeInTheDocument();

      // Click to open
      fireEvent.click(menuButton);
      
      // Wait for mobile menu to appear
      await waitFor(() => {
        // Mobile navigation should be accessible
        expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });

  describe('Breadcrumbs', () => {
    it('renders breadcrumbs when showBreadcrumbs is true and breadcrumbs are provided', () => {
      vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
        isSignedIn: false,
      } as any);

      const breadcrumbs = [
        { href: '/', label: 'Home' },
        { href: '/insights', label: 'Insights' },
        { href: '/insights/article', label: 'Article' },
      ];

      render(
        <Navbar
          mode="insights"
          showBreadcrumbs={true}
          breadcrumbs={breadcrumbs}
        />
      );

      const breadcrumbNav = screen.getByRole('navigation', { name: /breadcrumb/i });
      expect(breadcrumbNav).toBeInTheDocument();
      
      // Query within breadcrumb nav to avoid duplicate "Insights" from primary navigation
      expect(breadcrumbNav).toHaveTextContent('Home');
      expect(breadcrumbNav).toHaveTextContent('Insights');
      expect(breadcrumbNav).toHaveTextContent('Article');
    });

    it('does not render breadcrumbs when showBreadcrumbs is false', () => {
      vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
        isSignedIn: false,
      } as any);

      const breadcrumbs = [
        { href: '/', label: 'Home' },
        { href: '/insights', label: 'Insights' },
      ];

      render(
        <Navbar
          mode="insights"
          showBreadcrumbs={false}
          breadcrumbs={breadcrumbs}
        />
      );

      expect(screen.queryByRole('navigation', { name: /breadcrumb/i })).not.toBeInTheDocument();
    });

    it('does not render breadcrumbs when breadcrumbs array is empty', () => {
      vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
        isSignedIn: false,
      } as any);

      render(
        <Navbar
          mode="insights"
          showBreadcrumbs={true}
          breadcrumbs={[]}
        />
      );

      expect(screen.queryByRole('navigation', { name: /breadcrumb/i })).not.toBeInTheDocument();
    });
  });

  describe('Navigation items', () => {
    it('renders custom nav items when provided', async () => {
      vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
        isSignedIn: false,
      } as any);

      const customItems = [
        { href: '/custom1', label: 'Custom 1' },
        { href: '/custom2', label: 'Custom 2' },
      ];

      render(<Navbar mode="landing" items={customItems} />);

      // Custom items are rendered in mobile menu (desktop always uses MenuPrimaryLinks)
      // Open mobile menu to check custom items
      const { container } = render(<Navbar mode="landing" items={customItems} />);
      const menuButton = container.querySelector('[aria-controls="mobile-menu"]') as HTMLButtonElement;
      expect(menuButton).toBeInTheDocument();
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Custom 1')).toBeInTheDocument();
        expect(screen.getByText('Custom 2')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('uses default nav items when none provided', () => {
      vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
        isSignedIn: false,
      } as any);

      render(<Navbar mode="landing" />);

      // Should render default landing nav items (from PRIMARY_LINKS)
      expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
    });
  });

  describe('Logo', () => {
    it('renders logo with home link', () => {
      vi.spyOn(clerkModule, 'useAuth').mockReturnValue({
        isSignedIn: false,
      } as any);

      render(<Navbar mode="landing" />);

      const logoLink = screen.getByLabelText('Corso home');
      expect(logoLink).toBeInTheDocument();
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });
});

