import React from 'react';
import styles from './BentoGrid.module.css';

/**
 * BentoGrid - Responsive grid container for bento-style layouts
 * 
 * Provides a flexible grid system that automatically adjusts column count
 * based on viewport size with consistent gap spacing.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - GlassCard components or other grid items
 * @param {number} [props.gap=16] - Gap between items in pixels (default: 16)
 * @param {string} [props.className] - Additional CSS classes
 */
export default function BentoGrid({ children, gap, className = '' }) {
  const gridStyle = gap !== undefined ? { '--custom-gap': `${gap}px` } : {};

  return (
    <div 
      className={`${styles.bentoGrid} ${className}`}
      style={gridStyle}
    >
      {children}
    </div>
  );
}
