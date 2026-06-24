'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  X, 
  Eye, 
  Calendar, 
  Filter, 
  ArrowUpDown,
  Laptop,
  Smartphone,
  MousePointer,
  HelpCircle
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import styles from '@/styles/module.module.css';
import { toast } from 'sonner';

export default function HistorialPage() {
  const supabase = getSupabaseClient();

  // Loading states
  const [loading, setLoading] = useState(true);

  // Data states
  const [historial, setHistorial] = useState<any[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccion, setFilterAccion] = useState('');
  const [filterTipoActivo, setFilterTipoActivo] = useState('');
  const [filterFechaDesde, setFilterFechaDesde] = useState('');
  const [filterFechaHasta, setFilterFechaHasta] = useState('');

  // Detail Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Fetch history with self-healing table name detection (plural/singular)
  const fetchData = async () => {
    setLoading(true);
    try {
      let tableName = 'historial_asignaciones';
      
      let { data, error } = await supabase
        .from(tableName)
        .select(`
          *,
          usuario:usuarios(id, nombre, apellido, email),
          puesto:puestos_trabajo(id, codigo, descripcion)
        `)
        .order('created_at', { ascending: false });

      // If table 'historial_asignaciones' does not exist, fallback to singular 'historial_asignacion'
      if (error && (error.code === '42P01' || error.message.includes('does not exist'))) {
        tableName = 'historial_asignacion';
        const fallback = await supabase
          .from(tableName)
          .select(`
            *,
            usuario:usuarios(id, nombre, apellido, email),
            puesto:puestos_trabajo(id, codigo, descripcion)
          `)
          .order('created_at', { ascending: false });

        if (fallback.error) throw fallback.error;
        data = fallback.data;
      } else if (error) {
        throw error;
      }

      setHistorial(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al cargar el historial: ${err.message || err.details}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter history logs
  const filteredHistorial = historial.filter(item => {
    const detail = item.detalle || '';
    const user = item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido}` : '';
    const email = item.usuario?.email || '';
    const puesto = item.puesto?.codigo || '';
    const byUser = item.realizado_por || '';

    // Search query
    const matchSearch = 
      detail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      puesto.toLowerCase().includes(searchQuery.toLowerCase()) ||
      byUser.toLowerCase().includes(searchQuery.toLowerCase());

    // Category / Type / Action Filters
    const matchAccion = filterAccion ? item.accion === filterAccion : true;
    const matchTipo = filterTipoActivo ? item.tipo_activo === filterTipoActivo : true;

    // Date range filter
    let matchDate = true;
    if (filterFechaDesde) {
      const desdeDate = new Date(filterFechaDesde);
      desdeDate.setHours(0, 0, 0, 0);
      const itemDate = new Date(item.created_at);
      matchDate = matchDate && itemDate >= desdeDate;
    }
    if (filterFechaHasta) {
      const hastaDate = new Date(filterFechaHasta);
      hastaDate.setHours(23, 59, 59, 999);
      const itemDate = new Date(item.created_at);
      matchDate = matchDate && itemDate <= hastaDate;
    }

    return matchSearch && matchAccion && matchTipo && matchDate;
  });

  const handleOpenDetail = (item: any) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const getActivoIcon = (tipo: string) => {
    switch (tipo) {
      case 'computadora':
        return <Laptop size={14} style={{ marginRight: '6px' }} />;
      case 'movil':
        return <Smartphone size={14} style={{ marginRight: '6px' }} />;
      case 'periferico':
        return <MousePointer size={14} style={{ marginRight: '6px' }} />;
      default:
        return <HelpCircle size={14} style={{ marginRight: '6px' }} />;
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <History size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Historial de Asignaciones</h1>
            <p className={styles.pageSubtitle}>Registro de auditoría y movimientos de activos en puestos de trabajo</p>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', padding: '16px', borderRadius: 'var(--radius-lg)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div className={styles.searchWrapper} style={{ flex: 1, minWidth: '280px' }}>
            <Search size={18} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Buscar por detalle, usuario, puesto o auditor..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Action Filter */}
          <select 
            className={styles.filterSelect}
            value={filterAccion}
            onChange={(e) => setFilterAccion(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="">Acción (Todas)</option>
            <option value="Asignación">Asignación</option>
            <option value="Desasignación">Desasignación</option>
            <option value="Transferencia">Transferencia</option>
            <option value="Baja">Baja</option>
          </select>

          {/* Asset Type Filter */}
          <select 
            className={styles.filterSelect}
            value={filterTipoActivo}
            onChange={(e) => setFilterTipoActivo(e.target.value)}
            style={{ minWidth: '150px' }}
          >
            <option value="">Tipo de Activo (Todos)</option>
            <option value="computadora">Computadora</option>
            <option value="periferico">Periférico</option>
            <option value="movil">Móvil</option>
          </select>
        </div>

        {/* Date Filters */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Filtrar por Rango de Fechas:</span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Desde:</span>
            <input 
              type="date" 
              className={styles.filterSelect}
              value={filterFechaDesde}
              onChange={(e) => setFilterFechaDesde(e.target.value)}
              style={{ padding: '6px 10px', height: 'auto' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Hasta:</span>
            <input 
              type="date" 
              className={styles.filterSelect}
              value={filterFechaHasta}
              onChange={(e) => setFilterFechaHasta(e.target.value)}
              style={{ padding: '6px 10px', height: 'auto' }}
            />
          </div>

          {(filterFechaDesde || filterFechaHasta || filterAccion || filterTipoActivo || searchQuery) && (
            <button 
              onClick={() => {
                setFilterFechaDesde('');
                setFilterFechaHasta('');
                setFilterAccion('');
                setFilterTipoActivo('');
                setSearchQuery('');
              }}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'var(--danger-text)',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <X size={14} /> Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Table view */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Cargando logs de auditoría...</span>
        </div>
      ) : (
        filteredHistorial.length === 0 ? (
          <div className={styles.emptyState}>
            <History size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No se encontraron registros</h3>
            <p className={styles.emptyText}>El historial de asignaciones se irá completando a medida que asocies activos a los puestos.</p>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader} style={{ gridTemplateColumns: '1.2fr 1.2fr 1fr 1.5fr 1.2fr 2.5fr 1fr 60px' }}>
              <div>Fecha / Hora</div>
              <div>Activo (Tipo)</div>
              <div>Puesto</div>
              <div>Usuario</div>
              <div>Acción</div>
              <div>Detalle del Movimiento</div>
              <div>Realizado Por</div>
              <div style={{ textAlign: 'right' }}></div>
            </div>

            {filteredHistorial.map((item) => {
              const uName = item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido || ''}` : 'N/A';
              const pCode = item.puesto?.codigo || 'Sin Puesto';

              return (
                <div key={item.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '1.2fr 1.2fr 1fr 1.5fr 1.2fr 2.5fr 1fr 60px' }}>
                  <div>
                    {new Date(item.created_at).toLocaleDateString('es-AR')}
                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                      {new Date(item.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {getActivoIcon(item.tipo_activo)}
                    <span className={styles.rowText} style={{ textTransform: 'capitalize' }}>
                      {item.tipo_activo} ({item.id_activo})
                    </span>
                  </div>

                  <div className={styles.rowText} style={{ fontWeight: 600 }}>{pCode}</div>

                  <div className={styles.rowText}>{uName}</div>

                  <div>
                    <span className={`${styles.badge} ${
                      item.accion === 'Asignación' ? styles.badgeActive : 
                      item.accion === 'Desasignación' ? styles.badgeWarning : 
                      item.accion === 'Transferencia' ? styles.badgeInfo : styles.badgeInactive
                    }`}>
                      {item.accion}
                    </span>
                  </div>

                  <div className={styles.rowText} style={{ fontSize: '12px' }}>{item.detalle || 'Sin observaciones'}</div>

                  <div className={styles.rowText}>{item.realizado_por || 'Sistema'}</div>

                  <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                    <button className={styles.actionBtn} onClick={() => handleOpenDetail(item)} title="Ver detalles completo">
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* DETAIL MODAL */}
      {isModalOpen && selectedItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Detalles del Registro de Auditoría</h3>
              <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-secondary)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>ID de Registro</span>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>#{selectedItem.id}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-secondary)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Fecha y Hora</span>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>
                    {new Date(selectedItem.created_at).toLocaleString('es-AR')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-secondary)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Tipo de Activo</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>
                    {selectedItem.tipo_activo}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-secondary)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>ID del Activo</span>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>
                    {selectedItem.id_activo}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--border-secondary)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Acción Realizada</span>
                  <span className={`${styles.badge} ${
                    selectedItem.accion === 'Asignación' ? styles.badgeActive : 
                    selectedItem.accion === 'Desasignación' ? styles.badgeWarning : 
                    selectedItem.accion === 'Transferencia' ? styles.badgeInfo : styles.badgeInactive
                  }`}>
                    {selectedItem.accion}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '8px', borderBottom: '1px solid var(--border-secondary)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Puesto de Trabajo</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>
                    {selectedItem.puesto ? `${selectedItem.puesto.codigo} — ${selectedItem.puesto.descripcion || 'Sin descripción'}` : 'Sin puesto asociado / Retirado'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '8px', borderBottom: '1px solid var(--border-secondary)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Usuario Involucrado</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>
                    {selectedItem.usuario ? `${selectedItem.usuario.nombre} ${selectedItem.usuario.apellido || ''} (${selectedItem.usuario.email || ''})` : 'Sin usuario / Desasignado'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingBottom: '8px', borderBottom: '1px solid var(--border-secondary)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Auditor / Realizado por</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>
                    {selectedItem.realizado_por || 'Sistema / Desconocido'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Detalle</span>
                  <p style={{ 
                    fontSize: '13px', 
                    background: 'var(--bg-tertiary)', 
                    padding: '12px', 
                    borderRadius: 'var(--radius-md)', 
                    border: '1px solid var(--border-primary)',
                    whiteSpace: 'pre-wrap',
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    {selectedItem.detalle || 'Sin observaciones cargadas.'}
                  </p>
                </div>

              </div>
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.saveBtn} onClick={() => setIsModalOpen(false)} style={{ width: '100%' }}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
