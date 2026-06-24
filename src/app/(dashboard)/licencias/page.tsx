'use client';

import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  UserPlus, 
  UserMinus, 
  ChevronDown, 
  ChevronUp,
  User
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import styles from '@/styles/module.module.css';
import { toast } from 'sonner';

export default function LicenciasPage() {
  const supabase = getSupabaseClient();

  // Loading states
  const [loading, setLoading] = useState(true);

  // Data states
  const [licencias, setLicencias] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Assignment Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedLicencia, setSelectedLicencia] = useState<any>(null);
  const [assignForm, setAssignForm] = useState({
    id_usuario: '',
    notas: ''
  });

  // Confirm actions state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{
    type: 'delete' | 'release';
    id: number;
    title: string;
    message: string;
  }>({ type: 'delete', id: 0, title: '', message: '' });

  // Accordion/Expanded license IDs for showing assigned users
  const [expandedLicencias, setExpandedLicencias] = useState<number[]>([]);

  // Form states (CRUD)
  const [licenciaForm, setLicenciaForm] = useState({
    nombre_software: '',
    version: '',
    tipo_licencia: 'Suscripción anual',
    clave_licencia: '',
    cantidad_puestos: '',
    id_proveedor: '',
    fecha_compra: '',
    fecha_vencimiento: '',
    costo: '',
    estado: 'Vigente',
    notas: ''
  });

  // Load catalogs on mount
  useEffect(() => {
    async function loadCatalogos() {
      try {
        const [
          { data: proveedoresData },
          { data: usuariosData }
        ] = await Promise.all([
          supabase.from('proveedores').select('id, razon_social').order('razon_social'),
          supabase.from('usuarios').select('id, nombre, apellido, email').order('apellido')
        ]);

        if (proveedoresData) setProveedores(proveedoresData);
        if (usuariosData) setUsuarios(usuariosData);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
        toast.error('Error al cargar datos auxiliares');
      }
    }
    loadCatalogos();
  }, []);

  // Fetch licenses data with joins
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('licencias')
        .select(`
          *,
          proveedores(id, razon_social),
          licencias_usuarios(
            id,
            id_usuario,
            fecha_asignacion,
            notas,
            usuarios(id, nombre, apellido, email)
          )
        `)
        .order('id', { ascending: false });

      if (error) throw error;
      setLicencias(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al cargar licencias: ${err.message || err.details}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtering
  const filteredLicencias = licencias.filter(item => {
    const software = item.nombre_software || '';
    const notes = item.notas || '';
    const key = item.clave_licencia || '';
    
    const matchSearch = 
      software.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      key.toLowerCase().includes(searchQuery.toLowerCase());

    const matchEstado = filterEstado ? item.estado === filterEstado : true;
    const matchTipo = filterTipo ? item.tipo_licencia === filterTipo : true;

    return matchSearch && matchEstado && matchTipo;
  });

  // Expand / Collapse details
  const toggleExpand = (id: number) => {
    if (expandedLicencias.includes(id)) {
      setExpandedLicencias(expandedLicencias.filter(x => x !== id));
    } else {
      setExpandedLicencias([...expandedLicencias, id]);
    }
  };

  // Open CRUD Modal
  const handleOpenAdd = () => {
    setModalType('create');
    setSelectedItem(null);
    setLicenciaForm({
      nombre_software: '',
      version: '',
      tipo_licencia: 'Suscripción anual',
      clave_licencia: '',
      cantidad_puestos: '',
      id_proveedor: '',
      fecha_compra: '',
      fecha_vencimiento: '',
      costo: '',
      estado: 'Vigente',
      notas: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setModalType('edit');
    setSelectedItem(item);
    setLicenciaForm({
      nombre_software: item.nombre_software,
      version: item.version || '',
      tipo_licencia: item.tipo_licencia,
      clave_licencia: item.clave_licencia || '',
      cantidad_puestos: item.cantidad_puestos !== null && item.cantidad_puestos !== undefined ? String(item.cantidad_puestos) : '',
      id_proveedor: item.id_proveedor ? String(item.id_proveedor) : '',
      fecha_compra: item.fecha_compra || '',
      fecha_vencimiento: item.fecha_vencimiento || '',
      costo: item.costo !== null && item.costo !== undefined ? String(item.costo) : '',
      estado: item.estado,
      notas: item.notas || ''
    });
    setIsModalOpen(true);
  };

  // CRUD Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!licenciaForm.nombre_software.trim()) {
      toast.error('El nombre del software es obligatorio');
      return;
    }

    try {
      const payload = {
        nombre_software: licenciaForm.nombre_software.trim(),
        version: licenciaForm.version || null,
        tipo_licencia: licenciaForm.tipo_licencia,
        clave_licencia: licenciaForm.clave_licencia || null,
        cantidad_puestos: licenciaForm.cantidad_puestos ? parseInt(licenciaForm.cantidad_puestos) : null,
        id_proveedor: licenciaForm.id_proveedor ? parseInt(licenciaForm.id_proveedor) : null,
        fecha_compra: licenciaForm.fecha_compra || null,
        fecha_vencimiento: licenciaForm.fecha_vencimiento || null,
        costo: licenciaForm.costo ? parseFloat(licenciaForm.costo) : null,
        estado: licenciaForm.estado,
        notas: licenciaForm.notas || null
      };

      if (modalType === 'create') {
        const { error } = await supabase
          .from('licencias')
          .insert([{ ...payload, puestos_usados: 0 }]); // initial usage 0

        if (error) throw error;
        toast.success('Licencia creada con éxito');
      } else {
        const { error } = await supabase
          .from('licencias')
          .update(payload)
          .eq('id', selectedItem.id);

        if (error) throw error;
        toast.success('Licencia actualizada con éxito');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al guardar: ${err.message || err.details}`);
    }
  };

  // Assign License
  const handleOpenAssign = (licencia: any) => {
    setSelectedLicencia(licencia);
    setAssignForm({
      id_usuario: '',
      notas: ''
    });
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assignForm.id_usuario) {
      toast.error('Debe seleccionar un usuario');
      return;
    }

    // Verify slots
    const totalPuestos = selectedLicencia.cantidad_puestos;
    const puestosUsados = selectedLicencia.puestos_usados || 0;

    if (totalPuestos !== null && puestosUsados >= totalPuestos) {
      toast.error('No quedan puestos disponibles para esta licencia');
      return;
    }

    // Check if already assigned
    const alreadyAssigned = selectedLicencia.licencias_usuarios?.some(
      (lu: any) => lu.id_usuario === assignForm.id_usuario
    );

    if (alreadyAssigned) {
      toast.error('Esta licencia ya está asignada a este usuario');
      return;
    }

    try {
      const { error } = await supabase
        .from('licencias_usuarios')
        .insert([{
          id_licencia: selectedLicencia.id,
          id_usuario: assignForm.id_usuario,
          fecha_asignacion: new Date().toISOString(),
          notas: assignForm.notas || null
        }]);

      if (error) throw error;

      toast.success('Licencia asignada correctamente. Uso actualizado.');
      setIsAssignModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al asignar: ${err.message || err.details}`);
    }
  };

  // Release License Confirm
  const handleOpenRelease = (assignmentId: number, softwareName: string, userName: string) => {
    setConfirmConfig({
      type: 'release',
      id: assignmentId,
      title: '¿Liberar puesto de licencia?',
      message: `¿Estás seguro de que deseas desvincular a ${userName} de la licencia ${softwareName}?`
    });
    setIsConfirmOpen(true);
  };

  // Delete License Confirm
  const handleOpenDelete = (id: number, softwareName: string) => {
    setConfirmConfig({
      type: 'delete',
      id,
      title: '¿Eliminar licencia?',
      message: `Esta acción no se puede deshacer. Se eliminarán todas las asignaciones asociadas a la licencia ${softwareName}.`
    });
    setIsConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    setIsConfirmOpen(false);
    try {
      if (confirmConfig.type === 'delete') {
        const { error } = await supabase
          .from('licencias')
          .delete()
          .eq('id', confirmConfig.id);

        if (error) throw error;
        toast.success('Licencia eliminada con éxito');
      } else {
        const { error } = await supabase
          .from('licencias_usuarios')
          .delete()
          .eq('id', confirmConfig.id);

        if (error) throw error;
        toast.success('Licencia liberada con éxito');
      }
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al realizar acción: ${err.message || err.details}`);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <Key size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Licencias de Software</h1>
            <p className={styles.pageSubtitle}>Administración de claves, vencimientos y asignación a usuarios</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={handleOpenAdd}>
          <Plus size={16} />
          Nueva Licencia
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar por software, clave o notas..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select 
          className={styles.filterSelect}
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
        >
          <option value="">Tipos (Todos)</option>
          <option value="Perpetua">Perpetua</option>
          <option value="Suscripción mensual">Suscripción mensual</option>
          <option value="Suscripción anual">Suscripción anual</option>
          <option value="OEM">OEM</option>
          <option value="Volumen">Volumen</option>
          <option value="Freeware">Freeware</option>
          <option value="Open Source">Open Source</option>
        </select>

        <select 
          className={styles.filterSelect}
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
        >
          <option value="">Estados (Todos)</option>
          <option value="Vigente">Vigente</option>
          <option value="Por vencer">Por vencer</option>
          <option value="Vencida">Vencida</option>
          <option value="Cancelada">Cancelada</option>
        </select>
      </div>

      {/* Licenses list */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Cargando licencias...</span>
        </div>
      ) : (
        filteredLicencias.length === 0 ? (
          <div className={styles.emptyState}>
            <Key size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No se encontraron licencias</h3>
            <p className={styles.emptyText}>Agregá un software con su respectiva clave de activación.</p>
          </div>
        ) : (
          <div className={styles.table}>
            <div className={styles.tableHeader} style={{ gridTemplateColumns: '40px 2fr 1.2fr 1.2fr 1.2fr 1.5fr 1fr 150px' }}>
              <div></div>
              <div>Software</div>
              <div>Versión</div>
              <div>Tipo</div>
              <div>Uso (Puestos)</div>
              <div>Vencimiento</div>
              <div>Estado</div>
              <div style={{ textAlign: 'right' }}>Acciones</div>
            </div>

            {filteredLicencias.map((item) => {
              const total = item.cantidad_puestos;
              const usados = item.puestos_usados || 0;
              const diponibles = total !== null ? total - usados : 'Ilimitados';
              const esExpandido = expandedLicencias.includes(item.id);
              const asignaciones = item.licencias_usuarios || [];

              return (
                <React.Fragment key={item.id}>
                  {/* Row */}
                  <div className={styles.tableRowItem} style={{ gridTemplateColumns: '40px 2fr 1.2fr 1.2fr 1.2fr 1.5fr 1fr 150px' }}>
                    <button 
                      onClick={() => toggleExpand(item.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {esExpandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    <div className={styles.rowText} style={{ fontWeight: 600 }}>
                      {item.nombre_software}
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 'normal', fontFamily: 'monospace' }}>
                        Clave: {item.clave_licencia ? item.clave_licencia : 'Sin clave guardada'}
                      </span>
                    </div>

                    <div className={styles.rowText}>{item.version || 'N/A'}</div>
                    
                    <div>
                      <span className={`${styles.badge} ${styles.badgeInfo}`}>
                        {item.tipo_licencia}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontWeight: 600, color: total !== null && usados >= total ? 'var(--danger-text)' : 'inherit' }}>
                        {usados}
                      </span>
                      <span> / {total !== null ? total : '∞'}</span>
                      <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)' }}>
                        {total !== null ? `(${diponibles} libres)` : 'Libres'}
                      </span>
                    </div>

                    <div>
                      {item.fecha_vencimiento ? new Date(item.fecha_vencimiento).toLocaleDateString('es-AR') : 'Sin Vto'}
                    </div>

                    <div>
                      <span className={`${styles.badge} ${
                        item.estado === 'Vigente' ? styles.badgeActive : 
                        item.estado === 'Por vencer' ? styles.badgeWarning : styles.badgeInactive
                      }`}>
                        {item.estado}
                      </span>
                    </div>

                    <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                      <button 
                        className={styles.actionBtn} 
                        onClick={() => handleOpenAssign(item)}
                        title="Asignar a Usuario"
                        disabled={total !== null && usados >= total}
                        style={{ color: 'var(--success-text)' }}
                      >
                        <UserPlus size={14} />
                      </button>
                      <button className={styles.actionBtn} onClick={() => handleOpenEdit(item)}>
                        <Edit size={14} />
                      </button>
                      <button className={styles.deleteBtn} onClick={() => handleOpenDelete(item.id, item.nombre_software)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded assignments section */}
                  {esExpandido && (
                    <div style={{ 
                      gridColumn: '1 / span 8', 
                      background: 'var(--bg-tertiary)', 
                      padding: '16px 24px', 
                      borderBottom: '1px solid var(--border-secondary)',
                      animation: 'fadeIn 0.2s ease-out'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Usuarios Asignados ({asignaciones.length})
                        </h4>
                        {total !== null && (
                          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                            Puestos ocupados: {usados} de {total}
                          </span>
                        )}
                      </div>

                      {asignaciones.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                          No hay usuarios asociados a esta licencia.
                        </p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                          {asignaciones.map((lu: any) => {
                            const u = lu.usuarios || {};
                            const userName = u.nombre ? `${u.nombre} ${u.apellido || ''}` : 'Usuario Desconocido';
                            return (
                              <div key={lu.id} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                background: 'var(--bg-secondary)', 
                                border: '1px solid var(--border-primary)', 
                                padding: '8px 12px', 
                                borderRadius: 'var(--radius-md)' 
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                  <User size={16} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                                  <div style={{ overflow: 'hidden' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 500, display: 'block' }} className={styles.rowText}>
                                      {userName}
                                    </span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'block' }} className={styles.rowText}>
                                      {u.email || ''}
                                    </span>
                                    {lu.notas && (
                                      <span style={{ fontSize: '10px', color: 'var(--accent-primary)', display: 'block' }} className={styles.rowText}>
                                        Nota: {lu.notas}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleOpenRelease(lu.id, item.nombre_software, userName)}
                                  style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: 'var(--danger-text)', 
                                    cursor: 'pointer',
                                    padding: '4px',
                                    borderRadius: 'var(--radius-sm)'
                                  }}
                                  title="Liberar puesto"
                                >
                                  <UserMinus size={14} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )
      )}

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalWide} style={{ maxHeight: '90vh' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalType === 'create' ? 'Agregar ' : 'Editar '}
                Licencia
              </h3>
              <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Software *</label>
                  <input 
                    type="text" 
                    className={styles.fieldInput}
                    value={licenciaForm.nombre_software}
                    onChange={(e) => setLicenciaForm({...licenciaForm, nombre_software: e.target.value})}
                    placeholder="Ej. Microsoft Office 2021 LTSC"
                    required
                  />
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Versión</label>
                    <input 
                      type="text" 
                      className={styles.fieldInput}
                      value={licenciaForm.version}
                      onChange={(e) => setLicenciaForm({...licenciaForm, version: e.target.value})}
                      placeholder="Ej. Pro Plus, 1.0"
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Tipo de Licencia</label>
                    <select 
                      className={styles.fieldInput}
                      value={licenciaForm.tipo_licencia}
                      onChange={(e) => setLicenciaForm({...licenciaForm, tipo_licencia: e.target.value})}
                    >
                      <option value="Perpetua">Perpetua</option>
                      <option value="Suscripción mensual">Suscripción mensual</option>
                      <option value="Suscripción anual">Suscripción anual</option>
                      <option value="OEM">OEM</option>
                      <option value="Volumen">Volumen</option>
                      <option value="Freeware">Freeware</option>
                      <option value="Open Source">Open Source</option>
                    </select>
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Clave de Activación / Producto</label>
                    <input 
                      type="text" 
                      className={styles.fieldInput}
                      value={licenciaForm.clave_licencia}
                      onChange={(e) => setLicenciaForm({...licenciaForm, clave_licencia: e.target.value})}
                      placeholder="Serial Key"
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Cantidad de Puestos</label>
                    <input 
                      type="number" 
                      className={styles.fieldInput}
                      value={licenciaForm.cantidad_puestos}
                      onChange={(e) => setLicenciaForm({...licenciaForm, cantidad_puestos: e.target.value})}
                      placeholder="Vacío para ilimitados"
                      min="1"
                    />
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Estado</label>
                    <select 
                      className={styles.fieldInput}
                      value={licenciaForm.estado}
                      onChange={(e) => setLicenciaForm({...licenciaForm, estado: e.target.value})}
                    >
                      <option value="Vigente">Vigente</option>
                      <option value="Por vencer">Por vencer</option>
                      <option value="Vencida">Vencida</option>
                      <option value="Cancelada">Cancelada</option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Costo</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className={styles.fieldInput}
                      value={licenciaForm.costo}
                      onChange={(e) => setLicenciaForm({...licenciaForm, costo: e.target.value})}
                      placeholder="Valor en USD o ARS"
                    />
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Fecha de Compra</label>
                    <input 
                      type="date" 
                      className={styles.fieldInput}
                      value={licenciaForm.fecha_compra}
                      onChange={(e) => setLicenciaForm({...licenciaForm, fecha_compra: e.target.value})}
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Fecha de Vencimiento</label>
                    <input 
                      type="date" 
                      className={styles.fieldInput}
                      value={licenciaForm.fecha_vencimiento}
                      onChange={(e) => setLicenciaForm({...licenciaForm, fecha_vencimiento: e.target.value})}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Proveedor</label>
                  <select 
                    className={styles.fieldInput}
                    value={licenciaForm.id_proveedor}
                    onChange={(e) => setLicenciaForm({...licenciaForm, id_proveedor: e.target.value})}
                  >
                    <option value="">Sin Proveedor</option>
                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Notas</label>
                  <textarea 
                    className={styles.fieldTextarea}
                    value={licenciaForm.notas}
                    onChange={(e) => setLicenciaForm({...licenciaForm, notas: e.target.value})}
                    placeholder="Detalles del contrato de suscripción, cuentas asociadas, etc."
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

      {/* ASSIGNMENT MODAL */}
      {isAssignModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Asignar Licencia</h3>
              <button className={styles.modalCloseBtn} onClick={() => setIsAssignModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit}>
              <div className={styles.modalBody}>
                <div style={{ fontSize: '13px', background: 'var(--bg-tertiary)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, display: 'block' }}>Software: {selectedLicencia?.nombre_software}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Puestos Usados: {selectedLicencia?.puestos_usados || 0} / {selectedLicencia?.cantidad_puestos !== null ? selectedLicencia?.cantidad_puestos : '∞'}
                  </span>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Usuario *</label>
                  <select 
                    className={styles.fieldInput}
                    value={assignForm.id_usuario}
                    onChange={(e) => setAssignForm({...assignForm, id_usuario: e.target.value})}
                    required
                  >
                    <option value="">Seleccione Usuario del Sistema</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} {u.apellido || ''} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Notas de Asignación</label>
                  <textarea 
                    className={styles.fieldInput}
                    value={assignForm.notas}
                    onChange={(e) => setAssignForm({...assignForm, notas: e.target.value})}
                    placeholder="Ej. Notebook de diseño de Juan, PC de Soporte"
                    style={{ minHeight: '60px', resize: 'vertical' }}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsAssignModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Asignar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DIALOG */}
      {isConfirmOpen && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmModal}>
            <h3 className={styles.confirmTitle}>{confirmConfig.title}</h3>
            <p className={styles.confirmMessage}>{confirmConfig.message}</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setIsConfirmOpen(false)}>
                Cancelar
              </button>
              <button 
                className={confirmConfig.type === 'delete' ? styles.dangerBtn : styles.saveBtn}
                onClick={handleConfirmAction}
              >
                {confirmConfig.type === 'delete' ? 'Eliminar' : 'Liberar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
