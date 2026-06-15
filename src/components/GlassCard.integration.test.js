/**
 * Integration tests for GlassCard with BentoGrid
 * Tests the combination of GlassCard components within a BentoGrid layout
 */

import { render } from '@testing-library/react';
import GlassCard from './GlassCard';
import BentoGrid from './BentoGrid';

describe('GlassCard Integration with BentoGrid', () => {
  it('renders multiple GlassCards within BentoGrid', () => {
    const { getAllByText } = render(
      <BentoGrid>
        <GlassCard colSpan={1}>Card 1</GlassCard>
        <GlassCard colSpan={1}>Card 2</GlassCard>
        <GlassCard colSpan={2}>Card 3</GlassCard>
      </BentoGrid>
    );
    
    expect(getAllByText(/Card/).length).toBe(3);
  });

  it('applies correct grid span classes to cards in grid', () => {
    const { container } = render(
      <BentoGrid>
        <GlassCard colSpan={1}>Small</GlassCard>
        <GlassCard colSpan={2} rowSpan={2}>Large</GlassCard>
        <GlassCard colSpan={4}>Full Width</GlassCard>
      </BentoGrid>
    );
    
    const cards = container.querySelectorAll('[class*="glassCard"]');
    
    expect(cards[0]).toHaveClass('bento-col-1');
    expect(cards[1]).toHaveClass('bento-col-2');
    expect(cards[1]).toHaveClass('bento-row-2');
    expect(cards[2]).toHaveClass('bento-col-4');
  });

  it('supports mixed variants within same grid', () => {
    const { container } = render(
      <BentoGrid>
        <GlassCard variant="default">Default Card</GlassCard>
        <GlassCard variant="subtle">Subtle Card</GlassCard>
      </BentoGrid>
    );
    
    const cards = container.querySelectorAll('[class*="glassCard"]');
    
    expect(cards[0].className).toContain('default');
    expect(cards[1].className).toContain('subtle');
  });

  it('renders dashboard-style layout with metrics', () => {
    const { getByText, container } = render(
      <BentoGrid>
        <GlassCard colSpan={1}>
          <h4>Customers</h4>
          <p>1,250</p>
        </GlassCard>
        <GlassCard colSpan={1}>
          <h4>Segments</h4>
          <p>48</p>
        </GlassCard>
        <GlassCard colSpan={1}>
          <h4>Messages</h4>
          <p>12,456</p>
        </GlassCard>
        <GlassCard colSpan={1}>
          <h4>Delivery</h4>
          <p>98.2%</p>
        </GlassCard>
        <GlassCard colSpan={2} rowSpan={2} as="section" ariaLabel="Funnel">
          <h3>Communication Funnel</h3>
        </GlassCard>
        <GlassCard colSpan={2} rowSpan={2} as="section" ariaLabel="Campaigns">
          <h3>Recent Campaigns</h3>
        </GlassCard>
      </BentoGrid>
    );
    
    expect(getByText('Customers')).toBeInTheDocument();
    expect(getByText('1,250')).toBeInTheDocument();
    expect(getByText('Communication Funnel')).toBeInTheDocument();
    expect(getByText('Recent Campaigns')).toBeInTheDocument();
    
    const cards = container.querySelectorAll('[class*="glassCard"]');
    expect(cards.length).toBe(6);
  });

  it('works with custom gap in BentoGrid', () => {
    const { container } = render(
      <BentoGrid gap={24}>
        <GlassCard>Card 1</GlassCard>
        <GlassCard>Card 2</GlassCard>
      </BentoGrid>
    );
    
    const grid = container.firstChild;
    expect(grid.style.getPropertyValue('--custom-gap')).toBe('24px');
  });

  it('supports semantic HTML elements in grid layout', () => {
    const { container } = render(
      <BentoGrid>
        <GlassCard as="section" role="region" ariaLabel="Metrics">
          <h2>Metrics</h2>
        </GlassCard>
        <GlassCard as="article">
          <h2>Article</h2>
        </GlassCard>
      </BentoGrid>
    );
    
    const section = container.querySelector('section');
    const article = container.querySelector('article');
    
    expect(section).toBeInTheDocument();
    expect(section).toHaveAttribute('role', 'region');
    expect(article).toBeInTheDocument();
  });

  it('handles nested content within cards', () => {
    const { getByText, getByRole } = render(
      <BentoGrid>
        <GlassCard colSpan={2}>
          <div>
            <h3>Title</h3>
            <p>Description text</p>
            <button>Action</button>
          </div>
        </GlassCard>
      </BentoGrid>
    );
    
    expect(getByText('Title')).toBeInTheDocument();
    expect(getByText('Description text')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });
});
