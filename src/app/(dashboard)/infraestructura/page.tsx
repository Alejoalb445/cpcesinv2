'use client';

import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Zap, 
  Camera, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Loader2
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import styles from '@/styles/module.module.css';
import { toast } from 'sonner';

export default function InfraestructuraPage() {
  const supabase = getSupabaseClient();

  // Active Tab: 'red' | 'energia' | 'cctv'
  const [activeTab, setActiveTab] = useState<'red' | 'energia' | 'cctv'>('red');

  // Loading states
  const [loading, setLoading] = useState(true);

  // Data state
  const [dispositivos, setDispositivos] = useState<any[]>([]);

  // Catalog states for selects
  const [marcas, setMarcas] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [proveedores, setProveedores] = useState<any[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Confirm delete state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number>(0);

  // Form states
  // Base columns
  const [baseForm, setBaseForm] = useState({
    categoria: '',
    id_marca: '',
    id_modelo: '',
    serial: '',
    codigo_inventario: '',
    id_ubicacion: '',
    ip: '',
    id_proveedor: '',
    fecha_compra: '',
    garantia_hasta: '',
    estado: 'Activo',
    notas: ''
  });

  // Details columns (merged state depending on active tab)
  const [redForm, setRedForm] = useState({
    cantidad_puertos: '',
    puertos_poe: '',
    velocidad_gbps: '',
    gestionable: false,
    firmware: ''
  });

  const [energiaForm, setEnergiaForm] = useState({
    potencia_va: '',
    potencia_watts: '',
    tiempo_respaldo_min: '',
    cantidad_tomas: '',
    ultima_revision: ''
  });

  const [cctvForm, setCctvForm] = useState({
    canales: '',
    resolucion: '',
    almacenamiento_tb: '',
    poe_integrado: false,
    protocolo: ''
  });

  // Load catalogs on mount
  useEffect(() => {
    async function loadCatalogos() {
      try {
        const [
          { data: marcasData },
          { data: modelosData },
          { data: ubicacionesData },
          { data: proveedoresData }
        ] = await Promise.all([
          supabase.from('marcas').select('id, nombre').order('nombre'),
          supabase.from('modelos').select('id, nombre, id_marca').order('nombre'),
          supabase.from('ubicaciones').select('id, nombre').order('nombre'),
          supabase.from('proveedores').select('id, razon_social').order('razon_social')
        ]);

        if (marcasData) setMarcas(marcasData);
        if (modelosData) setModelos(modelosData);
        if (ubicacionesData) setUbicaciones(ubicacionesData);
        if (proveedoresData) setProveedores(proveedoresData);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
        toast.error('Error al cargar catálogos base');
      }
    }
    loadCatalogos();
  }, []);

  // Set default category when active tab changes
  useEffect(() => {
    if (activeTab === 'red') {
      setBaseForm(prev => ({ ...prev, categoria: 'Switch' }));
    } else if (activeTab === 'energia') {
      setBaseForm(prev => ({ ...prev, categoria: 'UPS' }));
    } else if (activeTab === 'cctv') {
      setBaseForm(prev => ({ ...prev, categoria: 'DVR' }));
    }
    setSearchQuery('');
    setFilterEstado('');
    setFilterCategoria('');
    fetchData();
  }, [activeTab]);

  // Fetch infrastructure devices with details joined
  const fetchData = async () => {
    setLoading(true);
    try {
      let categories: string[] = [];
      let selectFields = '';

      if (activeTab === 'red') {
        categories = ['Switch', 'Router', 'Access Point', 'Firewall'];
        selectFields = `
          *,
          marcas(id, nombre),
          modelos(id, nombre),
          ubicaciones(id, nombre),
          proveedores(id, razon_social),
          detalle_red:detalle_red(*)
        `;
      } else if (activeTab === 'energia') {
        categories = ['UPS', 'Estabilizador'];
        selectFields = `
          *,
          marcas(id, nombre),
          modelos(id, nombre),
          ubicaciones(id, nombre),
          proveedores(id, razon_social),
          detalle_energia:detalle_energia(*)
        `;
      } else if (activeTab === 'cctv') {
        categories = ['DVR', 'NVR', 'Cámara IP'];
        selectFields = `
          *,
          marcas(id, nombre),
          modelos(id, nombre),
          ubicaciones(id, nombre),
          proveedores(id, razon_social),
          detalle_cctv:detalle_cctv(*)
        `;
      }

      const { data, error } = await supabase
        .from('dispositivos_infraestructura')
        .select(selectFields)
        .in('categoria', categories)
        .order('id', { ascending: false });

      if (error) throw error;
      setDispositivos(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al cargar datos: ${err.message || err.details}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter devices
  const filteredDispositivos = dispositivos.filter(item => {
    const brand = item.marcas?.nombre || '';
    const model = item.modelos?.nombre || '';
    const location = item.ubicaciones?.nombre || '';
    
    const matchSearch = 
      brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoria.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.serial && item.serial.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.codigo_inventario && item.codigo_inventario.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.ip && item.ip.includes(searchQuery)) ||
      location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchEstado = filterEstado ? item.estado === filterEstado : true;
    const matchCat = filterCategoria ? item.categoria === filterCategoria : true;

    return matchSearch && matchEstado && matchCat;
  });

  // Open Add Modal
  const handleOpenAdd = () => {
    setModalType('create');
    setSelectedItem(null);
    
    const defaultCat = activeTab === 'red' ? 'Switch' : activeTab === 'energia' ? 'UPS' : 'DVR';
    setBaseForm({
      categoria: defaultCat,
      id_marca: '',
      id_modelo: '',
      serial: '',
      codigo_inventario: '',
      id_ubicacion: '',
      ip: '',
      id_proveedor: '',
      fecha_compra: '',
      garantia_hasta: '',
      estado: 'Activo',
      notas: ''
    });

    setRedForm({
      cantidad_puertos: '',
      puertos_poe: '',
      velocidad_gbps: '',
      gestionable: false,
      firmware: ''
    });

    setEnergiaForm({
      potencia_va: '',
      potencia_watts: '',
      tiempo_respaldo_min: '',
      cantidad_tomas: '',
      ultima_revision: ''
    });

    setCctvForm({
      canales: '',
      resolucion: '',
      almacenamiento_tb: '',
      poe_integrado: false,
      protocolo: ''
    });

    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: any) => {
    setModalType('edit');
    setSelectedItem(item);
    
    setBaseForm({
      categoria: item.categoria,
      id_marca: item.id_marca ? String(item.id_marca) : '',
      id_modelo: item.id_modelo ? String(item.id_modelo) : '',
      serial: item.serial || '',
      codigo_inventario: item.codigo_inventario || '',
      id_ubicacion: item.id_ubicacion ? String(item.id_ubicacion) : '',
      ip: item.ip || '',
      id_proveedor: item.id_proveedor ? String(item.id_proveedor) : '',
      fecha_compra: item.fecha_compra || '',
      garantia_hasta: item.garantia_hasta || '',
      estado: item.estado,
      notas: item.notas || ''
    });

    if (activeTab === 'red') {
      const d = item.detalle_red?.[0] || item.detalle_red || {};
      setRedForm({
        cantidad_puertos: d.cantidad_puertos !== null && d.cantidad_puertos !== undefined ? String(d.cantidad_puertos) : '',
        puertos_poe: d.puertos_poe !== null && d.puertos_poe !== undefined ? String(d.puertos_poe) : '',
        velocidad_gbps: d.velocidad_gbps !== null && d.velocidad_gbps !== undefined ? String(d.velocidad_gbps) : '',
        firmware: d.firmware || '',
        gestionable: !!d.gestionable
      });
    } else if (activeTab === 'energia') {
      const d = item.detalle_energia?.[0] || item.detalle_energia || {};
      setEnergiaForm({
        potencia_va: d.potencia_va !== null && d.potencia_va !== undefined ? String(d.potencia_va) : '',
        potencia_watts: d.potencia_watts !== null && d.potencia_watts !== undefined ? String(d.potencia_watts) : '',
        tiempo_respaldo_min: d.tiempo_respaldo_min !== null && d.tiempo_respaldo_min !== undefined ? String(d.tiempo_respaldo_min) : '',
        cantidad_tomas: d.cantidad_tomas !== null && d.cantidad_tomas !== undefined ? String(d.cantidad_tomas) : '',
        ultima_revision: d.ultima_revision || ''
      });
    } else if (activeTab === 'cctv') {
      const d = item.detalle_cctv?.[0] || item.detalle_cctv || {};
      setCctvForm({
        canales: d.canales !== null && d.canales !== undefined ? String(d.canales) : '',
        resolucion: d.resolucion || '',
        almacenamiento_tb: d.almacenamiento_tb !== null && d.almacenamiento_tb !== undefined ? String(d.almacenamiento_tb) : '',
        poe_integrado: !!d.poe_integrado,
        protocolo: d.protocolo || ''
      });
    }

    setIsModalOpen(true);
  };

  // Confirm delete
  const handleOpenDelete = (id: number) => {
    setItemToDeleteId(id);
    setIsConfirmOpen(true);
  };

  const executeDelete = async () => {
    setIsConfirmOpen(false);
    try {
      // Due to Cascade Delete constraints, detail tables should delete automatically. Let's do a direct delete.
      const { error } = await supabase
        .from('dispositivos_infraestructura')
        .delete()
        .eq('id', itemToDeleteId);

      if (error) throw error;
      toast.success('Dispositivo eliminado correctamente');
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al eliminar: ${err.message || err.details}`);
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!baseForm.id_marca || !baseForm.id_modelo || !baseForm.categoria) {
      toast.error('Categoría, Marca y Modelo son obligatorios');
      return;
    }

    try {
      const payloadBase = {
        categoria: baseForm.categoria,
        id_marca: parseInt(baseForm.id_marca),
        id_modelo: parseInt(baseForm.id_modelo),
        serial: baseForm.serial || null,
        codigo_inventario: baseForm.codigo_inventario || null,
        id_ubicacion: baseForm.id_ubicacion ? parseInt(baseForm.id_ubicacion) : null,
        ip: baseForm.ip || null,
        id_proveedor: baseForm.id_proveedor ? parseInt(baseForm.id_proveedor) : null,
        fecha_compra: baseForm.fecha_compra || null,
        garantia_hasta: baseForm.garantia_hasta || null,
        estado: baseForm.estado,
        notas: baseForm.notas || null
      };

      let deviceId: number;

      if (modalType === 'create') {
        const { data, error } = await supabase
          .from('dispositivos_infraestructura')
          .insert([payloadBase])
          .select('id')
          .single();

        if (error) throw error;
        deviceId = data.id;
      } else {
        deviceId = selectedItem.id;
        const { error } = await supabase
          .from('dispositivos_infraestructura')
          .update(payloadBase)
          .eq('id', deviceId);

        if (error) throw error;
      }

      // Handle Details insert/update
      if (activeTab === 'red') {
        const detailPayload = {
          cantidad_puertos: redForm.cantidad_puertos ? parseInt(redForm.cantidad_puertos) : null,
          puertos_poe: redForm.puertos_poe ? parseInt(redForm.puertos_poe) : null,
          velocidad_gbps: redForm.velocidad_gbps ? parseFloat(redForm.velocidad_gbps) : null,
          gestionable: redForm.gestionable,
          firmware: redForm.firmware || null
        };

        const { data: existingDetail } = await supabase
          .from('detalle_red')
          .select('id')
          .eq('id_dispositivo', deviceId)
          .maybeSingle();

        if (existingDetail) {
          const { error } = await supabase
            .from('detalle_red')
            .update(detailPayload)
            .eq('id', existingDetail.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('detalle_red')
            .insert([{ ...detailPayload, id_dispositivo: deviceId }]);
          if (error) throw error;
        }
      } else if (activeTab === 'energia') {
        const detailPayload = {
          potencia_va: energiaForm.potencia_va ? parseInt(energiaForm.potencia_va) : null,
          potencia_watts: energiaForm.potencia_watts ? parseInt(energiaForm.potencia_watts) : null,
          tiempo_respaldo_min: energiaForm.tiempo_respaldo_min ? parseInt(energiaForm.tiempo_respaldo_min) : null,
          cantidad_tomas: energiaForm.cantidad_tomas ? parseInt(energiaForm.cantidad_tomas) : null,
          ultima_revision: energiaForm.ultima_revision || null
        };

        const { data: existingDetail } = await supabase
          .from('detalle_energia')
          .select('id')
          .eq('id_dispositivo', deviceId)
          .maybeSingle();

        if (existingDetail) {
          const { error } = await supabase
            .from('detalle_energia')
            .update(detailPayload)
            .eq('id', existingDetail.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('detalle_energia')
            .insert([{ ...detailPayload, id_dispositivo: deviceId }]);
          if (error) throw error;
        }
      } else if (activeTab === 'cctv') {
        const detailPayload = {
          canales: cctvForm.canales ? parseInt(cctvForm.canales) : null,
          resolucion: cctvForm.resolucion || null,
          almacenamiento_tb: cctvForm.almacenamiento_tb ? parseInt(cctvForm.almacenamiento_tb) : null,
          poe_integrado: cctvForm.poe_integrado,
          protocolo: cctvForm.protocolo || null
        };

        const { data: existingDetail } = await supabase
          .from('detalle_cctv')
          .select('id')
          .eq('id_dispositivo', deviceId)
          .maybeSingle();

        if (existingDetail) {
          const { error } = await supabase
            .from('detalle_cctv')
            .update(detailPayload)
            .eq('id', existingDetail.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('detalle_cctv')
            .insert([{ ...detailPayload, id_dispositivo: deviceId }]);
          if (error) throw error;
        }
      }

      toast.success(modalType === 'create' ? 'Dispositivo registrado con éxito' : 'Dispositivo actualizado con éxito');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al guardar: ${err.message || err.details}`);
    }
  };

  const filteredModelosForm = modelos.filter(
    m => m.id_marca === parseInt(baseForm.id_marca)
  );

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <Network size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Infraestructura IT</h1>
            <p className={styles.pageSubtitle}>Gestión de switches, routers, sistemas de energía y CCTV</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={handleOpenAdd}>
          <Plus size={16} />
          Nuevo Dispositivo
        </button>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('red')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'red' ? 'var(--accent-gradient)' : 'none',
            color: activeTab === 'red' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Network size={16} />
          Redes
        </button>
        <button 
          onClick={() => setActiveTab('energia')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'energia' ? 'var(--accent-gradient)' : 'none',
            color: activeTab === 'energia' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Zap size={16} />
          Energía (UPS)
        </button>
        <button 
          onClick={() => setActiveTab('cctv')}
          style={{
            padding: '8px 16px',
            background: activeTab === 'cctv' ? 'var(--accent-gradient)' : 'none',
            color: activeTab === 'cctv' ? 'white' : 'var(--text-secondary)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Camera size={16} />
          CCTV / Cámaras
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar por marca, modelo, serial, IP o ubicación..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select 
          className={styles.filterSelect}
          value={filterCategoria}
          onChange={(e) => setFilterCategoria(e.target.value)}
        >
          <option value="">Categorías (Todas)</option>
          {activeTab === 'red' && (
            <>
              <option value="Switch">Switch</option>
              <option value="Router">Router</option>
              <option value="Access Point">Access Point</option>
              <option value="Firewall">Firewall</option>
            </>
          )}
          {activeTab === 'energia' && (
            <>
              <option value="UPS">UPS</option>
              <option value="Estabilizador">Estabilizador</option>
            </>
          )}
          {activeTab === 'cctv' && (
            <>
              <option value="DVR">DVR</option>
              <option value="NVR">NVR</option>
              <option value="Cámara IP">Cámara IP</option>
            </>
          )}
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
      </div>

      {/* Main Table view */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Cargando infraestructura...</span>
        </div>
      ) : (
        filteredDispositivos.length === 0 ? (
          <div className={styles.emptyState}>
            <Network size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>No se encontraron dispositivos</h3>
            <p className={styles.emptyText}>Registrá un nuevo equipo de infraestructura para este sector.</p>
          </div>
        ) : (
          <div className={styles.table}>
            {/* Table Headers depending on active tab */}
            {activeTab === 'red' && (
              <div className={styles.tableHeader} style={{ gridTemplateColumns: '1.2fr 2fr 1.5fr 1fr 1.2fr 1.5fr 1fr 120px' }}>
                <div>Categoría</div>
                <div>Marca / Modelo</div>
                <div>IP</div>
                <div>Puertos</div>
                <div>POE</div>
                <div>Velocidad</div>
                <div>Estado</div>
                <div style={{ textAlign: 'right' }}>Acciones</div>
              </div>
            )}
            {activeTab === 'energia' && (
              <div className={styles.tableHeader} style={{ gridTemplateColumns: '1.2fr 2fr 1.2fr 1.2fr 1.2fr 2fr 1fr 120px' }}>
                <div>Categoría</div>
                <div>Marca / Modelo</div>
                <div>Potencia VA</div>
                <div>Watts</div>
                <div>Tomas</div>
                <div>Ubicación</div>
                <div>Estado</div>
                <div style={{ textAlign: 'right' }}>Acciones</div>
              </div>
            )}
            {activeTab === 'cctv' && (
              <div className={styles.tableHeader} style={{ gridTemplateColumns: '1.2fr 2fr 1.2fr 1.2fr 1.2fr 2fr 1fr 120px' }}>
                <div>Categoría</div>
                <div>Marca / Modelo</div>
                <div>Canales</div>
                <div>Resolución</div>
                <div>HDD</div>
                <div>Ubicación</div>
                <div>Estado</div>
                <div style={{ textAlign: 'right' }}>Acciones</div>
              </div>
            )}

            {/* Table rows */}
            {filteredDispositivos.map((item) => {
              const detailRed = Array.isArray(item.detalle_red) ? item.detalle_red[0] : item.detalle_red;
              const detailEnergia = Array.isArray(item.detalle_energia) ? item.detalle_energia[0] : item.detalle_energia;
              const detailCctv = Array.isArray(item.detalle_cctv) ? item.detalle_cctv[0] : item.detalle_cctv;

              return (
                <div key={item.id} className={styles.tableRowItem} style={{
                  gridTemplateColumns: 
                    activeTab === 'red' ? '1.2fr 2fr 1.5fr 1fr 1.2fr 1.5fr 1fr 120px' :
                    activeTab === 'energia' ? '1.2fr 2fr 1.2fr 1.2fr 1.2fr 2fr 1fr 120px' :
                    '1.2fr 2fr 1.2fr 1.2fr 1.2fr 2fr 1fr 120px'
                }}>
                  {/* Common Column 1 */}
                  <div>
                    <span className={`${styles.badge} ${styles.badgeInfo}`}>
                      {item.categoria}
                    </span>
                  </div>

                  {/* Common Column 2 */}
                  <div className={styles.rowText} style={{ fontWeight: 600 }}>
                    {item.marcas?.nombre} {item.modelos?.nombre}
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 'normal' }}>
                      S/N: {item.serial || 'N/A'} {item.codigo_inventario && `| Inv: ${item.codigo_inventario}`}
                    </span>
                  </div>

                  {/* Tab specific columns */}
                  {activeTab === 'red' && (
                    <>
                      <div className={styles.rowText}>{item.ip || 'Sin IP'}</div>
                      <div>{detailRed?.cantidad_puertos || 'N/A'}</div>
                      <div>{detailRed?.puertos_poe || '0'}</div>
                      <div>{detailRed?.velocidad_gbps ? `${detailRed.velocidad_gbps} Gbps` : 'N/A'}</div>
                    </>
                  )}

                  {activeTab === 'energia' && (
                    <>
                      <div>{detailEnergia?.potencia_va ? `${detailEnergia.potencia_va} VA` : 'N/A'}</div>
                      <div>{detailEnergia?.potencia_watts ? `${detailEnergia.potencia_watts} W` : 'N/A'}</div>
                      <div>{detailEnergia?.cantidad_tomas || 'N/A'}</div>
                      <div className={styles.rowText}>{item.ubicaciones?.nombre || 'Sin ubicación'}</div>
                    </>
                  )}

                  {activeTab === 'cctv' && (
                    <>
                      <div>{detailCctv?.canales || 'N/A'} ch</div>
                      <div>{detailCctv?.resolucion || 'N/A'}</div>
                      <div>{detailCctv?.almacenamiento_tb ? `${detailCctv.almacenamiento_tb} TB` : 'N/A'}</div>
                      <div className={styles.rowText}>{item.ubicaciones?.nombre || 'Sin ubicación'}</div>
                    </>
                  )}

                  {/* Common column: Estado */}
                  <div>
                    <span className={`${styles.badge} ${
                      item.estado === 'Activo' ? styles.badgeActive : 
                      item.estado === 'En reparación' ? styles.badgeWarning : 
                      item.estado === 'En stock' ? styles.badgeInfo : styles.badgeInactive
                    }`}>
                      {item.estado}
                    </span>
                  </div>

                  {/* Common Column: Actions */}
                  <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                    <button className={styles.actionBtn} onClick={() => handleOpenEdit(item)}>
                      <Edit size={14} />
                    </button>
                    <button className={styles.deleteBtn} onClick={() => handleOpenDelete(item.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
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
                Dispositivo de Infraestructura
              </h3>
              <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                {/* CATEGORIA */}
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Categoría *</label>
                    <select 
                      className={styles.fieldInput}
                      value={baseForm.categoria}
                      onChange={(e) => setBaseForm({...baseForm, categoria: e.target.value})}
                      required
                    >
                      {activeTab === 'red' && (
                        <>
                          <option value="Switch">Switch</option>
                          <option value="Router">Router</option>
                          <option value="Access Point">Access Point</option>
                          <option value="Firewall">Firewall</option>
                        </>
                      )}
                      {activeTab === 'energia' && (
                        <>
                          <option value="UPS">UPS</option>
                          <option value="Estabilizador">Estabilizador</option>
                        </>
                      )}
                      {activeTab === 'cctv' && (
                        <>
                          <option value="DVR">DVR</option>
                          <option value="NVR">NVR</option>
                          <option value="Cámara IP">Cámara IP</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Estado</label>
                    <select 
                      className={styles.fieldInput}
                      value={baseForm.estado}
                      onChange={(e) => setBaseForm({...baseForm, estado: e.target.value})}
                    >
                      <option value="Activo">Activo</option>
                      <option value="En reparación">En reparación</option>
                      <option value="En stock">En stock</option>
                      <option value="Dado de baja">Dado de baja</option>
                    </select>
                  </div>
                </div>

                {/* MARCA Y MODELO */}
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Marca *</label>
                    <select 
                      className={styles.fieldInput}
                      value={baseForm.id_marca}
                      onChange={(e) => setBaseForm({...baseForm, id_marca: e.target.value, id_modelo: ''})}
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
                      value={baseForm.id_modelo}
                      onChange={(e) => setBaseForm({...baseForm, id_modelo: e.target.value})}
                      disabled={!baseForm.id_marca}
                      required
                    >
                      <option value="">Seleccione Modelo</option>
                      {filteredModelosForm.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                  </div>
                </div>

                {/* SERIAL E INVENTARIO */}
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Número de Serie</label>
                    <input 
                      type="text" 
                      className={styles.fieldInput}
                      value={baseForm.serial}
                      onChange={(e) => setBaseForm({...baseForm, serial: e.target.value})}
                      placeholder="Serial del fabricante"
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Código de Inventario</label>
                    <input 
                      type="text" 
                      className={styles.fieldInput}
                      value={baseForm.codigo_inventario}
                      onChange={(e) => setBaseForm({...baseForm, codigo_inventario: e.target.value})}
                      placeholder="Identificador interno"
                    />
                  </div>
                </div>

                {/* IP Y UBICACION */}
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Dirección IP</label>
                    <input 
                      type="text" 
                      className={styles.fieldInput}
                      value={baseForm.ip}
                      onChange={(e) => setBaseForm({...baseForm, ip: e.target.value})}
                      placeholder="192.168.x.x"
                    />
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Ubicación Física</label>
                    <select 
                      className={styles.fieldInput}
                      value={baseForm.id_ubicacion}
                      onChange={(e) => setBaseForm({...baseForm, id_ubicacion: e.target.value})}
                    >
                      <option value="">Seleccione Ubicación</option>
                      {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                    </select>
                  </div>
                </div>

                {/* COMPRAS INFO */}
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Proveedor</label>
                    <select 
                      className={styles.fieldInput}
                      value={baseForm.id_proveedor}
                      onChange={(e) => setBaseForm({...baseForm, id_proveedor: e.target.value})}
                    >
                      <option value="">Sin Proveedor</option>
                      {proveedores.map(p => <option key={p.id} value={p.id}>{p.razon_social}</option>)}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Fecha de Compra</label>
                    <input 
                      type="date" 
                      className={styles.fieldInput}
                      value={baseForm.fecha_compra}
                      onChange={(e) => setBaseForm({...baseForm, fecha_compra: e.target.value})}
                    />
                  </div>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Garantía Hasta</label>
                    <input 
                      type="date" 
                      className={styles.fieldInput}
                      value={baseForm.garantia_hasta}
                      onChange={(e) => setBaseForm({...baseForm, garantia_hasta: e.target.value})}
                    />
                  </div>
                </div>

                {/* SPECIFIC DETAIL FIELDS */}
                <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-secondary)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px' }}>
                    Detalles Específicos de {activeTab === 'red' ? 'Red' : activeTab === 'energia' ? 'Energía' : 'CCTV'}
                  </h4>

                  {/* Red details form */}
                  {activeTab === 'red' && (
                    <>
                      <div className={styles.fieldRow}>
                        <div className={styles.field}>
                          <label className={styles.fieldLabel}>Cantidad de Puertos</label>
                          <input 
                            type="number" 
                            className={styles.fieldInput}
                            value={redForm.cantidad_puertos}
                            onChange={(e) => setRedForm({...redForm, cantidad_puertos: e.target.value})}
                            placeholder="Ej. 24, 48"
                          />
                        </div>

                        <div className={styles.field}>
                          <label className={styles.fieldLabel}>Puertos POE</label>
                          <input 
                            type="number" 
                            className={styles.fieldInput}
                            value={redForm.puertos_poe}
                            onChange={(e) => setRedForm({...redForm, puertos_poe: e.target.value})}
                            placeholder="Ej. 8, 24"
                          />
                        </div>
                      </div>

                      <div className={styles.fieldRow}>
                        <div className={styles.field}>
                          <label className={styles.fieldLabel}>Velocidad (Gbps)</label>
                          <input 
                            type="number" 
                            step="0.1"
                            className={styles.fieldInput}
                            value={redForm.velocidad_gbps}
                            onChange={(e) => setRedForm({...redForm, velocidad_gbps: e.target.value})}
                            placeholder="Ej. 1, 10"
                          />
                        </div>

                        <div className={styles.field}>
                          <label className={styles.fieldLabel}>Versión de Firmware</label>
                          <input 
                            type="text" 
                            className={styles.fieldInput}
                            value={redForm.firmware}
                            onChange={(e) => setRedForm({...redForm, firmware: e.target.value})}
                            placeholder="Firmware OS"
                          />
                        </div>
                      </div>

                      <div className={styles.field} style={{ marginTop: '8px' }}>
                        <label className={styles.checkboxRow} style={{ cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={redForm.gestionable}
                            onChange={(e) => setRedForm({...redForm, gestionable: e.target.checked})}
                          />
                          <span className={styles.fieldLabel}>¿Es gestionable / administrable (L2/L3)?</span>
                        </label>
                      </div>
                    </>
                  )}

                  {/* Energy details form */}
                  {activeTab === 'energia' && (
                    <>
                      <div className={styles.fieldRow}>
                        <div className={styles.field}>
                          <label className={styles.fieldLabel}>Potencia (VA)</label>
                          <input 
                            type="number" 
                            className={styles.fieldInput}
                            value={energiaForm.potencia_va}
                            onChange={(e) => setEnergiaForm({...energiaForm, potencia_va: e.target.value})}
                            placeholder="Ej. 1500, 3000"
                          />
                        </div>

                        <div className={styles.field}>
                          <label className={styles.fieldLabel}>Potencia (Watts)</label>
                          <input 
                            type="number" 
                            className={styles.fieldInput}
                            value={energiaForm.potencia_watts}
                            onChange={(e) => setEnergiaForm({...energiaForm, potencia_watts: e.target.value})}
                            placeholder="Ej. 900, 2700"
                          />
                        </div>
                      </div>

                      <div className={styles.fieldRow}>
                        <div className={styles.field}>
                          <label className={styles.fieldLabel}>Tiempo de Respaldo (min)</label>
                          <input 
                            type="number" 
                            className={styles.fieldInput}
                            value={energiaForm.tiempo_respaldo_min}
                            onChange={(e) => setEnergiaForm({...energiaForm, tiempo_respaldo_min: e.target.value})}
                            placeholder="Minutos de autonomía"
                          />
                        </div>

                        <div className={styles.field}>
                          <label className={styles.fieldLabel}>Cantidad de Tomas</label>
                          <input 
                            type="number" 
                            className={styles.fieldInput}
                            value={energiaForm.cantidad_tomas}
                            onChange={(e) => setEnergiaForm({...energiaForm, cantidad_tomas: e.target.value})}
                            placeholder="Ej. 4, 6, 8"
                          />
                        </div>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Última Revisión / Cambio de Baterías</label>
                        <input 
                          type="date" 
                          className={styles.fieldInput}
                          value={energiaForm.ultima_revision}
                          onChange={(e) => setEnergiaForm({...energiaForm, ultima_revision: e.target.value})}
                        />
                      </div>
                    </>
                  )}

                  {/* CCTV details form */}
                  {activeTab === 'cctv' && (
                    <>
                      <div className={styles.fieldRow}>
                        <div className={styles.field}>
                          <label className={styles.fieldLabel}>Canales / Canales DVR-NVR</label>
                          <input 
                            type="number" 
                            className={styles.fieldInput}
                            value={cctvForm.canales}
                            onChange={(e) => setCctvForm({...cctvForm, canales: e.target.value})}
                            placeholder="Ej. 4, 8, 16, 32"
                          />
                        </div>

                        <div className={styles.field}>
                          <label className={styles.fieldLabel}>Resolución Máxima</label>
                          <input 
                            type="text" 
                            className={styles.fieldInput}
                            value={cctvForm.resolucion}
                            onChange={(e) => setCctvForm({...cctvForm, resolucion: e.target.value})}
                            placeholder="Ej. 1080p, 4K, 4MP"
                          />
                        </div>
                      </div>

                      <div className={styles.fieldRow}>
                        <div className={styles.field}>
                          <label className={styles.fieldLabel}>Capacidad de Almacenamiento (TB)</label>
                          <input 
                            type="number" 
                            className={styles.fieldInput}
                            value={cctvForm.almacenamiento_tb}
                            onChange={(e) => setCctvForm({...cctvForm, almacenamiento_tb: e.target.value})}
                            placeholder="Capacidad en Terabytes"
                          />
                        </div>

                        <div className={styles.field}>
                          <label className={styles.fieldLabel}>Protocolo de Conexión</label>
                          <input 
                            type="text" 
                            className={styles.fieldInput}
                            value={cctvForm.protocolo}
                            onChange={(e) => setCctvForm({...cctvForm, protocolo: e.target.value})}
                            placeholder="Ej. ONVIF, Hikvision"
                          />
                        </div>
                      </div>

                      <div className={styles.field} style={{ marginTop: '8px' }}>
                        <label className={styles.checkboxRow} style={{ cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            checked={cctvForm.poe_integrado}
                            onChange={(e) => setCctvForm({...cctvForm, poe_integrado: e.target.checked})}
                          />
                          <span className={styles.fieldLabel}>¿Posee switch POE integrado?</span>
                        </label>
                      </div>
                    </>
                  )}
                </div>

                {/* NOTAS */}
                <div className={styles.field} style={{ marginTop: '8px' }}>
                  <label className={styles.fieldLabel}>Notas adicionales</label>
                  <textarea 
                    className={styles.fieldTextarea}
                    value={baseForm.notas}
                    onChange={(e) => setBaseForm({...baseForm, notas: e.target.value})}
                    placeholder="Observaciones de configuración, puertos ocupados, etc."
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

      {/* CONFIRM DELETE DIALOG */}
      {isConfirmOpen && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmModal}>
            <h3 className={styles.confirmTitle}>¿Confirmar eliminación?</h3>
            <p className={styles.confirmMessage}>
              Esta acción no se puede deshacer. ¿Estás seguro de que deseas eliminar este dispositivo?
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
