/**
 * Unit tests for GlassCard component
 * Tests rendering, props handling, and accessibility features
 */

import { render } from '@testing-library/react';
import GlassCard from './GlassCard';

describe('GlassCard Component', () => {
  it('renders children content correctly', () => {
    const { getByText } = render(
      <GlassCard>
        <div>Test Content</div>
      </GlassCard>
    );
    
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('applies default single column span', () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    const card = container.firstChild;
    
    expect(card).toHaveClass('bento-col-1');
    expect(card).toHaveClass('bento-row-1');
  });

  it('applies custom column span from props', () => {
    const { container } = render(<GlassCard colSpan={3}>Content</GlassCard>);
    const card = container.firstChild;
    
    expect(card).toHaveClass('bento-col-3');
  });

  it('applies custom row span from props', () => {
    const { container } = render(<GlassCard rowSpan={2}>Content</GlassCard>);
    const card = container.firstChild;
    
    expect(card).toHaveClass('bento-row-2');
  });

  it('applies both column and row spans', () => {
    const { container } = render(
      <GlassCard colSpan={2} rowSpan={2}>Content</GlassCard>
    );
    const card = container.firstChild;
    
    expect(card).toHaveClass('bento-col-2');
    expect(card).toHaveClass('bento-row-2');
  });

  it('renders as div by default', () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    
    expect(container.firstChild.tagName).toBe('DIV');
  });

  it('renders as semantic HTML element when specified', () => {
    const { container: sectionContainer } = render(
      <GlassCard as="section">Content</GlassCard>
    );
    expect(sectionContainer.firstChild.tagName).toBe('SECTION');

    const { container: articleContainer } = render(
      <GlassCard as="article">Content</GlassCard>
    );
    expect(articleContainer.firstChild.tagName).toBe('ARTICLE');
  });

  it('includes ARIA label when provided', () => {
    const { getByLabelText } = render(
      <GlassCard ariaLabel="Metrics card">
        <div>Metrics</div>
      </GlassCard>
    );
    
    expect(getByLabelText('Metrics card')).toBeInTheDocument();
  });

  it('includes ARIA role when provided', () => {
    const { container } = render(
      <GlassCard role="region">Content</GlassCard>
    );
    
    expect(container.firstChild).toHaveAttribute('role', 'region');
  });

  it('applies default variant class', () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    const card = container.firstChild;
    
    expect(card.className).toContain('default');
  });

  it('applies subtle variant class when specified', () => {
    const { container } = render(
      <GlassCard variant="subtle">Content</GlassCard>
    );
    const card = container.firstChild;
    
    expect(card.className).toContain('subtle');
  });

  it('applies hover class by default', () => {
    const { container } = render(<GlassCard>Content</GlassCard>);
    const card = container.firstChild;
    
    expect(card.className).toContain('hover');
  });

  it('does not apply hover class when hover is false', () => {
    const { container } = render(<GlassCard hover={false}>Content</GlassCard>);
    const card = container.firstChild;
    
    expect(card.className).not.toContain('hover');
  });

  it('applies custom className alongside default classes', () => {
    const { container } = render(
      <GlassCard className="custom-class">Content</GlassCard>
    );
    const card = container.firstChild;
    
    expect(card).toHaveClass('custom-class');
    expect(card.className).toContain('glassCard');
  });

  it('handles all props together', () => {
    const { container, getByLabelText } = render(
      <GlassCard
        colSpan={4}
        rowSpan={2}
        variant="subtle"
        hover={false}
        className="my-card"
        as="section"
        role="region"
        ariaLabel="Dashboard metrics"
      >
        <div>Full content</div>
      </GlassCard>
    );
    
    const card = container.firstChild;
    
    expect(card.tagName).toBe('SECTION');
    expect(card).toHaveClass('bento-col-4');
    expect(card).toHaveClass('bento-row-2');
    expect(card.className).toContain('subtle');
    expect(card.className).not.toContain('hover');
    expect(card).toHaveClass('my-card');
    expect(card).toHaveAttribute('role', 'region');
    expect(getByLabelText('Dashboard metrics')).toBeInTheDocument();
  });
});
