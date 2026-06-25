'use client';

import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import styles from '@/styles/module.module.css';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';
import type { Usuario, Sector, RolSistema } from '@/types/database';

export default function UsuariosPage() {
  const { canAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('todos');
  const [stateFilter, setStateFilter] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Usuario | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: 'password123',
    nombre: '',
    apellido: '',
    id_sector: '',
    rol: 'Consulta' as RolSistema,
    activo: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Deletion confirm states
  const [itemToDelete, setItemToDelete] = useState<Usuario | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      
      // Fetch users and sectors
      const [usersResponse, sectorsResponse] = await Promise.all([
        supabase.from('usuarios').select('*, sector:sectores(*)').order('apellido', { ascending: true }),
        supabase.from('sectores').select('*').eq('activo', true).order('nombre', { ascending: true })
      ]);

      if (usersResponse.error) throw usersResponse.error;
      if (sectorsResponse.error) throw sectorsResponse.error;

      setUsers(usersResponse.data || []);
      setSectors(sectorsResponse.data || []);
    } catch (err: any) {
      console.error('Error fetching users/sectors:', err);
      toast.error('Error al cargar datos: ' + err.message);
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
  }, [searchQuery, sectorFilter, stateFilter]);

  // Filter items
  const filteredUsers = users.filter(item => {
    const fullName = `${item.nombre} ${item.apellido}`.toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) || 
      item.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSector = sectorFilter === 'todos' ? true : 
      item.id_sector?.toString() === sectorFilter;

    const matchesState = stateFilter === 'todos' ? true : 
      stateFilter === 'activos' ? item.activo === true : 
      item.activo === false;

    return matchesSearch && matchesSector && matchesState;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      email: '',
      password: 'password123',
      nombre: '',
      apellido: '',
      id_sector: sectors[0]?.id?.toString() || '',
      rol: 'Consulta',
      activo: true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item: Usuario) => {
    setEditingItem(item);
    setFormData({
      email: item.email || '',
      password: '', // Not needed for editing
      nombre: item.nombre || '',
      apellido: item.apellido || '',
      id_sector: item.id_sector?.toString() || '',
      rol: item.rol || 'Consulta',
      activo: item.activo
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!editingItem && !formData.email.trim()) {
      errors.email = 'El email es obligatorio para nuevos usuarios.';
    }
    if (!editingItem && formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio.';
    }
    if (!formData.apellido.trim()) {
      errors.apellido = 'El apellido es obligatorio.';
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

      const sectorId = formData.id_sector ? parseInt(formData.id_sector, 10) : null;

      if (editingItem) {
        // Edit existing profile in database
        const { error } = await supabase
          .from('usuarios')
          .update({
            nombre: formData.nombre.trim(),
            apellido: formData.apellido.trim(),
            id_sector: sectorId,
            rol: formData.rol,
            activo: formData.activo
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Usuario actualizado correctamente.');
        setIsModalOpen(false);
        fetchData();
      } else {
        // Create new user.
        // We use auth.signUp. Since email confirmation might be required, we can check if it creates the profile.
        // If there's an RLS trigger, it will create the record. Just in case, we also update it after signUp.
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            data: {
              nombre: formData.nombre.trim(),
              apellido: formData.apellido.trim(),
              rol: formData.rol,
              id_sector: sectorId
            }
          }
        });

        if (signUpError) throw signUpError;

        if (signUpData.user) {
          // Sometimes the trigger creates the user but we want to make sure details are synced,
          // or we force update in the public table if the trigger didn't set role/sector/active state.
          const { error: updateError } = await supabase
            .from('usuarios')
            .update({
              nombre: formData.nombre.trim(),
              apellido: formData.apellido.trim(),
              id_sector: sectorId,
              rol: formData.rol,
              activo: formData.activo
            })
            .eq('id', signUpData.user.id);
          
          if (updateError) {
            console.warn('Profile update warning:', updateError.message);
          }
        }

        toast.success('Usuario registrado correctamente. Si se requiere confirmación de email, el usuario recibirá un correo.');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      console.error('Error saving user:', err);
      toast.error('Error al guardar el usuario: ' + err.message);
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
        .from('usuarios')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;
      toast.success('Registro de usuario eliminado de la base de datos.');
      setItemToDelete(null);
      fetchData();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error('Error al eliminar usuario: ' + err.message);
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
            <Users size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Usuarios</h1>
            <p className={styles.pageSubtitle}>Gestión de perfiles de usuario, roles de acceso y sectores</p>
          </div>
        </div>
        {canAdmin && (
          <button className={styles.addBtn} onClick={openCreateModal}>
            <Plus size={18} /> Nuevo Usuario
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
            placeholder="Buscar por nombre, apellido o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
        >
          <option value="todos">Todos los sectores</option>
          {sectors.map((s) => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
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
          <span>Cargando usuarios...</span>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>No se encontraron usuarios</h3>
          <p className={styles.emptyText}>Intentá cambiar los filtros de búsqueda o registrá un nuevo usuario.</p>
        </div>
      ) : (
        <div className={styles.table}>
          <div className={styles.tableHeader} style={{ gridTemplateColumns: '2.5fr 2.5fr 2fr 1.5fr 1fr 100px' }}>
            <div>Nombre Completo</div>
            <div>Email</div>
            <div>Sector</div>
            <div>Rol</div>
            <div>Estado</div>
            <div style={{ textAlign: 'right' }}>Acciones</div>
          </div>
          {paginatedUsers.map((item) => (
            <div key={item.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '2.5fr 2.5fr 2fr 1.5fr 1fr 100px' }}>
              <div style={{ fontWeight: 600 }}>{item.apellido}, {item.nombre}</div>
              <div className={styles.rowText} title={item.email}>{item.email}</div>
              <div className={styles.rowText}>{item.sector?.nombre || '—'}</div>
              <div>
                <span className={`${styles.badge} ${item.rol === 'Admin IT' ? styles.badgeInactive : item.rol === 'Técnico' ? styles.badgeWarning : styles.badgeActive}`}>
                  {item.rol}
                </span>
              </div>
              <div>
                <span className={`${styles.badge} ${item.activo ? styles.badgeActive : styles.badgeInactive}`}>
                  {item.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                {canAdmin && (
                  <>
                    <button 
                      className={styles.actionBtn} 
                      onClick={() => openEditModal(item)}
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      className={styles.deleteBtn} 
                      onClick={() => setItemToDelete(item)}
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
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
              Mostrando <strong>{startIndex + 1}</strong> a <strong>{Math.min(startIndex + itemsPerPage, filteredUsers.length)}</strong> de <strong>{filteredUsers.length}</strong> {filteredUsers.length === 1 ? 'usuario' : 'usuarios'}
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
                {editingItem ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                {/* Email (only for new users) */}
                {!editingItem && (
                  <>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Email *</label>
                      <input
                        type="email"
                        className={styles.fieldInput}
                        placeholder="usuario@empresa.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={isSaving}
                      />
                      {formErrors.email && (
                        <span className={styles.fieldError}>{formErrors.email}</span>
                      )}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Contraseña * (Mín. 6 caracteres)</label>
                      <input
                        type="password"
                        className={styles.fieldInput}
                        placeholder="Contraseña inicial"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        disabled={isSaving}
                      />
                      {formErrors.password && (
                        <span className={styles.fieldError}>{formErrors.password}</span>
                      )}
                    </div>
                  </>
                )}

                {/* Nombre y Apellido */}
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Nombre *</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      placeholder="Ej. Juan"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      disabled={isSaving}
                    />
                    {formErrors.nombre && (
                      <span className={styles.fieldError}>{formErrors.nombre}</span>
                    )}
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Apellido *</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      placeholder="Ej. Pérez"
                      value={formData.apellido}
                      onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                      disabled={isSaving}
                    />
                    {formErrors.apellido && (
                      <span className={styles.fieldError}>{formErrors.apellido}</span>
                    )}
                  </div>
                </div>

                {/* Sector */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Sector / Área</label>
                  <select
                    className={styles.filterSelect}
                    style={{ width: '100%' }}
                    value={formData.id_sector}
                    onChange={(e) => setFormData({ ...formData, id_sector: e.target.value })}
                    disabled={isSaving}
                  >
                    <option value="">Seleccionar Sector...</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Rol */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Rol en el Sistema</label>
                  <select
                    className={styles.filterSelect}
                    style={{ width: '100%' }}
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value as RolSistema })}
                    disabled={isSaving}
                  >
                    <option value="Consulta">Consulta (Lectura)</option>
                    <option value="Técnico">Técnico (Escritura)</option>
                    <option value="Admin IT">Admin IT (Administración total)</option>
                  </select>
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
                    Este usuario se encuentra activo
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
              ¿Estás seguro de que querés eliminar el perfil de <strong>{itemToDelete.nombre} {itemToDelete.apellido}</strong>?
              Esta acción eliminará el perfil de la base de datos pero no borrará la cuenta de autenticación de Supabase (se recomienda desactivarlo en su lugar).
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
                Eliminar de todos modos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
