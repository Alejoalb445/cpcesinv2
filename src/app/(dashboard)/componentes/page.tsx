'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import styles from '@/styles/module.module.css';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  HardDrive, 
  Cpu 
} from 'lucide-react';
import { ComponentePc, Marca, Modelo, Computadora } from '@/types/database';

export default function ComponentesPage() {
  const supabase = getSupabaseClient();

  // Lists
  const [componentes, setComponentes] = useState<ComponentePc[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [computadoras, setComputadoras] = useState<Computadora[]>([]);

  // State
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStock, setFilterStock] = useState(''); // 'Todos' | 'stock' | 'asignado'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    tipo: 'RAM' as ComponentePc['tipo'],
    id_marca: '',
    id_modelo: '',
    serial: '',
    capacidad: '',
    velocidad: '',
    detalle: '',
    estado: 'En stock' as ComponentePc['estado'],
    en_stock: true,
    id_computadora: '',
    notas: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Confirm delete state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Reset pagination on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTipo, filterStock]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [compRes, marcasRes, modelosRes, computadorasRes] = await Promise.all([
        supabase.from('componentes_pc').select('*, marca:marcas(*), modelo:modelos(*), computadora:computadoras(*)'),
        supabase.from('marcas').select('*').order('nombre'),
        supabase.from('modelos').select('*').order('nombre'),
        supabase.from('computadoras').select('*').order('hostname')
      ]);

      if (compRes.error) throw compRes.error;
      if (marcasRes.error) throw marcasRes.error;
      if (modelosRes.error) throw modelosRes.error;
      if (computadorasRes.error) throw computadorasRes.error;

      setComponentes(compRes.data || []);
      setMarcas(marcasRes.data || []);
      setModelos(modelosRes.data || []);
      setComputadoras(computadorasRes.data || []);
    } catch (error: any) {
      console.error(error);
      toast.error('Error al cargar datos del módulo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      tipo: 'RAM',
      id_marca: '',
      id_modelo: '',
      serial: '',
      capacidad: '',
      velocidad: '',
      detalle: '',
      estado: 'En stock',
      en_stock: true,
      id_computadora: '',
      notas: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (comp: ComponentePc) => {
    setEditingId(comp.id);
    setFormData({
      tipo: comp.tipo,
      id_marca: comp.id_marca?.toString() || '',
      id_modelo: comp.id_modelo?.toString() || '',
      serial: comp.serial || '',
      capacidad: comp.capacidad || '',
      velocidad: comp.velocidad || '',
      detalle: comp.detalle || '',
      estado: comp.estado,
      en_stock: comp.en_stock,
      id_computadora: comp.id_computadora?.toString() || '',
      notas: comp.notas || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.tipo) errors.tipo = 'El tipo de componente es requerido';
    if (!formData.estado) errors.estado = 'El estado es requerido';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload = {
        tipo: formData.tipo,
        id_marca: formData.id_marca ? parseInt(formData.id_marca) : null,
        id_modelo: formData.id_modelo ? parseInt(formData.id_modelo) : null,
        serial: formData.serial.trim() || null,
        capacidad: formData.capacidad.trim() || null,
        velocidad: formData.velocidad.trim() || null,
        detalle: formData.detalle.trim() || null,
        estado: formData.estado,
        en_stock: formData.id_computadora ? false : formData.en_stock, // If assigned to a computer, it's not in stock
        id_computadora: formData.id_computadora ? parseInt(formData.id_computadora) : null,
        notas: formData.notas.trim() || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('componentes_pc')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Componente de PC actualizado con éxito');
      } else {
        const { error } = await supabase
          .from('componentes_pc')
          .insert([payload]);
        if (error) throw error;
        toast.success('Componente de PC registrado con éxito');
      }

      setIsModalOpen(false);
      fetchInitialData();
    } catch (error: any) {
      toast.error('Error al guardar: ' + error.message);
    }
  };

  const handleDeleteClick = (comp: ComponentePc) => {
    setDeletingId(comp.id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase
        .from('componentes_pc')
        .delete()
        .eq('id', deletingId);
      
      if (error) throw error;
      toast.success('Componente de PC eliminado con éxito');
      setIsConfirmOpen(false);
      fetchInitialData();
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  // Filter models based on selected brand
  const filteredModelosForm = modelos.filter(m => !formData.id_marca || m.id_marca === parseInt(formData.id_marca));

  // Search & Filter
  const filteredComponentes = componentes.filter(c => {
    const matchesSearch = 
      c.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.serial && c.serial.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.capacidad && c.capacidad.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.velocidad && c.velocidad.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.detalle && c.detalle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.marca?.nombre && c.marca.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.modelo?.nombre && c.modelo.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.computadora?.hostname && c.computadora.hostname.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTipo = filterTipo === '' || c.tipo === filterTipo;
    
    let matchesStock = true;
    if (filterStock === 'stock') {
      matchesStock = c.en_stock === true;
    } else if (filterStock === 'asignado') {
      matchesStock = c.id_computadora !== null;
    }

    return matchesSearch && matchesTipo && matchesStock;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredComponentes.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedComponentes = filteredComponentes.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <HardDrive size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Componentes de PC</h1>
            <p className={styles.pageSubtitle}>Administración de partes internas de hardware como RAMs, Discos, Fuentes y Placas</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={handleOpenCreateModal}>
          <Plus size={16} />
          Registrar Componente
        </button>
      </div>

      {/* Toolbar Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por tipo, marca, serial, computadora..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className={styles.filterSelect}
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="RAM">RAM</option>
          <option value="Disco">Disco</option>
          <option value="Fuente">Fuente</option>
          <option value="Placa de red">Placa de red</option>
          <option value="Placa de video">Placa de video</option>
          <option value="Motherboard">Motherboard</option>
          <option value="Procesador">Procesador</option>
          <option value="Lectora">Lectora</option>
          <option value="Otro">Otro</option>
        </select>

        <select
          className={styles.filterSelect}
          value={filterStock}
          onChange={(e) => setFilterStock(e.target.value)}
        >
          <option value="">Todos (Stock y Asignados)</option>
          <option value="stock">Solo en stock</option>
          <option value="asignado">Solo asignados a PC</option>
        </select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          Cargando componentes...
        </div>
      ) : filteredComponentes.length === 0 ? (
        /* Empty State */
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <HardDrive size={48} />
          </div>
          <h3 className={styles.emptyTitle}>No se encontraron componentes</h3>
          <p className={styles.emptyText}>No hay hardware de repuesto registrado o ninguno coincide con los filtros aplicados.</p>
        </div>
      ) : (
        /* Table Grid */
        <div className={styles.tableWrapper}>
          <div className={styles.table}>
            <div className={styles.tableHeader} style={{ gridTemplateColumns: '1.2fr 1.5fr 1.2fr 1fr 1.5fr 1fr 120px' }}>
              <div>Tipo Componente</div>
              <div>Marca/Modelo</div>
              <div>Serial</div>
              <div>Capacidad</div>
              <div>Computadora Asignada</div>
              <div>Estado</div>
              <div style={{ textAlign: 'right' }}>Acciones</div>
            </div>

            {paginatedComponentes.map((comp) => (
              <div
                key={comp.id}
                className={styles.tableRowItem}
                style={{ gridTemplateColumns: '1.2fr 1.5fr 1.2fr 1fr 1.5fr 1fr 120px', cursor: 'default' }}
              >
                <div style={{ fontWeight: 600 }}>{comp.tipo}</div>
                <div className={styles.rowText}>
                  {comp.marca?.nombre || 'N/A'} {comp.modelo?.nombre || ''}
                </div>
                <div className={styles.rowText}>{comp.serial || 'N/A'}</div>
                <div className={styles.rowText}>{comp.capacidad || 'N/A'}</div>
                <div className={styles.rowText} style={{ color: comp.computadora ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  {comp.computadora ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Cpu size={12} color="var(--accent-primary)" />
                      {comp.computadora.hostname || 'Sin hostname'}
                    </span>
                  ) : (
                    'En Stock / Depósito'
                  )}
                </div>
                <div>
                  <span className={`${styles.badge} ${
                    comp.estado === 'Activo' ? styles.badgeActive : 
                    comp.estado === 'En stock' ? styles.badgeInfo : 
                    comp.estado === 'En reparación' ? styles.badgeWarning : 
                    styles.badgeInactive
                  }`}>
                    {comp.estado}
                  </span>
                </div>
                <div className={styles.actionsCell} style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleOpenEditModal(comp)}
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteClick(comp)}
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
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
              Mostrando <strong>{startIndex + 1}</strong> a <strong>{Math.min(startIndex + itemsPerPage, filteredComponentes.length)}</strong> de <strong>{filteredComponentes.length}</strong> {filteredComponentes.length === 1 ? 'registro' : 'registros'}
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

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingId ? 'Editar Componente' : 'Registrar Componente'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Tipo de Componente *</label>
                  <select
                    className={styles.fieldInput}
                    value={formData.tipo}
                    onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}
                  >
                    <option value="RAM">RAM</option>
                    <option value="Disco">Disco</option>
                    <option value="Fuente">Fuente</option>
                    <option value="Placa de red">Placa de red</option>
                    <option value="Placa de video">Placa de video</option>
                    <option value="Motherboard">Motherboard</option>
                    <option value="Procesador">Procesador</option>
                    <option value="Lectora">Lectora</option>
                    <option value="Otro">Otro</option>
                  </select>
                  {formErrors.tipo && <span className={styles.fieldError}>{formErrors.tipo}</span>}
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Marca</label>
                    <select
                      className={styles.fieldInput}
                      value={formData.id_marca}
                      onChange={e => setFormData({ ...formData, id_marca: e.target.value, id_modelo: '' })}
                    >
                      <option value="">Seleccione marca...</option>
                      {marcas.map(m => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Modelo</label>
                    <select
                      className={styles.fieldInput}
                      value={formData.id_modelo}
                      onChange={e => setFormData({ ...formData, id_modelo: e.target.value })}
                      disabled={!formData.id_marca}
                    >
                      <option value="">Seleccione modelo...</option>
                      {filteredModelosForm.map(m => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Número de Serie</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={formData.serial}
                    onChange={e => setFormData({ ...formData, serial: e.target.value })}
                    placeholder="S/N del fabricante"
                  />
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Capacidad (Ej. 16GB, 1TB)</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={formData.capacidad}
                      onChange={e => setFormData({ ...formData, capacidad: e.target.value })}
                      placeholder="Ej. 16 GB, 1 TB"
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Velocidad (Ej. 3200MHz)</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={formData.velocidad}
                      onChange={e => setFormData({ ...formData, velocidad: e.target.value })}
                      placeholder="Ej. 3200 MHz"
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Asignar a Computadora</label>
                  <select
                    className={styles.fieldInput}
                    value={formData.id_computadora}
                    onChange={e => setFormData({ ...formData, id_computadora: e.target.value })}
                  >
                    <option value="">Permanecer en Stock / Depósito</option>
                    {computadoras.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.hostname || 'Sin hostname'} ({c.tipo} - {c.marca?.nombre} {c.modelo?.nombre})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Estado Activo *</label>
                    <select
                      className={styles.fieldInput}
                      value={formData.estado}
                      onChange={e => setFormData({ ...formData, estado: e.target.value as any })}
                    >
                      <option value="Activo">Activo</option>
                      <option value="En reparación">En reparación</option>
                      <option value="En stock">En stock</option>
                      <option value="Dado de baja">Dado de baja</option>
                      <option value="Prestado">Prestado</option>
                      <option value="Extraviado">Extraviado</option>
                    </select>
                    {formErrors.estado && <span className={styles.fieldError}>{formErrors.estado}</span>}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Detalles / Observaciones</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={formData.detalle}
                    onChange={e => setFormData({ ...formData, detalle: e.target.value })}
                    placeholder="Ej. M.2 NVMe PCIe 4.0, DDR4 Single Rank, etc."
                  />
                </div>

                {!formData.id_computadora && (
                  <div className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      id="en_stock"
                      checked={formData.en_stock}
                      onChange={e => setFormData({ ...formData, en_stock: e.target.checked })}
                    />
                    <label htmlFor="en_stock" className={styles.fieldLabel} style={{ cursor: 'pointer' }}>
                      Disponible en Stock (Depósito)
                    </label>
                  </div>
                )}
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {isConfirmOpen && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmModal}>
            <h3 className={styles.confirmTitle}>Confirmar eliminación</h3>
            <p className={styles.confirmMessage}>
              ¿Estás seguro de que deseas eliminar este componente del inventario? Esta acción no se puede deshacer.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setIsConfirmOpen(false)}>
                Cancelar
              </button>
              <button className={styles.dangerBtn} onClick={confirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
