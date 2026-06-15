'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './StatCard.module.css';

export default function StatCard({ icon, label, value, change, prefix = '', suffix = '', loading = false }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef(null);
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''));
  const hasNumericValue = !isNaN(numericValue);

  useEffect(() => {
    if (loading || value === undefined || value === null || !hasNumericValue) return;

    // Animate the counter
    const duration = 1200;
    const startTime = performance.now();
    const startVal = 0;
    let frameId;

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (numericValue - startVal) * eased;

      if (Number.isInteger(numericValue)) {
        setDisplayValue(Math.round(current));
      } else {
        setDisplayValue(parseFloat(current.toFixed(1)));
      }

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    }

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [value, loading, numericValue, hasNumericValue]);

  const formatValue = (val) => {
    if (typeof val === 'string') return val;
    if (typeof val === 'number' && val >= 1000) {
      return val.toLocaleString();
    }
    return val;
  };

  const changeIsPositive = change && parseFloat(change) > 0;
  const changeIsNegative = change && parseFloat(change) < 0;

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={`${styles.iconWrap} skeleton`} />
        <div className={styles.content}>
          <div className="skeleton skeleton-text" style={{ width: '60%' }} />
          <div className="skeleton skeleton-heading" style={{ width: '80%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card} ref={ref}>
      <div className={styles.iconWrap}>
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.content}>
        <span className={styles.label}>{label}</span>
        <div className={styles.valueRow}>
          <span className={styles.value}>
            {prefix}{formatValue(hasNumericValue ? displayValue : value)}{suffix}
          </span>
          {change !== undefined && change !== null && (
            <span
              className={`${styles.change} ${
                changeIsPositive ? styles.changeUp :
                changeIsNegative ? styles.changeDown : ''
              }`}
            >
              {changeIsPositive ? '' : changeIsNegative ? '' : ''}
              {typeof change === 'number' ? `${Math.abs(change)}%` : change}
            </span>
          )}
        </div>
      </div>
      <div className={styles.glowEffect} />
    </div>
  );
}
