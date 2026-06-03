'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { SolicitudCompra, OrdenCompra, RecepcionCompra, ItemStock, Proveedor, OrdenCompraDetalle } from '@/types/database';
import { ShoppingCart, Plus, Search, Pencil, Trash2, X, Check, Box } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

const ESTADO_OPTIONS = ['Pendiente', 'Solicitado', 'Aprobado', 'Comprado', 'Recibido', 'Cancelado'];

interface SolicitudForm {
  id_item_stock: number | '';
  descripcion_manual: string;
  cantidad_sugerida: number;
  motivo: string;
  proveedor_sugerido: number | '';
  observaciones: string;
}

interface OrdenForm {
  numero: string;
  id_proveedor: number | '';
  fecha_estimada_recepcion: string;
  observaciones: string;
  items: Array<{
    id_item_stock: number | '';
    cantidad: number;
    precio_unitario: number | '';
  }>;
}

interface RecepcionForm {
  id_orden_compra: number | '';
  id_item_stock: number | '';
  cantidad_recibida: number | '';
  observaciones: string;
}

const emptySolicitud: SolicitudForm = {
  id_item_stock: '',
  descripcion_manual: '',
  cantidad_sugerida: 1,
  motivo: '',
  proveedor_sugerido: '',
  observaciones: '',
};

const emptyOrden: OrdenForm = {
  numero: '',
  id_proveedor: '',
  fecha_estimada_recepcion: '',
  observaciones: '',
  items: [{ id_item_stock: '', cantidad: 1, precio_unitario: '' }],
};

const emptyRecepcion: RecepcionForm = {
  id_orden_compra: '',
  id_item_stock: '',
  cantidad_recibida: '',
  observaciones: '',
};

