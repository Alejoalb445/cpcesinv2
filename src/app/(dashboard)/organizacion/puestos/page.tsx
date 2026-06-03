'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Puesto, Sector, UbicacionFisica } from '@/types/database';
import { Monitor, Plus, Search, Pencil, Trash2, X, MonitorX } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

const MODO_IP_OPTIONS = ['DHCP', 'Estática', 'USB', 'Pendiente', 'No aplica'];
const ESTADO_OPTIONS = ['Activo', 'Inactivo', 'En mantenimiento', 'De baja'];

interface PuestoForm {
  codigo_puesto: string;
  id_sector: number | '';
  id_ubicacion_fisica: number | '';
  descripcion: string;
  ip: string;
  modo_ip: string;
  vlan: string;
  boca_red: string;
  patchera: string;
  switch_referencia: string;
  puerto_switch: string;
  telefono_interno: string;
  estado: string;
  notas: string;
}

const emptyForm: PuestoForm = {
  codigo_puesto: '',
  id_sector: '',
  id_ubicacion_fisica: '',
  descripcion: '',
  ip: '',
  modo_ip: 'DHCP',
  vlan: '',
  boca_red: '',
  patchera: '',
  switch_referencia: '',
  puerto_switch: '',
  telefono_interno: '',
  estado: 'Activo',
  notas: '',
};

