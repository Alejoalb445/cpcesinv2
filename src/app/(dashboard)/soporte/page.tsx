'use client';

import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  User, 
  AlertCircle,
  Calendar,
  Layers,
  Wrench
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import styles from '@/styles/module.module.css';
import { toast } from 'sonner';

export default function SoportePage() {
  const supabase = getSupabaseClient();

  // Loading states
  const [loading, setLoading] = useState(true);

  // Data states
  const [tareas, setTareas] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [puestos, setPuestos] = useState<any[]>([]);
  const [activosList, setActivosList] = useState<any[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Confirm delete state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number>(0);

  // Form states
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    prioridad: 'Media',
    estado: 'Abierta',
    id_solicitante: '',
    id_tecnico: '',
    id_puesto: '',
    tipo_activo: '',
    id_activo: '',
    notas_resolucion: ''
  });

  // Load catalogs on mount
  useEffect(() => {
    async function loadCatalogos() {
      try {
        const [
          { data: usuariosData },
          { data: puestosData }
        ] = await Promise.all([
          supabase.from('usuarios').select('id, nombre, apellido, email').order('apellido'),
          supabase.from('puestos_trabajo').select('id, codigo, descripcion').order('codigo')
        ]);

        if (usuariosData) setUsuarios(usuariosData);
        if (puestosData) setPuestos(puestosData);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
        toast.error('Error al cargar datos de usuarios y puestos');
      }
    }
    loadCatalogos();
  }, []);

  // Fetch support tasks
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tareas_soporte')
        .select(`
          *,
          solicitante:usuarios!tareas_soporte_id_solicitante_fkey(id, nombre, apellido, email),
          tecnico:usuarios!tareas_soporte_id_tecnico_fkey(id, nombre, apellido, email),
          puesto:puestos_trabajo(id, codigo, descripcion)
        `)
        .order('created_at', { ascending: false });

      // Note: If fkeys are named differently or cause errors, query with fallback:
      if (error) {
        // Fallback query without explicit fkey definitions (let Supabase resolve automatically)
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('tareas_soporte')
          .select(`
            *,
            solicitante:id_solicitante(id, nombre, apellido),
            tecnico:id_tecnico(id, nombre, apellido),
            puesto:id_puesto(id, codigo)
          `)
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        setTareas(fallbackData || []);
      } else {
        setTareas(data || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al cargar tareas de soporte: ${err.message || err.details}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPrioridad, filterEstado]);

  // Dynamically load assets list based on selected asset type in form
  useEffect(() => {
    async function loadActivos() {
      if (!form.tipo_activo) {
        setActivosList([]);
        return;
      }
      
      let table = '';
      let selectFields = 'id, serial';

      if (form.tipo_activo === 'computadora') {
        table = 'computadoras';
        selectFields = 'id, hostname, serial';
      } else if (form.tipo_activo === 'periferico') {
        table = 'perifericos';
        selectFields = 'id, categoria, serial';
      } else if (form.tipo_activo === 'movil') {
        table = 'dispositivos_movil';
        selectFields = 'id, tipo, serial';
      } else if (form.tipo_activo === 'impresora') {
        table = 'impresoras';
        selectFields = 'id, serial, tipo';
      } else if (form.tipo_activo === 'infraestructura') {
        table = 'dispositivos_infraestructura';
        selectFields = 'id, categoria, serial';
      }

      try {
        if (table) {
          const { data, error } = await supabase.from(table).select(selectFields);
          if (!error && data) {
            setActivosList(data);
          } else {
            setActivosList([]);
          }
        }
      } catch {
        setActivosList([]);
      }
    }
    loadActivos();
  }, [form.tipo_activo]);

  // Filtering
  const filteredTareas = tareas.filter(item => {
    const title = item.titulo || '';
    const desc = item.descripcion || '';
    const solName = item.solicitante ? `${item.solicitante.nombre} ${item.solicitante.apellido}` : '';
    const tecName = item.tecnico ? `${item.tecnico.nombre} ${item.tecnico.apellido}` : '';
    const puestoCode = item.puesto?.codigo || '';

    const matchSearch = 
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      solName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tecName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      puestoCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchPrioridad = filterPrioridad ? item.prioridad === filterPrioridad : true;
    const matchEstado = filterEstado ? item.estado === filterEstado : true;

    return matchSearch && matchPrioridad && matchEstado;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTareas.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTareas = filteredTareas.slice(startIndex, startIndex + itemsPerPage);

  // Open Add modal
  const handleOpenAdd = () => {
    setModalType('create');
    setSelectedItem(null);
    setForm({
      titulo: '',
      descripcion: '',
      prioridad: 'Media',
      estado: 'Abierta',
      id_solicitante: '',
      id_tecnico: '',
      id_puesto: '',
      tipo_activo: '',
      id_activo: '',
      notas_resolucion: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (item: any) => {
    setModalType('edit');
    setSelectedItem(item);
    setForm({
      titulo: item.titulo,
      descripcion: item.descripcion || '',
      prioridad: item.prioridad,
      estado: item.estado,
      id_solicitante: item.id_solicitante ? String(item.id_solicitante) : '',
      id_tecnico: item.id_tecnico ? String(item.id_tecnico) : '',
      id_puesto: item.id_puesto ? String(item.id_puesto) : '',
      tipo_activo: item.tipo_activo || '',
      id_activo: item.id_activo ? String(item.id_activo) : '',
      notas_resolucion: item.notas_resolucion || ''
    });
    setIsModalOpen(true);
  };

  // Confirm delete
  const handleOpenDelete = (id: number) => {
    setItemToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    setIsConfirmOpen(false);
    try {
      const { error } = await supabase
        .from('tareas_soporte')
        .delete()
        .eq('id', itemToDeleteId);

      if (error) throw error;
      toast.success('Tarea de soporte eliminada correctamente');
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al eliminar tarea: ${err.message || err.details}`);
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.titulo.trim()) {
      toast.error('El título es requerido');
      return;
    }

    try {
      const isResolved = form.estado === 'Resuelta' || form.estado === 'Cancelada';
      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        prioridad: form.prioridad,
        estado: form.estado,
        id_solicitante: form.id_solicitante || null,
        id_tecnico: form.id_tecnico || null,
        id_puesto: form.id_puesto ? parseInt(form.id_puesto) : null,
        tipo_activo: form.tipo_activo || null,
        id_activo: form.id_activo ? parseInt(form.id_activo) : null,
        notas_resolucion: form.notas_resolucion.trim() || null,
        fecha_resolucion: isResolved ? new Date().toISOString() : null
      };

      if (modalType === 'create') {
        const { error } = await supabase
          .from('tareas_soporte')
          .insert([payload]);

        if (error) throw error;
        toast.success('Tarea de soporte creada con éxito');
      } else {
        const { error } = await supabase
          .from('tareas_soporte')
          .update(payload)
          .eq('id', selectedItem.id);

        if (error) throw error;
        toast.success('Tarea de soporte actualizada con éxito');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al guardar: ${err.message || err.details}`);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <Ticket size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Tareas de Soporte</h1>
            <p className={styles.pageSubtitle}>Gestión de solicitudes de soporte técnico y resolución de incidentes</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={handleOpenAdd}>
          <Plus size={16} />
          Nuevo Ticket
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar por título, descripción, solicitante, técnico o puesto..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select 
          className={styles.filterSelect}
          value={filterPrioridad}
          onChange={(e) => setFilterPrioridad(e.target.value)}
        >
          <option value="">Prioridad (Todas)</option>
          <option value="Baja">Baja</option>
          <option value="Media">Media</option>
          <option value="Alta">Alta</option>
          <option value="Urgente">Urgente</option>
        </select>

        <select 
          className={styles.filterSelect}
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
        >
          <option value="">Estados (Todos)</option>
          <option value="Abierta">Abierta</option>
          <option value="En progreso">En progreso</option>
          <option value="En espera">En espera</option>
          <option value="Resuelta">Resuelta</option>
          <option value="Cancelada">Cancelada</option>
        </select>
      </div>

      {/* Main Table view */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Cargando tickets de soporte...</span>
        </div>
      ) : (
        filteredTareas.length === 0 ? (
          <div className={styles.emptyState}>
            <Ticket size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No se encontraron tareas</h3>
            <p className={styles.emptyText}>Creá un ticket de soporte para hacer el seguimiento técnico.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <div className={styles.table}>
              <div className={styles.tableHeader} style={{ gridTemplateColumns: '2fr 1fr 1.2fr 1.5fr 1.5fr 1.2fr 120px' }}>
                <div>Título / Descripción</div>
                <div>Prioridad</div>
                <div>Estado</div>
                <div>Solicitante</div>
                <div>Técnico Asignado</div>
                <div>Fecha Creado</div>
                <div style={{ textAlign: 'right' }}>Acciones</div>
              </div>

              {paginatedTareas.map((item) => {
                const solName = item.solicitante ? `${item.solicitante.nombre} ${item.solicitante.apellido || ''}` : 'Sin solicitante';
                const tecName = item.tecnico ? `${item.tecnico.nombre} ${item.tecnico.apellido || ''}` : 'Sin asignar';
                const puestoCode = item.puesto?.codigo ? `Puesto: ${item.puesto.codigo}` : null;

                return (
                  <div key={item.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '2fr 1fr 1.2fr 1.5fr 1.5fr 1.2fr 120px', cursor: 'default' }}>
                    <div className={styles.rowText}>
                      <span style={{ fontWeight: 600, display: 'block' }}>{item.titulo}</span>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)' }} className={styles.rowText}>
                        {item.descripcion || 'Sin descripción'}
                      </span>
                      {puestoCode && (
                        <span style={{ display: 'inline-block', marginTop: '2px', fontSize: '10px', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                          {puestoCode}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className={`${styles.badge} ${
                        item.prioridad === 'Urgente' ? styles.badgeInactive : 
                        item.prioridad === 'Alta' ? styles.badgeWarning : 
                        item.prioridad === 'Media' ? styles.badgeInfo : styles.badgeActive
                      }`}>
                        {item.prioridad}
                      </span>
                    </div>

                    <div>
                      <span className={`${styles.badge} ${
                        item.estado === 'Resuelta' ? styles.badgeActive : 
                        item.estado === 'Cancelada' ? styles.badgeInactive : 
                        item.estado === 'En progreso' ? styles.badgeWarning : styles.badgeInfo
                      }`}>
                        {item.estado}
                      </span>
                    </div>

                    <div className={styles.rowText}>
                      {solName}
                      {item.solicitante?.email && (
                        <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                          {item.solicitante.email}
                        </span>
                      )}
                    </div>

                    <div className={styles.rowText}>
                      {tecName}
                      {item.tecnico?.email && (
                        <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                          {item.tecnico.email}
                        </span>
                      )}
                    </div>

                    <div>
                      {new Date(item.created_at).toLocaleDateString('es-AR')}
                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                        {new Date(item.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                      <button className={styles.actionBtn} onClick={() => handleOpenEdit(item)}>
                        <Edit size={14} />
                      </button>
                      <button className={styles.deleteBtn} onClick={() => handleOpenDelete(item.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Controles de paginación */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderTop: '1px solid var(--border-secondary)',
              fontSize: '13px',
              color: 'var(--text-secondary)'
            }}>
              <div>
                Mostrando <strong>{startIndex + 1}</strong> a <strong>{Math.min(startIndex + itemsPerPage, filteredTareas.length)}</strong> de <strong>{filteredTareas.length}</strong> {filteredTareas.length === 1 ? 'registro' : 'registros'}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    color: currentPage === 1 ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  Anterior
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    color: currentPage === totalPages ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalWide} style={{ maxHeight: '90vh' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalType === 'create' ? 'Crear Nuevo ' : 'Editar '}
                Ticket de Soporte
              </h3>
              <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                {/* TITULO */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Título del Ticket *</label>
                  <input 
                    type="text" 
                    className={styles.fieldInput}
                    value={form.titulo}
                    onChange={(e) => setForm({...form, titulo: e.target.value})}
                    placeholder="Ej. Impresora sin tóner / Falla de red en administración"
                    required
                  />
                </div>

                {/* DESCRIPCION */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Descripción del problema</label>
                  <textarea 
                    className={styles.fieldTextarea}
                    value={form.descripcion}
                    onChange={(e) => setForm({...form, descripcion: e.target.value})}
                    placeholder="Detalles sobre el incidente..."
                  />
                </div>

                {/* PRIORIDAD Y ESTADO */}
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Prioridad</label>
                    <select 
                      className={styles.fieldInput}
                      value={form.prioridad}
                      onChange={(e) => setForm({...form, prioridad: e.target.value})}
                    >
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                      <option value="Urgente">Urgente</option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Estado</label>
                    <select 
                      className={styles.fieldInput}
                      value={form.estado}
                      onChange={(e) => setForm({...form, estado: e.target.value})}
                    >
                      <option value="Abierta">Abierta</option>
                      <option value="En progreso">En progreso</option>
                      <option value="En espera">En espera</option>
                      <option value="Resuelta">Resuelta</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>
                </div>

                {/* SOLICITANTE Y TECNICO */}
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Solicitante</label>
                    <select 
                      className={styles.fieldInput}
                      value={form.id_solicitante}
                      onChange={(e) => setForm({...form, id_solicitante: e.target.value})}
                    >
                      <option value="">Seleccione Solicitante</option>
                      {usuarios.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} {u.apellido || ''} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Técnico Responsable</label>
                    <select 
                      className={styles.fieldInput}
                      value={form.id_tecnico}
                      onChange={(e) => setForm({...form, id_tecnico: e.target.value})}
                    >
                      <option value="">Sin asignar / En mesa</option>
                      {usuarios.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} {u.apellido || ''} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* PUESTO DE TRABAJO */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Puesto de Trabajo afectado</label>
                  <select 
                    className={styles.fieldInput}
                    value={form.id_puesto}
                    onChange={(e) => setForm({...form, id_puesto: e.target.value})}
                  >
                    <option value="">Sin puesto específico</option>
                    {puestos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.codigo} — {p.descripcion || 'Sin descripción'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* VINCULO A ACTIVO */}
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Tipo de Activo</label>
                    <select 
                      className={styles.fieldInput}
                      value={form.tipo_activo}
                      onChange={(e) => setForm({...form, tipo_activo: e.target.value, id_activo: ''})}
                    >
                      <option value="">No aplica / Ninguno</option>
                      <option value="computadora">Computadora / Laptop</option>
                      <option value="impresora">Impresora</option>
                      <option value="periferico">Periférico</option>
                      <option value="infraestructura">Equipo de Red / Infra</option>
                      <option value="movil">Móvil / Celular</option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Activo Específico</label>
                    <select 
                      className={styles.fieldInput}
                      value={form.id_activo}
                      onChange={(e) => setForm({...form, id_activo: e.target.value})}
                      disabled={!form.tipo_activo}
                    >
                      <option value="">Seleccione Activo</option>
                      {activosList.map(a => {
                        const label = a.hostname 
                          ? `${a.hostname} (S/N: ${a.serial || 'N/A'})` 
                          : a.categoria 
                          ? `${a.categoria} (S/N: ${a.serial || 'N/A'})`
                          : a.tipo 
                          ? `${a.tipo} (S/N: ${a.serial || 'N/A'})`
                          : `ID: ${a.id} (S/N: ${a.serial || 'N/A'})`;
                        return <option key={a.id} value={a.id}>{label}</option>;
                      })}
                    </select>
                  </div>
                </div>

                {/* RESOLUTION NOTES (Shown when Resolved/Cancelled) */}
                {(form.estado === 'Resuelta' || form.estado === 'Cancelada') && (
                  <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel} style={{ color: 'var(--success-text)', fontWeight: 600 }}>
                        Notas de Resolución / Cierre *
                      </label>
                      <textarea 
                        className={styles.fieldTextarea}
                        value={form.notas_resolucion}
                        onChange={(e) => setForm({...form, notas_resolucion: e.target.value})}
                        placeholder="Explicá brevemente cuál fue la solución aplicada..."
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG */}
      {isConfirmOpen && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmModal}>
            <h3 className={styles.confirmTitle}>¿Confirmar eliminación?</h3>
            <p className={styles.confirmMessage}>
              Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este ticket?
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setIsConfirmOpen(false)}>
                Cancelar
              </button>
              <button className={styles.dangerBtn} onClick={executeDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
