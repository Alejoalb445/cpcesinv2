'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Sector } from '@/types/database';
import { Network, Plus, Search, Pencil, Trash2, X, FolderTree } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

interface SectorForm {
  nombre: string;
  descripcion: string;
  activo: boolean;
}

const emptyForm: SectorForm = {
  nombre: '',
  descripcion: '',
  activo: true,
};

export default function SectoresPage() {
  const supabase = getSupabaseClient();

  const [items, setItems] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Sector | null>(null);
  const [form, setForm] = useState<SectorForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Sector | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof SectorForm, string>>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sectores')
      .select('*')
      .order('nombre');

    if (error) {
      toast.error('Error al cargar sectores');
      console.error(error);
    } else {
      setItems(data as Sector[]);
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
      (item.descripcion || '').toLowerCase().includes(term)
    );
  });

  function openModal(item?: Sector) {
    if (item) {
      setEditingItem(item);
      setForm({
        nombre: item.nombre,
        descripcion: item.descripcion || '',
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
    const newErrors: Partial<Record<keyof SectorForm, string>> = {};
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      activo: form.activo,
    };

    if (editingItem) {
      const { error } = await supabase
        .from('sectores')
        .update(payload)
        .eq('id', editingItem.id);

      if (error) {
        toast.error('Error al actualizar el sector');
        console.error(error);
      } else {
        toast.success('Sector actualizado correctamente');
        closeModal();
        loadData();
      }
    } else {
      const { error } = await supabase
        .from('sectores')
        .insert(payload);

      if (error) {
        toast.error('Error al crear el sector');
        console.error(error);
      } else {
        toast.success('Sector creado correctamente');
        closeModal();
        loadData();
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const { error } = await supabase
      .from('sectores')
      .update({ activo: false })
      .eq('id', confirmDelete.id);

    if (error) {
      toast.error('Error al desactivar el sector');
      console.error(error);
    } else {
      toast.success('Sector desactivado correctamente');
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
            <Network size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Sectores</h1>
            <p className={styles.pageSubtitle}>Gestión de sectores y áreas de la organización</p>
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
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className={styles.table}>
        <div className={styles.tableHeader} style={{ gridTemplateColumns: '2fr 3fr 100px 120px' }}>
          <span>Nombre</span>
          <span>Descripción</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Cargando sectores...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <FolderTree size={48} className={styles.emptyIcon} />
            <p>No se encontraron sectores</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={styles.tableRowItem}
              style={{ gridTemplateColumns: '2fr 3fr 100px 120px' }}
              onClick={() => openModal(item)}
            >
              <span className={styles.rowText}>{item.nombre}</span>
              <span className={styles.rowText}>{item.descripcion || '—'}</span>
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
                {editingItem ? 'Editar Sector' : 'Nuevo Sector'}
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
                  placeholder="Nombre del sector"
                />
                {errors.nombre && <span className={styles.fieldError}>{errors.nombre}</span>}
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Descripción</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descripción del sector"
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
            <h3 className={styles.confirmTitle}>¿Desactivar sector?</h3>
            <p className={styles.confirmMessage}>
              Se desactivará el sector <strong>{confirmDelete.nombre}</strong>. Esta acción se puede revertir.
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
