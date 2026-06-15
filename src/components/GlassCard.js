'use client';

import styles from './GlassCard.module.css';

/**
 * GlassCard component with glassmorphism effects and bento grid span configuration
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to render inside the card
 * @param {1|2|3|4} [props.colSpan=1] - Grid column span (1-4)
 * @param {1|2} [props.rowSpan=1] - Grid row span (1-2)
 * @param {'default'|'subtle'} [props.variant='default'] - Visual intensity variation
 * @param {boolean} [props.hover=true] - Enable hover effects
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {'div'|'section'|'article'} [props.as='div'] - Semantic HTML element
 * @param {string} [props.role] - ARIA role attribute
 * @param {string} [props.ariaLabel] - ARIA label for accessibility
 */
export default function GlassCard({
  children,
  colSpan = 1,
  rowSpan = 1,
  variant = 'default',
  hover = true,
  className = '',
  as = 'div',
  role,
  ariaLabel,
}) {
  const Component = as;

  // Build class names for grid spans
  const spanClasses = `bento-col-${colSpan} bento-row-${rowSpan}`;
  
  // Build variant and hover classes
  const variantClass = variant === 'subtle' ? styles.subtle : styles.default;
  const hoverClass = hover ? styles.hover : '';
  
  // Combine all classes
  const combinedClasses = [
    styles.glassCard,
    variantClass,
    hoverClass,
    spanClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <Component
      className={combinedClasses}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </Component>
  );
}
