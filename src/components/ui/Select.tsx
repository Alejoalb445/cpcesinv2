'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export default function Select({
  label,
  options,
  error,
  placeholder,
  disabled,
  className,
  id,
  value,
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={styles.wrapper}>
      {label && (
        <label
          htmlFor={selectId}
          className={`${styles.label} ${error ? styles.errorLabel : ''}`}
        >
          {label}
        </label>
      )}
      <div className={styles.selectContainer}>
        <select
          id={selectId}
          className={`${styles.select} ${error ? styles.selectError : ''} ${!value ? styles.placeholder : ''} ${className ?? ''}`}
          disabled={disabled}
          value={value}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className={styles.arrow}>
          <ChevronDown />
        </span>
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}
