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
  Briefcase, 
  Monitor, 
  Keyboard, 
  Key, 
  Loader2, 
  AlertTriangle,
  Network,
  Phone
} from 'lucide-react';
import { PuestoTrabajo, Ubicacion, Sector, Usuario, Computadora, Periferico, LicenciaUsuario } from '@/types/database';

export default function PuestosPage() {
  const supabase = getSupabaseClient();

  // Lists
  const [puestos, setPuestos] = useState<PuestoTrabajo[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  // State
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [filterUbicacion, setFilterUbicacion] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected row for details panel
  const [selectedPuesto, setSelectedPuesto] = useState<PuestoTrabajo | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [assignedPCs, setAssignedPCs] = useState<Computadora[]>([]);
  const [assignedPeripherals, setAssignedPeripherals] = useState<Periferico[]>([]);
  const [assignedLicenses, setAssignedLicenses] = useState<any[]>([]);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  // Form states
  const [formData, setFormData] = useState({
    codigo: '',
    id_ubicacion: '',
    id_sector: '',
    usuario_asignado: '',
    ip: '',
    modo_ip: 'DHCP' as PuestoTrabajo['modo_ip'],
    boca_red: '',
    telefono_interno: '',
    tel_modulo_central: '',
    tel_pachera: '',
    tel_boca: '',
    red_switch: '',
    red_puerto: '',
    notas: '',
    activo: true
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'general' | 'red' | 'telefonia'>('general');

  // Confirm delete state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterSector, filterUbicacion]);

  useEffect(() => {
    if (selectedPuesto) {
      fetchDetails(selectedPuesto);
    } else {
      setAssignedPCs([]);
      setAssignedPeripherals([]);
      setAssignedLicenses([]);
    }
  }, [selectedPuesto]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [puestosRes, ubisRes, sectoresRes, usuariosRes] = await Promise.all([
        supabase.from('puestos_trabajo').select('*, ubicacion:ubicaciones(*), sector:sectores(*), usuario:usuarios(*)'),
        supabase.from('ubicaciones').select('*').eq('activo', true).order('nombre'),
        supabase.from('sectores').select('*').eq('activo', true).order('nombre'),
        supabase.from('usuarios').select('*').eq('activo', true).order('nombre')
      ]);

      if (puestosRes.error) throw puestosRes.error;
      if (ubisRes.error) throw ubisRes.error;
      if (sectoresRes.error) throw sectoresRes.error;
      if (usuariosRes.error) throw usuariosRes.error;

      setPuestos(puestosRes.data || []);
      setUbicaciones(ubisRes.data || []);
      setSectores(sectoresRes.data || []);
      setUsuarios(usuariosRes.data || []);
    } catch (error: any) {
      console.error(error);
      toast.error('Error al cargar datos del módulo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (puesto: PuestoTrabajo) => {
    setLoadingDetails(true);
    try {
      const [pcsRes, perifsRes] = await Promise.all([
        supabase.from('computadoras').select('*, marca:marcas(*), modelo:modelos(*)').eq('id_puesto', puesto.id),
        supabase.from('perifericos').select('*, marca:marcas(*), modelo:modelos(*)').eq('id_puesto', puesto.id)
      ]);

      if (pcsRes.error) throw pcsRes.error;
      if (perifsRes.error) throw perifsRes.error;

      setAssignedPCs(pcsRes.data || []);
      setAssignedPeripherals(perifsRes.data || []);

      if (puesto.usuario_asignado) {
        const { data, error } = await supabase
          .from('licencias_usuarios')
          .select('*, licencia:licencias(*)')
          .eq('id_usuario', puesto.usuario_asignado);
        if (error) throw error;
        setAssignedLicenses(data || []);
      } else {
        setAssignedLicenses([]);
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Error al cargar detalles del puesto: ' + error.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      codigo: '',
      id_ubicacion: ubicaciones[0]?.id?.toString() || '',
      id_sector: sectores[0]?.id?.toString() || '',
      usuario_asignado: '',
      ip: '',
      modo_ip: 'DHCP',
      boca_red: '',
      telefono_interno: '',
      tel_modulo_central: '',
      tel_pachera: '',
      tel_boca: '',
      red_switch: '',
      red_puerto: '',
      notas: '',
      activo: true
    });
    setFormErrors({});
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e: React.MouseEvent, puesto: PuestoTrabajo) => {
    e.stopPropagation(); // Prevent row selection click
    setEditingId(puesto.id);
    setFormData({
      codigo: puesto.codigo,
      id_ubicacion: puesto.id_ubicacion?.toString() || '',
      id_sector: puesto.id_sector?.toString() || '',
      usuario_asignado: puesto.usuario_asignado || '',
      ip: puesto.ip || '',
      modo_ip: puesto.modo_ip,
      boca_red: puesto.boca_red || '',
      telefono_interno: puesto.telefono_interno || '',
      tel_modulo_central: puesto.tel_modulo_central || '',
      tel_pachera: puesto.tel_pachera || '',
      tel_boca: puesto.tel_boca || '',
      red_switch: puesto.red_switch || '',
      red_puerto: puesto.red_puerto || '',
      notas: puesto.notas || '',
      activo: puesto.activo
    });
    setFormErrors({});
    setActiveTab('general');
    setIsModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.codigo.trim()) errors.codigo = 'El código de puesto es requerido';
    if (!formData.id_ubicacion) errors.id_ubicacion = 'Debe seleccionar una ubicación';
    if (!formData.id_sector) errors.id_sector = 'Debe seleccionar un sector';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsConfirmSaveOpen(true);
  };

  const executeSave = async () => {
    setIsConfirmSaveOpen(false);
    try {
      const payload = {
        codigo: formData.codigo.trim(),
        id_ubicacion: parseInt(formData.id_ubicacion),
        id_sector: parseInt(formData.id_sector),
        usuario_asignado: formData.usuario_asignado || null,
        ip: formData.ip.trim() || null,
        modo_ip: formData.modo_ip,
        boca_red: formData.boca_red.trim() || null,
        telefono_interno: formData.telefono_interno.trim() || null,
        tel_modulo_central: formData.tel_modulo_central.trim() || null,
        tel_pachera: formData.tel_pachera.trim() || null,
        tel_boca: formData.tel_boca.trim() || null,
        red_switch: formData.red_switch.trim() || null,
        red_puerto: formData.red_puerto.trim() || null,
        notas: formData.notas.trim() || null,
        activo: formData.activo
      };

      if (editingId) {
        const { error } = await supabase
          .from('puestos_trabajo')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Puesto de trabajo actualizado con éxito');
      } else {
        const { error } = await supabase
          .from('puestos_trabajo')
          .insert([payload]);
        if (error) throw error;
        toast.success('Puesto de trabajo creado con éxito');
      }

      setIsModalOpen(false);
      fetchInitialData();
      
      // If we are editing the currently selected puesto, refresh details
      if (selectedPuesto && selectedPuesto.id === editingId) {
        setSelectedPuesto({ ...selectedPuesto, ...payload } as any);
      }
    } catch (error: any) {
      toast.error('Error al guardar: ' + error.message);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, puesto: PuestoTrabajo) => {
    e.stopPropagation();
    setDeletingId(puesto.id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase
        .from('puestos_trabajo')
        .delete()
        .eq('id', deletingId);
      
      if (error) throw error;
      toast.success('Puesto de trabajo eliminado con éxito');
      setIsConfirmOpen(false);

      if (selectedPuesto?.id === deletingId) {
        setSelectedPuesto(null);
      }
      fetchInitialData();
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  // Filter & Search
  const filteredPuestos = puestos.filter(p => {
    const matchesSearch = 
      p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.ip && p.ip.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.telefono_interno && p.telefono_interno.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.boca_red && p.boca_red.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.ubicacion?.nombre && p.ubicacion.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.sector?.nombre && p.sector.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.usuario && `${p.usuario.nombre} ${p.usuario.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSector = filterSector === '' || p.id_sector === parseInt(filterSector);
    const matchesUbicacion = filterUbicacion === '' || p.id_ubicacion === parseInt(filterUbicacion);

    return matchesSearch && matchesSector && matchesUbicacion;
  });

  const totalPages = Math.ceil(filteredPuestos.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPuestos = filteredPuestos.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <Briefcase size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Puestos de Trabajo</h1>
            <p className={styles.pageSubtitle}>Administración de puestos, ubicaciones y asignación de usuarios</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={handleOpenCreateModal}>
          <Plus size={16} />
          Agregar Puesto
        </button>
      </div>

      {/* Toolbar Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por código, IP, interno, usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className={styles.filterSelect}
          value={filterUbicacion}
          onChange={(e) => setFilterUbicacion(e.target.value)}
        >
          <option value="">Todas las ubicaciones</option>
          {ubicaciones.map(u => (
            <option key={u.id} value={u.id}>{u.nombre}</option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={filterSector}
          onChange={(e) => setFilterSector(e.target.value)}
        >
          <option value="">Todos los sectores</option>
          {sectores.map(s => (
            <option key={s.id} value={s.id}>{s.nombre}</option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          Cargando puestos de trabajo...
        </div>
      ) : filteredPuestos.length === 0 ? (
        /* Empty State */
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Briefcase size={48} />
          </div>
          <h3 className={styles.emptyTitle}>No se encontraron puestos</h3>
          <p className={styles.emptyText}>No hay puestos de trabajo creados o ninguno coincide con los filtros aplicados.</p>
        </div>
      ) : (
        /* Table Grid */
        <div className={styles.tableWrapper}>
          <div className={styles.table}>
            <div className={styles.tableHeader} style={{ gridTemplateColumns: '1.2fr 1.2fr 1.2fr 1.2fr 0.8fr 1fr 120px' }}>
              <div>Código Puesto</div>
              <div>Ubicación</div>
              <div>Sector</div>
              <div>IP / Modo</div>
              <div>Interno</div>
              <div>Estado</div>
              <div style={{ textAlign: 'right' }}>Acciones</div>
            </div>

            {paginatedPuestos.map((puesto) => {
              const isSelected = selectedPuesto?.id === puesto.id;
              return (
                <React.Fragment key={puesto.id}>
                  <div
                    className={`${styles.tableRowItem} ${isSelected ? 'active-row' : ''}`}
                    style={{ 
                      gridTemplateColumns: '1.2fr 1.2fr 1.2fr 1.2fr 0.8fr 1fr 120px',
                      backgroundColor: isSelected ? 'var(--bg-hover)' : undefined,
                      borderLeft: isSelected ? '3px solid var(--accent-primary)' : undefined
                    }}
                    onClick={() => setSelectedPuesto(isSelected ? null : puesto)}
                  >
                    <div className={styles.rowText} style={{ fontWeight: 600 }}>{puesto.codigo}</div>
                    <div className={styles.rowText}>{puesto.ubicacion?.nombre || 'N/A'}</div>
                    <div className={styles.rowText}>{puesto.sector?.nombre || 'N/A'}</div>
                    <div className={styles.rowText}>
                      {puesto.ip ? `${puesto.ip} (${puesto.modo_ip})` : `Sin IP (${puesto.modo_ip})`}
                    </div>
                    <div className={styles.rowText}>{puesto.telefono_interno || 'N/A'}</div>
                    <div>
                      <span className={`${styles.badge} ${puesto.activo ? styles.badgeActive : styles.badgeInactive}`}>
                        {puesto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <div className={styles.actionsCell} style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        className={styles.actionBtn}
                        onClick={(e) => handleOpenEditModal(e, puesto)}
                        title="Editar"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={(e) => handleDeleteClick(e, puesto)}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Collapsible details panel directly under the row */}
                  {isSelected && (
                    <div style={{
                      background: 'var(--bg-tertiary)',
                      borderBottom: '1px solid var(--border-secondary)',
                      padding: '24px',
                      animation: 'fadeIn 0.2s ease-out'
                    }} onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Recursos y Conectividad: <span style={{ color: 'var(--accent-primary)' }}>{puesto.codigo}</span>
                          </h3>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Ubicación: {puesto.ubicacion?.nombre} | Sector: {puesto.sector?.nombre} | Usuario: {puesto.usuario ? `${puesto.usuario.nombre} ${puesto.usuario.apellido}` : 'Sin asignar'}
                          </p>
                        </div>
                        <button className={styles.actionBtn} onClick={() => setSelectedPuesto(null)}>
                          <X size={16} />
                          Cerrar
                        </button>
                      </div>

                      {loadingDetails ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '20px', color: 'var(--text-secondary)' }}>
                          <Loader2 size={20} className="animate-spin" />
                          <span>Cargando recursos asignados...</span>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                          {/* Computadoras */}
                          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
                              <Monitor size={18} color="var(--accent-primary)" />
                              Computadoras Asignadas ({assignedPCs.length})
                            </h4>
                            {assignedPCs.length === 0 ? (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>No hay computadoras asociadas a este puesto.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {assignedPCs.map(pc => (
                                  <div key={pc.id} style={{ fontSize: '0.85rem', background: 'var(--bg-tertiary)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-secondary)' }}>
                                    <div style={{ fontWeight: 600 }}>{pc.hostname || 'Sin Hostname'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                      {pc.tipo} | {pc.marca?.nombre} {pc.modelo?.nombre}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                      S/N: {pc.serial || 'N/A'} | Inventario: {pc.codigo_inventario || 'N/A'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Perifericos */}
                          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
                              <Keyboard size={18} color="var(--accent-primary)" />
                              Periféricos Asignados ({assignedPeripherals.length})
                            </h4>
                            {assignedPeripherals.length === 0 ? (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>No hay periféricos asociados a este puesto.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {assignedPeripherals.map(per => (
                                  <div key={per.id} style={{ fontSize: '0.85rem', background: 'var(--bg-tertiary)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-secondary)' }}>
                                    <div style={{ fontWeight: 600 }}>{per.categoria}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                      {per.marca?.nombre} {per.modelo?.nombre}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                      S/N: {per.serial || 'N/A'} | Inventario: {per.codigo_inventario || 'N/A'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Licencias */}
                          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
                              <Key size={18} color="var(--accent-primary)" />
                              Licencias de Software ({assignedLicenses.length})
                            </h4>
                            {!puesto.usuario_asignado ? (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Asigne un usuario al puesto para ver sus licencias asociadas.</p>
                            ) : assignedLicenses.length === 0 ? (
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>No se encontraron licencias asignadas al usuario de este puesto.</p>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {assignedLicenses.map(al => (
                                  <div key={al.id} style={{ fontSize: '0.85rem', background: 'var(--bg-tertiary)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-secondary)' }}>
                                    <div style={{ fontWeight: 600 }}>{al.licencia?.nombre_software || 'Software'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                      Tipo: {al.licencia?.tipo_licencia} | Versión: {al.licencia?.version || 'N/A'}
                                    </div>
                                    {al.notas && (
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: '2px' }}>
                                        Nota: {al.notas}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {puesto.notas && (
                        <div style={{ marginTop: '20px', padding: '12px', background: 'var(--bg-secondary)', borderLeft: '3px solid var(--border-primary)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', fontSize: '0.8rem' }}>
                          <strong>Notas del puesto:</strong> {puesto.notas}
                        </div>
                      )}

                      {/* Datos de Conectividad */}
                      <div style={{ marginTop: '20px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
                        <h4 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
                          Datos de Conectividad
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                          {/* Red */}
                          <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-secondary)' }}>
                            <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '12px' }}>
                              <Network size={16} />
                              Conectividad de Red
                            </h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '4px' }}>
                                <strong>Switch:</strong> <span>{puesto.red_switch || '—'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '4px' }}>
                                <strong>Puerto Switch:</strong> <span>{puesto.red_puerto || '—'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '4px' }}>
                                <strong>Boca de Red:</strong> <span>{puesto.boca_red || '—'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                                <strong>IP ({puesto.modo_ip}):</strong> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{puesto.ip || '—'}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Telefonía */}
                          <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-secondary)' }}>
                            <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '12px' }}>
                              <Phone size={16} />
                              Conectividad de Telefonía
                            </h5>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '4px' }}>
                                <strong>Módulo Central:</strong> <span>{puesto.tel_modulo_central || '—'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '4px' }}>
                                <strong>Pachera:</strong> <span>{puesto.tel_pachera || '—'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '4px' }}>
                                <strong>Boca de Teléfono:</strong> <span>{puesto.tel_boca || '—'}</span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                                <strong>Teléfono Interno:</strong> <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{puesto.telefono_interno || '—'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
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
              Mostrando <strong>{startIndex + 1}</strong> a <strong>{Math.min(startIndex + itemsPerPage, filteredPuestos.length)}</strong> de <strong>{filteredPuestos.length}</strong> {filteredPuestos.length === 1 ? 'registro' : 'registros'}
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

      {/* Row details panel */}
      {selectedPuesto && (
        <div className={styles.card} style={{ marginTop: '24px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Detalles del Puesto: <span style={{ color: 'var(--accent-primary)' }}>{selectedPuesto.codigo}</span>
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Ubicación: {selectedPuesto.ubicacion?.nombre} | Sector: {selectedPuesto.sector?.nombre} | Usuario: {selectedPuesto.usuario ? `${selectedPuesto.usuario.nombre} ${selectedPuesto.usuario.apellido}` : 'Sin asignar'}
              </p>
            </div>
            <button className={styles.actionBtn} onClick={() => setSelectedPuesto(null)}>
              <X size={16} />
              Cerrar Panel
            </button>
          </div>

          {loadingDetails ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '20px', color: 'var(--text-secondary)' }}>
              <Loader2 size={20} className="animate-spin" />
              <span>Cargando recursos asignados...</span>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              {/* Computadoras */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  <Monitor size={18} color="var(--accent-primary)" />
                  Computadoras Asignadas ({assignedPCs.length})
                </h4>
                {assignedPCs.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>No hay computadoras asociadas a este puesto.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {assignedPCs.map(pc => (
                      <div key={pc.id} style={{ fontSize: '0.85rem', background: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-secondary)' }}>
                        <div style={{ fontWeight: 600 }}>{pc.hostname || 'Sin Hostname'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {pc.tipo} | {pc.marca?.nombre} {pc.modelo?.nombre}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          S/N: {pc.serial || 'N/A'} | Inventario: {pc.codigo_inventario || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Perifericos */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  <Keyboard size={18} color="var(--accent-primary)" />
                  Periféricos Asignados ({assignedPeripherals.length})
                </h4>
                {assignedPeripherals.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>No hay periféricos asociados a este puesto.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {assignedPeripherals.map(per => (
                      <div key={per.id} style={{ fontSize: '0.85rem', background: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-secondary)' }}>
                        <div style={{ fontWeight: 600 }}>{per.categoria}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {per.marca?.nombre} {per.modelo?.nombre}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                          S/N: {per.serial || 'N/A'} | Inventario: {per.codigo_inventario || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Licencias */}
              <div style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
                  <Key size={18} color="var(--accent-primary)" />
                  Licencias de Software ({assignedLicenses.length})
                </h4>
                {!selectedPuesto.usuario_asignado ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Asigne un usuario al puesto para ver sus licencias asociadas.</p>
                ) : assignedLicenses.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>No se encontraron licencias asignadas al usuario de este puesto.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {assignedLicenses.map(al => (
                      <div key={al.id} style={{ fontSize: '0.85rem', background: 'var(--bg-secondary)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-secondary)' }}>
                        <div style={{ fontWeight: 600 }}>{al.licencia?.nombre_software || 'Software'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Tipo: {al.licencia?.tipo_licencia} | Versión: {al.licencia?.version || 'N/A'}
                        </div>
                        {al.notas && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: '2px' }}>
                            Nota: {al.notas}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedPuesto.notas && (
            <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-secondary)', borderLeft: '3px solid var(--border-primary)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', fontSize: '0.8rem' }}>
              <strong>Notas del puesto:</strong> {selectedPuesto.notas}
            </div>
          )}

          {/* Datos de Conectividad */}
          <div style={{ marginTop: '20px', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-primary)' }}>
            <h4 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
              Datos de Conectividad
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Red */}
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-secondary)' }}>
                <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '12px' }}>
                  <Network size={16} />
                  Conectividad de Red
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '4px' }}>
                    <strong>Switch:</strong> <span>{selectedPuesto.red_switch || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '4px' }}>
                    <strong>Puerto Switch:</strong> <span>{selectedPuesto.red_puerto || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '4px' }}>
                    <strong>Boca de Red:</strong> <span>{selectedPuesto.boca_red || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                    <strong>IP ({selectedPuesto.modo_ip}):</strong> <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{selectedPuesto.ip || '—'}</span>
                  </div>
                </div>
              </div>
              
              {/* Telefonía */}
              <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-secondary)' }}>
                <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-primary)', marginBottom: '12px' }}>
                  <Phone size={16} />
                  Conectividad de Telefonía
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '4px' }}>
                    <strong>Módulo Central:</strong> <span>{selectedPuesto.tel_modulo_central || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '4px' }}>
                    <strong>Pachera:</strong> <span>{selectedPuesto.tel_pachera || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '4px' }}>
                    <strong>Boca de Teléfono:</strong> <span>{selectedPuesto.tel_boca || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                    <strong>Teléfono Interno:</strong> <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedPuesto.telefono_interno || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} style={{ zIndex: 9999 }}>
          <div className={styles.modalWide}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingId ? 'Editar Puesto de Trabajo' : 'Crear Puesto de Trabajo'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              {/* Tab Navigation */}
              <div className={styles.modalTabs}>
                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${activeTab === 'general' ? styles.modalTabBtnActive : ''}`}
                  onClick={() => setActiveTab('general')}
                >
                  Datos Generales
                </button>
                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${activeTab === 'red' ? styles.modalTabBtnActive : ''}`}
                  onClick={() => setActiveTab('red')}
                >
                  Conectividad de Red
                </button>
                <button
                  type="button"
                  className={`${styles.modalTabBtn} ${activeTab === 'telefonia' ? styles.modalTabBtnActive : ''}`}
                  onClick={() => setActiveTab('telefonia')}
                >
                  Telefonía
                </button>
              </div>

              <div className={styles.modalBody}>
                {/* TAB GENERAL */}
                {activeTab === 'general' && (
                  <>
                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Código de Puesto *</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={formData.codigo}
                          onChange={e => setFormData({ ...formData, codigo: e.target.value })}
                          placeholder="Ej. PUESTO-SIS-03"
                        />
                        {formErrors.codigo && <span className={styles.fieldError}>{formErrors.codigo}</span>}
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Ubicación Física *</label>
                        <select
                          className={styles.fieldInput}
                          value={formData.id_ubicacion}
                          onChange={e => setFormData({ ...formData, id_ubicacion: e.target.value })}
                        >
                          <option value="">Seleccione ubicación...</option>
                          {ubicaciones.map(u => (
                            <option key={u.id} value={u.id}>{u.nombre}</option>
                          ))}
                        </select>
                        {formErrors.id_ubicacion && <span className={styles.fieldError}>{formErrors.id_ubicacion}</span>}
                      </div>
                    </div>

                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Sector *</label>
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
                        {formErrors.id_sector && <span className={styles.fieldError}>{formErrors.id_sector}</span>}
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Usuario Asignado</label>
                        <select
                          className={styles.fieldInput}
                          value={formData.usuario_asignado}
                          onChange={e => setFormData({ ...formData, usuario_asignado: e.target.value })}
                        >
                          <option value="">Sin asignar</option>
                          {usuarios.map(u => (
                            <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.field} style={{ marginTop: '8px' }}>
                      <label className={styles.fieldLabel}>Notas / Comentarios</label>
                      <textarea
                        className={styles.fieldTextarea}
                        value={formData.notas}
                        onChange={e => setFormData({ ...formData, notas: e.target.value })}
                        placeholder="Detalles adicionales del puesto..."
                      />
                    </div>

                    <div className={styles.checkboxRow} style={{ marginTop: '8px' }}>
                      <input
                        type="checkbox"
                        id="activo"
                        checked={formData.activo}
                        onChange={e => setFormData({ ...formData, activo: e.target.checked })}
                      />
                      <label htmlFor="activo" className={styles.fieldLabel} style={{ cursor: 'pointer' }}>
                        Puesto Activo (habilita la asignación de hardware y software)
                      </label>
                    </div>
                  </>
                )}

                {/* TAB RED */}
                {activeTab === 'red' && (
                  <>
                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Switch</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={formData.red_switch}
                          onChange={e => setFormData({ ...formData, red_switch: e.target.value })}
                          placeholder="Ej. SW-PISO1-02"
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Puerto Switch</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={formData.red_puerto}
                          onChange={e => setFormData({ ...formData, red_puerto: e.target.value })}
                          placeholder="Ej. 14"
                        />
                      </div>
                    </div>
                    <div className={styles.fieldRow} style={{ marginTop: '12px' }}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Boca de Red</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={formData.boca_red}
                          onChange={e => setFormData({ ...formData, boca_red: e.target.value })}
                          placeholder="Ej. B-303"
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Modo de IP</label>
                        <select
                          className={styles.fieldInput}
                          value={formData.modo_ip}
                          onChange={e => setFormData({ ...formData, modo_ip: e.target.value as any })}
                        >
                          <option value="DHCP">DHCP</option>
                          <option value="Estática">Estática</option>
                          <option value="No aplica">No aplica</option>
                        </select>
                      </div>
                    </div>
                    <div className={styles.fieldRow} style={{ marginTop: '12px' }}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Dirección IP</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={formData.ip}
                          onChange={e => setFormData({ ...formData, ip: e.target.value })}
                          placeholder="Ej. 192.168.1.100"
                          disabled={formData.modo_ip === 'No aplica'}
                        />
                      </div>
                      <div style={{ flex: 1 }}></div>
                    </div>
                  </>
                )}

                {/* TAB TELEFONIA */}
                {activeTab === 'telefonia' && (
                  <>
                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Módulo Central</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={formData.tel_modulo_central}
                          onChange={e => setFormData({ ...formData, tel_modulo_central: e.target.value })}
                          placeholder="Ej. Mod-01"
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Pachera</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={formData.tel_pachera}
                          onChange={e => setFormData({ ...formData, tel_pachera: e.target.value })}
                          placeholder="Ej. Pachera B"
                        />
                      </div>
                    </div>
                    <div className={styles.fieldRow} style={{ marginTop: '12px' }}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Boca de Teléfono</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={formData.tel_boca}
                          onChange={e => setFormData({ ...formData, tel_boca: e.target.value })}
                          placeholder="Ej. T-12"
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Teléfono Interno</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={formData.telefono_interno}
                          onChange={e => setFormData({ ...formData, telefono_interno: e.target.value })}
                          placeholder="Ej. 1026"
                        />
                      </div>
                    </div>
                  </>
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
        <div className={styles.confirmOverlay} style={{ zIndex: 9999 }}>
          <div className={styles.confirmModal}>
            <h3 className={styles.confirmTitle}>Confirmar eliminación</h3>
            <p className={styles.confirmMessage}>
              ¿Estás seguro de que deseas eliminar este puesto de trabajo? Esta acción no se puede deshacer y puede afectar las asociaciones de hardware existentes.
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

      {/* Confirm Save Dialog */}
      {isConfirmSaveOpen && (
        <div className={styles.confirmOverlay} style={{ zIndex: 10000 }}>
          <div className={styles.confirmModal}>
            <h3 className={styles.confirmTitle}>Confirmar cambios</h3>
            <p className={styles.confirmMessage}>
              ¿Estás seguro de que deseas guardar los cambios en este puesto de trabajo?
            </p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setIsConfirmSaveOpen(false)}>
                Cancelar
              </button>
              <button type="button" className={styles.saveBtn} onClick={executeSave}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
