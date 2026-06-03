'use client';

import React from 'react';
import styles from './LoadingSpinner.module.css';

export interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({
  text,
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={`${styles.container} ${size !== 'md' ? styles[size] : ''} ${className ?? ''}`}
      role="status"
      aria-label={text ?? 'Cargando'}
    >
      <div className={styles.spinner} />
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
}
