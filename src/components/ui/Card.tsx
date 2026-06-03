'use client';

import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: React.ReactNode;
  hoverable?: boolean;
  padding?: 'default' | 'compact' | 'none';
  className?: string;
  onClick?: () => void;
}

export default function Card({
  children,
  hoverable = false,
  padding = 'default',
  className,
  onClick,
}: CardProps) {
  const classNames = [
    styles.card,
    hoverable ? styles.hoverable : '',
    padding === 'none' ? styles.noPadding : '',
    padding === 'compact' ? styles.compact : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames} onClick={onClick}>
      {children}
    </div>
  );
}
