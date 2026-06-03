'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import styles from './Tabs.module.css';

export interface Tab {
  key: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

export default function Tabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: TabsProps) {
  return (
    <div className={`${styles.container} ${className ?? ''}`} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={() => onTabChange(tab.key)}
            role="tab"
            aria-selected={isActive}
          >
            {Icon && (
              <span className={styles.tabIcon}>
                <Icon />
              </span>
            )}
            {tab.label}
            {tab.count !== undefined && (
              <span className={styles.tabCount}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
