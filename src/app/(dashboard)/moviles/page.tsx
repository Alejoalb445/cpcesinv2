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
  Smartphone 
} from 'lucide-react';
import { DispositivoMovil, Marca, Modelo, Usuario, Sector, Proveedor } from '@/types/database';

export default function MovilesPage() {
  const supabase = getSupabaseClient();

  // Lists
  const [moviles, setMoviles] = useState<DispositivoMovil[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // State
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    tipo: 'Celular' as DispositivoMovil['tipo'],
    id_marca: '',
    id_modelo: '',
    serial: '',
    imei: '',
    numero_linea: '',
    codigo_inventario: '',
    usuario_asignado: '',
    id_sector: '',
    id_proveedor: '',
    fecha_compra: '',
    garantia_hasta: '',
    estado: 'En stock' as DispositivoMovil['estado'],
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

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [movilRes, marcasRes, modelosRes, usuariosRes, sectoresRes, provsRes] = await Promise.all([
        supabase.from('dispositivos_moviles').select('*, marca:marcas(*), modelo:modelos(*), usuario:usuarios(*), sector:sectores(*), proveedor:proveedores(*)'),
        supabase.from('marcas').select('*').order('nombre'),
        supabase.from('modelos').select('*').order('nombre'),
        supabase.from('usuarios').select('*').eq('activo', true).order('nombre'),
        supabase.from('sectores').select('*').eq('activo', true).order('nombre'),
        supabase.from('proveedores').select('*').eq('activo', true).order('razon_social')
      ]);

      if (movilRes.error) throw movilRes.error;
      if (marcasRes.error) throw marcasRes.error;
      if (modelosRes.error) throw modelosRes.error;
      if (usuariosRes.error) throw usuariosRes.error;
      if (sectoresRes.error) throw sectoresRes.error;
      if (provsRes.error) throw provsRes.error;

      setMoviles(movilRes.data || []);
      setMarcas(marcasRes.data || []);
      setModelos(modelosRes.data || []);
      setUsuarios(usuariosRes.data || []);
      setSectores(sectoresRes.data || []);
      setProveedores(provsRes.data || []);
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
      tipo: 'Celular',
      id_marca: '',
      id_modelo: '',
      serial: '',
      imei: '',
      numero_linea: '',
      codigo_inventario: '',
      usuario_asignado: '',
      id_sector: '',
      id_proveedor: '',
      fecha_compra: '',
      garantia_hasta: '',
      estado: 'En stock',
      notas: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (mov: DispositivoMovil) => {
    setEditingId(mov.id);
    setFormData({
      tipo: mov.tipo,
      id_marca: mov.id_marca?.toString() || '',
      id_modelo: mov.id_modelo?.toString() || '',
      serial: mov.serial || '',
      imei: mov.imei || '',
      numero_linea: mov.numero_linea || '',
      codigo_inventario: mov.codigo_inventario || '',
      usuario_asignado: mov.usuario_asignado || '',
      id_sector: mov.id_sector?.toString() || '',
      id_proveedor: mov.id_proveedor?.toString() || '',
      fecha_compra: mov.fecha_compra || '',
      garantia_hasta: mov.garantia_hasta || '',
      estado: mov.estado,
      notas: mov.notas || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.tipo) errors.tipo = 'El tipo de dispositivo móvil es requerido';
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
        imei: formData.imei.trim() || null,
        numero_linea: formData.numero_linea.trim() || null,
        codigo_inventario: formData.codigo_inventario.trim() || null,
        usuario_asignado: formData.usuario_asignado || null,
        id_sector: formData.id_sector ? parseInt(formData.id_sector) : null,
        id_proveedor: formData.id_proveedor ? parseInt(formData.id_proveedor) : null,
        fecha_compra: formData.fecha_compra || null,
        garantia_hasta: formData.garantia_hasta || null,
        estado: formData.estado,
        notas: formData.notas.trim() || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('dispositivos_moviles')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Dispositivo móvil actualizado con éxito');
      } else {
        const { error } = await supabase
          .from('dispositivos_moviles')
          .insert([payload]);
        if (error) throw error;
        toast.success('Dispositivo móvil registrado con éxito');
      }

      setIsModalOpen(false);
      fetchInitialData();
    } catch (error: any) {
      toast.error('Error al guardar: ' + error.message);
    }
  };

  const handleDeleteClick = (mov: DispositivoMovil) => {
    setDeletingId(mov.id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase
        .from('dispositivos_moviles')
        .delete()
        .eq('id', deletingId);
      
      if (error) throw error;
      toast.success('Dispositivo móvil eliminado con éxito');
      setIsConfirmOpen(false);
      fetchInitialData();
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  // Filter models based on selected brand
  const filteredModelosForm = modelos.filter(m => !formData.id_marca || m.id_marca === parseInt(formData.id_marca));

  // Search & Filter
  const filteredMoviles = moviles.filter(m => {
    const matchesSearch = 
      m.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.serial && m.serial.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.imei && m.imei.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.numero_linea && m.numero_linea.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.codigo_inventario && m.codigo_inventario.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.marca?.nombre && m.marca.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.modelo?.nombre && m.modelo.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.usuario && `${m.usuario.nombre} ${m.usuario.apellido}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.sector?.nombre && m.sector.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.notas && m.notas.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTipo = filterTipo === '' || m.tipo === filterTipo;
    const matchesEstado = filterEstado === '' || m.estado === filterEstado;

    return matchesSearch && matchesTipo && matchesEstado;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredMoviles.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMoviles = filteredMoviles.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <Smartphone size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Móviles y Tablets</h1>
            <p className={styles.pageSubtitle}>Inventario de celulares corporativos, tablets, líneas telefónicas y asignaciones de personal</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={handleOpenCreateModal}>
          <Plus size={16} />
          Registrar Dispositivo
        </button>
      </div>

      {/* Toolbar Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por IMEI, línea, usuario, marca..."
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
          <option value="Celular">Celular</option>
          <option value="Tablet">Tablet</option>
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
          Cargando móviles...
        </div>
      ) : filteredMoviles.length === 0 ? (
        /* Empty State */
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Smartphone size={48} />
          </div>
          <h3 className={styles.emptyTitle}>No se encontraron dispositivos móviles</h3>
          <p className={styles.emptyText}>No hay celulares o tablets registrados o ninguno coincide con los filtros aplicados.</p>
        </div>
      ) : (
        /* Table Grid */
        <div className={styles.tableWrapper}>
          <div className={styles.table}>
            <div className={styles.tableHeader} style={{ gridTemplateColumns: '1fr 1.2fr 1.2fr 1.2fr 1fr 1.2fr 1fr 120px' }}>
              <div>Tipo</div>
              <div>Marca/Modelo</div>
              <div>Serial</div>
              <div>IMEI</div>
              <div>Línea</div>
              <div>Usuario Asignado</div>
              <div>Estado</div>
              <div style={{ textAlign: 'right' }}>Acciones</div>
            </div>

            {paginatedMoviles.map((mov) => (
              <div
                key={mov.id}
                className={styles.tableRowItem}
                style={{ gridTemplateColumns: '1fr 1.2fr 1.2fr 1.2fr 1fr 1.2fr 1fr 120px', cursor: 'default' }}
              >
                <div style={{ fontWeight: 600 }}>{mov.tipo}</div>
                <div className={styles.rowText}>
                  {mov.marca?.nombre || 'N/A'} {mov.modelo?.nombre || ''}
                </div>
                <div className={styles.rowText}>{mov.serial || 'N/A'}</div>
                <div className={styles.rowText}>{mov.imei || 'N/A'}</div>
                <div className={styles.rowText}>{mov.numero_linea || 'N/A'}</div>
                <div className={styles.rowText} style={{ color: mov.usuario ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  {mov.usuario ? `${mov.usuario.nombre} ${mov.usuario.apellido}` : 'En Depósito / Stock'}
                </div>
                <div>
                  <span className={`${styles.badge} ${
                    mov.estado === 'Activo' ? styles.badgeActive : 
                    mov.estado === 'En stock' ? styles.badgeInfo : 
                    mov.estado === 'En reparación' ? styles.badgeWarning : 
                    styles.badgeInactive
                  }`}>
                    {mov.estado}
                  </span>
                </div>
                <div className={styles.actionsCell} style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleOpenEditModal(mov)}
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteClick(mov)}
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
              Mostrando <strong>{startIndex + 1}</strong> a <strong>{Math.min(startIndex + itemsPerPage, filteredMoviles.length)}</strong> de <strong>{filteredMoviles.length}</strong> {filteredMoviles.length === 1 ? 'registro' : 'registros'}
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
          <div className={styles.modalWide}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingId ? 'Editar Dispositivo Móvil' : 'Registrar Dispositivo Móvil'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Tipo de Dispositivo *</label>
                    <select
                      className={styles.fieldInput}
                      value={formData.tipo}
                      onChange={e => setFormData({ ...formData, tipo: e.target.value as any })}
                    >
                      <option value="Celular">Celular</option>
                      <option value="Tablet">Tablet</option>
                    </select>
                    {formErrors.tipo && <span className={styles.fieldError}>{formErrors.tipo}</span>}
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Código de Inventario</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={formData.codigo_inventario}
                      onChange={e => setFormData({ ...formData, codigo_inventario: e.target.value })}
                      placeholder="Ej. MOV-001"
                    />
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
                    <label className={styles.fieldLabel}>Número de Serie</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={formData.serial}
                      onChange={e => setFormData({ ...formData, serial: e.target.value })}
                      placeholder="S/N del fabricante"
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Número IMEI (15 dígitos)</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={formData.imei}
                      onChange={e => setFormData({ ...formData, imei: e.target.value })}
                      placeholder="IMEI del dispositivo"
                      maxLength={15}
                    />
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Número de Línea (Chip/SIM)</label>
                    <input
                      type="text"
                      className={styles.fieldInput}
                      value={formData.numero_linea}
                      onChange={e => setFormData({ ...formData, numero_linea: e.target.value })}
                      placeholder="Ej. +54 11 9876-5432"
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Usuario Asignado</label>
                    <select
                      className={styles.fieldInput}
                      value={formData.usuario_asignado}
                      onChange={e => setFormData({ ...formData, usuario_asignado: e.target.value })}
                    >
                      <option value="">Permanecer en Stock / Sin asignar</option>
                      {usuarios.map(u => (
                        <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Sector Corporativo</label>
                    <select
                      className={styles.fieldInput}
                      value={formData.id_sector}
                      onChange={e => setFormData({ ...formData, id_sector: e.target.value })}
                    >
                      <option value="">Seleccione sector...</option>
                      {sectores.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
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
                    placeholder="Detalles del plan móvil, estado físico, historial, etc..."
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
              ¿Estás seguro de que deseas eliminar este dispositivo móvil? Esta acción no se puede revertir.
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
