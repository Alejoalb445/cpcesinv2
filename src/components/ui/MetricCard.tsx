'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import styles from './MetricCard.module.css';

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient?: string;
  change?: string;
  subtitle?: string;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  gradient,
  change,
  subtitle,
}: MetricCardProps) {
  const isNegative = change?.startsWith('-');

  return (
    <div
      className={styles.card}
      style={{ background: gradient ? `var(${gradient})` : 'var(--bg-secondary)' }}
    >
      <div className={styles.topRow}>
        <div className={styles.iconCircle}>
          <Icon />
        </div>
        {change && (
          <span
            className={`${styles.change} ${isNegative ? styles.changeNegative : ''}`}
          >
            {change}
          </span>
        )}
      </div>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{title}</div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </div>
  );
}
