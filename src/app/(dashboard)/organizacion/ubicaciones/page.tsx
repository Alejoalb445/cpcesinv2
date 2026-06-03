'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { UbicacionFisica, Sede } from '@/types/database';
import { MapPin, Plus, Search, Pencil, Trash2, X, Building } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

interface UbicacionForm {
  id_sede: number | '';
  detalle: string;
  piso: string;
  referencia: string;
  activo: boolean;
}

const emptyForm: UbicacionForm = {
  id_sede: '',
  detalle: '',
  piso: '',
  referencia: '',
  activo: true,
};

export default function UbicacionesPage() {
  const supabase = getSupabaseClient();

  const [items, setItems] = useState<UbicacionFisica[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSede, setFilterSede] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UbicacionFisica | null>(null);
  const [form, setForm] = useState<UbicacionForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<UbicacionFisica | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof UbicacionForm, string>>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [ubicRes, sedeRes] = await Promise.all([
      supabase
        .from('ubicaciones_fisicas')
        .select('*, sede:sedes(nombre)')
        .order('detalle'),
      supabase
        .from('sedes')
        .select('*')
        .eq('activo', true)
        .order('nombre'),
    ]);

    if (ubicRes.error) {
      toast.error('Error al cargar ubicaciones');
      console.error(ubicRes.error);
    } else {
      setItems(ubicRes.data as UbicacionFisica[]);
    }

    if (sedeRes.data) {
      setSedes(sedeRes.data as Sede[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.detalle.toLowerCase().includes(term) ||
      (item.piso || '').toLowerCase().includes(term) ||
      (item.referencia || '').toLowerCase().includes(term) ||
      (item.sede?.nombre || '').toLowerCase().includes(term);
    const matchesSede = filterSede ? item.id_sede === Number(filterSede) : true;
    return matchesSearch && matchesSede;
  });

  function openModal(item?: UbicacionFisica) {
    if (item) {
      setEditingItem(item);
      setForm({
        id_sede: item.id_sede,
        detalle: item.detalle,
        piso: item.piso || '',
        referencia: item.referencia || '',
        activo: item.activo,
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
    const newErrors: Partial<Record<keyof UbicacionForm, string>> = {};
    if (!form.detalle.trim()) newErrors.detalle = 'El detalle es obligatorio';
    if (!form.id_sede) newErrors.id_sede = 'La sede es obligatoria';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      id_sede: Number(form.id_sede),
      detalle: form.detalle.trim(),
      piso: form.piso.trim() || null,
      referencia: form.referencia.trim() || null,
      activo: form.activo,
    };

    if (editingItem) {
      const { error } = await supabase
        .from('ubicaciones_fisicas')
        .update(payload)
        .eq('id', editingItem.id);

      if (error) {
        toast.error('Error al actualizar la ubicación');
        console.error(error);
      } else {
        toast.success('Ubicación actualizada correctamente');
        closeModal();
        loadData();
      }
    } else {
      const { error } = await supabase
        .from('ubicaciones_fisicas')
        .insert(payload);

      if (error) {
        toast.error('Error al crear la ubicación');
        console.error(error);
      } else {
        toast.success('Ubicación creada correctamente');
        closeModal();
        loadData();
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const { error } = await supabase
      .from('ubicaciones_fisicas')
      .update({ activo: false })
      .eq('id', confirmDelete.id);

    if (error) {
      toast.error('Error al desactivar la ubicación');
      console.error(error);
    } else {
      toast.success('Ubicación desactivada correctamente');
      loadData();
    }
    setConfirmDelete(null);
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <MapPin size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Ubicaciones Físicas</h1>
            <p className={styles.pageSubtitle}>Gestión de ubicaciones dentro de cada sede</p>
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
            placeholder="Buscar por detalle, piso, referencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterSede}
          onChange={(e) => setFilterSede(e.target.value)}
        >
          <option value="">Todas las sedes</option>
          {sedes.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className={styles.table}>
        <div className={styles.tableHeader} style={{ gridTemplateColumns: '2fr 1.5fr 80px 1.5fr 100px 120px' }}>
          <span>Detalle</span>
          <span>Sede</span>
          <span>Piso</span>
          <span>Referencia</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Cargando ubicaciones...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Building size={48} className={styles.emptyIcon} />
            <p>No se encontraron ubicaciones</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={styles.tableRowItem}
              style={{ gridTemplateColumns: '2fr 1.5fr 80px 1.5fr 100px 120px' }}
              onClick={() => openModal(item)}
            >
              <span className={styles.rowText}>{item.detalle}</span>
              <span className={styles.rowText}>{item.sede?.nombre || '—'}</span>
              <span className={styles.rowText}>{item.piso || '—'}</span>
              <span className={styles.rowText}>{item.referencia || '—'}</span>
              <span>
                <span className={`${styles.badge} ${item.activo ? styles.badgeActive : styles.badgeInactive}`}>
                  {item.activo ? 'Activo' : 'Inactivo'}
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
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingItem ? 'Editar Ubicación' : 'Nueva Ubicación'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Sede *</label>
                <select
                  className={styles.fieldInput}
                  value={form.id_sede}
                  onChange={(e) => setForm({ ...form, id_sede: e.target.value ? Number(e.target.value) : '' })}
                >
                  <option value="">Seleccionar sede...</option>
                  {sedes.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
                {errors.id_sede && <span className={styles.fieldError}>{errors.id_sede}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Detalle *</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={form.detalle}
                  onChange={(e) => setForm({ ...form, detalle: e.target.value })}
                  placeholder="Ej: Oficina 201, Sala de reuniones, etc."
                />
                {errors.detalle && <span className={styles.fieldError}>{errors.detalle}</span>}
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Piso</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.piso}
                    onChange={(e) => setForm({ ...form, piso: e.target.value })}
                    placeholder="Ej: PB, 1, 2"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Referencia</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.referencia}
                    onChange={(e) => setForm({ ...form, referencia: e.target.value })}
                    placeholder="Referencia adicional"
                  />
                </div>
              </div>
              {editingItem && (
                <div className={styles.field}>
                  <div className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      id="activo"
                      checked={form.activo}
                      onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                    />
                    <label htmlFor="activo" className={styles.fieldLabel}>Activo</label>
                  </div>
                </div>
              )}
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
            <h3 className={styles.confirmTitle}>¿Desactivar ubicación?</h3>
            <p className={styles.confirmMessage}>
              Se desactivará la ubicación <strong>{confirmDelete.detalle}</strong>. Esta acción se puede revertir.
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
