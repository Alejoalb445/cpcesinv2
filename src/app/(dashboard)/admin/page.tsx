'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Settings, Plus, Search, Pencil, Trash2, X, ShieldAlert, Check } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

type AdminTab = 'Usuarios' | 'Marcas' | 'Modelos' | 'TiposActivo' | 'CatStock' | 'CatComponentes' | 'Servicios' | 'Proveedores';

export default function AdminPage() {
  const supabase = getSupabaseClient();

  const [activeTab, setActiveTab] = useState<AdminTab>('Usuarios');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Lists
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  const [tiposActivo, setTiposActivo] = useState<any[]>([]);
  const [catStock, setCatStock] = useState<any[]>([]);
  const [catComp, setCatComp] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [usrRes, marcasRes, modRes, tiposRes, cStockRes, cCompRes, servRes, provRes] = await Promise.all([
      supabase.from('usuarios_sistema').select('*, persona:personas(*)').order('created_at', { ascending: false }),
      supabase.from('marcas').select('*').order('nombre'),
      supabase.from('modelos').select('*, marca:marcas(*)').order('nombre'),
      supabase.from('tipos_activo').select('*').order('nombre'),
      supabase.from('categorias_stock').select('*').order('nombre'),
      supabase.from('categorias_componentes').select('*').order('nombre'),
      supabase.from('servicios_internos').select('*').order('nombre'),
      supabase.from('proveedores').select('*').order('nombre'),
    ]);

    if (usrRes.data) setUsuarios(usrRes.data);
    if (marcasRes.data) setMarcas(marcasRes.data);
    if (modRes.data) setModelos(modRes.data);
    if (tiposRes.data) setTiposActivo(tiposRes.data);
    if (cStockRes.data) setCatStock(cStockRes.data);
    if (cCompRes.data) setCatComp(cCompRes.data);
    if (servRes.data) setServicios(servRes.data);
    if (provRes.data) setProveedores(provRes.data);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filters computed from search
  const filteredItems = () => {
    const term = searchTerm.toLowerCase();
    switch (activeTab) {
      case 'Usuarios':
        return usuarios.filter(u => (u.persona?.nombre || '').toLowerCase().includes(term) || (u.persona?.email || '').toLowerCase().includes(term));
      case 'Marcas':
        return marcas.filter(m => m.nombre.toLowerCase().includes(term));
      case 'Modelos':
        return modelos.filter(m => m.nombre.toLowerCase().includes(term) || (m.marca?.nombre || '').toLowerCase().includes(term));
      case 'TiposActivo':
        return tiposActivo.filter(t => t.nombre.toLowerCase().includes(term) || t.categoria.toLowerCase().includes(term));
      case 'CatStock':
        return catStock.filter(c => c.nombre.toLowerCase().includes(term));
      case 'CatComponentes':
        return catComp.filter(c => c.nombre.toLowerCase().includes(term));
      case 'Servicios':
        return servicios.filter(s => s.nombre.toLowerCase().includes(term));
      case 'Proveedores':
        return proveedores.filter(p => p.nombre.toLowerCase().includes(term));
      default:
        return [];
    }
  };

  function openModal(item?: any) {
    if (item) {
      setEditingItem(item);
      setForm({ ...item });
    } else {
      setEditingItem(null);
      setForm({ activo: true });
    }
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingItem(null);
    setForm({});
  }

  async function handleSave() {
    setSaving(true);
    let table = '';
    const payload: any = { ...form };

    // Clean payload joins
    delete payload.marca;
    delete payload.persona;

    switch (activeTab) {
      case 'Usuarios':
        table = 'usuarios_sistema';
        break;
      case 'Marcas':
        table = 'marcas';
        break;
      case 'Modelos':
        table = 'modelos';
        payload.id_marca = Number(payload.id_marca);
        break;
      case 'TiposActivo':
        table = 'tipos_activo';
        break;
      case 'CatStock':
        table = 'categorias_stock';
        break;
      case 'CatComponentes':
        table = 'categorias_componentes';
        break;
      case 'Servicios':
        table = 'servicios_internos';
        break;
      case 'Proveedores':
        table = 'proveedores';
        break;
    }

    if (editingItem) {
      const { error } = await supabase.from(table).update(payload).eq('id', editingItem.id);
      if (error) {
        toast.error('Error al actualizar registro');
        console.error(error);
      } else {
        toast.success('Registro actualizado correctamente');
        closeModal();
        loadData();
      }
    } else {
      const { error } = await supabase.from(table).insert(payload);
      if (error) {
        toast.error('Error al crear registro');
        console.error(error);
      } else {
        toast.success('Registro creado correctamente');
        closeModal();
        loadData();
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    let table = '';
    switch (activeTab) {
      case 'Marcas': table = 'marcas'; break;
      case 'Modelos': table = 'modelos'; break;
      case 'TiposActivo': table = 'tipos_activo'; break;
      case 'CatStock': table = 'categorias_stock'; break;
      case 'CatComponentes': table = 'categorias_componentes'; break;
      case 'Servicios': table = 'servicios_internos'; break;
      case 'Proveedores': table = 'proveedores'; break;
    }

    const { error } = await supabase.from(table).update({ activo: false }).eq('id', confirmDelete.id);
    if (error) {
      toast.error('Error al desactivar registro');
      console.error(error);
    } else {
      toast.success('Registro desactivado correctamente');
      loadData();
    }
    setConfirmDelete(null);
  }

  async function handleToggleUserStatus(user: any) {
    const { error } = await supabase
      .from('usuarios_sistema')
      .update({ activo: !user.activo })
      .eq('id', user.id);

    if (error) {
      toast.error('Error al cambiar estado del usuario');
      console.error(error);
    } else {
      toast.success(`Usuario ${!user.activo ? 'activado' : 'desactivado'} correctamente`);
      loadData();
    }
  }

  async function handleChangeUserRole(user: any, newRol: string) {
    const { error } = await supabase
      .from('usuarios_sistema')
      .update({ rol: newRol })
      .eq('id', user.id);

    if (error) {
      toast.error('Error al cambiar rol del usuario');
      console.error(error);
    } else {
      toast.success('Rol actualizado correctamente');
      loadData();
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <Settings size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Administración General</h1>
            <p className={styles.pageSubtitle}>Configuración del sistema, roles de usuarios y catálogos de base de datos</p>
          </div>
        </div>
        {activeTab !== 'Usuarios' && (
          <button className={styles.addBtn} onClick={() => openModal()}>
            <Plus size={18} /> Agregar Registro
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-2)', overflowX: 'auto' }}>
        {[
          { key: 'Usuarios', label: 'Usuarios' },
          { key: 'Marcas', label: 'Marcas' },
          { key: 'Modelos', label: 'Modelos' },
          { key: 'TiposActivo', label: 'Tipos Activo' },
          { key: 'CatStock', label: 'Cat. Stock' },
          { key: 'CatComponentes', label: 'Cat. Componentes' },
          { key: 'Servicios', label: 'Servicios Internos' },
          { key: 'Proveedores', label: 'Proveedores' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key as AdminTab); setSearchTerm(''); }}
            style={{
              padding: '8px 16px',
              background: activeTab === tab.key ? 'var(--accent-bg)' : 'transparent',
              color: activeTab === tab.key ? 'var(--accent-text)' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid var(--accent-primary)' : 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: activeTab === tab.key ? '600' : '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all var(--transition-fast)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={`Buscar en ${activeTab.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Content Table */}
      <div className={styles.table}>
        {activeTab === 'Usuarios' && (
          <>
            <div className={styles.tableHeader} style={{ gridTemplateColumns: '2fr 2fr 150px 100px 150px' }}>
              <span>Usuario / Nombre</span>
              <span>Email</span>
              <span>Rol de Acceso</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>
            {loading ? (
              <div className={styles.loadingState}><div className={styles.spinner} /><span>Cargando usuarios...</span></div>
            ) : filteredItems().length === 0 ? (
              <div className={styles.emptyState}><ShieldAlert size={48} className={styles.emptyIcon} /><p>No hay usuarios registrados</p></div>
            ) : (
              filteredItems().map((item) => (
                <div key={item.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '2fr 2fr 150px 100px 150px' }}>
                  <span className={styles.rowText} style={{ fontWeight: 600 }}>{item.persona ? `${item.persona.nombre} ${item.persona.apellido || ''}` : 'Usuario Auth'}</span>
                  <span className={styles.rowText}>{item.persona?.email || '—'}</span>
                  <span>
                    <select
                      className={styles.filterSelect}
                      style={{ padding: '4px 8px', minWidth: '110px' }}
                      value={item.rol}
                      onChange={(e) => handleChangeUserRole(item, e.target.value)}
                    >
                      {['SuperAdmin', 'Admin', 'Tecnico', 'Consulta'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </span>
                  <span>
                    <span className={`${styles.badge} ${item.activo ? styles.badgeActive : styles.badgeInactive}`}>
                      {item.activo ? 'Activo' : 'Suspendido'}
                    </span>
                  </span>
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleToggleUserStatus(item)}
                      style={{ borderColor: item.activo ? 'var(--danger-bg)' : 'var(--success-bg)' }}
                    >
                      {item.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'Marcas' && (
          <>
            <div className={styles.tableHeader} style={{ gridTemplateColumns: '3fr 1fr 120px' }}>
              <span>Nombre Marca</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>
            {loading ? (
              <div className={styles.loadingState}><div className={styles.spinner} /></div>
            ) : filteredItems().length === 0 ? (
              <div className={styles.emptyState}><p>No hay marcas registradas</p></div>
            ) : (
              filteredItems().map((item) => (
                <div key={item.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '3fr 1fr 120px' }} onClick={() => openModal(item)}>
                  <span style={{ fontWeight: 600 }}>{item.nombre}</span>
                  <span><span className={`${styles.badge} ${item.activo ? styles.badgeActive : styles.badgeInactive}`}>{item.activo ? 'Activa' : 'Desactivada'}</span></span>
                  <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.actionBtn} onClick={() => openModal(item)}><Pencil size={14} /></button>
                    {item.activo && <button className={styles.deleteBtn} onClick={() => setConfirmDelete(item)}><Trash2 size={14} /></button>}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'Modelos' && (
          <>
            <div className={styles.tableHeader} style={{ gridTemplateColumns: '2fr 2fr 1fr 120px' }}>
              <span>Nombre Modelo</span>
              <span>Marca</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>
            {loading ? (
              <div className={styles.loadingState}><div className={styles.spinner} /></div>
            ) : filteredItems().length === 0 ? (
              <div className={styles.emptyState}><p>No hay modelos registrados</p></div>
            ) : (
              filteredItems().map((item) => (
                <div key={item.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '2fr 2fr 1fr 120px' }} onClick={() => openModal(item)}>
                  <span style={{ fontWeight: 600 }}>{item.nombre}</span>
                  <span>{item.marca?.nombre}</span>
                  <span><span className={`${styles.badge} ${item.activo ? styles.badgeActive : styles.badgeInactive}`}>{item.activo ? 'Activo' : 'Desactivado'}</span></span>
                  <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.actionBtn} onClick={() => openModal(item)}><Pencil size={14} /></button>
                    {item.activo && <button className={styles.deleteBtn} onClick={() => setConfirmDelete(item)}><Trash2 size={14} /></button>}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* TiposActivo / CatStock / CatComponentes / Servicios / Proveedores tables */}
        {['TiposActivo', 'CatStock', 'CatComponentes', 'Servicios', 'Proveedores'].includes(activeTab) && (
          <>
            <div className={styles.tableHeader} style={{ gridTemplateColumns: '2fr 3fr 1fr 120px' }}>
              <span>Nombre</span>
              <span>{activeTab === 'Proveedores' ? 'Contacto / Email' : 'Descripción'}</span>
              <span>Estado</span>
              <span>Acciones</span>
            </div>
            {loading ? (
              <div className={styles.loadingState}><div className={styles.spinner} /></div>
            ) : filteredItems().length === 0 ? (
              <div className={styles.emptyState}><p>No se encontraron registros</p></div>
            ) : (
              filteredItems().map((item) => (
                <div key={item.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '2fr 3fr 1fr 120px' }} onClick={() => openModal(item)}>
                  <span style={{ fontWeight: 600 }}>{item.nombre}</span>
                  <span className={styles.rowText}>{activeTab === 'Proveedores' ? `${item.contacto || '—'} / ${item.email || '—'}` : (item.descripcion || '—')}</span>
                  <span><span className={`${styles.badge} ${item.activo ? styles.badgeActive : styles.badgeInactive}`}>{item.activo ? 'Activo' : 'Desactivado'}</span></span>
                  <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.actionBtn} onClick={() => openModal(item)}><Pencil size={14} /></button>
                    {item.activo && <button className={styles.deleteBtn} onClick={() => setConfirmDelete(item)}><Trash2 size={14} /></button>}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Catalog Create/Edit Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingItem ? 'Editar Registro' : 'Nuevo Registro'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={closeModal}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Nombre *</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={form.nombre || ''}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Nombre o identificación"
                />
              </div>

              {activeTab === 'Modelos' && (
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Marca *</label>
                  <select
                    className={styles.fieldInput}
                    value={form.id_marca || ''}
                    onChange={(e) => setForm({ ...form, id_marca: e.target.value })}
                  >
                    <option value="">Seleccione marca...</option>
                    {marcas.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === 'TiposActivo' && (
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Categoría *</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.categoria || ''}
                    onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                    placeholder="Ej: Computación, Redes, CCTV"
                  />
                </div>
              )}

              {activeTab === 'Servicios' && (
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Criticidad</label>
                    <select
                      className={styles.fieldInput}
                      value={form.criticidad || 'Media'}
                      onChange={(e) => setForm({ ...form, criticidad: e.target.value })}
                    >
                      {['Baja', 'Media', 'Alta', 'Crítica'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Responsable</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={form.responsable || ''}
                      onChange={(e) => setForm({ ...form, responsable: e.target.value })}
                      placeholder="Responsable IT"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'Proveedores' && (
                <>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Contacto</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={form.contacto || ''}
                        onChange={(e) => setForm({ ...form, contacto: e.target.value })}
                        placeholder="Persona contacto"
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Teléfono</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={form.telefono || ''}
                        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                        placeholder="Teléfono"
                      />
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Email</label>
                    <input
                      type="email"
                      className={styles.fieldInput}
                      value={form.email || ''}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="correo@proveedor.com"
                    />
                  </div>
                </>
              )}

              {activeTab !== 'Marcas' && activeTab !== 'Modelos' && (
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>{activeTab === 'Proveedores' ? 'Dirección' : 'Descripción'}</label>
                  <textarea
                    className={styles.fieldTextarea}
                    value={activeTab === 'Proveedores' ? (form.direccion || '') : (form.descripcion || '')}
                    onChange={(e) => activeTab === 'Proveedores' 
                      ? setForm({ ...form, direccion: e.target.value })
                      : setForm({ ...form, descripcion: e.target.value })
                    }
                    placeholder="Detalles adicionales..."
                  />
                </div>
              )}

              <div className={styles.field}>
                <div className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    id="activo"
                    checked={form.activo ?? true}
                    onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  />
                  <label htmlFor="activo" className={styles.fieldLabel}>Activo</label>
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

      {/* Confirm Delete Catalog Item */}
      {confirmDelete && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>¿Desactivar Registro?</h3>
            <p className={styles.confirmMessage}>
              ¿Está seguro de que desea desactivar <strong>{confirmDelete.nombre}</strong>?
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
