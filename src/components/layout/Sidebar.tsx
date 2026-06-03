'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Monitor,
  Package,
  ShoppingCart,
  Ticket,
  Key,
  Camera,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Sun,
  Moon,
  MapPin,
  Users,
  Briefcase,
  Cpu,
  Printer,
  Network,
  Phone,
  HardDrive,
  ClipboardList,
  Box,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import styles from './Sidebar.module.css';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
    ],
  },
  {
    title: 'Organización',
    items: [
      { label: 'Sedes', href: '/organizacion/sedes', icon: <Building2 size={20} /> },
      { label: 'Ubicaciones', href: '/organizacion/ubicaciones', icon: <MapPin size={20} /> },
      { label: 'Sectores', href: '/organizacion/sectores', icon: <Shield size={20} /> },
      { label: 'Personas', href: '/organizacion/personas', icon: <Users size={20} /> },
      { label: 'Puestos', href: '/organizacion/puestos', icon: <Briefcase size={20} /> },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { label: 'Activos', href: '/activos', icon: <Monitor size={20} /> },
      { label: 'PCs / Notebooks', href: '/activos/pcs', icon: <Cpu size={20} /> },
      { label: 'Impresoras', href: '/activos/impresoras', icon: <Printer size={20} /> },
      { label: 'Red', href: '/activos/red', icon: <Network size={20} /> },
      { label: 'Telefonía', href: '/activos/telefonia', icon: <Phone size={20} /> },
      { label: 'Componentes', href: '/activos/componentes', icon: <HardDrive size={20} /> },
    ],
  },
  {
    title: 'Stock y Pedidos',
    items: [
      { label: 'Stock Central', href: '/stock', icon: <Package size={20} /> },
      { label: 'Pedidos', href: '/pedidos', icon: <ClipboardList size={20} /> },
      { label: 'Compras', href: '/compras', icon: <ShoppingCart size={20} /> },
    ],
  },
  {
    title: 'Gestión',
    items: [
      { label: 'Licencias', href: '/licencias', icon: <Key size={20} /> },
      { label: 'Soporte', href: '/soporte', icon: <Ticket size={20} /> },
      { label: 'CCTV', href: '/cctv', icon: <Camera size={20} /> },
      { label: 'Actas', href: '/actas', icon: <FileText size={20} /> },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { label: 'Administración', href: '/admin', icon: <Settings size={20} /> },
      { label: 'Auditoría', href: '/admin/auditoria', icon: <Box size={20} /> },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved as 'dark' | 'light');
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const getInitials = () => {
    if (!user?.persona) return 'U';
    const n = user.persona.nombre?.[0] || '';
    const a = user.persona.apellido?.[0] || '';
    return (n + a).toUpperCase() || 'U';
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <>
      <button
        className={styles.mobileMenuBtn}
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      <div
        className={`${styles.overlay} ${mobileOpen ? styles.visible : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
        <button
          className={styles.collapseBtn}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Monitor size={20} />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>Inventario CPC</span>
            <span className={styles.logoSubtitle}>Gestión IT</span>
          </div>
        </div>

        <nav className={styles.nav}>
          {navSections.map((section) => (
            <div key={section.title} className={styles.navSection}>
              <div className={styles.navSectionLabel}>{section.title}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className={styles.navItemIcon}>{item.icon}</span>
                  <span className={styles.navItemText}>{item.label}</span>
                  {item.badge ? (
                    <span className={styles.navItemBadge}>{item.badge}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.footer}>
          <div className={styles.themeRow}>
            <span className={styles.themeLabel}>
              {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
              <span>{theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}</span>
            </span>
            <button
              onClick={toggleTheme}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                transition: 'color var(--transition-fast)',
              }}
              aria-label="Cambiar tema"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>

          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{getInitials()}</div>
            <div className={styles.userDetails}>
              <div className={styles.userName}>
                {user?.persona
                  ? `${user.persona.nombre} ${user.persona.apellido || ''}`
                  : user?.email || 'Usuario'}
              </div>
              <div className={styles.userRole}>{user?.role || 'Cargando...'}</div>
            </div>
          </div>

          <button className={styles.logoutBtn} onClick={handleSignOut}>
            <LogOut size={18} />
            <span className={styles.navItemText}>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