export default function PuestosPage() {
  const supabase = getSupabaseClient();

  const [items, setItems] = useState<Puesto[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [ubicaciones, setUbicaciones] = useState<UbicacionFisica[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Puesto | null>(null);
  const [form, setForm] = useState<PuestoForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Puesto | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof PuestoForm, string>>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [puestoRes, sectorRes, ubicRes] = await Promise.all([
      supabase
        .from('puestos')
        .select('*, sector:sectores(nombre), ubicacion_fisica:ubicaciones_fisicas(detalle, sede:sedes(nombre))')
        .order('codigo_puesto'),
      supabase
        .from('sectores')
        .select('*')
        .eq('activo', true)
        .order('nombre'),
      supabase
        .from('ubicaciones_fisicas')
        .select('*, sede:sedes(nombre)')
        .eq('activo', true)
        .order('detalle'),
    ]);

    if (puestoRes.error) {
      toast.error('Error al cargar puestos');
      console.error(puestoRes.error);
    } else {
      setItems(puestoRes.data as Puesto[]);
    }

    if (sectorRes.data) setSectores(sectorRes.data as Sector[]);
    if (ubicRes.data) setUbicaciones(ubicRes.data as UbicacionFisica[]);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.codigo_puesto.toLowerCase().includes(term) ||
      (item.descripcion || '').toLowerCase().includes(term) ||
      (item.ip || '').toLowerCase().includes(term) ||
      (item.sector?.nombre || '').toLowerCase().includes(term);
    const matchesSector = filterSector ? item.id_sector === Number(filterSector) : true;
    return matchesSearch && matchesSector;
  });

  function openModal(item?: Puesto) {
    if (item) {
      setEditingItem(item);
      setForm({
        codigo_puesto: item.codigo_puesto,
        id_sector: item.id_sector || '',
        id_ubicacion_fisica: item.id_ubicacion_fisica || '',
        descripcion: item.descripcion || '',
        ip: item.ip || '',
        modo_ip: item.modo_ip || 'DHCP',
        vlan: item.vlan || '',
        boca_red: item.boca_red || '',
        patchera: item.patchera || '',
        switch_referencia: item.switch_referencia || '',
        puerto_switch: item.puerto_switch || '',
        telefono_interno: item.telefono_interno || '',
        estado: item.estado || 'Activo',
        notas: item.notas || '',
      });
    } else {
      setEditingItem(null);
      setForm(emptyForm);
    }
    setErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
    setErrors({});
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof PuestoForm, string>> = {};
    if (!form.codigo_puesto.trim()) newErrors.codigo_puesto = 'El código es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      codigo_puesto: form.codigo_puesto.trim(),
      id_sector: form.id_sector ? Number(form.id_sector) : null,
      id_ubicacion_fisica: form.id_ubicacion_fisica ? Number(form.id_ubicacion_fisica) : null,
      descripcion: form.descripcion.trim() || null,
      ip: form.ip.trim() || null,
      modo_ip: form.modo_ip,
      vlan: form.vlan.trim() || null,
      boca_red: form.boca_red.trim() || null,
      patchera: form.patchera.trim() || null,
      switch_referencia: form.switch_referencia.trim() || null,
      puerto_switch: form.puerto_switch.trim() || null,
      telefono_interno: form.telefono_interno.trim() || null,
      estado: form.estado,
      notas: form.notas.trim() || null,
    };

    if (editingItem) {
      const { error } = await supabase
        .from('puestos')
        .update(payload)
        .eq('id', editingItem.id);

      if (error) {
        toast.error('Error al actualizar el puesto');
        console.error(error);
      } else {
        toast.success('Puesto actualizado correctamente');
        closeModal();
        loadData();
      }
    } else {
      const { error } = await supabase
        .from('puestos')
        .insert(payload);

      if (error) {
        toast.error('Error al crear el puesto');
        console.error(error);
      } else {
        toast.success('Puesto creado correctamente');
        closeModal();
        loadData();
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const { error } = await supabase
      .from('puestos')
      .update({ estado: 'Inactivo' })
      .eq('id', confirmDelete.id);

    if (error) {
      toast.error('Error al desactivar el puesto');
      console.error(error);
    } else {
      toast.success('Puesto desactivado correctamente');
      loadData();
    }
    setConfirmDelete(null);
  }

  function getEstadoBadge(estado: string) {
    switch (estado) {
      case 'Activo':
        return styles.badgeActive;
      case 'Inactivo':
      case 'De baja':
        return styles.badgeInactive;
      case 'En mantenimiento':
        return styles.badgeWarning;
      default:
        return styles.badgeInfo;
    }
  }

  function getUbicacionLabel(item: Puesto) {
    if (!item.ubicacion_fisica) return '—';
    const sede = (item.ubicacion_fisica as UbicacionFisica & { sede?: { nombre: string } }).sede;
    return sede
      ? `${item.ubicacion_fisica.detalle} (${sede.nombre})`
      : item.ubicacion_fisica.detalle;
  }

  function getUbicacionOptionLabel(u: UbicacionFisica) {
    const sede = (u as UbicacionFisica & { sede?: { nombre: string } }).sede;
    return sede ? `${u.detalle} — ${sede.nombre}` : u.detalle;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <Monitor size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Puestos</h1>
            <p className={styles.pageSubtitle}>Gestión de puestos de trabajo y red</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={18} /> Agregar
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por código, descripción, IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterSector}
          onChange={(e) => setFilterSector(e.target.value)}
        >
          <option value="">Todos los sectores</option>
          {sectores.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className={styles.table}>
        <div className={styles.tableHeader} style={{ gridTemplateColumns: '1.2fr 1.5fr 1.5fr 1.2fr 100px 120px 120px' }}>
          <span>Código</span>
          <span>Sector</span>
          <span>Ubicación</span>
          <span>IP</span>
          <span>Modo IP</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Cargando puestos...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <MonitorX size={48} className={styles.emptyIcon} />
            <p>No se encontraron puestos</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={styles.tableRowItem}
              style={{ gridTemplateColumns: '1.2fr 1.5fr 1.5fr 1.2fr 100px 120px 120px' }}
              onClick={() => openModal(item)}
            >
              <span className={styles.rowText} style={{ fontWeight: 600 }}>{item.codigo_puesto}</span>
              <span className={styles.rowText}>{item.sector?.nombre || '—'}</span>
              <span className={styles.rowText}>{getUbicacionLabel(item)}</span>
              <span className={styles.rowText} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                {item.ip || '—'}
              </span>
              <span>
                <span className={`${styles.badge} ${styles.badgeInfo}`}>
                  {item.modo_ip}
                </span>
              </span>
              <span>
                <span className={`${styles.badge} ${getEstadoBadge(item.estado)}`}>
                  {item.estado}
                </span>
              </span>
              <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                <button className={styles.actionBtn} onClick={() => openModal(item)} title="Editar">
                  <Pencil size={14} />
                </button>
                <button className={styles.deleteBtn} onClick={() => setConfirmDelete(item)} title="Desactivar">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalWide} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingItem ? 'Editar Puesto' : 'Nuevo Puesto'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Código de puesto *</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.codigo_puesto}
                    onChange={(e) => setForm({ ...form, codigo_puesto: e.target.value })}
                    placeholder="Ej: PC-ADM-001"
                  />
                  {errors.codigo_puesto && <span className={styles.fieldError}>{errors.codigo_puesto}</span>}
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
                  <label className={styles.fieldLabel}>Sector</label>
                  <select
                    className={styles.fieldInput}
                    value={form.id_sector}
                    onChange={(e) => setForm({ ...form, id_sector: e.target.value ? Number(e.target.value) : '' })}
                  >
                    <option value="">Sin sector</option>
                    {sectores.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Ubicación física</label>
                  <select
                    className={styles.fieldInput}
                    value={form.id_ubicacion_fisica}
                    onChange={(e) => setForm({ ...form, id_ubicacion_fisica: e.target.value ? Number(e.target.value) : '' })}
                  >
                    <option value="">Sin ubicación</option>
                    {ubicaciones.map((u) => (
                      <option key={u.id} value={u.id}>{getUbicacionOptionLabel(u)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Descripción</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descripción del puesto"
                />
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>IP</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.ip}
                    onChange={(e) => setForm({ ...form, ip: e.target.value })}
                    placeholder="192.168.x.x"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Modo IP</label>
                  <select
                    className={styles.fieldInput}
                    value={form.modo_ip}
                    onChange={(e) => setForm({ ...form, modo_ip: e.target.value })}
                  >
                    {MODO_IP_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>VLAN</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.vlan}
                    onChange={(e) => setForm({ ...form, vlan: e.target.value })}
                    placeholder="Ej: VLAN 10"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Boca de red</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.boca_red}
                    onChange={(e) => setForm({ ...form, boca_red: e.target.value })}
                    placeholder="Identificación boca"
                  />
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Patchera</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.patchera}
                    onChange={(e) => setForm({ ...form, patchera: e.target.value })}
                    placeholder="Identificación patchera"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Switch referencia</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.switch_referencia}
                    onChange={(e) => setForm({ ...form, switch_referencia: e.target.value })}
                    placeholder="Nombre/ID del switch"
                  />
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Puerto switch</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.puerto_switch}
                    onChange={(e) => setForm({ ...form, puerto_switch: e.target.value })}
                    placeholder="Ej: Gi0/1"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Teléfono interno</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.telefono_interno}
                    onChange={(e) => setForm({ ...form, telefono_interno: e.target.value })}
                    placeholder="Interno telefónico"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Notas</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={form.notas}
                  onChange={(e) => setForm({ ...form, notas: e.target.value })}
                  placeholder="Observaciones adicionales"
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

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>¿Desactivar puesto?</h3>
            <p className={styles.confirmMessage}>
              Se marcará el puesto <strong>{confirmDelete.codigo_puesto}</strong> como Inactivo. Esta acción se puede revertir.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className={styles.dangerBtn} onClick={handleDelete}>Desactivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
