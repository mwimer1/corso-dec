import { InsightHeaderBlock } from '@/components/insights/widgets/insight-header-block';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock Next.js Image component to avoid priority/lazy loading conflicts in tests
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => (
    <img src={src} alt={alt} data-testid="next-image" {...props} />
  ),
}));

describe('InsightHeaderBlock', () => {
  const defaultProps = {
    title: 'Test Article Title',
    publishDate: '2025-01-15' as const,
    readingTime: 5,
    author: { name: 'Test Author' },
    categories: [{ slug: 'data', name: 'Data' }],
  };

  it('renders all header elements', () => {
    render(<InsightHeaderBlock {...defaultProps} />);

    // Back navigation
    expect(screen.getByRole('navigation', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByText('Back to Insights')).toBeInTheDocument();

    // Categories
    expect(screen.getByText('Data')).toBeInTheDocument();

    // Title
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('Test Article Title');

    // Metadata
    expect(screen.getByText(/Jan 15, 2025/)).toBeInTheDocument();
    expect(screen.getByText('5 min read')).toBeInTheDocument();
    expect(screen.getByText(/Written by/)).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('renders without optional props', () => {
    render(<InsightHeaderBlock title="Minimal Title" />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Minimal Title');
    expect(screen.getByText('Back to Insights')).toBeInTheDocument();
  });

  it('renders updated date when different from publish date', () => {
    render(
      <InsightHeaderBlock
        {...defaultProps}
        publishDate="2025-01-15"
        updatedDate="2025-02-01"
      />
    );

    expect(screen.getByText(/Updated Feb 1, 2025/)).toBeInTheDocument();
  });

  it('renders hero image when provided', () => {
    // Mock Next.js Image component to avoid priority/lazy conflict
    vi.mock('next/image', () => ({
      default: ({ src, alt, ...props }: any) => (
        <img src={src} alt={alt} data-testid="hero-image" {...props} />
      ),
    }));

    render(
      <InsightHeaderBlock
        {...defaultProps}
        heroImageUrl="/test-image.jpg"
        heroCaption="Test caption"
      />
    );

    const image = screen.getByAltText('Test Article Title');
    expect(image).toBeInTheDocument();
    expect(screen.getByText('Test caption')).toBeInTheDocument();
  });

  it('does not render hero image when not provided', () => {
    render(<InsightHeaderBlock {...defaultProps} />);

    const images = screen.queryAllByRole('img');
    // Only author avatar image should be present (if author has avatar)
    expect(images.length).toBeLessThanOrEqual(1);
  });

  it('renders multiple categories', () => {
    render(
      <InsightHeaderBlock
        {...defaultProps}
        categories={[
          { slug: 'data', name: 'Data' },
          { slug: 'operations', name: 'Operations' },
        ]}
      />
    );

    expect(screen.getByText('Data')).toBeInTheDocument();
    expect(screen.getByText('Operations')).toBeInTheDocument();
  });

  it('renders author avatar when provided', () => {
    render(
      <InsightHeaderBlock
        {...defaultProps}
        author={{ name: 'Test Author', avatar: '/avatar.jpg' }}
      />
    );

    const avatar = screen.getByAltText('Test Author');
    expect(avatar).toBeInTheDocument();
  });

  it('uses custom backHref when provided', () => {
    render(<InsightHeaderBlock title="Test" backHref="/custom" />);

    const link = screen.getByRole('link', { name: /Back to Insights/ });
    expect(link).toHaveAttribute('href', '/custom');
  });

  it('applies custom className', () => {
    const { container } = render(
      <InsightHeaderBlock title="Test" className="custom-class" />
    );

    const header = container.querySelector('header');
    expect(header).toHaveClass('custom-class');
  });
});

