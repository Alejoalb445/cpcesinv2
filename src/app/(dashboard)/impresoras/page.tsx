'use client';

import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Loader2,
  Package,
  ArrowRightLeft
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import styles from '@/styles/module.module.css';
import { toast } from 'sonner';

export default function ImpresorasPage() {
  const supabase = getSupabaseClient();

  // Active Tab: 'impresoras' | 'insumos' | 'consumos'
  const [activeTab, setActiveTab] = useState<'impresoras' | 'insumos' | 'consumos'>('impresoras');

  // Loading states
  const [loading, setLoading] = useState(true);

  // Data states
  const [impresoras, setImpresoras] = useState<any[]>([]);
  const [insumos, setInsumos] = useState<any[]>([]);
  const [consumos, setConsumos] = useState<any[]>([]);

  // Catalog states for select dropdowns
  const [marcas, setMarcas] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [sectores, setSectores] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterTipo, setFilterTipo] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [activeEntity, setActiveEntity] = useState<'impresora' | 'insumo' | 'consumo'>('impresora');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Confirm delete state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; entity: 'impresora' | 'insumo' }>({ id: 0, entity: 'impresora' });

  // Form states
  // 1. Impresora Form
  const [impresoraForm, setImpresoraForm] = useState({
    tipo: 'Laser',
    id_marca: '',
    id_modelo: '',
    serial: '',
    codigo_inventario: '',
    id_ubicacion: '',
    id_sector: '',
    ip: '',
    es_red: false,
    id_proveedor: '',
    fecha_compra: '',
    garantia_hasta: '',
    estado: 'Activo',
    notas: ''
  });

  // 2. Insumo Form
  const [insumoForm, setInsumoForm] = useState({
    nombre: '',
    tipo: 'Tóner',
    codigo_oem: '',
    id_marca: '',
    compatible_con: '',
    stock_actual: 0,
    stock_minimo: 0,
    notas: ''
  });

  // 3. Consumo Form
  const [consumoForm, setConsumoForm] = useState({
    id_insumo: '',
    id_impresora: '',
    cantidad: 1,
    id_sector_destino: '',
    solicitado_por: '',
    entregado_por: '',
    observaciones: ''
  });

  // Load Catalogs once
  useEffect(() => {
    async function loadCatalogos() {
      try {
        const [
          { data: marcasData },
          { data: modelosData },
          { data: ubicacionesData },
          { data: sectoresData },
          { data: proveedoresData }
        ] = await Promise.all([
          supabase.from('marcas').select('id, nombre').order('nombre'),
          supabase.from('modelos').select('id, nombre, id_marca').order('nombre'),
          supabase.from('ubicaciones').select('id, nombre').order('nombre'),
          supabase.from('sectores').select('id, nombre').order('nombre'),
          supabase.from('proveedores').select('id, razon_social').order('razon_social')
        ]);

        if (marcasData) setMarcas(marcasData);
        if (modelosData) setModelos(modelosData);
        if (ubicacionesData) setUbicaciones(ubicacionesData);
        if (sectoresData) setSectores(sectoresData);
        if (proveedoresData) setProveedores(proveedoresData);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
        toast.error('Error al cargar catálogos base');
      }
    }
    loadCatalogos();
  }, []);

  // Fetch Data based on active tab
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'impresoras') {
        const { data, error } = await supabase
          .from('impresoras')
          .select(`
            *,
            marcas(id, nombre),
            modelos(id, nombre),
            ubicaciones(id, nombre),
            sectores(id, nombre),
            proveedores(id, razon_social)
          `)
          .order('id', { ascending: false });

        if (error) throw error;
        setImpresoras(data || []);
      } else if (activeTab === 'insumos') {
        const { data, error } = await supabase
          .from('insumos_impresora')
          .select(`
            *,
            marcas(id, nombre)
          `)
          .order('id', { ascending: false });

        if (error) throw error;
        setInsumos(data || []);
      } else if (activeTab === 'consumos') {
        const { data, error } = await supabase
          .from('consumos_insumo')
          .select(`
            *,
            insumo:insumos_impresora(id, nombre, codigo_oem),
            impresora:impresoras(id, serial, codigo_inventario, modelos(nombre)),
            sector_destino:sectores(id, nombre)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setConsumos(data || []);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al cargar datos: ${err.message || err.details}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Handle Search & Filter Reset when changing tabs
  useEffect(() => {
    setSearchQuery('');
    setFilterEstado('');
    setFilterTipo('');
  }, [activeTab]);

  // Reset pagination on filter, search or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterEstado, filterTipo, activeTab]);

  // Filtering Logic
  const filteredImpresoras = impresoras.filter(item => {
    const brand = item.marcas?.nombre || '';
    const model = item.modelos?.nombre || '';
    const location = item.ubicaciones?.nombre || '';
    const matchSearch = 
      brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.serial && item.serial.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.codigo_inventario && item.codigo_inventario.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.ip && item.ip.includes(searchQuery)) ||
      location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchEstado = filterEstado ? item.estado === filterEstado : true;
    const matchTipo = filterTipo ? item.tipo === filterTipo : true;
    
    return matchSearch && matchEstado && matchTipo;
  });

  const filteredInsumos = insumos.filter(item => {
    const brand = item.marcas?.nombre || '';
    const matchSearch = 
      item.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.codigo_oem && item.codigo_oem.toLowerCase().includes(searchQuery.toLowerCase())) ||
      brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.compatible_con && item.compatible_con.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchTipo = filterTipo ? item.tipo === filterTipo : true;
    return matchSearch && matchTipo;
  });

  const filteredConsumos = consumos.filter(item => {
    const insumoName = item.insumo?.nombre || '';
    const oem = item.insumo?.codigo_oem || '';
    const printerSerial = item.impresora?.serial || '';
    const sectorName = item.sector_destino?.nombre || '';
    
    return (
      insumoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      oem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      printerSerial.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sectorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.solicitado_por && item.solicitado_por.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.entregado_por && item.entregado_por.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Pagination for Impresoras
  const totalPagesImpresoras = Math.ceil(filteredImpresoras.length / itemsPerPage) || 1;
  const startIndexImpresoras = (currentPage - 1) * itemsPerPage;
  const paginatedImpresoras = filteredImpresoras.slice(startIndexImpresoras, startIndexImpresoras + itemsPerPage);

  // Pagination for Insumos
  const totalPagesInsumos = Math.ceil(filteredInsumos.length / itemsPerPage) || 1;
  const startIndexInsumos = (currentPage - 1) * itemsPerPage;
  const paginatedInsumos = filteredInsumos.slice(startIndexInsumos, startIndexInsumos + itemsPerPage);

  // Pagination for Consumos
  const totalPagesConsumos = Math.ceil(filteredConsumos.length / itemsPerPage) || 1;
  const startIndexConsumos = (currentPage - 1) * itemsPerPage;
  const paginatedConsumos = filteredConsumos.slice(startIndexConsumos, startIndexConsumos + itemsPerPage);

  // Open Add Modals
  const handleOpenAdd = () => {
    setModalType('create');
    setSelectedItem(null);
    setActiveEntity(activeTab === 'consumos' ? 'consumo' : activeTab === 'insumos' ? 'insumo' : 'impresora');
    
    if (activeTab === 'impresoras') {
      setImpresoraForm({
        tipo: 'Laser',
        id_marca: '',
        id_modelo: '',
        serial: '',
        codigo_inventario: '',
        id_ubicacion: '',
        id_sector: '',
        ip: '',
        es_red: false,
        id_proveedor: '',
        fecha_compra: '',
        garantia_hasta: '',
        estado: 'Activo',
        notas: ''
      });
    } else if (activeTab === 'insumos') {
      setInsumoForm({
        nombre: '',
        tipo: 'Tóner',
        codigo_oem: '',
        id_marca: '',
        compatible_con: '',
        stock_actual: 0,
        stock_minimo: 0,
        notas: ''
      });
    } else {
      setConsumoForm({
        id_insumo: '',
        id_impresora: '',
        cantidad: 1,
        id_sector_destino: '',
        solicitado_por: '',
        entregado_por: '',
        observaciones: ''
      });
    }
    setIsModalOpen(true);
  };

  // Open Edit Modals
  const handleOpenEdit = (item: any, entity: 'impresora' | 'insumo') => {
    setModalType('edit');
    setSelectedItem(item);
    setActiveEntity(entity);
    
    if (entity === 'impresora') {
      setImpresoraForm({
        tipo: item.tipo,
        id_marca: item.id_marca ? String(item.id_marca) : '',
        id_modelo: item.id_modelo ? String(item.id_modelo) : '',
        serial: item.serial || '',
        codigo_inventario: item.codigo_inventario || '',
        id_ubicacion: item.id_ubicacion ? String(item.id_ubicacion) : '',
        id_sector: item.id_sector ? String(item.id_sector) : '',
        ip: item.ip || '',
        es_red: !!item.es_red,
        id_proveedor: item.id_proveedor ? String(item.id_proveedor) : '',
        fecha_compra: item.fecha_compra || '',
        garantia_hasta: item.garantia_hasta || '',
        estado: item.estado,
        notas: item.notas || ''
      });
    } else {
      setInsumoForm({
        nombre: item.nombre,
        tipo: item.tipo,
        codigo_oem: item.codigo_oem || '',
        id_marca: item.id_marca ? String(item.id_marca) : '',
        compatible_con: item.compatible_con || '',
        stock_actual: item.stock_actual || 0,
        stock_minimo: item.stock_minimo || 0,
        notas: item.notas || ''
      });
    }
    setIsModalOpen(true);
  };

  // Handle Delete Confirm
  const handleOpenDelete = (id: number, entity: 'impresora' | 'insumo') => {
    setItemToDelete({ id, entity });
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    setIsConfirmOpen(false);
    try {
      const table = itemToDelete.entity === 'impresora' ? 'impresoras' : 'insumos_impresora';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;
      toast.success(`${itemToDelete.entity === 'impresora' ? 'Impresora' : 'Insumo'} eliminado correctamente`);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al eliminar: ${err.message || err.details}`);
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (activeEntity === 'impresora') {
        if (!impresoraForm.id_marca || !impresoraForm.id_modelo) {
          toast.error('Marca y Modelo son obligatorios');
          return;
        }

        const payload = {
          tipo: impresoraForm.tipo,
          id_marca: parseInt(impresoraForm.id_marca),
          id_modelo: parseInt(impresoraForm.id_modelo),
          serial: impresoraForm.serial || null,
          codigo_inventario: impresoraForm.codigo_inventario || null,
          id_ubicacion: impresoraForm.id_ubicacion ? parseInt(impresoraForm.id_ubicacion) : null,
          id_sector: impresoraForm.id_sector ? parseInt(impresoraForm.id_sector) : null,
          ip: impresoraForm.ip || null,
          es_red: impresoraForm.es_red,
          id_proveedor: impresoraForm.id_proveedor ? parseInt(impresoraForm.id_proveedor) : null,
          fecha_compra: impresoraForm.fecha_compra || null,
          garantia_hasta: impresoraForm.garantia_hasta || null,
          estado: impresoraForm.estado,
          notas: impresoraForm.notas || null
        };

        if (modalType === 'create') {
          const { error } = await supabase
            .from('impresoras')
            .insert([payload]);
          if (error) throw error;
          toast.success('Impresora creada con éxito');
        } else {
          const { error } = await supabase
            .from('impresoras')
            .update(payload)
            .eq('id', selectedItem.id);
          if (error) throw error;
          toast.success('Impresora actualizada con éxito');
        }
      } else if (activeEntity === 'insumo') {
        if (!insumoForm.nombre.trim()) {
          toast.error('El nombre del insumo es obligatorio');
          return;
        }

        const payload = {
          nombre: insumoForm.nombre.trim(),
          tipo: insumoForm.tipo,
          codigo_oem: insumoForm.codigo_oem || null,
          id_marca: insumoForm.id_marca ? parseInt(insumoForm.id_marca) : null,
          compatible_con: insumoForm.compatible_con || null,
          stock_actual: Number(insumoForm.stock_actual) || 0,
          stock_minimo: Number(insumoForm.stock_minimo) || 0,
          notas: insumoForm.notas || null
        };

        if (modalType === 'create') {
          const { error } = await supabase
            .from('insumos_impresora')
            .insert([payload]);
          if (error) throw error;
          toast.success('Insumo registrado con éxito');
        } else {
          const { error } = await supabase
            .from('insumos_impresora')
            .update(payload)
            .eq('id', selectedItem.id);
          if (error) throw error;
          toast.success('Insumo actualizado con éxito');
        }
      } else if (activeEntity === 'consumo') {
        if (!consumoForm.id_insumo || !consumoForm.cantidad || consumoForm.cantidad <= 0) {
          toast.error('Debe seleccionar un insumo y especificar una cantidad válida');
          return;
        }

        const payload = {
          id_insumo: parseInt(consumoForm.id_insumo),
          id_impresora: consumoForm.id_impresora ? parseInt(consumoForm.id_impresora) : null,
          cantidad: Number(consumoForm.cantidad),
          id_sector_destino: consumoForm.id_sector_destino ? parseInt(consumoForm.id_sector_destino) : null,
          solicitado_por: consumoForm.solicitado_por || null,
          entregado_por: consumoForm.entregado_por || null,
          observaciones: consumoForm.observaciones || null,
          tipo_movimiento: 'Consumo'
        };

        const selectedInsumo = insumos.find(i => i.id === payload.id_insumo);
        if (selectedInsumo && selectedInsumo.stock_actual < payload.cantidad) {
          toast.error(`Stock insuficiente. Disponible: ${selectedInsumo.stock_actual}`);
          return;
        }

        const { error } = await supabase
          .from('consumos_insumo')
          .insert([payload]);

        if (error) throw error;
        toast.success('Entrega registrada con éxito. Stock actualizado.');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al guardar: ${err.message || err.details}`);
    }
  };

  const filteredModelosForm = modelos.filter(
    m => m.id_marca === parseInt(impresoraForm.id_marca)
  );

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <Printer size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Impresoras y Tóner</h1>
            <p className={styles.pageSubtitle}>Gestión de equipamiento de impresión y consumibles de stock</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={handleOpenAdd}>
          <Plus size={16} />
          {activeTab === 'impresoras' && 'Agregar Impresora'}
          {activeTab === 'insumos' && 'Nuevo Insumo / Tóner'}
          {activeTab === 'consumos' && 'Registrar Entrega'}
        </button>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('impresoras')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'impresoras' ? 'var(--accent-gradient)' : 'none',
            color: activeTab === 'impresoras' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Printer size={16} />
          Impresoras
        </button>
        <button 
          onClick={() => setActiveTab('insumos')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'insumos' ? 'var(--accent-gradient)' : 'none',
            color: activeTab === 'insumos' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Package size={16} />
          Insumos / Tóner
        </button>
        <button 
          onClick={() => setActiveTab('consumos')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'consumos' ? 'var(--accent-gradient)' : 'none',
            color: activeTab === 'consumos' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ArrowRightLeft size={16} />
          Consumos / Entregas
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder={
              activeTab === 'impresoras' 
                ? 'Buscar por marca, modelo, serial, IP o ubicación...' 
                : activeTab === 'insumos'
                ? 'Buscar por nombre, código OEM, marca o compatibilidad...'
                : 'Buscar consumos por insumo, impresora, sector o responsable...'
            }
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {activeTab === 'impresoras' && (
          <>
            <select 
              className={styles.filterSelect}
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="Laser">Láser</option>
              <option value="Inkjet">Inkjet</option>
              <option value="Matricial">Matricial</option>
              <option value="Térmica">Térmica</option>
              <option value="Multifunción">Multifunción</option>
              <option value="Plotter">Plotter</option>
            </select>
            <select 
              className={styles.filterSelect}
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="Activo">Activo</option>
              <option value="En reparación">En reparación</option>
              <option value="En stock">En stock</option>
              <option value="Dado de baja">Dado de baja</option>
            </select>
          </>
        )}

        {activeTab === 'insumos' && (
          <select 
            className={styles.filterSelect}
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option value="Tóner">Tóner</option>
            <option value="Cartucho">Cartucho</option>
            <option value="Cinta">Cinta</option>
            <option value="Rollo">Rollo</option>
            <option value="Otro">Otro</option>
          </select>
        )}
      </div>

      {/* Main Table View */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Cargando datos...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: Impresoras */}
          {activeTab === 'impresoras' && (
            filteredImpresoras.length === 0 ? (
              <div className={styles.emptyState}>
                <Printer size={48} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No se encontraron impresoras</h3>
                <p className={styles.emptyText}>Modificá los filtros o agregá una nueva impresora al sistema.</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <div className={styles.table}>
                  <div className={styles.tableHeader} style={{ gridTemplateColumns: '1fr 2fr 1.5fr 1fr 2fr 1.2fr 120px' }}>
                    <div>Tipo</div>
                    <div>Marca / Modelo</div>
                    <div>Dirección IP</div>
                    <div>Red</div>
                    <div>Ubicación / Sector</div>
                    <div>Estado</div>
                    <div style={{ textAlign: 'right' }}>Acciones</div>
                  </div>
                  {paginatedImpresoras.map((item) => (
                    <div key={item.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '1fr 2fr 1.5fr 1fr 2fr 1.2fr 120px' }}>
                      <div className={styles.rowText}>{item.tipo}</div>
                      <div className={styles.rowText} style={{ fontWeight: 600 }}>
                        {item.marcas?.nombre} {item.modelos?.nombre}
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 'normal' }}>
                          S/N: {item.serial || 'N/A'} {item.codigo_inventario && `| Inv: ${item.codigo_inventario}`}
                        </span>
                      </div>
                      <div className={styles.rowText}>{item.ip || 'Sin IP'}</div>
                      <div>
                        <span className={`${styles.badge} ${item.es_red ? styles.badgeActive : styles.badgeInactive}`}>
                          {item.es_red ? 'Sí' : 'No'}
                        </span>
                      </div>
                      <div className={styles.rowText}>
                        {item.ubicaciones?.nombre || 'Sin Ubicación'}
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          {item.sectores?.nombre || 'Sin Sector'}
                        </span>
                      </div>
                      <div>
                        <span className={`${styles.badge} ${
                          item.estado === 'Activo' ? styles.badgeActive : 
                          item.estado === 'En reparación' ? styles.badgeWarning : 
                          item.estado === 'En stock' ? styles.badgeInfo : styles.badgeInactive
                        }`}>
                          {item.estado}
                        </span>
                      </div>
                      <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                        <button className={styles.actionBtn} onClick={() => handleOpenEdit(item, 'impresora')}>
                          <Edit size={14} />
                        </button>
                        <button className={styles.deleteBtn} onClick={() => handleOpenDelete(item.id, 'impresora')}>
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
                    Mostrando <strong>{startIndexImpresoras + 1}</strong> a <strong>{Math.min(startIndexImpresoras + itemsPerPage, filteredImpresoras.length)}</strong> de <strong>{filteredImpresoras.length}</strong> {filteredImpresoras.length === 1 ? 'registro' : 'registros'}
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
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesImpresoras))}
                      disabled={currentPage === totalPagesImpresoras}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-primary)',
                        color: currentPage === totalPagesImpresoras ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        cursor: currentPage === totalPagesImpresoras ? 'not-allowed' : 'pointer',
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

          {/* TAB 2: Insumos */}
          {activeTab === 'insumos' && (
            filteredInsumos.length === 0 ? (
              <div className={styles.emptyState}>
                <Package size={48} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No se encontraron insumos</h3>
                <p className={styles.emptyText}>Agregá consumibles como tóners o cartuchos para controlar su stock.</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <div className={styles.table}>
                  <div className={styles.tableHeader} style={{ gridTemplateColumns: '2fr 1fr 1.2fr 1.5fr 1fr 1fr 120px' }}>
                    <div>Nombre Insumo</div>
                    <div>Tipo</div>
                    <div>Cód OEM</div>
                    <div>Marca / Compatibilidad</div>
                    <div>Stock Actual</div>
                    <div>Stock Mínimo</div>
                    <div style={{ textAlign: 'right' }}>Acciones</div>
                  </div>
                  {paginatedInsumos.map((item) => {
                    const esBajoStock = item.stock_actual <= item.stock_minimo;
                    return (
                      <div key={item.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '2fr 1fr 1.2fr 1.5fr 1fr 1fr 120px' }}>
                        <div className={styles.rowText} style={{ fontWeight: 600 }}>{item.nombre}</div>
                        <div>{item.tipo}</div>
                        <div className={styles.rowText}>{item.codigo_oem || 'N/A'}</div>
                        <div className={styles.rowText}>
                          {item.marcas?.nombre || 'Genérico'}
                          {item.compatible_con && (
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                              Comp: {item.compatible_con}
                            </span>
                          )}
                        </div>
                        <div>
                          <span 
                            className={`${styles.badge} ${esBajoStock ? styles.badgeInactive : styles.badgeActive}`}
                            style={{ fontSize: '12px', padding: '4px 10px' }}
                          >
                            {item.stock_actual} uds
                          </span>
                        </div>
                        <div>{item.stock_minimo} uds</div>
                        <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                          <button className={styles.actionBtn} onClick={() => handleOpenEdit(item, 'insumo')}>
                            <Edit size={14} />
                          </button>
                          <button className={styles.deleteBtn} onClick={() => handleOpenDelete(item.id, 'insumo')}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
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
                    Mostrando <strong>{startIndexInsumos + 1}</strong> a <strong>{Math.min(startIndexInsumos + itemsPerPage, filteredInsumos.length)}</strong> de <strong>{filteredInsumos.length}</strong> {filteredInsumos.length === 1 ? 'registro' : 'registros'}
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
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesInsumos))}
                      disabled={currentPage === totalPagesInsumos}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-primary)',
                        color: currentPage === totalPagesInsumos ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        cursor: currentPage === totalPagesInsumos ? 'not-allowed' : 'pointer',
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

          {/* TAB 3: Consumos / Entregas */}
          {activeTab === 'consumos' && (
            filteredConsumos.length === 0 ? (
              <div className={styles.emptyState}>
                <ArrowRightLeft size={48} className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No se registraron entregas</h3>
                <p className={styles.emptyText}>Registrá las entregas de tóner y consumibles para hacer un seguimiento del stock.</p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <div className={styles.table}>
                  <div className={styles.tableHeader} style={{ gridTemplateColumns: '2fr 2fr 1fr 1.2fr 1.5fr 1.5fr 1.5fr' }}>
                    <div>Insumo</div>
                    <div>Destino (Impresora / Sector)</div>
                    <div>Cantidad</div>
                    <div>Movimiento</div>
                    <div>Fecha</div>
                    <div>Solicitado por</div>
                    <div>Entregado por</div>
                  </div>
                  {paginatedConsumos.map((item) => (
                    <div key={item.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '2fr 2fr 1fr 1.2fr 1.5fr 1.5fr 1.5fr', cursor: 'default' }}>
                      <div className={styles.rowText} style={{ fontWeight: 600 }}>
                        {item.insumo?.nombre}
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 'normal' }}>
                          OEM: {item.insumo?.codigo_oem || 'N/A'}
                        </span>
                      </div>
                      <div className={styles.rowText}>
                        {item.impresora ? (
                          <>
                            Impresora: {item.impresora.modelos?.nombre || 'S/D'}
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                              S/N: {item.impresora.serial || 'N/A'}
                            </span>
                          </>
                        ) : (
                          `Sector: ${item.sector_destino?.nombre || 'General'}`
                        )}
                      </div>
                      <div>{item.cantidad} uds</div>
                      <div>
                        <span className={`${styles.badge} ${
                          item.tipo_movimiento === 'Ingreso' ? styles.badgeActive : 
                          item.tipo_movimiento === 'Consumo' ? styles.badgeInactive : styles.badgeInfo
                        }`}>
                          {item.tipo_movimiento}
                        </span>
                      </div>
                      <div>{new Date(item.created_at).toLocaleString('es-AR')}</div>
                      <div className={styles.rowText}>{item.solicitado_por || 'N/A'}</div>
                      <div className={styles.rowText}>{item.entregado_por || 'N/A'}</div>
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
                    Mostrando <strong>{startIndexConsumos + 1}</strong> a <strong>{Math.min(startIndexConsumos + itemsPerPage, filteredConsumos.length)}</strong> de <strong>{filteredConsumos.length}</strong> {filteredConsumos.length === 1 ? 'registro' : 'registros'}
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
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPagesConsumos))}
                      disabled={currentPage === totalPagesConsumos}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-primary)',
                        color: currentPage === totalPagesConsumos ? 'var(--text-tertiary)' : 'var(--text-primary)',
                        cursor: currentPage === totalPagesConsumos ? 'not-allowed' : 'pointer',
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
        </>
      )}

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalWide} style={{ maxHeight: '90vh' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalType === 'create' ? 'Agregar ' : 'Editar '}
                {activeEntity === 'impresora' && 'Impresora'}
                {activeEntity === 'insumo' && 'Insumo / Tóner'}
                {activeEntity === 'consumo' && 'Entrega de Insumo'}
              </h3>
              <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                {/* 1. IMPRESORA FORM */}
                {activeEntity === 'impresora' && (
                  <>
                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Tipo de Impresora</label>
                        <select 
                          className={styles.fieldInput}
                          value={impresoraForm.tipo}
                          onChange={(e) => setImpresoraForm({...impresoraForm, tipo: e.target.value})}
                        >
                          <option value="Laser">Láser</option>
                          <option value="Inkjet">Inkjet</option>
                          <option value="Matricial">Matricial</option>
                          <option value="Térmica">Térmica</option>
                          <option value="Multifunción">Multifunción</option>
                          <option value="Plotter">Plotter</option>
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Estado</label>
                        <select 
                          className={styles.fieldInput}
                          value={impresoraForm.estado}
                          onChange={(e) => setImpresoraForm({...impresoraForm, estado: e.target.value})}
                        >
                          <option value="Activo">Activo</option>
                          <option value="En reparación">En reparación</option>
                          <option value="En stock">En stock</option>
                          <option value="Dado de baja">Dado de baja</option>
                          <option value="Prestado">Prestado</option>
                          <option value="Extraviado">Extraviado</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Marca *</label>
                        <select 
                          className={styles.fieldInput}
                          value={impresoraForm.id_marca}
                          onChange={(e) => setImpresoraForm({...impresoraForm, id_marca: e.target.value, id_modelo: ''})}
                          required
                        >
                          <option value="">Seleccione Marca</option>
                          {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Modelo *</label>
                        <select 
                          className={styles.fieldInput}
                          value={impresoraForm.id_modelo}
                          onChange={(e) => setImpresoraForm({...impresoraForm, id_modelo: e.target.value})}
                          disabled={!impresoraForm.id_marca}
                          required
                        >
                          <option value="">Seleccione Modelo</option>
                          {filteredModelosForm.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Número de Serie</label>
                        <input 
                          type="text" 
                          className={styles.fieldInput}
                          value={impresoraForm.serial}
                          onChange={(e) => setImpresoraForm({...impresoraForm, serial: e.target.value})}
                          placeholder="Serial OEM"
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Código Inventario</label>
                        <input 
                          type="text" 
                          className={styles.fieldInput}
                          value={impresoraForm.codigo_inventario}
                          onChange={(e) => setImpresoraForm({...impresoraForm, codigo_inventario: e.target.value})}
                          placeholder="Código de barras interno"
                        />
                      </div>
                    </div>

                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Ubicación Física</label>
                        <select 
                          className={styles.fieldInput}
                          value={impresoraForm.id_ubicacion}
                          onChange={(e) => setImpresoraForm({...impresoraForm, id_ubicacion: e.target.value})}
                        >
                          <option value="">Sin Ubicación</option>
                          {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Sector Asignado</label>
                        <select 
                          className={styles.fieldInput}
                          value={impresoraForm.id_sector}
                          onChange={(e) => setImpresoraForm({...impresoraForm, id_sector: e.target.value})}
                        >
                          <option value="">Sin Sector</option>
                          {sectores.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>IP</label>
                        <input 
                          type="text" 
                          className={styles.fieldInput}
                          value={impresoraForm.ip}
                          onChange={(e) => setImpresoraForm({...impresoraForm, ip: e.target.value})}
                          placeholder="192.168.x.x"
                        />
                      </div>

                      <div className={styles.field} style={{ justifyContent: 'center' }}>
                        <label className={styles.checkboxRow} style={{ marginTop: '20px', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={impresoraForm.es_red}
                            onChange={(e) => setImpresoraForm({...impresoraForm, es_red: e.target.checked})}
                          />
                          <span className={styles.fieldLabel}>¿Es impresora de red?</span>
                        </label>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Proveedor</label>
                      <select 
                        className={styles.fieldInput}
                        value={impresoraForm.id_proveedor}
                        onChange={(e) => setImpresoraForm({...impresoraForm, id_proveedor: e.target.value})}
                      >
                        <option value="">Sin Proveedor</option>
                        {proveedores.map(p => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
                      </select>
                    </div>

                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Fecha de Compra</label>
                        <input 
                          type="date" 
                          className={styles.fieldInput}
                          value={impresoraForm.fecha_compra}
                          onChange={(e) => setImpresoraForm({...impresoraForm, fecha_compra: e.target.value})}
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Garantía Hasta</label>
                        <input 
                          type="date" 
                          className={styles.fieldInput}
                          value={impresoraForm.garantia_hasta}
                          onChange={(e) => setImpresoraForm({...impresoraForm, garantia_hasta: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Notas</label>
                      <textarea 
                        className={styles.fieldTextarea}
                        value={impresoraForm.notas}
                        onChange={(e) => setImpresoraForm({...impresoraForm, notas: e.target.value})}
                        placeholder="Observaciones adicionales, cartuchos compatibles, etc."
                      />
                    </div>
                  </>
                )}

                {/* 2. INSUMO FORM */}
                {activeEntity === 'insumo' && (
                  <>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Nombre del Insumo *</label>
                      <input 
                        type="text" 
                        className={styles.fieldInput}
                        value={insumoForm.nombre}
                        onChange={(e) => setInsumoForm({...insumoForm, nombre: e.target.value})}
                        placeholder="Ej. Tóner Brother TN-2410 Negro"
                        required
                      />
                    </div>

                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Tipo de Insumo</label>
                        <select 
                          className={styles.fieldInput}
                          value={insumoForm.tipo}
                          onChange={(e) => setInsumoForm({...insumoForm, tipo: e.target.value})}
                        >
                          <option value="Tóner">Tóner</option>
                          <option value="Cartucho">Cartucho</option>
                          <option value="Cinta">Cinta</option>
                          <option value="Rollo">Rollo</option>
                          <option value="Otro">Otro</option>
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Código OEM / Referencia</label>
                        <input 
                          type="text" 
                          className={styles.fieldInput}
                          value={insumoForm.codigo_oem}
                          onChange={(e) => setInsumoForm({...insumoForm, codigo_oem: e.target.value})}
                          placeholder="Ej. TN2410"
                        />
                      </div>
                    </div>

                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Marca Fabricante</label>
                        <select 
                          className={styles.fieldInput}
                          value={insumoForm.id_marca}
                          onChange={(e) => setInsumoForm({...insumoForm, id_marca: e.target.value})}
                        >
                          <option value="">Genérico / Otra</option>
                          {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Compatible con</label>
                        <input 
                          type="text" 
                          className={styles.fieldInput}
                          value={insumoForm.compatible_con}
                          onChange={(e) => setInsumoForm({...insumoForm, compatible_con: e.target.value})}
                          placeholder="Modelos compatibles"
                        />
                      </div>
                    </div>

                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Stock Actual</label>
                        <input 
                          type="number" 
                          className={styles.fieldInput}
                          value={insumoForm.stock_actual}
                          onChange={(e) => setInsumoForm({...insumoForm, stock_actual: parseInt(e.target.value) || 0})}
                          min="0"
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Stock Mínimo</label>
                        <input 
                          type="number" 
                          className={styles.fieldInput}
                          value={insumoForm.stock_minimo}
                          onChange={(e) => setInsumoForm({...insumoForm, stock_minimo: parseInt(e.target.value) || 0})}
                          min="0"
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Notas / Descripción</label>
                      <textarea 
                        className={styles.fieldTextarea}
                        value={insumoForm.notas}
                        onChange={(e) => setInsumoForm({...insumoForm, notas: e.target.value})}
                        placeholder="Ubicación física en el depósito, costo estimado, etc."
                      />
                    </div>
                  </>
                )}

                {/* 3. CONSUMO FORM */}
                {activeEntity === 'consumo' && (
                  <>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Insumo / Tóner a Entregar *</label>
                      <select 
                        className={styles.fieldInput}
                        value={consumoForm.id_insumo}
                        onChange={(e) => setConsumoForm({...consumoForm, id_insumo: e.target.value})}
                        required
                      >
                        <option value="">Seleccione Insumo</option>
                        {insumos.map(i => (
                          <option key={i.id} value={i.id} disabled={i.stock_actual <= 0}>
                            {i.nombre} (Stock: {i.stock_actual} uds) {i.stock_actual <= 0 ? '— AGOTADO' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Impresora de Destino</label>
                        <select 
                          className={styles.fieldInput}
                          value={consumoForm.id_impresora}
                          onChange={(e) => setConsumoForm({...consumoForm, id_impresora: e.target.value, id_sector_destino: ''})}
                        >
                          <option value="">Sin impresora (Entrega a Sector General)</option>
                          {impresoras.filter(p => p.estado === 'Activo').map(p => (
                            <option key={p.id} value={p.id}>
                              {p.marcas?.nombre} {p.modelos?.nombre} — S/N: {p.serial || 'N/A'} ({p.ubicaciones?.nombre || 'S/D'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Sector de Destino</label>
                        <select 
                          className={styles.fieldInput}
                          value={consumoForm.id_sector_destino}
                          onChange={(e) => setConsumoForm({...consumoForm, id_sector_destino: e.target.value, id_impresora: ''})}
                        >
                          <option value="">Sin sector (Entrega a Impresora Específica)</option>
                          {sectores.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Cantidad a Entregar *</label>
                      <input 
                        type="number" 
                        className={styles.fieldInput}
                        value={consumoForm.cantidad}
                        onChange={(e) => setConsumoForm({...consumoForm, cantidad: parseInt(e.target.value) || 1})}
                        min="1"
                        required
                      />
                    </div>

                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Solicitado por</label>
                        <input 
                          type="text" 
                          className={styles.fieldInput}
                          value={consumoForm.solicitado_por}
                          onChange={(e) => setConsumoForm({...consumoForm, solicitado_por: e.target.value})}
                          placeholder="Nombre del usuario solicitante"
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Entregado por</label>
                        <input 
                          type="text" 
                          className={styles.fieldInput}
                          value={consumoForm.entregado_por}
                          onChange={(e) => setConsumoForm({...consumoForm, entregado_por: e.target.value})}
                          placeholder="Nombre del técnico responsable"
                        />
                      </div>
                    </div>

                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Observaciones</label>
                      <textarea 
                        className={styles.fieldTextarea}
                        value={consumoForm.observaciones}
                        onChange={(e) => setConsumoForm({...consumoForm, observaciones: e.target.value})}
                        placeholder="Detalles sobre la entrega..."
                      />
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

      {/* CONFIRM DELETE DIALOG */}
      {isConfirmOpen && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmModal}>
            <h3 className={styles.confirmTitle}>¿Confirmar eliminación?</h3>
            <p className={styles.confirmMessage}>
              Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este registro?
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setIsConfirmOpen(false)}>
                Cancelar
              </button>
              <button className={styles.dangerBtn} onClick={executeDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
