'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Monitor, Mail, Lock, Eye, EyeOff, AlertCircle, AlertTriangle } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inactiveUser, setInactiveUser] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInactiveUser(false);

    if (!email.trim() || !password.trim()) {
      setError('Por favor, completá todos los campos.');
      return;
    }

    setLoading(true);

    try {
      const supabase = getSupabaseClient();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login')) {
          setError('Email o contraseña incorrectos.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check if user is active in usuarios (optional check)
        const { data: usuario, error: userError } = await supabase
          .from('usuarios')
          .select('activo, rol')
          .eq('id', data.user.id)
          .single();

        if (!userError && usuario && !usuario.activo) {
          setInactiveUser(true);
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Error inesperado. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoWrapper}>
            <Monitor size={28} color="white" />
          </div>
          <h1 className={styles.title}>Inventario CPC</h1>
          <p className={styles.subtitle}>Sistema de Gestión IT</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.alertError}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {inactiveUser && (
            <div className={styles.alertWarning}>
              <AlertTriangle size={16} />
              Tu cuenta está pendiente de activación. Contactá al administrador del sistema.
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Correo electrónico
            </label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input
                id="email"
                type="email"
                className={styles.input}
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Contraseña
            </label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className={styles.spinner} />
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>

        <div className={styles.footer}>
          Inventario CPC &copy; {new Date().getFullYear()} — Área de Sistemas
        </div>
      </div>
    </div>
  );
}