export default function ComprasPage() {
  const supabase = getSupabaseClient();

  const [activeTab, setActiveTab] = useState<'Solicitudes' | 'Ordenes' | 'Recepciones'>('Solicitudes');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Lists
  const [solicitudes, setSolicitudes] = useState<SolicitudCompra[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [recepciones, setRecepciones] = useState<RecepcionCompra[]>([]);

  // Catalogs
  const [itemsStock, setItemsStock] = useState<ItemStock[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSolicitud, setEditingSolicitud] = useState<SolicitudCompra | null>(null);
  const [editingOrden, setEditingOrden] = useState<OrdenCompra | null>(null);

  // Forms
  const [solForm, setSolForm] = useState<SolicitudForm>(emptySolicitud);
  const [ordForm, setOrdForm] = useState<OrdenForm>(emptyOrden);
  const [recForm, setRecForm] = useState<RecepcionForm>(emptyRecepcion);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<OrdenCompraDetalle[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [solRes, ordRes, recRes, stockRes, provRes] = await Promise.all([
      supabase
        .from('solicitudes_compra')
        .select('*, item_stock:items_stock(*), proveedor:proveedores(*)')
        .order('created_at', { ascending: false }),
      supabase
        .from('ordenes_compra')
        .select('*, proveedor:proveedores(*)')
        .order('created_at', { ascending: false }),
      supabase
        .from('recepciones_compra')
        .select('*, item_stock:items_stock(*), orden_compra:ordenes_compra(*)')
        .order('created_at', { ascending: false }),
      supabase.from('items_stock').select('*').eq('activo', true).order('descripcion'),
      supabase.from('proveedores').select('*').eq('activo', true).order('nombre'),
    ]);

    if (solRes.data) setSolicitudes(solRes.data as SolicitudCompra[]);
    if (ordRes.data) setOrdenes(ordRes.data as OrdenCompra[]);
    if (recRes.data) setRecepciones(recRes.data as RecepcionCompra[]);
    if (stockRes.data) setItemsStock(stockRes.data as ItemStock[]);
    if (provRes.data) setProveedores(provRes.data as Proveedor[]);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load items from order details when selected in reception
  useEffect(() => {
    if (recForm.id_orden_compra) {
      supabase
        .from('ordenes_compra_detalle')
        .select('*, item_stock:items_stock(id, descripcion, codigo)')
        .eq('id_orden_compra', recForm.id_orden_compra)
        .then(({ data }: { data: any }) => {
          if (data) setSelectedOrderDetails(data as OrdenCompraDetalle[]);
        });
    } else {
      setSelectedOrderDetails([]);
    }
  }, [recForm.id_orden_compra, supabase]);

  const filteredSolicitudes = solicitudes.filter((s) => {
    const term = searchTerm.toLowerCase();
    const desc = s.descripcion_manual || s.item_stock?.descripcion || '';
    return desc.toLowerCase().includes(term) || (s.motivo || '').toLowerCase().includes(term);
  });

  const filteredOrdenes = ordenes.filter((o) => {
    const term = searchTerm.toLowerCase();
    return (o.numero || '').toLowerCase().includes(term) || (o.proveedor?.nombre || '').toLowerCase().includes(term);
  });

  const filteredRecepciones = recepciones.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      (r.item_stock?.descripcion || '').toLowerCase().includes(term) ||
      (r.orden_compra?.numero || '').toLowerCase().includes(term)
    );
  });

  function openModal(item?: any) {
    setErrors({});
    if (activeTab === 'Solicitudes') {
      if (item) {
        setEditingSolicitud(item);
        setSolForm({
          id_item_stock: item.id_item_stock || '',
          descripcion_manual: item.descripcion_manual || '',
          cantidad_sugerida: item.cantidad_sugerida || 1,
          motivo: item.motivo || '',
          proveedor_sugerido: item.proveedor_sugerido || '',
          observaciones: item.observaciones || '',
        });
      } else {
        setEditingSolicitud(null);
        setSolForm(emptySolicitud);
      }
    } else if (activeTab === 'Ordenes') {
      if (item) {
        setEditingOrden(item);
        setOrdForm({
          numero: item.numero || '',
          id_proveedor: item.id_proveedor || '',
          fecha_estimada_recepcion: item.fecha_estimada_recepcion ? item.fecha_estimada_recepcion.substring(0, 10) : '',
          observaciones: item.observaciones || '',
          items: [{ id_item_stock: '', cantidad: 1, precio_unitario: '' }],
        });
      } else {
        setEditingOrden(null);
        setOrdForm(emptyOrden);
      }
    } else {
      setRecForm(emptyRecepcion);
    }
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingSolicitud(null);
    setEditingOrden(null);
    setSolForm(emptySolicitud);
    setOrdForm(emptyOrden);
    setRecForm(emptyRecepcion);
  }

  function validate(): boolean {
    const newErrors: Partial<Record<string, string>> = {};
    if (activeTab === 'Solicitudes') {
      if (!solForm.id_item_stock && !solForm.descripcion_manual.trim()) {
        newErrors.id_item_stock = 'Debe seleccionar un insumo o ingresar descripción manual';
      }
      if (solForm.cantidad_sugerida <= 0) newErrors.cantidad_sugerida = 'La cantidad debe ser mayor a 0';
    } else if (activeTab === 'Ordenes') {
      if (!ordForm.numero.trim()) newErrors.numero = 'El número de orden es obligatorio';
      if (!ordForm.id_proveedor) newErrors.id_proveedor = 'El proveedor es obligatorio';
    } else {
      if (!recForm.id_orden_compra) newErrors.id_orden_compra = 'La orden es obligatoria';
      if (!recForm.id_item_stock) newErrors.id_item_stock = 'El insumo es obligatorio';
      if (!recForm.cantidad_recibida || Number(recForm.cantidad_recibida) <= 0) {
        newErrors.cantidad_recibida = 'La cantidad debe ser mayor a 0';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    if (activeTab === 'Solicitudes') {
      const payload = {
        id_item_stock: solForm.id_item_stock ? Number(solForm.id_item_stock) : null,
        descripcion_manual: solForm.descripcion_manual.trim() || null,
        cantidad_sugerida: Number(solForm.cantidad_sugerida),
        motivo: solForm.motivo.trim() || null,
        proveedor_sugerido: solForm.proveedor_sugerido ? Number(solForm.proveedor_sugerido) : null,
        estado: editingSolicitud ? editingSolicitud.estado : 'Pendiente',
        observaciones: solForm.observaciones.trim() || null,
        fecha_solicitud: editingSolicitud ? editingSolicitud.fecha_solicitud : new Date().toISOString(),
      };

      if (editingSolicitud) {
        const { error } = await supabase
          .from('solicitudes_compra')
          .update(payload)
          .eq('id', editingSolicitud.id);

        if (error) {
          toast.error('Error al actualizar la solicitud');
          console.error(error);
        } else {
          toast.success('Solicitud actualizada correctamente');
          closeModal();
          loadData();
        }
      } else {
        const { error } = await supabase
          .from('solicitudes_compra')
          .insert(payload);

        if (error) {
          toast.error('Error al crear la solicitud');
          console.error(error);
        } else {
          toast.success('Solicitud creada correctamente');
          closeModal();
          loadData();
        }
      }
    } else if (activeTab === 'Ordenes') {
      const payload = {
        numero: ordForm.numero.trim(),
        id_proveedor: Number(ordForm.id_proveedor),
        estado: editingOrden ? editingOrden.estado : 'Solicitado',
        fecha_orden: editingOrden ? editingOrden.fecha_orden : new Date().toISOString(),
        fecha_estimada_recepcion: ordForm.fecha_estimada_recepcion || null,
        observaciones: ordForm.observaciones.trim() || null,
      };

      if (editingOrden) {
        const { error } = await supabase
          .from('ordenes_compra')
          .update(payload)
          .eq('id', editingOrden.id);

        if (error) {
          toast.error('Error al actualizar la orden');
          console.error(error);
        } else {
          toast.success('Orden de compra actualizada correctamente');
          closeModal();
          loadData();
        }
      } else {
        // Insert new order
        const { data: newOrd, error: ordError } = await supabase
          .from('ordenes_compra')
          .insert(payload)
          .select()
          .single();

        if (ordError) {
          toast.error('Error al crear la orden de compra');
          console.error(ordError);
          setSaving(false);
          return;
        }

        // Insert items in order details
        const details = ordForm.items
          .filter(item => item.id_item_stock)
          .map((item) => ({
            id_orden_compra: newOrd.id,
            id_item_stock: Number(item.id_item_stock),
            cantidad: Number(item.cantidad),
            precio_unitario: item.precio_unitario ? Number(item.precio_unitario) : null,
          }));

        if (details.length > 0) {
          const { error: detError } = await supabase
            .from('ordenes_compra_detalle')
            .insert(details);

          if (detError) {
            toast.error('Orden creada pero no se agregaron los detalles');
            console.error(detError);
          } else {
            toast.success('Orden de compra registrada correctamente');
          }
        } else {
          toast.success('Orden de compra registrada correctamente');
        }

        closeModal();
        loadData();
      }
    } else {
      // Recepcion
      const { data, error } = await supabase.rpc('registrar_recepcion_compra', {
        p_id_orden_compra: Number(recForm.id_orden_compra),
        p_id_item_stock: Number(recForm.id_item_stock),
        p_cantidad_recibida: Number(recForm.cantidad_recibida),
        p_observaciones: recForm.observaciones.trim() || undefined,
      });

      if (error) {
        toast.error(`Error al registrar recepción: ${error.message}`);
        console.error(error);
      } else {
        toast.success('Recepción registrada e inventario actualizado');
        closeModal();
        loadData();
      }
    }
    setSaving(false);
  }

  function addOrderItem() {
    setOrdForm({
      ...ordForm,
      items: [...ordForm.items, { id_item_stock: '', cantidad: 1, precio_unitario: '' }],
    });
  }

  function removeOrderItem(index: number) {
    const list = [...ordForm.items];
    list.splice(index, 1);
    setOrdForm({ ...ordForm, items: list });
  }

  function getEstadoBadge(estado: string) {
    switch (estado) {
      case 'Recibido':
      case 'Aprobado':
        return styles.badgeActive;
      case 'Pendiente':
        return styles.badgeWarning;
      case 'Solicitado':
      case 'Comprado':
        return styles.badgeInfo;
      case 'Cancelado':
        return styles.badgeInactive;
      default:
        return styles.badgeNeutral;
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <ShoppingCart size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Compras y Solicitudes</h1>
            <p className={styles.pageSubtitle}>Pedidos de compra, registro de órdenes y recepción de mercadería</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={18} /> {activeTab === 'Solicitudes' ? 'Nueva Solicitud' : activeTab === 'Ordenes' ? 'Nueva Orden' : 'Registrar Recepción'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-2)' }}>
        {['Solicitudes', 'Ordenes', 'Recepciones'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab as any); setSearchTerm(''); }}
            style={{
              padding: '8px 16px',
              background: activeTab === tab ? 'var(--accent-bg)' : 'transparent',
              color: activeTab === tab ? 'var(--accent-text)' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : 'none',
              fontWeight: activeTab === tab ? '600' : '500',
              cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {tab === 'Solicitudes' ? 'Solicitudes de Compra' : tab === 'Ordenes' ? 'Órdenes de Compra' : 'Recepciones'}
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

      {/* Content Tables */}
      <div className={styles.table}>
        {activeTab === 'Solicitudes' && (
          <>
            <div className={styles.tableHeader} style={{ gridTemplateColumns: '60px 2fr 80px 1.5fr 110px 1.2fr 100px' }}>
              <span>ID</span>
              <span>Item / Descripción</span>
              <span>Cant.</span>
              <span>Motivo</span>
              <span>Estado</span>
              <span>Proveedor Sug.</span>
              <span>Fecha</span>
            </div>
            {loading ? (
              <div className={styles.loadingState}><div className={styles.spinner} /><span>Cargando...</span></div>
            ) : filteredSolicitudes.length === 0 ? (
              <div className={styles.emptyState}><Box size={48} className={styles.emptyIcon} /><p>No hay solicitudes registradas</p></div>
            ) : (
              filteredSolicitudes.map((item) => (
                <div key={item.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '60px 2fr 80px 1.5fr 110px 1.2fr 100px' }} onClick={() => openModal(item)}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>#{item.id}</span>
                  <span className={styles.rowText} style={{ fontWeight: 600 }}>{item.item_stock?.descripcion || item.descripcion_manual}</span>
                  <span>{item.cantidad_sugerida}</span>
                  <span className={styles.rowText}>{item.motivo || '—'}</span>
                  <span><span className={`${styles.badge} ${getEstadoBadge(item.estado)}`}>{item.estado}</span></span>
                  <span className={styles.rowText}>{item.proveedor?.nombre || '—'}</span>
                  <span>{new Date(item.fecha_solicitud).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'Ordenes' && (
          <>
            <div className={styles.tableHeader} style={{ gridTemplateColumns: '80px 1.5fr 2fr 120px 120px 120px' }}>
              <span>ID</span>
              <span>Número Orden</span>
              <span>Proveedor</span>
              <span>Estado</span>
              <span>Fecha Orden</span>
              <span>Est. Recepción</span>
            </div>
            {loading ? (
              <div className={styles.loadingState}><div className={styles.spinner} /><span>Cargando...</span></div>
            ) : filteredOrdenes.length === 0 ? (
              <div className={styles.emptyState}><Box size={48} className={styles.emptyIcon} /><p>No hay órdenes de compra</p></div>
            ) : (
              filteredOrdenes.map((item) => (
                <div key={item.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '80px 1.5fr 2fr 120px 120px 120px' }} onClick={() => openModal(item)}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>#{item.id}</span>
                  <span className={styles.rowText} style={{ fontWeight: 600 }}>{item.numero}</span>
                  <span className={styles.rowText}>{item.proveedor?.nombre || '—'}</span>
                  <span><span className={`${styles.badge} ${getEstadoBadge(item.estado)}`}>{item.estado}</span></span>
                  <span>{new Date(item.fecha_orden).toLocaleDateString()}</span>
                  <span>{item.fecha_estimada_recepcion ? new Date(item.fecha_estimada_recepcion).toLocaleDateString() : '—'}</span>
                </div>
              ))
            )}
          </>
        )}

        {activeTab === 'Recepciones' && (
          <>
            <div className={styles.tableHeader} style={{ gridTemplateColumns: '80px 1.5fr 2.5fr 100px 120px' }}>
              <span>ID</span>
              <span>Orden Nro.</span>
              <span>Item Recibido</span>
              <span>Cantidad</span>
              <span>Fecha Recibido</span>
            </div>
            {loading ? (
              <div className={styles.loadingState}><div className={styles.spinner} /><span>Cargando...</span></div>
            ) : filteredRecepciones.length === 0 ? (
              <div className={styles.emptyState}><Box size={48} className={styles.emptyIcon} /><p>No hay recepciones registradas</p></div>
            ) : (
              filteredRecepciones.map((item) => (
                <div key={item.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '80px 1.5fr 2.5fr 100px 120px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>#{item.id}</span>
                  <span className={styles.rowText} style={{ fontWeight: 600 }}>{item.orden_compra?.numero || '—'}</span>
                  <span className={styles.rowText}>{item.item_stock?.descripcion}</span>
                  <span style={{ fontWeight: 600 }}>{item.cantidad_recibida}</span>
                  <span>{new Date(item.fecha_recepcion).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Modals based on tab */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalWide} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {activeTab === 'Solicitudes'
                  ? (editingSolicitud ? 'Editar Solicitud' : 'Nueva Solicitud de Compra')
                  : activeTab === 'Ordenes'
                  ? (editingOrden ? 'Editar Orden' : 'Registrar Orden de Compra')
                  : 'Registrar Recepción de Mercadería'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {activeTab === 'Solicitudes' ? (
                <>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Item del Catálogo</label>
                      <select
                        className={styles.fieldInput}
                        value={solForm.id_item_stock}
                        onChange={(e) => setSolForm({ ...solForm, id_item_stock: e.target.value ? Number(e.target.value) : '' })}
                      >
                        <option value="">Ingresar descripción manual...</option>
                        {itemsStock.map((i) => (
                          <option key={i.id} value={i.id}>{i.descripcion} (Stock: {i.stock_actual})</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Cantidad a Solicitar *</label>
                      <input
                        type="number"
                        className={styles.fieldInput}
                        value={solForm.cantidad_sugerida}
                        onChange={(e) => setSolForm({ ...solForm, cantidad_sugerida: e.target.value ? Number(e.target.value) : 1 })}
                        min="1"
                      />
                    </div>
                  </div>

                  {!solForm.id_item_stock && (
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Descripción Manual *</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={solForm.descripcion_manual}
                        onChange={(e) => setSolForm({ ...solForm, descripcion_manual: e.target.value })}
                        placeholder="Describa el producto a comprar..."
                      />
                    </div>
                  )}

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Proveedor Sugerido</label>
                      <select
                        className={styles.fieldInput}
                        value={solForm.proveedor_sugerido}
                        onChange={(e) => setSolForm({ ...solForm, proveedor_sugerido: e.target.value ? Number(e.target.value) : '' })}
                      >
                        <option value="">Ninguno</option>
                        {proveedores.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Motivo de la Compra</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={solForm.motivo}
                        onChange={(e) => setSolForm({ ...solForm, motivo: e.target.value })}
                        placeholder="Ej: Stock bajo, ampliación sector..."
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Observaciones</label>
                    <textarea
                      className={styles.fieldTextarea}
                      value={solForm.observaciones}
                      onChange={(e) => setSolForm({ ...solForm, observaciones: e.target.value })}
                      placeholder="Detalles sobre enlaces, precios de referencia..."
                    />
                  </div>
                </>
              ) : activeTab === 'Ordenes' ? (
                <>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Número de Orden *</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={ordForm.numero}
                        onChange={(e) => setOrdForm({ ...ordForm, numero: e.target.value })}
                        placeholder="Ej: OC-2026-001"
                      />
                      {errors.numero && <span className={styles.fieldError}>{errors.numero}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Proveedor *</label>
                      <select
                        className={styles.fieldInput}
                        value={ordForm.id_proveedor}
                        onChange={(e) => setOrdForm({ ...ordForm, id_proveedor: e.target.value ? Number(e.target.value) : '' })}
                      >
                        <option value="">Seleccione proveedor...</option>
                        {proveedores.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                      {errors.id_proveedor && <span className={styles.fieldError}>{errors.id_proveedor}</span>}
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Fecha Est. Recepción</label>
                      <input
                        type="date"
                        className={styles.fieldInput}
                        value={ordForm.fecha_estimada_recepcion}
                        onChange={(e) => setOrdForm({ ...ordForm, fecha_estimada_recepcion: e.target.value })}
                      />
                    </div>
                  </div>

                  {!editingOrden && (
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 600 }}>Items de la Orden</span>
                        <button type="button" className={styles.actionBtn} onClick={addOrderItem}>+ Agregar Item</button>
                      </div>
                      {ordForm.items.map((item, index) => (
                        <div key={index} className={styles.fieldRow} style={{ marginBottom: '10px', alignItems: 'end' }}>
                          <div className={styles.field} style={{ flex: 2 }}>
                            <label className={styles.fieldLabel}>Item del Catálogo</label>
                            <select
                              className={styles.fieldInput}
                              value={item.id_item_stock}
                              onChange={(e) => {
                                const list = [...ordForm.items];
                                list[index].id_item_stock = e.target.value ? Number(e.target.value) : '';
                                setOrdForm({ ...ordForm, items: list });
                              }}
                            >
                              <option value="">Seleccione item...</option>
                              {itemsStock.map((i) => (
                                <option key={i.id} value={i.id}>{i.descripcion}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.field} style={{ flex: 0.5 }}>
                            <label className={styles.fieldLabel}>Cantidad</label>
                            <input
                              type="number"
                              className={styles.fieldInput}
                              value={item.cantidad}
                              onChange={(e) => {
                                const list = [...ordForm.items];
                                list[index].cantidad = Number(e.target.value);
                                setOrdForm({ ...ordForm, items: list });
                              }}
                              min="1"
                            />
                          </div>
                          <div className={styles.field} style={{ flex: 0.8 }}>
                            <label className={styles.fieldLabel}>Precio Unit. (USD)</label>
                            <input
                              type="number"
                              className={styles.fieldInput}
                              value={item.precio_unitario}
                              onChange={(e) => {
                                const list = [...ordForm.items];
                                list[index].precio_unitario = e.target.value ? Number(e.target.value) : '';
                                setOrdForm({ ...ordForm, items: list });
                              }}
                              placeholder="USD"
                            />
                          </div>
                          {ordForm.items.length > 1 && (
                            <button type="button" className={styles.deleteBtn} style={{ padding: '10px' }} onClick={() => removeOrderItem(index)}>
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.field} style={{ marginTop: '10px' }}>
                    <label className={styles.fieldLabel}>Observaciones</label>
                    <textarea
                      className={styles.fieldTextarea}
                      value={ordForm.observaciones}
                      onChange={(e) => setOrdForm({ ...ordForm, observaciones: e.target.value })}
                      placeholder="Observaciones generales de la orden"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Orden de Compra *</label>
                    <select
                      className={styles.fieldInput}
                      value={recForm.id_orden_compra}
                      onChange={(e) => setRecForm({ ...recForm, id_orden_compra: e.target.value ? Number(e.target.value) : '', id_item_stock: '' })}
                    >
                      <option value="">Seleccione orden...</option>
                      {ordenes.filter(o => o.estado !== 'Recibido' && o.estado !== 'Cancelado').map((o) => (
                        <option key={o.id} value={o.id}>{o.numero} — {o.proveedor?.nombre}</option>
                      ))}
                    </select>
                    {errors.id_orden_compra && <span className={styles.fieldError}>{errors.id_orden_compra}</span>}
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Insumo a Recibir *</label>
                      <select
                        className={styles.fieldInput}
                        value={recForm.id_item_stock}
                        onChange={(e) => setRecForm({ ...recForm, id_item_stock: e.target.value ? Number(e.target.value) : '' })}
                        disabled={!recForm.id_orden_compra}
                      >
                        <option value="">Seleccione item de la orden...</option>
                        {selectedOrderDetails.map((d) => (
                          <option key={d.id_item_stock} value={d.id_item_stock || ''}>
                            {d.item_stock?.descripcion} (Solicitado: {d.cantidad})
                          </option>
                        ))}
                      </select>
                      {errors.id_item_stock && <span className={styles.fieldError}>{errors.id_item_stock}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Cantidad Recibida *</label>
                      <input
                        type="number"
                        className={styles.fieldInput}
                        value={recForm.cantidad_recibida}
                        onChange={(e) => setRecForm({ ...recForm, cantidad_recibida: e.target.value ? Number(e.target.value) : '' })}
                        placeholder="Cantidad"
                        min="1"
                      />
                      {errors.cantidad_recibida && <span className={styles.fieldError}>{errors.cantidad_recibida}</span>}
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Observaciones</label>
                    <textarea
                      className={styles.fieldTextarea}
                      value={recForm.observaciones}
                      onChange={(e) => setRecForm({ ...recForm, observaciones: e.target.value })}
                      placeholder="Detalles sobre recepción de mercadería (ej: Remito Nro, estado del paquete)..."
                    />
                  </div>
                </>
              )}
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
    </div>
  );
}
