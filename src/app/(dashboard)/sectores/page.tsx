'use client';

import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import styles from '@/styles/module.module.css';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  Shield, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';
import type { Sector } from '@/types/database';

export default function SectoresPage() {
  const { canCreate, canDelete } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Sector[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Sector | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    nombre: '',
    responsable: '',
    notas: '',
    activo: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Deletion confirm states
  const [itemToDelete, setItemToDelete] = useState<Sector | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      
      let query = supabase.from('sectores').select('*').order('nombre', { ascending: true });
      
      const { data: result, error } = await query;
      if (error) throw error;
      setData(result || []);
    } catch (err: any) {
      console.error('Error fetching sectors:', err);
      toast.error('Error al cargar los sectores: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, stateFilter]);

  // Filter items
  const filteredData = data.filter(item => {
    const matchesSearch = item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.responsable && item.responsable.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notas && item.notas.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesState = stateFilter === 'todos' ? true : 
      stateFilter === 'activos' ? item.activo === true : 
      item.activo === false;

    return matchesSearch && matchesState;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      nombre: '',
      responsable: '',
      notas: '',
      activo: true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: Sector) => {
    setEditingItem(item);
    setFormData({
      nombre: item.nombre || '',
      responsable: item.responsable || '',
      notas: item.notas || '',
      activo: item.activo
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio.';
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
        nombre: formData.nombre.trim(),
        responsable: formData.responsable.trim() || null,
        notas: formData.notas.trim() || null,
        activo: formData.activo
      };

      if (editingItem) {
        // Update
        const { error } = await supabase
          .from('sectores')
          .update(payload)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        toast.success('Sector actualizado correctamente.');
      } else {
        // Create
        const { error } = await supabase
          .from('sectores')
          .insert([payload]);

        if (error) throw error;
        toast.success('Sector creado correctamente.');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving sector:', err);
      toast.error('Error al guardar el sector: ' + err.message);
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
        .from('sectores')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;
      toast.success('Sector eliminado correctamente.');
      setItemToDelete(null);
      fetchData();
    } catch (err: any) {
      console.error('Error deleting sector:', err);
      toast.error('Error al eliminar el sector: ' + err.message);
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
            <Shield size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Sectores</h1>
            <p className={styles.pageSubtitle}>Administración de departamentos y áreas de la organización</p>
          </div>
        </div>
        {canCreate && (
          <button className={styles.addBtn} onClick={openCreateModal}>
            <Plus size={18} /> Nuevo Sector
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
            placeholder="Buscar por nombre, responsable..."
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
          <span>Cargando sectores...</span>
        </div>
      ) : filteredData.length === 0 ? (
        <div className={styles.emptyState}>
          <Shield size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No se encontraron sectores</h3>
          <p className={styles.emptyText}>Intentá cambiar los filtros de búsqueda o creá un nuevo sector.</p>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader} style={{ gridTemplateColumns: '2.5fr 2.5fr 4fr 1.5fr 100px' }}>
            <div>Nombre</div>
            <div>Responsable</div>
            <div>Notas</div>
            <div>Estado</div>
            <div style={{ textAlign: 'right' }}>Acciones</div>
          </div>
          {paginatedData.map((item) => (
            <div key={item.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '2.5fr 2.5fr 4fr 1.5fr 100px' }}>
              <div style={{ fontWeight: 600 }}>{item.nombre}</div>
              <div className={styles.rowText} title={item.responsable || ''}>{item.responsable || '—'}</div>
              <div className={styles.rowText} title={item.notas || ''}>{item.notas || '—'}</div>
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
              Mostrando <strong>{startIndex + 1}</strong> a <strong>{Math.min(startIndex + itemsPerPage, filteredData.length)}</strong> de <strong>{filteredData.length}</strong> {filteredData.length === 1 ? 'sector' : 'sectores'}
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
      )}

      {/* CRUD Form Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingItem ? 'Editar Sector' : 'Nuevo Sector'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                {/* Nombre */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Nombre *</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    placeholder="Ej. Recursos Humanos"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    disabled={isSaving}
                  />
                  {formErrors.nombre && (
                    <span className={styles.fieldError}>{formErrors.nombre}</span>
                  )}
                </div>

                {/* Responsable */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Responsable</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    placeholder="Ej. Juan Pérez"
                    value={formData.responsable}
                    onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                    disabled={isSaving}
                  />
                </div>

                {/* Notas */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Notas</label>
                  <textarea
                    className={styles.fieldTextarea}
                    placeholder="Notas o descripción del sector..."
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
                    Este sector se encuentra activo
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
              ¿Estás seguro de que querés eliminar el sector <strong>{itemToDelete.nombre}</strong>?
              Esta acción no se puede deshacer y puede afectar la asignación de usuarios y puestos de trabajo en este sector.
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
