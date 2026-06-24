'use client';

import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import styles from '@/styles/module.module.css';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  Truck, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';
import type { Proveedor } from '@/types/database';

export default function ProveedoresPage() {
  const { canCreate, canDelete } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Proveedor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Proveedor | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    razon_social: '',
    cuit: '',
    telefono: '',
    email: '',
    direccion: '',
    contacto_nombre: '',
    notas: '',
    activo: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Deletion confirm states
  const [itemToDelete, setItemToDelete] = useState<Proveedor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      
      let query = supabase.from('proveedores').select('*').order('razon_social', { ascending: true });
      
      const { data: result, error } = await query;
      if (error) throw error;
      setData(result || []);
    } catch (err: any) {
      console.error('Error fetching providers:', err);
      toast.error('Error al cargar los proveedores: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter items
  const filteredData = data.filter(item => {
    const matchesSearch = item.razon_social.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.cuit && item.cuit.includes(searchQuery)) ||
      (item.contacto_nombre && item.contacto_nombre.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.email && item.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesState = stateFilter === 'todos' ? true : 
      stateFilter === 'activos' ? item.activo === true : 
      item.activo === false;

    return matchesSearch && matchesState;
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      razon_social: '',
      cuit: '',
      telefono: '',
      email: '',
      direccion: '',
      contacto_nombre: '',
      notas: '',
      activo: true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: Proveedor) => {
    setEditingItem(item);
    setFormData({
      razon_social: item.razon_social || '',
      cuit: item.cuit || '',
      telefono: item.telefono || '',
      email: item.email || '',
      direccion: item.direccion || '',
      contacto_nombre: item.contacto_nombre || '',
      notas: item.notas || '',
      activo: item.activo
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.razon_social.trim()) {
      errors.razon_social = 'La razón social es obligatoria.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const supabase = getSupabaseClient();

      const payload = {
        razon_social: formData.razon_social.trim(),
        cuit: formData.cuit.trim() || null,
        telefono: formData.telefono.trim() || null,
        email: formData.email.trim() || null,
        direccion: formData.direccion.trim() || null,
        contacto_nombre: formData.contacto_nombre.trim() || null,
        notas: formData.notas.trim() || null,
        activo: formData.activo
      };

      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('proveedores')
          .update(payload)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        toast.success('Proveedor actualizado correctamente.');
      } else {
        // Create
        const { error } = await supabase
          .from('proveedores')
          .insert([payload]);

        if (error) throw error;
        toast.success('Proveedor creado correctamente.');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving provider:', err);
      toast.error('Error al guardar el proveedor: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from('proveedores')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;
      toast.success('Proveedor eliminado correctamente.');
      setItemToDelete(null);
      fetchData();
    } catch (err: any) {
      console.error('Error deleting provider:', err);
      toast.error('Error al eliminar el proveedor: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <Truck size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Proveedores</h1>
            <p className={styles.pageSubtitle}>Administración de proveedores de hardware, software y servicios IT</p>
          </div>
        </div>
        {canCreate && (
          <button className={styles.addBtn} onClick={openCreateModal}>
            <Plus size={18} /> Nuevo Proveedor
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por razón social, CUIT, contacto, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value as any)}
        >
          <option value="todos">Todos los estados</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </select>
      </div>

      {/* Data Table / List */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <span>Cargando proveedores...</span>
        </div>
      ) : filteredData.length === 0 ? (
        <div className={styles.emptyState}>
          <Truck size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No se encontraron proveedores</h3>
          <p className={styles.emptyText}>Intentá cambiar los filtros de búsqueda o creá un nuevo proveedor.</p>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader} style={{ gridTemplateColumns: '2.5fr 1.5fr 1.5fr 2fr 2fr 1fr 100px' }}>
            <div>Razón Social</div>
            <div>CUIT</div>
            <div>Teléfono</div>
            <div>Email</div>
            <div>Contacto</div>
            <div>Estado</div>
            <div style={{ textAlign: 'right' }}>Acciones</div>
          </div>
          {filteredData.map((item) => (
            <div key={item.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '2.5fr 1.5fr 1.5fr 2fr 2fr 1fr 100px' }}>
              <div style={{ fontWeight: 600 }}>{item.razon_social}</div>
              <div>{item.cuit || '—'}</div>
              <div>{item.telefono || '—'}</div>
              <div className={styles.rowText} title={item.email || ''}>{item.email || '—'}</div>
              <div className={styles.rowText} title={item.contacto_nombre || ''}>{item.contacto_nombre || '—'}</div>
              <div>
                <span className={`${styles.badge} ${item.activo ? styles.badgeActive : styles.badgeInactive}`}>
                  {item.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                {canCreate && (
                  <button 
                    className={styles.actionBtn} 
                    onClick={() => openEditModal(item)}
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
                {canDelete && (
                  <button 
                    className={styles.deleteBtn} 
                    onClick={() => setItemToDelete(item)}
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Form Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingItem ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                {/* Razón Social */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Razón Social *</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    placeholder="Ej. Dell Argentina S.A."
                    value={formData.razon_social}
                    onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                    disabled={isSaving}
                  />
                  {formErrors.razon_social && (
                    <span className={styles.fieldError}>{formErrors.razon_social}</span>
                  )}
                </div>

                {/* CUIT y Contacto en una fila */}
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>CUIT</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      placeholder="Ej. 30-12345678-9"
                      value={formData.cuit}
                      onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Nombre de Contacto</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      placeholder="Ej. Ing. Juan Gómez"
                      value={formData.contacto_nombre}
                      onChange={(e) => setFormData({ ...formData, contacto_nombre: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Teléfono y Email en una fila */}
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Teléfono</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      placeholder="Ej. +54 11 4444-5555"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Email de Contacto</label>
                    <input
                      type="email"
                      className={styles.fieldInput}
                      placeholder="Ej. ventas@dell.com.ar"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* Dirección */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Dirección Comercial</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    placeholder="Ej. Av. Libertador 100 Piso 10, CABA"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    disabled={isSaving}
                  />
                </div>

                {/* Notas */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Notas / Acuerdos de Nivel de Servicio (SLA)</label>
                  <textarea
                    className={styles.fieldTextarea}
                    placeholder="Detalles sobre tiempos de respuesta, garantías, cuentas bancarias..."
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    disabled={isSaving}
                  />
                </div>

                {/* Activo (Checkbox) */}
                <div className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    id="activo"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    disabled={isSaving}
                  />
                  <label htmlFor="activo" className={styles.fieldLabel} style={{ cursor: 'pointer' }}>
                    Este proveedor se encuentra activo
                  </label>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  className={styles.cancelBtn} 
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={styles.saveBtn}
                  disabled={isSaving}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isSaving && <Loader2 size={16} className={styles.spinner} />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {itemToDelete && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmModal}>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--danger)', marginBottom: '12px' }}>
              <AlertTriangle size={40} />
            </div>
            <h3 className={styles.confirmTitle}>¿Confirmar eliminación?</h3>
            <p className={styles.confirmMessage}>
              ¿Estás seguro de que querés eliminar al proveedor <strong>{itemToDelete.razon_social}</strong>?
              Esta acción no se puede deshacer y puede provocar errores si hay equipos, licencias o compras asociadas a este proveedor.
            </p>
            <div className={styles.confirmActions}>
              <button 
                className={styles.cancelBtn} 
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button 
                className={styles.dangerBtn} 
                onClick={handleDelete}
                disabled={isDeleting}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {isDeleting && <Loader2 size={16} className={styles.spinner} />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
