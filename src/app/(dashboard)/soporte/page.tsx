'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { TicketSoporte, TicketComentario, Persona, Puesto, Sector, Activo, ServicioInterno } from '@/types/database';
import { Ticket, Plus, Search, Pencil, Trash2, X, MessageSquare, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

const PRIORIDAD_OPTIONS = ['Baja', 'Media', 'Alta', 'Crítica'];
const ESTADO_OPTIONS = ['Pendiente', 'En proceso', 'Esperando tercero', 'Resuelto', 'Cancelado'];
const ORIGEN_OPTIONS = ['Sistema', 'Outlook', 'Manual', 'Teléfono', 'Presencial'];

interface TicketForm {
  titulo: string;
  descripcion: string;
  id_persona_afectada: number | '';
  id_puesto: number | '';
  id_sector: number | '';
  id_activo: number | '';
  id_servicio: number | '';
  prioridad: string;
  estado: string;
  origen: string;
}

const emptyForm: TicketForm = {
  titulo: '',
  descripcion: '',
  id_persona_afectada: '',
  id_puesto: '',
  id_sector: '',
  id_activo: '',
  id_servicio: '',
  prioridad: 'Media',
  estado: 'Pendiente',
  origen: 'Manual',
};

export default function SoportePage() {
  const supabase = getSupabaseClient();

  const [items, setItems] = useState<TicketSoporte[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [activos, setActivos] = useState<Activo[]>([]);
  const [servicios, setServicios] = useState<ServicioInterno[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState('');

  // Comments for selected ticket
  const [selectedTicket, setSelectedTicket] = useState<TicketSoporte | null>(null);
  const [comentarios, setComentarios] = useState<TicketComentario[]>([]);
  const [newComentario, setNewComentario] = useState('');
  const [loadingComentarios, setLoadingComentarios] = useState(false);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TicketSoporte | null>(null);
  const [form, setForm] = useState<TicketForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [closeTicketOpen, setCloseTicketOpen] = useState(false);
  const [notasResolucion, setNotasResolucion] = useState('');

  const [errors, setErrors] = useState<Partial<Record<keyof TicketForm, string>>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [ticketRes, persRes, puestoRes, secRes, actRes, servRes] = await Promise.all([
      supabase
        .from('tickets_soporte')
        .select('*, persona_afectada:personas(*), puesto:puestos(*), sector:sectores(*), activo:activos(*, marca:marcas(*), modelo:modelos(*)), servicio:servicios_internos(*)')
        .order('fecha_creacion', { ascending: false }),
      supabase.from('personas').select('*').eq('activo', true).order('nombre'),
      supabase.from('puestos').select('*').order('codigo_puesto'),
      supabase.from('sectores').select('*').eq('activo', true).order('nombre'),
      supabase.from('activos').select('*, marca:marcas(*), modelo:modelos(*)').eq('dado_de_baja', false),
      supabase.from('servicios_internos').select('*').eq('activo', true).order('nombre'),
    ]);

    if (ticketRes.data) setItems(ticketRes.data as TicketSoporte[]);
    if (persRes.data) setPersonas(persRes.data as Persona[]);
    if (puestoRes.data) setPuestos(puestoRes.data as Puesto[]);
    if (secRes.data) setSectores(secRes.data as Sector[]);
    if (actRes.data) setActivos(actRes.data as Activo[]);
    if (servRes.data) setServicios(servRes.data as ServicioInterno[]);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadComentarios = useCallback(async (ticketId: number) => {
    setLoadingComentarios(true);
    const { data, error } = await supabase
      .from('ticket_comentarios')
      .select('*')
      .eq('id_ticket', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Error al cargar comentarios');
      console.error(error);
    } else {
      setComentarios(data as TicketComentario[]);
    }
    setLoadingComentarios(false);
  }, [supabase]);

  useEffect(() => {
    if (selectedTicket) {
      loadComentarios(selectedTicket.id);
    } else {
      setComentarios([]);
    }
  }, [selectedTicket, loadComentarios]);

  const filtered = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.titulo.toLowerCase().includes(term) ||
      (item.descripcion || '').toLowerCase().includes(term) ||
      (item.persona_afectada?.nombre || '').toLowerCase().includes(term) ||
      (item.persona_afectada?.apellido || '').toLowerCase().includes(term);

    const matchesEstado = filterEstado ? item.estado === filterEstado : true;
    const matchesPrioridad = filterPrioridad ? item.prioridad === filterPrioridad : true;

    return matchesSearch && matchesEstado && matchesPrioridad;
  });

  function openModal(item?: TicketSoporte) {
    setErrors({});
    if (item) {
      setEditingItem(item);
      setForm({
        titulo: item.titulo,
        descripcion: item.descripcion || '',
        id_persona_afectada: item.id_persona_afectada || '',
        id_puesto: item.id_puesto || '',
        id_sector: item.id_sector || '',
        id_activo: item.id_activo || '',
        id_servicio: item.id_servicio || '',
        prioridad: item.prioridad || 'Media',
        estado: item.estado || 'Pendiente',
        origen: item.origen || 'Manual',
      });
    } else {
      setEditingItem(null);
      setForm(emptyForm);
    }
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
    setErrors({});
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof TicketForm, string>> = {};
    if (!form.titulo.trim()) newErrors.titulo = 'El título es obligatorio';
    if (!form.id_persona_afectada) newErrors.id_persona_afectada = 'El solicitante afectado es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      id_persona_afectada: Number(form.id_persona_afectada),
      id_puesto: form.id_puesto ? Number(form.id_puesto) : null,
      id_sector: form.id_sector ? Number(form.id_sector) : null,
      id_activo: form.id_activo ? Number(form.id_activo) : null,
      id_servicio: form.id_servicio ? Number(form.id_servicio) : null,
      prioridad: form.prioridad as any,
      estado: form.estado as any,
      origen: form.origen,
    };

    if (editingItem) {
      const { error } = await supabase
        .from('tickets_soporte')
        .update(payload)
        .eq('id', editingItem.id);

      if (error) {
        toast.error('Error al actualizar el ticket');
        console.error(error);
      } else {
        toast.success('Ticket actualizado correctamente');
        closeModal();
        loadData();
      }
    } else {
      const { error } = await supabase
        .from('tickets_soporte')
        .insert({
          ...payload,
          fecha_creacion: new Date().toISOString(),
        });

      if (error) {
        toast.error('Error al crear el ticket');
        console.error(error);
      } else {
        toast.success('Ticket creado correctamente');
        closeModal();
        loadData();
      }
    }
    setSaving(false);
  }

  async function handleAddComentario() {
    if (!selectedTicket || !newComentario.trim()) return;
    setSaving(true);

    const { error } = await supabase.from('ticket_comentarios').insert({
      id_ticket: selectedTicket.id,
      comentario: newComentario.trim(),
      created_at: new Date().toISOString(),
    });

    if (error) {
      toast.error('Error al agregar comentario');
      console.error(error);
    } else {
      setNewComentario('');
      loadComentarios(selectedTicket.id);
    }
    setSaving(false);
  }

  async function handleCloseTicket() {
    if (!selectedTicket || !notasResolucion.trim()) {
      toast.error('Ingrese notas de resolución para cerrar el ticket');
      return;
    }
    setSaving(true);

    const { error } = await supabase
      .from('tickets_soporte')
      .update({
        estado: 'Resuelto',
        fecha_cierre: new Date().toISOString(),
        notas_resolucion: notasResolucion.trim(),
      })
      .eq('id', selectedTicket.id);

    if (error) {
      toast.error('Error al cerrar el ticket');
      console.error(error);
    } else {
      toast.success('Ticket resuelto y cerrado correctamente');
      setCloseTicketOpen(false);
      setNotasResolucion('');
      setSelectedTicket(null);
      loadData();
    }
    setSaving(false);
  }

  function getPrioridadBadge(prio: string) {
    switch (prio) {
      case 'Baja':
        return styles.badgeActive; // green
      case 'Media':
        return styles.badgeInfo; // blue
      case 'Alta':
        return styles.badgeWarning; // orange
      case 'Crítica':
        return styles.badgeInactive; // red
      default:
        return styles.badgeNeutral;
    }
  }

  function getEstadoBadge(est: string) {
    switch (est) {
      case 'Resuelto':
        return styles.badgeActive;
      case 'Pendiente':
        return styles.badgeWarning;
      case 'En proceso':
        return styles.badgeInfo;
      case 'Cancelado':
        return styles.badgeInactive;
      case 'Esperando tercero':
        return styles.badgeNeutral;
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
            <Ticket size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Mesa de Ayuda (Soporte)</h1>
            <p className={styles.pageSubtitle}>Registro y seguimiento de incidencias, requerimientos y soporte técnico</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={18} /> Nuevo Ticket
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por título, descripción o solicitante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {ESTADO_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <select
          className={styles.filterSelect}
          value={filterPrioridad}
          onChange={(e) => setFilterPrioridad(e.target.value)}
        >
          <option value="">Todas las prioridades</option>
          {PRIORIDAD_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedTicket ? '1.8fr 1.2fr' : '1fr', gap: 'var(--space-5)', transition: 'all 0.3s' }}>
        {/* Table List */}
        <div className={styles.table}>
          <div className={styles.tableHeader} style={{ gridTemplateColumns: '60px 2fr 90px 110px 1.2fr 1fr 100px 100px' }}>
            <span>ID</span>
            <span>Título</span>
            <span>Prioridad</span>
            <span>Estado</span>
            <span>Solicitante</span>
            <span>Sector</span>
            <span>Fecha</span>
            <span>Acciones</span>
          </div>

          {loading ? (
            <div className={styles.loadingState}><div className={styles.spinner} /><span>Cargando tickets...</span></div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}><Ticket size={48} className={styles.emptyIcon} /><p>No se encontraron tickets</p></div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`${styles.tableRowItem} ${selectedTicket?.id === item.id ? styles.activeRow : ''}`}
                style={{ gridTemplateColumns: '60px 2fr 90px 110px 1.2fr 1fr 100px 100px', background: selectedTicket?.id === item.id ? 'var(--bg-hover)' : undefined }}
                onClick={() => setSelectedTicket(item)}
              >
                <span style={{ fontFamily: 'var(--font-mono)' }}>#{item.id}</span>
                <span className={styles.rowText} style={{ fontWeight: 600 }}>{item.titulo}</span>
                <span><span className={`${styles.badge} ${getPrioridadBadge(item.prioridad)}`}>{item.prioridad}</span></span>
                <span><span className={`${styles.badge} ${getEstadoBadge(item.estado)}`}>{item.estado}</span></span>
                <span className={styles.rowText}>
                  {item.persona_afectada?.nombre} {item.persona_afectada?.apellido || ''}
                </span>
                <span className={styles.rowText}>{item.sector?.nombre || '—'}</span>
                <span>{new Date(item.fecha_creacion).toLocaleDateString()}</span>
                <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                  <button className={styles.actionBtn} onClick={() => openModal(item)} title="Editar">
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comments Sidebar Panel */}
        {selectedTicket && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>Detalle y Comentarios</h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Ticket #{selectedTicket.id}: {selectedTicket.titulo}</span>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setSelectedTicket(null)}><X size={18} /></button>
            </div>

            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-secondary)' }}>
              <div><strong>Descripción:</strong> {selectedTicket.descripcion || 'Sin descripción'}</div>
              {selectedTicket.activo && <div><strong>Activo vinculado:</strong> {selectedTicket.activo.codigo_interno} ({selectedTicket.activo.serial})</div>}
              {selectedTicket.servicio && <div><strong>Servicio:</strong> {selectedTicket.servicio.nombre}</div>}
              {selectedTicket.estado === 'Resuelto' && (
                <div style={{ color: 'var(--success-text)', background: 'var(--success-bg)', padding: '8px', borderRadius: 'var(--radius-sm)', marginTop: '8px' }}>
                  <strong>Resolución:</strong> {selectedTicket.notas_resolucion}
                </div>
              )}
            </div>

            {/* List comments */}
            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={16} /> Comentarios / Bitácora
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {loadingComentarios ? (
                <div className={styles.loadingState} style={{ padding: '10px' }}><div className={styles.spinner} /></div>
              ) : comentarios.length === 0 ? (
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textAlign: 'center', padding: '10px' }}>
                  No hay comentarios registrados.
                </span>
              ) : (
                comentarios.map((c) => (
                  <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: '2px', background: 'var(--bg-tertiary)', padding: '8px 10px', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-primary)' }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{new Date(c.created_at).toLocaleString()}</span>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{c.comentario}</p>
                  </div>
                ))
              )}
            </div>

            {/* New Comment Input */}
            {selectedTicket.estado !== 'Resuelto' && selectedTicket.estado !== 'Cancelado' && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <input
                  type="text"
                  className={styles.fieldInput}
                  style={{ flex: 1 }}
                  placeholder="Agregar comentario de avance..."
                  value={newComentario}
                  onChange={(e) => setNewComentario(e.target.value)}
                />
                <button className={styles.saveBtn} onClick={handleAddComentario} disabled={saving || !newComentario.trim()}>
                  Enviar
                </button>
              </div>
            )}

            {/* Close ticket button */}
            {selectedTicket.estado !== 'Resuelto' && selectedTicket.estado !== 'Cancelado' && (
              <button
                className={styles.addBtn}
                style={{ width: '100%', justifyContent: 'center', background: 'var(--success-text)', color: 'white', marginTop: '10px' }}
                onClick={() => setCloseTicketOpen(true)}
              >
                <CheckCircle size={16} /> Cerrar / Resolver Ticket
              </button>
            )}
          </div>
        )}
      </div>

      {/* Ticket Create/Edit Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalWide} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingItem ? 'Editar Ticket' : 'Crear Nuevo Ticket'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={closeModal}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Título del incidente *</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ej: Impresora no enciende, Falla de conexión a red..."
                />
                {errors.titulo && <span className={styles.fieldError}>{errors.titulo}</span>}
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Descripción detallada</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Explique el problema de forma detallada..."
                />
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Persona Afectada *</label>
                  <select
                    className={styles.fieldInput}
                    value={form.id_persona_afectada}
                    onChange={(e) => setForm({ ...form, id_persona_afectada: e.target.value ? Number(e.target.value) : '' })}
                  >
                    <option value="">Seleccione persona...</option>
                    {personas.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido || ''}</option>
                    ))}
                  </select>
                  {errors.id_persona_afectada && <span className={styles.fieldError}>{errors.id_persona_afectada}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Sector</label>
                  <select
                    className={styles.fieldInput}
                    value={form.id_sector}
                    onChange={(e) => setForm({ ...form, id_sector: e.target.value ? Number(e.target.value) : '' })}
                  >
                    <option value="">Seleccione sector...</option>
                    {sectores.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Puesto de Trabajo</label>
                  <select
                    className={styles.fieldInput}
                    value={form.id_puesto}
                    onChange={(e) => setForm({ ...form, id_puesto: e.target.value ? Number(e.target.value) : '' })}
                  >
                    <option value="">Seleccione puesto...</option>
                    {puestos.map((pst) => (
                      <option key={pst.id} value={pst.id}>{pst.codigo_puesto} — {pst.descripcion}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Activo Relacionado</label>
                  <select
                    className={styles.fieldInput}
                    value={form.id_activo}
                    onChange={(e) => setForm({ ...form, id_activo: e.target.value ? Number(e.target.value) : '' })}
                  >
                    <option value="">Seleccione activo...</option>
                    {activos.map((act) => (
                      <option key={act.id} value={act.id}>
                        {act.codigo_interno} ({act.marca?.nombre} {act.modelo?.nombre} — S/N: {act.serial})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Servicio Afectado</label>
                  <select
                    className={styles.fieldInput}
                    value={form.id_servicio}
                    onChange={(e) => setForm({ ...form, id_servicio: e.target.value ? Number(e.target.value) : '' })}
                  >
                    <option value="">Ninguno</option>
                    {servicios.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre} ({s.categoria})</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Origen</label>
                  <select
                    className={styles.fieldInput}
                    value={form.origen}
                    onChange={(e) => setForm({ ...form, origen: e.target.value })}
                  >
                    {ORIGEN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Prioridad</label>
                  <select
                    className={styles.fieldInput}
                    value={form.prioridad}
                    onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
                  >
                    {PRIORIDAD_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Estado</label>
                  <select
                    className={styles.fieldInput}
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  >
                    {ESTADO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={closeModal}>Cancelar</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Ticket Dialog */}
      {closeTicketOpen && selectedTicket && (
        <div className={styles.modalOverlay} onClick={() => setCloseTicketOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Resolver / Cerrar Ticket #{selectedTicket.id}</h2>
              <button className={styles.modalCloseBtn} onClick={() => setCloseTicketOpen(false)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Notas de resolución *</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={notasResolucion}
                  onChange={(e) => setNotasResolucion(e.target.value)}
                  placeholder="Detalle los trabajos realizados para solucionar el ticket..."
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setCloseTicketOpen(false)}>Cancelar</button>
              <button className={styles.saveBtn} style={{ background: 'var(--success-text)' }} onClick={handleCloseTicket} disabled={saving || !notasResolucion.trim()}>
                Cerrar Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
