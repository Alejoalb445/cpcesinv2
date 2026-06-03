'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Licencia, LicenciaAsignada, Proveedor, Persona, Puesto, Sector } from '@/types/database';
import { Key, Plus, Search, Pencil, Trash2, X, Users, Briefcase, UserCheck, Shield, Cpu } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

const TIPO_LICENCIA_OPTIONS = ['OEM', 'Por usuario', 'Por equipo', 'Volumen', 'Suscripción', 'Perpetua', 'Otra'];
const ESTADO_OPTIONS = ['Activa', 'Vencida', 'Suspendida', 'Cancelada'];

interface LicenciaForm {
  software: string;
  fabricante: string;
  tipo: string;
  clave_producto: string;
  cantidad_total: number | '';
  id_proveedor: number | '';
  fecha_compra: string;
  fecha_vencimiento: string;
  estado: string;
  notas: string;
}

interface AsignarForm {
  id_pc: number | '';
  id_persona: number | '';
  id_puesto: number | '';
  id_sector: number | '';
  notas: string;
}

const emptyForm: LicenciaForm = {
  software: '',
  fabricante: '',
  tipo: 'Suscripción',
  clave_producto: '',
  cantidad_total: 1,
  id_proveedor: '',
  fecha_compra: '',
  fecha_vencimiento: '',
  estado: 'Activa',
  notas: '',
};

const emptyAsignar: AsignarForm = {
  id_pc: '',
  id_persona: '',
  id_puesto: '',
  id_sector: '',
  notas: '',
};

type JoinedLicencia = Licencia & {
  proveedor: Proveedor | null;
};

