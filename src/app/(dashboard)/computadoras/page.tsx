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
  Cpu, 
  HardDrive, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';
import { Computadora, Marca, Modelo, PuestoTrabajo, Proveedor, ComponentePc } from '@/types/database';

export default function ComputadorasPage() {
  const supabase = getSupabaseClient();

  // Lists
  const [computadoras, setComputadoras] = useState<Computadora[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [puestos, setPuestos] = useState<PuestoTrabajo[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // State
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected row for details panel
  const [selectedComputadora, setSelectedComputadora] = useState<Computadora | null>(null);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [assignedComponents, setAssignedComponents] = useState<ComponentePc[]>([]);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    tipo: 'Desktop' as Computadora['tipo'],
    hostname: '',
    id_marca: '',
    id_modelo: '',
    serial: '',
    codigo_inventario: '',
    procesador: '',
    ram_total_gb: '',
    disco_total_gb: '',
    sistema_operativo: '',
    id_puesto: '',
    id_proveedor: '',
    fecha_compra: '',
    garantia_hasta: '',
    estado: 'En stock' as Computadora['estado'],
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
  }, [searchTerm, filterTipo, filterEstado]);

  useEffect(() => {
    if (selectedComputadora) {
      fetchComponents(selectedComputadora);
    } else {
      setAssignedComponents([]);
    }
  }, [selectedComputadora]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [compRes, marcasRes, modelosRes, puestosRes, provsRes] = await Promise.all([
        supabase.from('computadoras').select('*, marca:marcas(*), modelo:modelos(*), puesto:puestos_trabajo(*), proveedor:proveedores(*)'),
        supabase.from('marcas').select('*').order('nombre'),
        supabase.from('modelos').select('*').order('nombre'),
        supabase.from('puestos_trabajo').select('*').eq('activo', true).order('codigo'),
        supabase.from('proveedores').select('*').eq('activo', true).order('razon_social')
      ]);

      if (compRes.error) throw compRes.error;
      if (marcasRes.error) throw marcasRes.error;
      if (modelosRes.error) throw modelosRes.error;
      if (puestosRes.error) throw puestosRes.error;
      if (provsRes.error) throw provsRes.error;

      setComputadoras(compRes.data || []);
      setMarcas(marcasRes.data || []);
      setModelos(modelosRes.data || []);
      setPuestos(puestosRes.data || []);
      setProveedores(provsRes.data || []);
    } catch (error: any) {
      console.error(error);
      toast.error('Error al cargar datos de computadoras: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchComponents = async (pc: Computadora) => {
    setLoadingComponents(true);
    try {
      const { data, error } = await supabase
        .from('componentes_pc')
        .select('*, marca:marcas(*), modelo:modelos(*)')
        .eq('id_computadora', pc.id);
      if (error) throw error;
      setAssignedComponents(data || []);
    } catch (error: any) {
      console.error(error);
      toast.error('Error al cargar componentes: ' + error.message);
    } finally {
      setLoadingComponents(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      tipo: 'Desktop',
      hostname: '',
      id_marca: '',
      id_modelo: '',
      serial: '',
      codigo_inventario: '',
      procesador: '',
      ram_total_gb: '',
      disco_total_gb: '',
      sistema_operativo: '',
      id_puesto: '',
      id_proveedor: '',
      fecha_compra: '',
      garantia_hasta: '',
      estado: 'En stock',
      notas: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e: React.MouseEvent, pc: Computadora) => {
    e.stopPropagation();
    setEditingId(pc.id);
    setFormData({
      tipo: pc.tipo,
      hostname: pc.hostname || '',
      id_marca: pc.id_marca?.toString() || '',
      id_modelo: pc.id_modelo?.toString() || '',
      serial: pc.serial || '',
      codigo_inventario: pc.codigo_inventario || '',
      procesador: pc.procesador || '',
      ram_total_gb: pc.ram_total_gb?.toString() || '',
      disco_total_gb: pc.disco_total_gb?.toString() || '',
      sistema_operativo: pc.sistema_operativo || '',
      id_puesto: pc.id_puesto?.toString() || '',
      id_proveedor: pc.id_proveedor?.toString() || '',
      fecha_compra: pc.fecha_compra || '',
      garantia_hasta: pc.garantia_hasta || '',
      estado: pc.estado,
      notas: pc.notas || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.tipo) errors.tipo = 'El tipo de computadora es requerido';
    if (!formData.hostname.trim()) errors.hostname = 'El hostname es requerido';
    if (!formData.estado) errors.estado = 'El estado es requerido';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload = {
        tipo: formData.tipo,
        hostname: formData.hostname.trim(),
        id_marca: formData.id_marca ? parseInt(formData.id_marca) : null,
        id_modelo: formData.id_modelo ? parseInt(formData.id_modelo) : null,
        serial: formData.serial.trim() || null,
        codigo_inventario: formData.codigo_inventario.trim() || null,
        procesador: formData.procesador.trim() || null,
        ram_total_gb: formData.ram_total_gb ? parseInt(formData.ram_total_gb) : null,
        disco_total_gb: formData.disco_total_gb ? parseInt(formData.disco_total_gb) : null,
        sistema_operativo: formData.sistema_operativo.trim() || null,
        id_puesto: formData.id_puesto ? parseInt(formData.id_puesto) : null,
        id_proveedor: formData.id_proveedor ? parseInt(formData.id_proveedor) : null,
        fecha_compra: formData.fecha_compra || null,
        garantia_hasta: formData.garantia_hasta || null,
        estado: formData.estado,
        notas: formData.notas.trim() || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('computadoras')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Computadora actualizada con éxito');
      } else {
        const { error } = await supabase
          .from('computadoras')
          .insert([payload]);
        if (error) throw error;
        toast.success('Computadora registrada con éxito');
      }

      setIsModalOpen(false);
      fetchInitialData();

      if (selectedComputadora && selectedComputadora.id === editingId) {
        setSelectedComputadora({ ...selectedComputadora, ...payload } as any);
      }
    } catch (error: any) {
      toast.error('Error al guardar: ' + error.message);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, pc: Computadora) => {
    e.stopPropagation();
    setDeletingId(pc.id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase
        .from('computadoras')
        .delete()
        .eq('id', deletingId);
      
      if (error) throw error;
      toast.success('Computadora eliminada con éxito');
      setIsConfirmOpen(false);

      if (selectedComputadora?.id === deletingId) {
        setSelectedComputadora(null);
      }
      fetchInitialData();
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  // Filter models based on selected brand
  const filteredModelosForm = modelos.filter(m => !formData.id_marca || m.id_marca === parseInt(formData.id_marca));

  // Search & Filter computation
  const filteredComputadoras = computadoras.filter(c => {
    const matchesSearch = 
      (c.hostname && c.hostname.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.serial && c.serial.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.codigo_inventario && c.codigo_inventario.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.procesador && c.procesador.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.sistema_operativo && c.sistema_operativo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.marca?.nombre && c.marca.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.modelo?.nombre && c.modelo.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.puesto?.codigo && c.puesto.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.notas && c.notas.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTipo = filterTipo === '' || c.tipo === filterTipo;
    const matchesEstado = filterEstado === '' || c.estado === filterEstado;

    return matchesSearch && matchesTipo && matchesEstado;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredComputadoras.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedComputadoras = filteredComputadoras.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <Cpu size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>PCs / Notebooks</h1>
            <p className={styles.pageSubtitle}>Inventario de computadoras de escritorio, notebooks y estaciones de trabajo</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={handleOpenCreateModal}>
          <Plus size={16} />
          Registrar Computadora
        </button>
      </div>

      {/* Toolbar Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por hostname, marca, serial, puesto..."
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
          <option value="Desktop">Desktop</option>
          <option value="Notebook">Notebook</option>
          <option value="All-in-One">All-in-One</option>
          <option value="Mini PC">Mini PC</option>
        </select>

        <select
          className={styles.filterSelect}
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="Activo">Activos</option>
          <option value="En reparación">En reparación</option>
          <option value="En stock">En stock</option>
          <option value="Dado de baja">Dados de baja</option>
          <option value="Prestado">Prestado</option>
          <option value="Extraviado">Extraviado</option>
        </select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          Cargando computadoras...
        </div>
      ) : filteredComputadoras.length === 0 ? (
        /* Empty State */
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Cpu size={48} />
          </div>
          <h3 className={styles.emptyTitle}>No se encontraron computadoras</h3>
          <p className={styles.emptyText}>No hay equipos registrados o ninguno coincide con los filtros aplicados.</p>
        </div>
      ) : (
        /* Table Grid */
        <div className={styles.tableWrapper}>
          <div className={styles.table}>
            <div className={styles.tableHeader} style={{ gridTemplateColumns: '1.2fr 1fr 1.2fr 1.2fr 1fr 1.2fr 1fr 120px' }}>
              <div>Hostname</div>
              <div>Tipo</div>
              <div>Marca/Modelo</div>
              <div>Serial</div>
              <div>Código Inventario</div>
              <div>Puesto Asignado</div>
              <div>Estado</div>
              <div style={{ textAlign: 'right' }}>Acciones</div>
            </div>

            {paginatedComputadoras.map((pc) => (
              <div
                key={pc.id}
                className={styles.tableRowItem}
                style={{ 
                  gridTemplateColumns: '1.2fr 1fr 1.2fr 1.2fr 1fr 1.2fr 1fr 120px',
                  backgroundColor: selectedComputadora?.id === pc.id ? 'var(--bg-hover)' : undefined,
                  borderLeft: selectedComputadora?.id === pc.id ? '3px solid var(--accent-primary)' : undefined
                }}
                onClick={() => setSelectedComputadora(pc)}
              >
                <div className={styles.rowText} style={{ fontWeight: 600 }}>{pc.hostname || 'Sin hostname'}</div>
                <div className={styles.rowText}>{pc.tipo}</div>
                <div className={styles.rowText}>
                  {pc.marca?.nombre || 'N/A'} {pc.modelo?.nombre || ''}
                </div>
                <div className={styles.rowText}>{pc.serial || 'N/A'}</div>
                <div className={styles.rowText}>{pc.codigo_inventario || 'N/A'}</div>
                <div className={styles.rowText}>{pc.puesto?.codigo || 'En depósito / Stock'}</div>
                <div>
                  <span className={`${styles.badge} ${
                    pc.estado === 'Activo' ? styles.badgeActive : 
                    pc.estado === 'En stock' ? styles.badgeInfo : 
                    pc.estado === 'En reparación' ? styles.badgeWarning : 
                    styles.badgeInactive
                  }`}>
                    {pc.estado}
                  </span>
                </div>
                <div className={styles.actionsCell} style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    className={styles.actionBtn}
                    onClick={(e) => handleOpenEditModal(e, pc)}
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => handleDeleteClick(e, pc)}
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
              Mostrando <strong>{startIndex + 1}</strong> a <strong>{Math.min(startIndex + itemsPerPage, filteredComputadoras.length)}</strong> de <strong>{filteredComputadoras.length}</strong> {filteredComputadoras.length === 1 ? 'registro' : 'registros'}
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

      {/* Component detail panel */}
      {selectedComputadora && (
        <div className={styles.card} style={{ marginTop: '24px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Componentes de la Computadora: <span style={{ color: 'var(--accent-primary)' }}>{selectedComputadora.hostname || 'Sin Hostname'}</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Procesador: {selectedComputadora.procesador || 'N/A'} | RAM: {selectedComputadora.ram_total_gb ? `${selectedComputadora.ram_total_gb} GB` : 'N/A'} | Disco: {selectedComputadora.disco_total_gb ? `${selectedComputadora.disco_total_gb} GB` : 'N/A'} | S.O: {selectedComputadora.sistema_operativo || 'N/A'}
              </p>
            </div>
            <button className={styles.actionBtn} onClick={() => setSelectedComputadora(null)}>
              <X size={16} />
              Cerrar Panel
            </button>
          </div>

          {loadingComponents ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '20px', color: 'var(--text-secondary)' }}>
              <Loader2 size={20} className="animate-spin" />
              <span>Cargando componentes de hardware...</span>
            </div>
          ) : assignedComponents.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
              <HardDrive size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p style={{ fontSize: '0.85rem' }}>No hay componentes individuales (RAM, Discos, Fuentes, etc.) asignados a esta PC.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <div className={styles.table}>
                <div className={styles.tableHeader} style={{ gridTemplateColumns: '1.2fr 1.5fr 1.2fr 1.2fr 1.5fr 1fr' }}>
                  <div>Tipo Componente</div>
                  <div>Marca/Modelo</div>
                  <div>Serial</div>
                  <div>Capacidad</div>
                  <div>Notas/Detalles</div>
                  <div>Estado</div>
                </div>
                {assignedComponents.map(comp => (
                  <div key={comp.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '1.2fr 1.5fr 1.2fr 1.2fr 1.5fr 1fr', cursor: 'default' }}>
                    <div style={{ fontWeight: 600 }}>{comp.tipo}</div>
                    <div>{comp.marca?.nombre || 'N/A'} {comp.modelo?.nombre || ''}</div>
                    <div>{comp.serial || 'N/A'}</div>
                    <div>{comp.capacidad || 'N/A'}</div>
                    <div className={styles.rowText}>{comp.detalle || comp.notas || 'N/A'}</div>
                    <div>
                      <span className={`${styles.badge} ${comp.estado === 'Activo' ? styles.badgeActive : styles.badgeInactive}`}>
                        {comp.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalWide}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingId ? 'Editar Computadora' : 'Registrar Computadora'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Tipo de Computadora *</label>
                    <select
                      className={styles.fieldInput}
                      value={formData.tipo}
                      onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}
                    >
                      <option value="Desktop">Desktop</option>
                      <option value="Notebook">Notebook</option>
                      <option value="All-in-One">All-in-One</option>
                      <option value="Mini PC">Mini PC</option>
                    </select>
                    {formErrors.tipo && <span className={styles.fieldError}>{formErrors.tipo}</span>}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Hostname / Nombre del PC *</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={formData.hostname}
                      onChange={e => setFormData({ ...formData, hostname: e.target.value })}
                      placeholder="Ej. CPC-SIS-LAP02"
                    />
                    {formErrors.hostname && <span className={styles.fieldError}>{formErrors.hostname}</span>}
                  </div>
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

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Serial / Número de Serie</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={formData.serial}
                      onChange={e => setFormData({ ...formData, serial: e.target.value })}
                      placeholder="Número de serie del fabricante"
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Código de Inventario</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={formData.codigo_inventario}
                      onChange={e => setFormData({ ...formData, codigo_inventario: e.target.value })}
                      placeholder="Ej. PC-124"
                    />
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Procesador</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={formData.procesador}
                      onChange={e => setFormData({ ...formData, procesador: e.target.value })}
                      placeholder="Ej. Intel Core i5 12400"
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Sistema Operativo</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={formData.sistema_operativo}
                      onChange={e => setFormData({ ...formData, sistema_operativo: e.target.value })}
                      placeholder="Ej. Windows 11 Pro"
                    />
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Memoria RAM Total (GB)</label>
                    <input
                      type="number"
                      className={styles.fieldInput}
                      value={formData.ram_total_gb}
                      onChange={e => setFormData({ ...formData, ram_total_gb: e.target.value })}
                      placeholder="Ej. 16"
                      min="1"
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Almacenamiento Total (GB)</label>
                    <input
                      type="number"
                      className={styles.fieldInput}
                      value={formData.disco_total_gb}
                      onChange={e => setFormData({ ...formData, disco_total_gb: e.target.value })}
                      placeholder="Ej. 512"
                      min="1"
                    />
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Puesto de Trabajo Asignado</label>
                    <select
                      className={styles.fieldInput}
                      value={formData.id_puesto}
                      onChange={e => setFormData({ ...formData, id_puesto: e.target.value })}
                    >
                      <option value="">En Stock / Depósito</option>
                      {puestos.map(p => (
                        <option key={p.id} value={p.id}>{p.codigo}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Proveedor</label>
                    <select
                      className={styles.fieldInput}
                      value={formData.id_proveedor}
                      onChange={e => setFormData({ ...formData, id_proveedor: e.target.value })}
                    >
                      <option value="">Seleccione proveedor...</option>
                      {proveedores.map(p => (
                        <option key={p.id} value={p.id}>{p.razon_social}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Fecha de Compra</label>
                    <input
                      type="date"
                      className={styles.fieldInput}
                      value={formData.fecha_compra}
                      onChange={e => setFormData({ ...formData, fecha_compra: e.target.value })}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Garantía Hasta</label>
                    <input
                      type="date"
                      className={styles.fieldInput}
                      value={formData.garantia_hasta}
                      onChange={e => setFormData({ ...formData, garantia_hasta: e.target.value })}
                    />
                  </div>
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
                  <label className={styles.fieldLabel}>Notas / Comentarios</label>
                  <textarea
                    className={styles.fieldTextarea}
                    value={formData.notas}
                    onChange={e => setFormData({ ...formData, notas: e.target.value })}
                    placeholder="Detalles de hardware adicionales, incidentes, etc..."
                  />
                </div>
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
              ¿Estás seguro de que deseas eliminar este equipo? Se eliminarán los datos históricos y registros asociados.
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
