'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { LogAuditoria } from '@/types/database';
import { Box, Search, Eye, X, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

export default function AuditoriaPage() {
  const supabase = getSupabaseClient();

  const [items, setItems] = useState<LogAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTabla, setFilterTabla] = useState('');
  const [filterAccion, setFilterAccion] = useState('');

  // Selected log for JSON diff modal
  const [selectedItem, setSelectedItem] = useState<LogAuditoria | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('logs_auditoria')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(150);

    if (error) {
      toast.error('Error al cargar logs de auditoría');
      console.error(error);
    } else {
      setItems(data as LogAuditoria[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract unique table names for filter dropdown
  const tableNames = Array.from(new Set(items.map((item) => item.tabla))).sort();

  const filtered = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.tabla.toLowerCase().includes(term) ||
      (item.registro_id || '').toLowerCase().includes(term) ||
      (item.user_id || '').toLowerCase().includes(term);

    const matchesTabla = filterTabla ? item.tabla === filterTabla : true;
    const matchesAccion = filterAccion ? item.accion === filterAccion : true;

    return matchesSearch && matchesTabla && matchesAccion;
  });

  function getAccionBadge(accion: string) {
    switch (accion) {
      case 'INSERT':
        return styles.badgeActive; // green
      case 'UPDATE':
        return styles.badgeInfo; // blue
      case 'DELETE':
        return styles.badgeInactive; // red
      default:
        return styles.badgeNeutral;
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <Box size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Auditoría de Cambios</h1>
            <p className={styles.pageSubtitle}>Historial de modificaciones, inserciones y eliminaciones de registros en la base de datos</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por ID de registro o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterTabla}
          onChange={(e) => setFilterTabla(e.target.value)}
        >
          <option value="">Todas las tablas</option>
          {tableNames.map((tbl) => (
            <option key={tbl} value={tbl}>{tbl}</option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={filterAccion}
          onChange={(e) => setFilterAccion(e.target.value)}
        >
          <option value="">Todas las acciones</option>
          {['INSERT', 'UPDATE', 'DELETE'].map((act) => (
            <option key={act} value={act}>{act}</option>
          ))}
        </select>
      </div>

      {/* Table List */}
      <div className={styles.table}>
        <div className={styles.tableHeader} style={{ gridTemplateColumns: '150px 150px 150px 100px 100px 1fr 100px' }}>
          <span>Fecha / Hora</span>
          <span>Usuario ID</span>
          <span>Tabla</span>
          <span>Registro ID</span>
          <span>Acción</span>
          <span>Detalle Rápido</span>
          <span>Acciones</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}><div className={styles.spinner} /><span>Cargando logs...</span></div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}><ShieldAlert size={48} className={styles.emptyIcon} /><p>No se encontraron registros de auditoría</p></div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={styles.tableRowItem}
              style={{ gridTemplateColumns: '150px 150px 150px 100px 100px 1fr 100px' }}
              onClick={() => setSelectedItem(item)}
            >
              <span>{new Date(item.fecha).toLocaleString()}</span>
              <span className={styles.rowText} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{item.user_id || 'system_trigger'}</span>
              <span className={styles.rowText} style={{ fontWeight: 600 }}>{item.tabla}</span>
              <span className={styles.rowText} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{item.registro_id || '—'}</span>
              <span><span className={`${styles.badge} ${getAccionBadge(item.accion)}`}>{item.accion}</span></span>
              <span className={styles.rowText} style={{ color: 'var(--text-tertiary)' }}>
                {item.accion === 'INSERT' ? JSON.stringify(item.datos_nuevos) : JSON.stringify(item.datos_nuevos || item.datos_anteriores)}
              </span>
              <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                <button className={styles.actionBtn} onClick={() => setSelectedItem(item)} title="Ver Diferencias">
                  <Eye size={14} /> Diff
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* JSON Diff Viewer Modal */}
      {selectedItem && (
        <div className={styles.modalOverlay} onClick={() => setSelectedItem(null)}>
          <div className={styles.modalWide} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Detalles de Auditoría - Log #{selectedItem.id}</h2>
              <button className={styles.modalCloseBtn} onClick={() => setSelectedItem(null)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '15px' }}>
                <div><strong>Tabla afectada:</strong> {selectedItem.tabla}</div>
                <div><strong>Registro ID:</strong> {selectedItem.registro_id}</div>
                <div><strong>Acción realizada:</strong> <span className={`${styles.badge} ${getAccionBadge(selectedItem.accion)}`}>{selectedItem.accion}</span></div>
                <div><strong>Fecha:</strong> {new Date(selectedItem.fecha).toLocaleString()}</div>
                <div><strong>Usuario ID:</strong> {selectedItem.user_id || 'system_trigger'}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: selectedItem.accion === 'UPDATE' ? '1fr 1fr' : '1fr', gap: '15px' }}>
                {selectedItem.datos_anteriores && (
                  <div>
                    <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', fontSize: 'var(--text-sm)' }}>Valores Anteriores</h4>
                    <pre style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: 'var(--radius-md)', maxHeight: '300px', overflow: 'auto', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--danger-text)', border: '1px solid var(--border-primary)' }}>
                      {JSON.stringify(selectedItem.datos_anteriores, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedItem.datos_nuevos && (
                  <div>
                    <h4 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', fontSize: 'var(--text-sm)' }}>Valores Nuevos</h4>
                    <pre style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: 'var(--radius-md)', maxHeight: '300px', overflow: 'auto', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--success-text)', border: '1px solid var(--border-primary)' }}>
                      {JSON.stringify(selectedItem.datos_nuevos, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setSelectedItem(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
