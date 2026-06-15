# GlassCard Component

A reusable React component that provides glassmorphism effects with Bento grid span configuration. This component implements the glass card design pattern with backdrop blur, semi-transparency, and flexible grid positioning.

## Features

- ✨ **Glassmorphism Effects**: Backdrop blur with semi-transparent backgrounds
- 📐 **Flexible Grid Spans**: Support for 1-4 column spans and 1-2 row spans
- 🎨 **Visual Variants**: Default and subtle blur intensity options
- ♿ **Accessibility**: Full ARIA support and semantic HTML
- 🎭 **Hover States**: Optional enhanced hover effects
- 📱 **Responsive**: Optimized blur effects for mobile devices
- 🌐 **Browser Compatibility**: Fallback styles for unsupported browsers
- ⚡ **Performance**: Respects prefers-reduced-motion

## Installation

The component is located at `src/components/GlassCard.js` and uses CSS Modules for styling.

```javascript
import GlassCard from '@/components/GlassCard';
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `React.ReactNode` | required | Content to render inside the card |
| `colSpan` | `1 \| 2 \| 3 \| 4` | `1` | Number of grid columns to span |
| `rowSpan` | `1 \| 2` | `1` | Number of grid rows to span |
| `variant` | `'default' \| 'subtle'` | `'default'` | Visual intensity variation |
| `hover` | `boolean` | `true` | Enable hover effects |
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `'div' \| 'section' \| 'article'` | `'div'` | Semantic HTML element |
| `role` | `string` | `undefined` | ARIA role attribute |
| `ariaLabel` | `string` | `undefined` | ARIA label for accessibility |

## Basic Usage

### Simple Card

```javascript
<GlassCard>
  <h3>Welcome</h3>
  <p>This is a basic glass card.</p>
</GlassCard>
```

### Multi-Column Card

```javascript
<GlassCard colSpan={2} rowSpan={2}>
  <h2>Large Content Area</h2>
  <p>This card spans 2 columns and 2 rows.</p>
</GlassCard>
```

### Subtle Variant

```javascript
<GlassCard variant="subtle">
  <h3>Reduced Blur</h3>
  <p>This card has less intense glass effect.</p>
</GlassCard>
```

## Advanced Usage

### Semantic HTML with Accessibility

```javascript
<GlassCard 
  as="section" 
  role="region" 
  ariaLabel="Dashboard metrics"
  colSpan={2}
>
  <h2>Key Metrics</h2>
  <div>Content here</div>
</GlassCard>
```

### Bento Grid Layout

```javascript
<div className="bento-grid">
  <GlassCard colSpan={1}>Metric 1</GlassCard>
  <GlassCard colSpan={1}>Metric 2</GlassCard>
  <GlassCard colSpan={2} rowSpan={2}>
    Large Chart
  </GlassCard>
  <GlassCard colSpan={1}>Metric 3</GlassCard>
  <GlassCard colSpan={1}>Metric 4</GlassCard>
</div>
```

### Custom Styling

```javascript
<GlassCard className="custom-card-style" colSpan={3}>
  <h2>Custom Card</h2>
</GlassCard>
```

```css
/* In your CSS Module or global styles */
.custom-card-style {
  padding: 32px;
  background: rgba(17, 21, 22, 0.8);
}
```

### Without Hover Effects

```javascript
<GlassCard hover={false}>
  <h3>Static Card</h3>
  <p>No hover animation on this card.</p>
</GlassCard>
```

## Variants

### Default Variant
- Blur: 12px (8px on mobile)
- Background opacity: 0.6
- Box shadow: Standard depth

### Subtle Variant
- Blur: 8px (6px on mobile)
- Background opacity: 0.6
- Box shadow: Reduced depth

## Responsive Behavior

The component automatically adjusts based on viewport size:

- **Desktop (≥1200px)**: Full 4-column grid, standard blur
- **Tablet (900-1199px)**: Max 3-column span
- **Small Tablet (600-899px)**: Max 2-column span
- **Mobile (<600px)**: Single column, reduced blur for performance

## Browser Compatibility

- **Modern browsers** (Chrome, Safari, Edge): Full glass effect with backdrop-filter
- **Firefox**: Backdrop-filter support (check current version)
- **Fallback**: Solid background for browsers without backdrop-filter support

## Accessibility

The component is fully accessible:

- Supports semantic HTML elements (`section`, `article`)
- Accepts ARIA attributes (`role`, `aria-label`)
- Maintains sufficient text contrast (4.5:1 minimum)
- Respects `prefers-reduced-motion` preference

## Performance Considerations

- Backdrop-filter is GPU-accelerated but can impact performance
- Reduced blur on mobile devices for better performance
- Disabled effects when user prefers reduced motion
- Recommended: Limit to ~20 glass cards per page

## CSS Variables

The component uses these CSS custom properties from `globals.css`:

```css
--glass-blur: 12px;
--glass-blur-subtle: 8px;
--glass-bg: rgba(17, 21, 22, 0.6);
--glass-bg-hover: rgba(17, 21, 22, 0.75);
--glass-border: rgba(37, 43, 44, 0.8);
--glass-border-hover: rgba(57, 66, 67, 0.9);
```

## Examples

See `GlassCard.example.js` for complete usage examples including:
- Simple cards
- Multi-column layouts
- Semantic HTML variants
- Bento grid compositions
- Custom styling patterns

## Testing

Run the test suite:

```bash
npm test GlassCard.test.js
```

The component includes 15 unit tests covering:
- Rendering and content display
- Props handling (colSpan, rowSpan, variant)
- Semantic HTML element selection
- ARIA attributes
- CSS class application
- Hover behavior

## Related Components

- **BentoGrid**: Wrapper component for bento-style layouts
- **StatCard**: Enhanced metric card component
- **Sidebar**: Navigation with glass background

## Requirements Validated

This component validates the following requirements from the Bento Glass UI Redesign spec:

- ✅ **Requirement 4.1**: Reusable Card_Component with glass effect styling
- ✅ **Requirement 4.2**: Accept props for grid column span (1-4)
- ✅ **Requirement 4.3**: Accept props for grid row span (1-2)
- ✅ **Requirement 4.4**: Support optional hover effect variations
- ✅ **Requirement 4.5**: Render child content without styling constraints
- ✅ **Requirement 4.6**: Maintain accessibility with proper ARIA attributes
- ✅ **Requirement 4.7**: Export from centralized components directory
- ✅ **Requirement 2.1**: Apply backdrop-blur filter effect
- ✅ **Requirement 2.2**: Use semi-transparent backgrounds with rgba
- ✅ **Requirement 2.3**: Display subtle border with reduced opacity
- ✅ **Requirement 2.4**: Use backdrop-filter with blur between 8-16px
- ✅ **Requirement 2.5**: Use background opacity between 0.4-0.7
- ✅ **Requirement 2.6**: Increase background opacity on hover
- ✅ **Requirement 2.7**: Include subtle shadow for depth perception

## License

Part of the Xeno Customer Engagement Platform.
