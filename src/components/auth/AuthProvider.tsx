'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { AuthUser, RolSistema } from '@/types/database';

interface AuthContextType {
  user: AuthUser | null;
  supabaseUser: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  canCreate: boolean;
  canDelete: boolean;
  canAdmin: boolean;
  isReadOnly: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  supabaseUser: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
  canCreate: false,
  canDelete: false,
  canAdmin: false,
  isReadOnly: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseClient();

  const fetchUserData = useCallback(async (authUser: User) => {
    try {
      const { data: usuario, error } = await supabase
        .from('usuarios_sistema')
        .select(`
          id,
          id_persona,
          rol,
          activo,
          persona:personas(*)
        `)
        .eq('id', authUser.id)
        .single();

      if (error || !usuario) {
        setUser(null);
        return;
      }

      const personaData = Array.isArray(usuario.persona) ? usuario.persona[0] : usuario.persona;

      setUser({
        id: usuario.id,
        email: authUser.email || '',
        role: usuario.rol as RolSistema,
        persona: personaData || null,
        activo: usuario.activo,
      });
    } catch {
      setUser(null);
    }
  }, [supabase]);

  const refreshUser = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      await fetchUserData(authUser);
    }
  }, [supabase, fetchUserData]);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setSupabaseUser(authUser);
        if (authUser) {
          await fetchUserData(authUser);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setSupabaseUser(session.user);
          await fetchUserData(session.user);
        } else if (event === 'SIGNED_OUT') {
          setSupabaseUser(null);
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchUserData]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  };

  const role = user?.role;
  const canCreate = role === 'SuperAdmin' || role === 'Admin' || role === 'Tecnico';
  const canDelete = role === 'SuperAdmin' || role === 'Admin';
  const canAdmin = role === 'SuperAdmin' || role === 'Admin';
  const isReadOnly = role === 'Consulta';

  return (
    <AuthContext.Provider value={{
      user,
      supabaseUser,
      loading,
      signOut,
      refreshUser,
      canCreate,
      canDelete,
      canAdmin,
      isReadOnly,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
