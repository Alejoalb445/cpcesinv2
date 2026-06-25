'use client';

import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import styles from '@/styles/module.module.css';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/AuthProvider';
import { 
  FolderCog, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';
import type { Marca, Modelo } from '@/types/database';

export default function CatalogosPage() {
  const { canCreate, canDelete } = useAuth();
  const [activeTab, setActiveTab] = useState<'marcas' | 'modelos'>('marcas');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [marcaFilter, setMarcaFilter] = useState<string>('todos');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Marca Modal States
  const [isMarcaModalOpen, setIsMarcaModalOpen] = useState(false);
  const [editingMarca, setEditingMarca] = useState<Marca | null>(null);
  const [marcaForm, setMarcaForm] = useState({ nombre: '' });
  const [marcaErrors, setMarcaErrors] = useState<Record<string, string>>({});
  const [isSavingMarca, setIsSavingMarca] = useState(false);

  // Modelo Modal States
  const [isModeloModalOpen, setIsModeloModalOpen] = useState(false);
  const [editingModelo, setEditingModelo] = useState<Modelo | null>(null);
  const [modeloForm, setModeloForm] = useState({
    nombre: '',
    id_marca: '',
    categoria: ''
  });
  const [modeloErrors, setModeloErrors] = useState<Record<string, string>>({});
  const [isSavingModelo, setIsSavingModelo] = useState(false);

  // Delete Confirm States
  const [itemToDelete, setItemToDelete] = useState<{ type: 'marca'; data: Marca } | { type: 'modelo'; data: Modelo } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();
      
      // Fetch marcas and modelos in parallel
      const [marcasRes, modelosRes] = await Promise.all([
        supabase.from('marcas').select('*').order('nombre', { ascending: true }),
        supabase.from('modelos').select('*, marca:marcas(*)').order('nombre', { ascending: true })
      ]);

      if (marcasRes.error) throw marcasRes.error;
      if (modelosRes.error) throw modelosRes.error;

      setMarcas(marcasRes.data || []);
      setModelos(modelosRes.data || []);
    } catch (err: any) {
      console.error('Error loading catalogs data:', err);
      toast.error('Error al cargar catálogos: ' + err.message);
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
  }, [searchQuery, marcaFilter]);

  // Filtered Marcas
  const filteredMarcas = marcas.filter(m => 
    m.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered Modelos
  const filteredModelos = modelos.filter(m => {
    const matchesSearch = m.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.categoria && m.categoria.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.marca?.nombre && m.marca.nombre.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMarca = marcaFilter === 'todos' ? true : 
      m.id_marca?.toString() === marcaFilter;

    return matchesSearch && matchesMarca;
  });

  // Pagination calculations for Marcas
  const totalPagesMarcas = Math.ceil(filteredMarcas.length / itemsPerPage) || 1;
  const startIndexMarcas = (currentPage - 1) * itemsPerPage;
  const paginatedMarcas = filteredMarcas.slice(startIndexMarcas, startIndexMarcas + itemsPerPage);

  // Pagination calculations for Modelos
  const totalPagesModelos = Math.ceil(filteredModelos.length / itemsPerPage) || 1;
  const startIndexModelos = (currentPage - 1) * itemsPerPage;
  const paginatedModelos = filteredModelos.slice(startIndexModelos, startIndexModelos + itemsPerPage);

  // Reset search on tab change
  const handleTabChange = (tab: 'marcas' | 'modelos') => {
    setActiveTab(tab);
    setSearchQuery('');
    setMarcaFilter('todos');
    setCurrentPage(1);
  };

  // Marca Actions
  const openCreateMarca = () => {
    setEditingMarca(null);
    setMarcaForm({ nombre: '' });
    setMarcaErrors({});
    setIsMarcaModalOpen(true);
  };

  const openEditMarca = (marca: Marca) => {
    setEditingMarca(marca);
    setMarcaForm({ nombre: marca.nombre || '' });
    setMarcaErrors({});
    setIsMarcaModalOpen(true);
  };

  const handleSaveMarca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!marcaForm.nombre.trim()) {
      setMarcaErrors({ nombre: 'El nombre de la marca es obligatorio.' });
      return;
    }

    try {
      setIsSavingMarca(true);
      const supabase = getSupabaseClient();
      const payload = { nombre: marcaForm.nombre.trim() };

      if (editingMarca) {
        const { error } = await supabase
          .from('marcas')
          .update(payload)
          .eq('id', editingMarca.id);
        if (error) throw error;
        toast.success('Marca actualizada correctamente.');
      } else {
        const { error } = await supabase
          .from('marcas')
          .insert([payload]);
        if (error) throw error;
        toast.success('Marca creada correctamente.');
      }

      setIsMarcaModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving brand:', err);
      toast.error('Error al guardar la marca: ' + err.message);
    } finally {
      setIsSavingMarca(false);
    }
  };

  // Modelo Actions
  const openCreateModelo = () => {
    setEditingModelo(null);
    setModeloForm({
      nombre: '',
      id_marca: marcas[0]?.id?.toString() || '',
      categoria: ''
    });
    setModeloErrors({});
    setIsModeloModalOpen(true);
  };

  const openEditModelo = (modelo: Modelo) => {
    setEditingModelo(modelo);
    setModeloForm({
      nombre: modelo.nombre || '',
      id_marca: modelo.id_marca?.toString() || '',
      categoria: modelo.categoria || ''
    });
    setModeloErrors({});
    setIsModeloModalOpen(true);
  };

  const handleSaveModelo = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!modeloForm.nombre.trim()) {
      errors.nombre = 'El nombre del modelo es obligatorio.';
    }
    if (!modeloForm.id_marca) {
      errors.id_marca = 'Debe seleccionar una marca.';
    }
    
    if (Object.keys(errors).length > 0) {
      setModeloErrors(errors);
      return;
    }

    try {
      setIsSavingModelo(true);
      const supabase = getSupabaseClient();
      const payload = {
        nombre: modeloForm.nombre.trim(),
        id_marca: parseInt(modeloForm.id_marca, 10),
        categoria: modeloForm.categoria.trim() || null
      };

      if (editingModelo) {
        const { error } = await supabase
          .from('modelos')
          .update(payload)
          .eq('id', editingModelo.id);
        if (error) throw error;
        toast.success('Modelo actualizado correctamente.');
      } else {
        const { error } = await supabase
          .from('modelos')
          .insert([payload]);
        if (error) throw error;
        toast.success('Modelo creado correctamente.');
      }

      setIsModeloModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving model:', err);
      toast.error('Error al guardar el modelo: ' + err.message);
    } finally {
      setIsSavingModelo(false);
    }
  };

  // Generic Deletion
  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      const supabase = getSupabaseClient();

      if (itemToDelete.type === 'marca') {
        const { error } = await supabase
          .from('marcas')
          .delete()
          .eq('id', itemToDelete.data.id);
        if (error) throw error;
        toast.success('Marca eliminada correctamente.');
      } else {
        const { error } = await supabase
          .from('modelos')
          .delete()
          .eq('id', itemToDelete.data.id);
        if (error) throw error;
        toast.success('Modelo eliminado correctamente.');
      }

      setItemToDelete(null);
      fetchData();
    } catch (err: any) {
      console.error('Error deleting item:', err);
      toast.error('Error al eliminar: ' + err.message);
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
            <FolderCog size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Catálogos</h1>
            <p className={styles.pageSubtitle}>Gestión de marcas y modelos de equipamiento e insumos</p>
          </div>
        </div>
        {canCreate && (
          <button 
            className={styles.addBtn} 
            onClick={activeTab === 'marcas' ? openCreateMarca : openCreateModelo}
          >
            <Plus size={18} /> {activeTab === 'marcas' ? 'Nueva Marca' : 'Nuevo Modelo'}
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px', 
        borderBottom: '1px solid var(--border-primary)', 
        paddingBottom: '8px' 
      }}>
        <button
          onClick={() => handleTabChange('marcas')}
          className={activeTab === 'marcas' ? styles.addBtn : styles.cancelBtn}
          style={{ 
            background: activeTab === 'marcas' ? undefined : 'transparent',
            borderColor: activeTab === 'marcas' ? undefined : 'transparent',
            color: activeTab === 'marcas' ? 'white' : 'var(--text-secondary)'
          }}
        >
          Marcas
        </button>
        <button
          onClick={() => handleTabChange('modelos')}
          className={activeTab === 'modelos' ? styles.addBtn : styles.cancelBtn}
          style={{ 
            background: activeTab === 'modelos' ? undefined : 'transparent',
            borderColor: activeTab === 'modelos' ? undefined : 'transparent',
            color: activeTab === 'modelos' ? 'white' : 'var(--text-secondary)'
          }}
        >
          Modelos
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={activeTab === 'marcas' ? "Buscar marcas..." : "Buscar por nombre, categoría, marca..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {activeTab === 'modelos' && (
          <select
            className={styles.filterSelect}
            value={marcaFilter}
            onChange={(e) => setMarcaFilter(e.target.value)}
          >
            <option value="todos">Todas las marcas</option>
            {marcas.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        )}
      </div>

      {/* Data Section */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <span>Cargando datos...</span>
        </div>
      ) : activeTab === 'marcas' ? (
        /* TAB MARCAS */
        filteredMarcas.length === 0 ? (
          <div className={styles.emptyState}>
            <FolderCog size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No se encontraron marcas</h3>
            <p className={styles.emptyText}>Intentá cambiar los filtros o creá una nueva marca.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <div className={styles.table}>
              <div className={styles.tableHeader} style={{ gridTemplateColumns: '8fr 2fr' }}>
                <div>Nombre de la Marca</div>
                <div style={{ textAlign: 'right' }}>Acciones</div>
              </div>
              {paginatedMarcas.map((item) => (
                <div key={item.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '8fr 2fr' }}>
                  <div style={{ fontWeight: 600 }}>{item.nombre}</div>
                  <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                    {canCreate && (
                      <button 
                        className={styles.actionBtn} 
                        onClick={() => openEditMarca(item)}
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button 
                        className={styles.deleteBtn} 
                        onClick={() => setItemToDelete({ type: 'marca', data: item })}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

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
                Mostrando <strong>{startIndexMarcas + 1}</strong> a <strong>{Math.min(startIndexMarcas + itemsPerPage, filteredMarcas.length)}</strong> de <strong>{filteredMarcas.length}</strong> {filteredMarcas.length === 1 ? 'registro' : 'registros'}
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesMarcas))}
                  disabled={currentPage === totalPagesMarcas}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    color: currentPage === totalPagesMarcas ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    cursor: currentPage === totalPagesMarcas ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )
      ) : (
        /* TAB MODELOS */
        filteredModelos.length === 0 ? (
          <div className={styles.emptyState}>
            <FolderCog size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No se encontraron modelos</h3>
            <p className={styles.emptyText}>Intentá cambiar los filtros o creá un nuevo modelo.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <div className={styles.table}>
              <div className={styles.tableHeader} style={{ gridTemplateColumns: '4fr 3fr 3fr 100px' }}>
                <div>Nombre del Modelo</div>
                <div>Marca</div>
                <div>Categoría</div>
                <div style={{ textAlign: 'right' }}>Acciones</div>
              </div>
              {paginatedModelos.map((item) => (
                <div key={item.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '4fr 3fr 3fr 100px' }}>
                  <div style={{ fontWeight: 600 }}>{item.nombre}</div>
                  <div>{item.marca?.nombre || '—'}</div>
                  <div>{item.categoria || '—'}</div>
                  <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                    {canCreate && (
                      <button 
                        className={styles.actionBtn} 
                        onClick={() => openEditModelo(item)}
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button 
                        className={styles.deleteBtn} 
                        onClick={() => setItemToDelete({ type: 'modelo', data: item })}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

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
                Mostrando <strong>{startIndexModelos + 1}</strong> a <strong>{Math.min(startIndexModelos + itemsPerPage, filteredModelos.length)}</strong> de <strong>{filteredModelos.length}</strong> {filteredModelos.length === 1 ? 'registro' : 'registros'}
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesModelos))}
                  disabled={currentPage === totalPagesModelos}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    color: currentPage === totalPagesModelos ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    cursor: currentPage === totalPagesModelos ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 500
                  }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )
      )}

      {/* Marca Form Modal */}
      {isMarcaModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingMarca ? 'Editar Marca' : 'Nueva Marca'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={() => setIsMarcaModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveMarca}>
              <div className={styles.modalBody}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Nombre de la Marca *</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    placeholder="Ej. Dell, HP, Cisco..."
                    value={marcaForm.nombre}
                    onChange={(e) => setMarcaForm({ nombre: e.target.value })}
                    disabled={isSavingMarca}
                  />
                  {marcaErrors.nombre && (
                    <span className={styles.fieldError}>{marcaErrors.nombre}</span>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  className={styles.cancelBtn} 
                  onClick={() => setIsMarcaModalOpen(false)}
                  disabled={isSavingMarca}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={styles.saveBtn}
                  disabled={isSavingMarca}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isSavingMarca && <Loader2 size={16} className={styles.spinner} />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modelo Form Modal */}
      {isModeloModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingModelo ? 'Editar Modelo' : 'Nuevo Modelo'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={() => setIsModeloModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveModelo}>
              <div className={styles.modalBody}>
                {/* Nombre */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Nombre del Modelo *</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    placeholder="Ej. Optiplex 7090 Micro"
                    value={modeloForm.nombre}
                    onChange={(e) => setModeloForm({ ...modeloForm, nombre: e.target.value })}
                    disabled={isSavingModelo}
                  />
                  {modeloErrors.nombre && (
                    <span className={styles.fieldError}>{modeloErrors.nombre}</span>
                  )}
                </div>

                {/* Marca Select */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Marca *</label>
                  <select
                    className={styles.filterSelect}
                    style={{ width: '100%' }}
                    value={modeloForm.id_marca}
                    onChange={(e) => setModeloForm({ ...modeloForm, id_marca: e.target.value })}
                    disabled={isSavingModelo}
                  >
                    <option value="">Seleccione una marca...</option>
                    {marcas.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                  {modeloErrors.id_marca && (
                    <span className={styles.fieldError}>{modeloErrors.id_marca}</span>
                  )}
                </div>

                {/* Categoría */}
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Categoría</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    placeholder="Ej. Computación, Red, Impresión, Periférico..."
                    value={modeloForm.categoria}
                    onChange={(e) => setModeloForm({ ...modeloForm, categoria: e.target.value })}
                    disabled={isSavingModelo}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  type="button" 
                  className={styles.cancelBtn} 
                  onClick={() => setIsModeloModalOpen(false)}
                  disabled={isSavingModelo}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={styles.saveBtn}
                  disabled={isSavingModelo}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isSavingModelo && <Loader2 size={16} className={styles.spinner} />}
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {itemToDelete && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmModal}>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--danger)', marginBottom: '12px' }}>
              <AlertTriangle size={40} />
            </div>
            <h3 className={styles.confirmTitle}>¿Confirmar eliminación?</h3>
            <p className={styles.confirmMessage}>
              ¿Estás seguro de que querés eliminar {itemToDelete.type === 'marca' ? 'la marca' : 'el modelo'}{' '}
              <strong>{itemToDelete.data.nombre}</strong>?
              Esta acción no se puede deshacer y fallará si hay activos o consumos asignados a este elemento.
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