export default function LicenciasPage() {
  const supabase = getSupabaseClient();

  const [items, setItems] = useState<JoinedLicencia[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [pcs, setPcs] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Selected license for assignments details
  const [selectedItem, setSelectedItem] = useState<JoinedLicencia | null>(null);
  const [assignments, setAssignments] = useState<LicenciaAsignada[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JoinedLicencia | null>(null);
  const [form, setForm] = useState<LicenciaForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState<AsignarForm>(emptyAsignar);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [licRes, provRes, persRes, puestoRes, secRes, pcsRes] = await Promise.all([
      supabase
        .from('licencias')
        .select('*, proveedor:proveedores(*)')
        .order('software'),
      supabase.from('proveedores').select('*').eq('activo', true).order('nombre'),
      supabase.from('personas').select('*').eq('activo', true).order('nombre'),
      supabase.from('puestos').select('*').order('codigo_puesto'),
      supabase.from('sectores').select('*').eq('activo', true).order('nombre'),
      supabase.from('activos_pc').select('*, activo:activos(codigo_interno, id_marca, id_modelo, marcas(nombre), modelos(nombre))'),
    ]);

    if (licRes.data) setItems(licRes.data as JoinedLicencia[]);
    if (provRes.data) setProveedores(provRes.data as Proveedor[]);
    if (persRes.data) setPersonas(persRes.data as Persona[]);
    if (puestoRes.data) setPuestos(puestoRes.data as Puesto[]);
    if (secRes.data) setSectores(secRes.data as Sector[]);
    if (pcsRes.data) setPcs(pcsRes.data as any[]);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load assignments when selection changes
  const loadAssignments = useCallback(async (licId: number) => {
    setLoadingAssignments(true);
    const { data, error } = await supabase
      .from('licencias_asignadas')
      .select('*, persona:personas(*), puesto:puestos(*), sector:sectores(*)')
      .eq('id_licencia', licId)
      .is('fecha_liberado', null)
      .order('fecha_asignado', { ascending: false });

    if (error) {
      toast.error('Error al cargar asignaciones de licencias');
      console.error(error);
    } else {
      setAssignments(data as LicenciaAsignada[]);
    }
    setLoadingAssignments(false);
  }, [supabase]);

  useEffect(() => {
    if (selectedItem) {
      loadAssignments(selectedItem.id);
    } else {
      setAssignments([]);
    }
  }, [selectedItem, loadAssignments]);

  const filtered = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.software.toLowerCase().includes(term) ||
      (item.fabricante || '').toLowerCase().includes(term) ||
      (item.clave_producto || '').toLowerCase().includes(term);

    const matchesEstado = filterEstado ? item.estado === filterEstado : true;
    return matchesSearch && matchesEstado;
  });

  function openModal(item?: JoinedLicencia) {
    setErrors({});
    if (item) {
      setEditingItem(item);
      setForm({
        software: item.software,
        fabricante: item.fabricante || '',
        tipo: item.tipo || 'Suscripción',
        clave_producto: item.clave_producto || '',
        cantidad_total: item.cantidad_total ?? 1,
        id_proveedor: item.id_proveedor || '',
        fecha_compra: item.fecha_compra ? item.fecha_compra.substring(0, 10) : '',
        fecha_vencimiento: item.fecha_vencimiento ? item.fecha_vencimiento.substring(0, 10) : '',
        estado: item.estado || 'Activa',
        notes: item.notas || '', // handle fallback
      } as any);
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

  function openAssign(item: JoinedLicencia) {
    setErrors({});
    setSelectedItem(item);
    setAssignForm(emptyAsignar);
    setAssignOpen(true);
  }

  function closeAssign() {
    setAssignOpen(false);
    setAssignForm(emptyAsignar);
  }

  function validate(): boolean {
    const newErrors: Partial<Record<string, string>> = {};
    if (!form.software.trim()) newErrors.software = 'El nombre de software es obligatorio';
    if (!form.cantidad_total || Number(form.cantidad_total) <= 0) {
      newErrors.cantidad_total = 'La cantidad total debe ser mayor a 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      software: form.software.trim(),
      fabricante: form.fabricante.trim() || null,
      tipo: form.tipo,
      clave_producto: form.clave_producto.trim() || null,
      cantidad_total: Number(form.cantidad_total),
      id_proveedor: form.id_proveedor ? Number(form.id_proveedor) : null,
      fecha_compra: form.fecha_compra || null,
      fecha_vencimiento: form.fecha_vencimiento || null,
      estado: form.estado,
      notas: (form as any).notes?.trim() || null,
    };

    if (editingItem) {
      const { error } = await supabase
        .from('licencias')
        .update(payload)
        .eq('id', editingItem.id);

      if (error) {
        toast.error('Error al actualizar la licencia');
        console.error(error);
      } else {
        toast.success('Licencia actualizada correctamente');
        closeModal();
        loadData();
      }
    } else {
      const { error } = await supabase
        .from('licencias')
        .insert({
          ...payload,
          cantidad_en_uso: 0,
        });

      if (error) {
        toast.error('Error al registrar la licencia');
        console.error(error);
      } else {
        toast.success('Licencia registrada correctamente');
        closeModal();
        loadData();
      }
    }
    setSaving(false);
  }

  async function handleAssign() {
    if (!selectedItem) return;
    
    const { id_pc, id_persona, id_puesto, id_sector, notas } = assignForm;
    if (!id_pc && !id_persona && !id_puesto && !id_sector) {
      toast.error('Debe seleccionar al menos un destino para asignar la licencia (Equipo, Persona, Puesto o Sector)');
      return;
    }

    setSaving(true);
    // 1. Insert assignment
    const { error: insError } = await supabase
      .from('licencias_asignadas')
      .insert({
        id_licencia: selectedItem.id,
        id_pc: id_pc ? Number(id_pc) : null,
        id_persona: id_persona ? Number(id_persona) : null,
        id_puesto: id_puesto ? Number(id_puesto) : null,
        id_sector: id_sector ? Number(id_sector) : null,
        fecha_asignado: new Date().toISOString(),
        estado: 'Asignada',
        notas: notas.trim() || null,
      });

    if (insError) {
      toast.error('Error al crear la asignación');
      console.error(insError);
      setSaving(false);
      return;
    }

    // 2. Call RPC to increment cantidad_en_uso
    const { error: rpcError } = await supabase.rpc('incrementar_uso_licencia', {
      p_id_licencia: selectedItem.id,
    });

    if (rpcError) {
      toast.error('Asignado pero no se pudo actualizar el total de uso');
      console.error(rpcError);
    } else {
      toast.success('Licencia asignada correctamente');
      loadAssignments(selectedItem.id);
      loadData();
      closeAssign();
    }
    setSaving(false);
  }

  async function handleRelease(idAsignacion: number) {
    if (!selectedItem) return;
    setSaving(true);

    // 1. Update assignment to set fecha_liberado
    const { error: updError } = await supabase
      .from('licencias_asignadas')
      .update({
        fecha_liberado: new Date().toISOString(),
        estado: 'Liberada',
      })
      .eq('id', idAsignacion);

    if (updError) {
      toast.error('Error al liberar la asignación');
      console.error(updError);
      setSaving(false);
      return;
    }

    // 2. Call RPC to decrement
    const { error: rpcError } = await supabase.rpc('decrementar_uso_licencia', {
      p_id_licencia: selectedItem.id,
    });

    if (rpcError) {
      toast.error('Liberada pero no se pudo actualizar el contador');
      console.error(rpcError);
    } else {
      toast.success('Licencia liberada correctamente');
      loadAssignments(selectedItem.id);
      loadData();
    }
    setSaving(false);
  }

  function getEstadoBadge(estado: string) {
    switch (estado) {
      case 'Activa':
        return styles.badgeActive;
      case 'Vencida':
      case 'Cancelada':
        return styles.badgeInactive;
      case 'Suspendida':
        return styles.badgeWarning;
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
            <Key size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Licencias de Software</h1>
            <p className={styles.pageSubtitle}>Inventario de claves, suscripciones y asignación de asientos</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={18} /> Nueva Licencia
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por software, fabricante o clave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedItem ? '1.8fr 1.2fr' : '1fr', gap: 'var(--space-5)', transition: 'all 0.3s' }}>
        {/* Table List */}
        <div className={styles.table}>
          <div className={styles.tableHeader} style={{ gridTemplateColumns: '2fr 1.2fr 1fr 70px 70px 110px 100px 140px' }}>
            <span>Software</span>
            <span>Fabricante</span>
            <span>Tipo</span>
            <span>Total</span>
            <span>Uso</span>
            <span>Vencimiento</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>

          {loading ? (
            <div className={styles.loadingState}><div className={styles.spinner} /><span>Cargando...</span></div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}><Key size={48} className={styles.emptyIcon} /><p>No se encontraron licencias</p></div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`${styles.tableRowItem} ${selectedItem?.id === item.id ? styles.activeRow : ''}`}
                style={{ gridTemplateColumns: '2fr 1.2fr 1fr 70px 70px 110px 100px 140px', background: selectedItem?.id === item.id ? 'var(--bg-hover)' : undefined }}
                onClick={() => setSelectedItem(item)}
              >
                <span className={styles.rowText} style={{ fontWeight: 600 }}>{item.software}</span>
                <span className={styles.rowText}>{item.fabricante || '—'}</span>
                <span>{item.tipo}</span>
                <span style={{ fontWeight: 600 }}>{item.cantidad_total}</span>
                <span style={{ fontWeight: 600, color: item.cantidad_en_uso >= item.cantidad_total ? 'var(--danger)' : undefined }}>
                  {item.cantidad_en_uso}
                </span>
                <span>{item.fecha_vencimiento ? new Date(item.fecha_vencimiento).toLocaleDateString() : 'Perpetua'}</span>
                <span><span className={`${styles.badge} ${getEstadoBadge(item.estado)}`}>{item.estado}</span></span>
                <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                  <button className={styles.actionBtn} onClick={() => openAssign(item)} title="Asignar Licencia" style={{ color: 'var(--accent-primary)' }}>
                    <Plus size={14} /> Asignar
                  </button>
                  <button className={styles.actionBtn} onClick={() => openModal(item)} title="Editar">
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Assignments Panel */}
        {selectedItem && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>Asignaciones Activas</h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Software: {selectedItem.software}</span>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setSelectedItem(null)}><X size={18} /></button>
            </div>

            {loadingAssignments ? (
              <div className={styles.loadingState}><div className={styles.spinner} /><span>Cargando asignaciones...</span></div>
            ) : assignments.length === 0 ? (
              <div className={styles.emptyState} style={{ padding: 'var(--space-6)' }}>
                <Users size={36} className={styles.emptyIcon} />
                <p style={{ fontSize: 'var(--text-sm)' }}>No hay asignaciones activas</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {assignments.map((asg) => (
                  <div key={asg.id} style={{ padding: 'var(--space-3)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                        {asg.id_pc && <><Cpu size={14} /> Equipo PC</>}
                        {asg.id_persona && <><UserCheck size={14} /> {asg.persona?.nombre} {asg.persona?.apellido || ''}</>}
                        {asg.id_puesto && <><Briefcase size={14} /> Puesto: {asg.puesto?.codigo_puesto}</>}
                        {asg.id_sector && <><Shield size={14} /> Sector: {asg.sector?.nombre}</>}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Asignado el {new Date(asg.fecha_asignado).toLocaleDateString()}</span>
                      {asg.notas && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Notas: {asg.notas}</span>}
                    </div>
                    <button className={styles.deleteBtn} style={{ padding: '6px 10px', fontSize: 'var(--text-xs)' }} onClick={() => handleRelease(asg.id)} disabled={saving}>
                      Liberar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail/Create/Edit Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalWide} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingItem ? 'Editar Licencia' : 'Nueva Licencia de Software'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Software *</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.software}
                    onChange={(e) => setForm({ ...form, software: e.target.value })}
                    placeholder="Nombre del software"
                  />
                  {errors.software && <span className={styles.fieldError}>{errors.software}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Fabricante</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.fabricante}
                    onChange={(e) => setForm({ ...form, fabricante: e.target.value })}
                    placeholder="Ej: Microsoft, Adobe"
                  />
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Tipo de Licencia</label>
                  <select
                    className={styles.fieldInput}
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    {TIPO_LICENCIA_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Cantidad de Asientos / Total *</label>
                  <input
                    type="number"
                    className={styles.fieldInput}
                    value={form.cantidad_total}
                    onChange={(e) => setForm({ ...form, cantidad_total: e.target.value ? Number(e.target.value) : '' })}
                    min="1"
                  />
                  {errors.cantidad_total && <span className={styles.fieldError}>{errors.cantidad_total}</span>}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Clave de Producto / Licencia</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={form.clave_producto}
                  onChange={(e) => setForm({ ...form, clave_producto: e.target.value })}
                  placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                />
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Proveedor</label>
                  <select
                    className={styles.fieldInput}
                    value={form.id_proveedor}
                    onChange={(e) => setForm({ ...form, id_proveedor: e.target.value ? Number(e.target.value) : '' })}
                  >
                    <option value="">Ninguno</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
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

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Fecha de Compra</label>
                  <input
                    type="date"
                    className={styles.fieldInput}
                    value={form.fecha_compra}
                    onChange={(e) => setForm({ ...form, fecha_compra: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Fecha de Vencimiento</label>
                  <input
                    type="date"
                    className={styles.fieldInput}
                    value={form.fecha_vencimiento}
                    onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Notas / Comentarios</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={(form as any).notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value } as any)}
                  placeholder="Detalles adicionales..."
                />
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

      {/* Assign Modal */}
      {assignOpen && selectedItem && (
        <div className={styles.modalOverlay} onClick={closeAssign}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Asignar Licencia</h2>
              <button className={styles.modalCloseBtn} onClick={closeAssign}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Licencia: <strong>{selectedItem.software}</strong><br />
                Asientos libres: <strong>{selectedItem.cantidad_total - selectedItem.cantidad_en_uso}</strong>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Opción A: Asignar a PC</label>
                  <select
                    className={styles.fieldInput}
                    value={assignForm.id_pc}
                    onChange={(e) => setAssignForm({ ...assignForm, id_pc: e.target.value ? Number(e.target.value) : '', id_persona: '', id_puesto: '', id_sector: '' })}
                  >
                    <option value="">Seleccione PC...</option>
                    {pcs.map((pc) => (
                      <option key={pc.id_activo} value={pc.id_activo}>
                        {pc.activo?.codigo_interno} — {pc.hostname} ({pc.activo?.marcas?.nombre} {pc.activo?.modelos?.nombre})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Opción B: Asignar a Persona</label>
                  <select
                    className={styles.fieldInput}
                    value={assignForm.id_persona}
                    onChange={(e) => setAssignForm({ ...assignForm, id_persona: e.target.value ? Number(e.target.value) : '', id_pc: '', id_puesto: '', id_sector: '' })}
                  >
                    <option value="">Seleccione persona...</option>
                    {personas.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido || ''}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Opción C: Asignar a Puesto</label>
                  <select
                    className={styles.fieldInput}
                    value={assignForm.id_puesto}
                    onChange={(e) => setAssignForm({ ...assignForm, id_puesto: e.target.value ? Number(e.target.value) : '', id_pc: '', id_persona: '', id_sector: '' })}
                  >
                    <option value="">Seleccione puesto...</option>
                    {puestos.map((pst) => (
                      <option key={pst.id} value={pst.id}>{pst.codigo_puesto} — {pst.descripcion}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Opción D: Asignar a Sector</label>
                  <select
                    className={styles.fieldInput}
                    value={assignForm.id_sector}
                    onChange={(e) => setAssignForm({ ...assignForm, id_sector: e.target.value ? Number(e.target.value) : '', id_pc: '', id_persona: '', id_puesto: '' })}
                  >
                    <option value="">Seleccione sector...</option>
                    {sectores.map((sec) => (
                      <option key={sec.id} value={sec.id}>{sec.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Notas de asignación</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={assignForm.notas}
                    onChange={(e) => setAssignForm({ ...assignForm, notas: e.target.value })}
                    placeholder="Ej: Licencia anual para gerencia"
                  />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={closeAssign}>Cancelar</button>
              <button className={styles.saveBtn} onClick={handleAssign} disabled={saving}>
                {saving ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
