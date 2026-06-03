'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Sede } from '@/types/database';
import { Building2, Plus, Search, Pencil, Trash2, X, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

interface SedeForm {
  nombre: string;
  direccion: string;
  telefono: string;
  notas: string;
  activo: boolean;
}

const emptyForm: SedeForm = {
  nombre: '',
  direccion: '',
  telefono: '',
  notas: '',
  activo: true,
};

export default function SedesPage() {
  const supabase = getSupabaseClient();

  const [items, setItems] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Sede | null>(null);
  const [form, setForm] = useState<SedeForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Sede | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof SedeForm, string>>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sedes')
      .select('*')
      .order('nombre');

    if (error) {
      toast.error('Error al cargar sedes');
      console.error(error);
    } else {
      setItems(data as Sede[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.nombre.toLowerCase().includes(term) ||
      (item.direccion || '').toLowerCase().includes(term) ||
      (item.telefono || '').toLowerCase().includes(term)
    );
  });

  function openModal(item?: Sede) {
    if (item) {
      setEditingItem(item);
      setForm({
        nombre: item.nombre,
        direccion: item.direccion || '',
        telefono: item.telefono || '',
        notas: item.notas || '',
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
    const newErrors: Partial<Record<keyof SedeForm, string>> = {};
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      nombre: form.nombre.trim(),
      direccion: form.direccion.trim() || null,
      telefono: form.telefono.trim() || null,
      notas: form.notas.trim() || null,
      activo: form.activo,
    };

    if (editingItem) {
      const { error } = await supabase
        .from('sedes')
        .update(payload)
        .eq('id', editingItem.id);

      if (error) {
        toast.error('Error al actualizar la sede');
        console.error(error);
      } else {
        toast.success('Sede actualizada correctamente');
        closeModal();
        loadData();
      }
    } else {
      const { error } = await supabase
        .from('sedes')
        .insert(payload);

      if (error) {
        toast.error('Error al crear la sede');
        console.error(error);
      } else {
        toast.success('Sede creada correctamente');
        closeModal();
        loadData();
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const { error } = await supabase
      .from('sedes')
      .update({ activo: false })
      .eq('id', confirmDelete.id);

    if (error) {
      toast.error('Error al desactivar la sede');
      console.error(error);
    } else {
      toast.success('Sede desactivada correctamente');
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
            <Building2 size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Sedes</h1>
            <p className={styles.pageSubtitle}>Gestión de sedes y edificios de la organización</p>
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
            placeholder="Buscar por nombre, dirección o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className={styles.table}>
        <div className={styles.tableHeader} style={{ gridTemplateColumns: '2fr 2fr 1fr 100px 120px' }}>
          <span>Nombre</span>
          <span>Dirección</span>
          <span>Teléfono</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Cargando sedes...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <MapPin size={48} className={styles.emptyIcon} />
            <p>No se encontraron sedes</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={styles.tableRowItem}
              style={{ gridTemplateColumns: '2fr 2fr 1fr 100px 120px' }}
              onClick={() => openModal(item)}
            >
              <span className={styles.rowText}>{item.nombre}</span>
              <span className={styles.rowText}>{item.direccion || '—'}</span>
              <span className={styles.rowText}>{item.telefono || '—'}</span>
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
                {editingItem ? 'Editar Sede' : 'Nueva Sede'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Nombre *</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre de la sede"
                />
                {errors.nombre && <span className={styles.fieldError}>{errors.nombre}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Dirección</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Dirección completa"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Teléfono</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="Teléfono de contacto"
                />
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
            <h3 className={styles.confirmTitle}>¿Desactivar sede?</h3>
            <p className={styles.confirmMessage}>
              Se desactivará la sede <strong>{confirmDelete.nombre}</strong>. Esta acción se puede revertir.
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
