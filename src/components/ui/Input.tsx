'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import styles from './Input.module.css';

/* ---- Input ---- */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export default function Input({
  label,
  error,
  icon: Icon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={styles.wrapper}>
      {label && (
        <label
          htmlFor={inputId}
          className={`${styles.label} ${error ? styles.errorLabel : ''}`}
        >
          {label}
        </label>
      )}
      <div className={styles.inputContainer}>
        {Icon && (
          <span className={styles.inputIcon}>
            <Icon />
          </span>
        )}
        <input
          id={inputId}
          className={`${styles.input} ${Icon ? styles.hasIcon : ''} ${error ? styles.inputError : ''} ${className ?? ''}`}
          {...props}
        />
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}

/* ---- Textarea ---- */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={styles.wrapper}>
      {label && (
        <label
          htmlFor={textareaId}
          className={`${styles.label} ${error ? styles.errorLabel : ''}`}
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`${styles.textarea} ${error ? styles.inputError : ''} ${className ?? ''}`}
        {...props}
      />
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}
