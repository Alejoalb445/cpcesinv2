'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Persona, Sector } from '@/types/database';
import { Users, Plus, Search, Pencil, Trash2, X, UserX } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

interface PersonaForm {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  legajo: string;
  id_sector_actual: number | '';
  interno: boolean;
  notas: string;
  activo: boolean;
}

const emptyForm: PersonaForm = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  legajo: '',
  id_sector_actual: '',
  interno: true,
  notas: '',
  activo: true,
};

export default function PersonasPage() {
  const supabase = getSupabaseClient();

  const [items, setItems] = useState<Persona[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Persona | null>(null);
  const [form, setForm] = useState<PersonaForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Persona | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof PersonaForm, string>>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [perRes, secRes] = await Promise.all([
      supabase
        .from('personas')
        .select('*, sector_actual:sectores(nombre)')
        .order('apellido')
        .order('nombre'),
      supabase
        .from('sectores')
        .select('*')
        .eq('activo', true)
        .order('nombre'),
    ]);

    if (perRes.error) {
      toast.error('Error al cargar personas');
      console.error(perRes.error);
    } else {
      setItems(perRes.data as Persona[]);
    }

    if (secRes.data) {
      setSectores(secRes.data as Sector[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    const fullName = `${item.nombre} ${item.apellido || ''}`.toLowerCase();
    const matchesSearch =
      fullName.includes(term) ||
      (item.email || '').toLowerCase().includes(term) ||
      (item.legajo || '').toLowerCase().includes(term) ||
      (item.telefono || '').toLowerCase().includes(term);
    const matchesSector = filterSector ? item.id_sector_actual === Number(filterSector) : true;
    return matchesSearch && matchesSector;
  });

  function openModal(item?: Persona) {
    if (item) {
      setEditingItem(item);
      setForm({
        nombre: item.nombre,
        apellido: item.apellido || '',
        email: item.email || '',
        telefono: item.telefono || '',
        legajo: item.legajo || '',
        id_sector_actual: item.id_sector_actual || '',
        interno: item.interno,
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
    const newErrors: Partial<Record<keyof PersonaForm, string>> = {};
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Email inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim() || null,
      email: form.email.trim() || null,
      telefono: form.telefono.trim() || null,
      legajo: form.legajo.trim() || null,
      id_sector_actual: form.id_sector_actual ? Number(form.id_sector_actual) : null,
      interno: form.interno,
      notas: form.notas.trim() || null,
      activo: form.activo,
    };

    if (editingItem) {
      const { error } = await supabase
        .from('personas')
        .update(payload)
        .eq('id', editingItem.id);

      if (error) {
        toast.error('Error al actualizar la persona');
        console.error(error);
      } else {
        toast.success('Persona actualizada correctamente');
        closeModal();
        loadData();
      }
    } else {
      const { error } = await supabase
        .from('personas')
        .insert(payload);

      if (error) {
        toast.error('Error al crear la persona');
        console.error(error);
      } else {
        toast.success('Persona creada correctamente');
        closeModal();
        loadData();
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const { error } = await supabase
      .from('personas')
      .update({ activo: false })
      .eq('id', confirmDelete.id);

    if (error) {
      toast.error('Error al desactivar la persona');
      console.error(error);
    } else {
      toast.success('Persona desactivada correctamente');
      loadData();
    }
    setConfirmDelete(null);
  }

  function displayName(p: Persona) {
    return [p.apellido, p.nombre].filter(Boolean).join(', ') || p.nombre;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <Users size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Personas</h1>
            <p className={styles.pageSubtitle}>Gestión de personas y personal de la organización</p>
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
            placeholder="Buscar por nombre, email, legajo..."
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
        <div className={styles.tableHeader} style={{ gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1.5fr 100px 120px' }}>
          <span>Nombre</span>
          <span>Email</span>
          <span>Teléfono</span>
          <span>Legajo</span>
          <span>Sector</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Cargando personas...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <UserX size={48} className={styles.emptyIcon} />
            <p>No se encontraron personas</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={styles.tableRowItem}
              style={{ gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1.5fr 100px 120px' }}
              onClick={() => openModal(item)}
            >
              <span className={styles.rowText}>{displayName(item)}</span>
              <span className={styles.rowText}>{item.email || '—'}</span>
              <span className={styles.rowText}>{item.telefono || '—'}</span>
              <span className={styles.rowText}>{item.legajo || '—'}</span>
              <span className={styles.rowText}>{item.sector_actual?.nombre || '—'}</span>
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
                {editingItem ? 'Editar Persona' : 'Nueva Persona'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Nombre *</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Nombre"
                  />
                  {errors.nombre && <span className={styles.fieldError}>{errors.nombre}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Apellido</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.apellido}
                    onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                    placeholder="Apellido"
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Email</label>
                <input
                  type="email"
                  className={styles.fieldInput}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="correo@ejemplo.com"
                />
                {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Teléfono</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="Teléfono"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Legajo</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.legajo}
                    onChange={(e) => setForm({ ...form, legajo: e.target.value })}
                    placeholder="Número de legajo"
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Sector</label>
                <select
                  className={styles.fieldInput}
                  value={form.id_sector_actual}
                  onChange={(e) => setForm({ ...form, id_sector_actual: e.target.value ? Number(e.target.value) : '' })}
                >
                  <option value="">Sin sector asignado</option>
                  {sectores.map((s) => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <div className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    id="interno"
                    checked={form.interno}
                    onChange={(e) => setForm({ ...form, interno: e.target.checked })}
                  />
                  <label htmlFor="interno" className={styles.fieldLabel}>Personal interno</label>
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
            <h3 className={styles.confirmTitle}>¿Desactivar persona?</h3>
            <p className={styles.confirmMessage}>
              Se desactivará a <strong>{displayName(confirmDelete)}</strong>. Esta acción se puede revertir.
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
