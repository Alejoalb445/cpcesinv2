'use client';

import React from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import Sidebar from '@/components/layout/Sidebar';
import styles from '@/components/layout/Sidebar.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-primary)',
        gap: '12px',
      }}>
        <div style={{
          width: 32,
          height: 32,
          border: '3px solid var(--border-primary)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <span>Cargando...</span>
      </div>
    );
  }

  if (!user || !user.activo) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-primary)',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <h2>Acceso pendiente</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Tu cuenta existe pero aún no ha sido activada por un administrador.
        </p>
        <a href="/login" style={{ color: 'var(--accent-primary)' }}>Volver al inicio</a>
      </div>
    );
  }

  return (
    <div>
      <Sidebar />
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}
