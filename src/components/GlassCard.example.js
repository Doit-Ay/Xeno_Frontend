/**
 * Example usage of GlassCard component
 * This file demonstrates various ways to use the GlassCard component
 */

import GlassCard from './GlassCard';

// Example 1: Simple single-column card
export function SimpleCard() {
  return (
    <GlassCard>
      <h3>Simple Card</h3>
      <p>This is a basic glass card with default settings.</p>
    </GlassCard>
  );
}

// Example 2: Large card spanning multiple columns
export function LargeCard() {
  return (
    <GlassCard colSpan={2} rowSpan={2}>
      <h2>Large Card</h2>
      <p>This card spans 2 columns and 2 rows.</p>
    </GlassCard>
  );
}

// Example 3: Subtle variant card
export function SubtleCard() {
  return (
    <GlassCard variant="subtle">
      <h3>Subtle Glass Effect</h3>
      <p>This card has a reduced blur effect.</p>
    </GlassCard>
  );
}

// Example 4: Semantic HTML with accessibility
export function SemanticCard() {
  return (
    <GlassCard 
      as="section" 
      role="region" 
      ariaLabel="Communication funnel metrics"
      colSpan={2}
    >
      <h2>Communication Funnel</h2>
      <p>Accessible card using semantic HTML and ARIA attributes.</p>
    </GlassCard>
  );
}

// Example 5: Card without hover effects
export function StaticCard() {
  return (
    <GlassCard hover={false}>
      <h3>Static Card</h3>
      <p>This card does not have hover effects.</p>
    </GlassCard>
  );
}

// Example 6: Card with custom styling
export function CustomCard() {
  return (
    <GlassCard className="my-custom-card" colSpan={3}>
      <h2>Custom Styled Card</h2>
      <p>This card includes custom CSS classes for additional styling.</p>
    </GlassCard>
  );
}

// Example 7: Full-width card
export function FullWidthCard() {
  return (
    <GlassCard colSpan={4}>
      <h2>Full Width Card</h2>
      <p>This card spans all 4 columns of the grid.</p>
    </GlassCard>
  );
}

// Example 8: Bento Grid Layout with multiple cards
export function BentoGridExample() {
  return (
    <div className="bento-grid">
      <GlassCard colSpan={1}>
        <h4>Metric 1</h4>
        <p>1,250</p>
      </GlassCard>
      
      <GlassCard colSpan={1}>
        <h4>Metric 2</h4>
        <p>48</p>
      </GlassCard>
      
      <GlassCard colSpan={1}>
        <h4>Metric 3</h4>
        <p>12,456</p>
      </GlassCard>
      
      <GlassCard colSpan={1}>
        <h4>Metric 4</h4>
        <p>98.2%</p>
      </GlassCard>
      
      <GlassCard colSpan={2} rowSpan={2} as="section" ariaLabel="Communication funnel">
        <h3>Communication Funnel</h3>
        {/* Chart content here */}
      </GlassCard>
      
      <GlassCard colSpan={2} rowSpan={2} as="section" ariaLabel="Recent campaigns">
        <h3>Recent Campaigns</h3>
        {/* Campaign list here */}
      </GlassCard>
    </div>
  );
}
