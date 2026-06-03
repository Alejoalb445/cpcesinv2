'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { PedidoToner, PedidoStockGeneral, ItemStock, Persona, Sector, Puesto } from '@/types/database';
import { ClipboardList, Plus, Search, Pencil, Trash2, X, Check, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

const ESTADO_OPTIONS = ['Pendiente', 'En revisión', 'Sin stock', 'Entregado', 'Cancelado', 'Rechazado'];

interface PedidoTonerForm {
  id_item_stock: number | '';
  id_impresora: number | '';
  id_persona_solicitante: number | '';
  id_sector: number | '';
  id_puesto: number | '';
  cantidad: number;
  observaciones: string;
}

interface PedidoGeneralForm {
  id_item_stock: number | '';
  id_persona_solicitante: number | '';
  id_sector: number | '';
  id_puesto: number | '';
  cantidad: number;
  motivo: string;
  observaciones: string;
}

const emptyTonerForm: PedidoTonerForm = {
  id_item_stock: '',
  id_impresora: '',
  id_persona_solicitante: '',
  id_sector: '',
  id_puesto: '',
  cantidad: 1,
  observaciones: '',
};

const emptyGeneralForm: PedidoGeneralForm = {
  id_item_stock: '',
  id_persona_solicitante: '',
  id_sector: '',
  id_puesto: '',
  cantidad: 1,
  motivo: '',
  observaciones: '',
};

export default function PedidosPage() {
  const supabase = getSupabaseClient();

  const [activeTab, setActiveTab] = useState<'Toner' | 'General'>('Toner');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Data items
  const [pedidosToner, setPedidosToner] = useState<PedidoToner[]>([]);
  const [pedidosGeneral, setPedidosGeneral] = useState<PedidoStockGeneral[]>([]);

  // Catalogs for forms
  const [itemsStock, setItemsStock] = useState<ItemStock[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [impresoras, setImpresoras] = useState<any[]>([]);

  // Modal forms
  const [modalOpen, setModalOpen] = useState(false);
  const [editingToner, setEditingToner] = useState<PedidoToner | null>(null);
  const [editingGeneral, setEditingGeneral] = useState<PedidoStockGeneral | null>(null);
  const [tonerForm, setTonerForm] = useState<PedidoTonerForm>(emptyTonerForm);
  const [generalForm, setGeneralForm] = useState<PedidoGeneralForm>(emptyGeneralForm);

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [tonerRes, genRes, stockRes, persRes, secRes, puestoRes, impRes] = await Promise.all([
      supabase
        .from('pedidos_toner')
        .select('*, item_stock:items_stock(*), persona_solicitante:personas(*), sector:sectores(*), puesto:puestos(*)')
        .order('fecha_pedido', { ascending: false }),
      supabase
        .from('pedidos_stock_general')
        .select('*, item_stock:items_stock(*), persona_solicitante:personas(*), sector:sectores(*), puesto:puestos(*)')
        .order('fecha_pedido', { ascending: false }),
      supabase.from('items_stock').select('*').eq('activo', true).order('descripcion'),
      supabase.from('personas').select('*').eq('activo', true).order('nombre'),
      supabase.from('sectores').select('*').eq('activo', true).order('nombre'),
      supabase.from('puestos').select('*').order('codigo_puesto'),
      supabase.from('activos_impresoras').select('*, activo:activos(*, marca:marcas(*), modelo:modelos(*))'),
    ]);

    if (tonerRes.data) setPedidosToner(tonerRes.data as PedidoToner[]);
    if (genRes.data) setPedidosGeneral(genRes.data as PedidoStockGeneral[]);
    if (stockRes.data) setItemsStock(stockRes.data as ItemStock[]);
    if (persRes.data) setPersonas(persRes.data as Persona[]);
    if (secRes.data) setSectores(secRes.data as Sector[]);
    if (puestoRes.data) setPuestos(puestoRes.data as Puesto[]);
    if (impRes.data) setImpresoras(impRes.data as any[]);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search filtering
  const filteredToner = pedidosToner.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (p.item_stock?.descripcion || '').toLowerCase().includes(term) ||
      (p.persona_solicitante?.nombre || '').toLowerCase().includes(term) ||
      (p.persona_solicitante?.apellido || '').toLowerCase().includes(term) ||
      (p.sector?.nombre || '').toLowerCase().includes(term);
    const matchesEstado = filterEstado ? p.estado === filterEstado : true;
    return matchesSearch && matchesEstado;
  });

  const filteredGeneral = pedidosGeneral.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (p.item_stock?.descripcion || '').toLowerCase().includes(term) ||
      (p.persona_solicitante?.nombre || '').toLowerCase().includes(term) ||
      (p.persona_solicitante?.apellido || '').toLowerCase().includes(term) ||
      (p.sector?.nombre || '').toLowerCase().includes(term);
    const matchesEstado = filterEstado ? p.estado === filterEstado : true;
    return matchesSearch && matchesEstado;
  });

  // Filter toners for selection (categories containing toner/tinta)
  const tonerItems = itemsStock.filter((i) => {
    const desc = i.descripcion.toLowerCase();
    const code = (i.codigo || '').toLowerCase();
    return desc.includes('toner') || desc.includes('tóner') || desc.includes('tinta') || desc.includes('cartucho');
  });

  function openModal(item?: any) {
    setErrors({});
    if (activeTab === 'Toner') {
      if (item) {
        setEditingToner(item);
        setTonerForm({
          id_item_stock: item.id_item_stock || '',
          id_impresora: item.id_impresora || '',
          id_persona_solicitante: item.id_persona_solicitante || '',
          id_sector: item.id_sector || '',
          id_puesto: item.id_puesto || '',
          cantidad: item.cantidad || 1,
          observaciones: item.observaciones || '',
        });
      } else {
        setEditingToner(null);
        setTonerForm(emptyTonerForm);
      }
    } else {
      if (item) {
        setEditingGeneral(item);
        setGeneralForm({
          id_item_stock: item.id_item_stock || '',
          id_persona_solicitante: item.id_persona_solicitante || '',
          id_sector: item.id_sector || '',
          id_puesto: item.id_puesto || '',
          cantidad: item.cantidad || 1,
          motivo: item.motivo || '',
          observaciones: item.observaciones || '',
        });
      } else {
        setEditingGeneral(null);
        setGeneralForm(emptyGeneralForm);
      }
    }
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingToner(null);
    setEditingGeneral(null);
    setTonerForm(emptyTonerForm);
    setGeneralForm(emptyGeneralForm);
  }

  function validate(): boolean {
    const newErrors: Partial<Record<string, string>> = {};
    if (activeTab === 'Toner') {
      if (!tonerForm.id_item_stock) newErrors.id_item_stock = 'Debe seleccionar un cartucho/tóner';
      if (!tonerForm.id_persona_solicitante) newErrors.id_persona_solicitante = 'El solicitante es obligatorio';
      if (!tonerForm.id_sector) newErrors.id_sector = 'El sector es obligatorio';
      if (tonerForm.cantidad <= 0) newErrors.cantidad = 'La cantidad debe ser mayor a 0';
    } else {
      if (!generalForm.id_item_stock) newErrors.id_item_stock = 'Debe seleccionar un insumo';
      if (!generalForm.id_persona_solicitante) newErrors.id_persona_solicitante = 'El solicitante es obligatorio';
      if (!generalForm.id_sector) newErrors.id_sector = 'El sector es obligatorio';
      if (generalForm.cantidad <= 0) newErrors.cantidad = 'La cantidad debe ser mayor a 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    if (activeTab === 'Toner') {
      const payload = {
        id_item_stock: Number(tonerForm.id_item_stock),
        id_impresora: tonerForm.id_impresora ? Number(tonerForm.id_impresora) : null,
        id_persona_solicitante: Number(tonerForm.id_persona_solicitante),
        id_sector: Number(tonerForm.id_sector),
        id_puesto: tonerForm.id_puesto ? Number(tonerForm.id_puesto) : null,
        cantidad: Number(tonerForm.cantidad),
        estado: editingToner ? editingToner.estado : 'Pendiente',
        origen: 'Sistema',
        observaciones: tonerForm.observaciones.trim() || null,
        fecha_pedido: editingToner ? editingToner.fecha_pedido : new Date().toISOString(),
      };

      if (editingToner) {
        const { error } = await supabase
          .from('pedidos_toner')
          .update(payload)
          .eq('id', editingToner.id);

        if (error) {
          toast.error('Error al actualizar el pedido de tóner');
          console.error(error);
        } else {
          toast.success('Pedido actualizado correctamente');
          closeModal();
          loadData();
        }
      } else {
        const { error } = await supabase
          .from('pedidos_toner')
          .insert(payload);

        if (error) {
          toast.error('Error al crear el pedido de tóner');
          console.error(error);
        } else {
          toast.success('Pedido registrado correctamente');
          closeModal();
          loadData();
        }
      }
    } else {
      const payload = {
        id_item_stock: Number(generalForm.id_item_stock),
        id_persona_solicitante: Number(generalForm.id_persona_solicitante),
        id_sector: Number(generalForm.id_sector),
        id_puesto: generalForm.id_puesto ? Number(generalForm.id_puesto) : null,
        cantidad: Number(generalForm.cantidad),
        motivo: generalForm.motivo.trim() || null,
        estado: editingGeneral ? editingGeneral.estado : 'Pendiente',
        origen: 'Sistema',
        observaciones: generalForm.observaciones.trim() || null,
        fecha_pedido: editingGeneral ? editingGeneral.fecha_pedido : new Date().toISOString(),
      };

      if (editingGeneral) {
        const { error } = await supabase
          .from('pedidos_stock_general')
          .update(payload)
          .eq('id', editingGeneral.id);

        if (error) {
          toast.error('Error al actualizar el pedido');
          console.error(error);
        } else {
          toast.success('Pedido actualizado correctamente');
          closeModal();
          loadData();
        }
      } else {
        const { error } = await supabase
          .from('pedidos_stock_general')
          .insert(payload);

        if (error) {
          toast.error('Error al crear el pedido');
          console.error(error);
        } else {
          toast.success('Pedido registrado correctamente');
          closeModal();
          loadData();
        }
      }
    }
    setSaving(false);
  }

  async function handleDeliver(id: number) {
    setSaving(true);
    const rpcName = activeTab === 'Toner' ? 'entregar_pedido_toner' : 'entregar_pedido_stock_general';
    const { data, error } = await supabase.rpc(rpcName, { p_id_pedido: id });

    if (error) {
      toast.error(`Error al entregar el pedido: ${error.message}`);
      console.error(error);
    } else {
      toast.success('Pedido marcado como Entregado y descontado del stock');
      loadData();
    }
    setSaving(false);
  }

  async function handleCancel(id: number) {
    setSaving(true);
    const table = activeTab === 'Toner' ? 'pedidos_toner' : 'pedidos_stock_general';
    const { error } = await supabase
      .from(table)
      .update({ estado: 'Cancelado' })
      .eq('id', id);

    if (error) {
      toast.error('Error al cancelar el pedido');
      console.error(error);
    } else {
      toast.success('Pedido cancelado correctamente');
      loadData();
    }
    setSaving(false);
  }

  function getEstadoBadge(estado: string) {
    switch (estado) {
      case 'Entregado':
        return styles.badgeActive;
      case 'Pendiente':
        return styles.badgeWarning;
      case 'En revisión':
        return styles.badgeInfo;
      case 'Sin stock':
      case 'Cancelado':
      case 'Rechazado':
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
            <ClipboardList size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Pedidos de Sistemas</h1>
            <p className={styles.pageSubtitle}>Administración y entrega de insumos a sectores e internos</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={18} /> Registrar Pedido
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-2)' }}>
        <button
          onClick={() => { setActiveTab('Toner'); setSearchTerm(''); }}
          style={{
            padding: '8px 16px',
            background: activeTab === 'Toner' ? 'var(--accent-bg)' : 'transparent',
            color: activeTab === 'Toner' ? 'var(--accent-text)' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'Toner' ? '2px solid var(--accent-primary)' : 'none',
            fontWeight: activeTab === 'Toner' ? '600' : '500',
            cursor: 'pointer',
            borderRadius: 'var(--radius-md)',
          }}
        >
          Tóner e Impresión
        </button>
        <button
          onClick={() => { setActiveTab('General'); setSearchTerm(''); }}
          style={{
            padding: '8px 16px',
            background: activeTab === 'General' ? 'var(--accent-bg)' : 'transparent',
            color: activeTab === 'General' ? 'var(--accent-text)' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'General' ? '2px solid var(--accent-primary)' : 'none',
            fontWeight: activeTab === 'General' ? '600' : '500',
            cursor: 'pointer',
            borderRadius: 'var(--radius-md)',
          }}
        >
          General (Periféricos / Cables / Hardware)
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por item, solicitante o sector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {ESTADO_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className={styles.table}>
        <div className={styles.tableHeader} style={{ gridTemplateColumns: '60px 2fr 1.5fr 1fr 70px 110px 100px 140px' }}>
          <span>ID</span>
          <span>Item / Insumo</span>
          <span>Solicitante</span>
          <span>Sector</span>
          <span>Cant.</span>
          <span>Estado</span>
          <span>Fecha</span>
          <span>Acciones</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Cargando pedidos...</span>
          </div>
        ) : (activeTab === 'Toner' ? filteredToner : filteredGeneral).length === 0 ? (
          <div className={styles.emptyState}>
            <ClipboardList size={48} className={styles.emptyIcon} />
            <p>No se encontraron pedidos pendientes</p>
          </div>
        ) : (
          (activeTab === 'Toner' ? filteredToner : filteredGeneral).map((item) => (
            <div
              key={item.id}
              className={styles.tableRowItem}
              style={{ gridTemplateColumns: '60px 2fr 1.5fr 1fr 70px 110px 100px 140px' }}
              onClick={() => openModal(item)}
            >
              <span style={{ fontFamily: 'var(--font-mono)' }}>#{item.id}</span>
              <span className={styles.rowText} style={{ fontWeight: 600 }}>{item.item_stock?.descripcion}</span>
              <span className={styles.rowText}>
                {item.persona_solicitante?.nombre} {item.persona_solicitante?.apellido || ''}
              </span>
              <span className={styles.rowText}>{item.sector?.nombre || '—'}</span>
              <span>{item.cantidad}</span>
              <span>
                <span className={`${styles.badge} ${getEstadoBadge(item.estado)}`}>
                  {item.estado}
                </span>
              </span>
              <span>{new Date(item.fecha_pedido).toLocaleDateString()}</span>
              <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                {item.estado === 'Pendiente' && (
                  <>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleDeliver(item.id)}
                      title="Entregar Pedido"
                      style={{ color: 'var(--success)', borderColor: 'var(--success-bg)' }}
                      disabled={saving}
                    >
                      <Check size={14} /> Entregar
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleCancel(item.id)}
                      title="Cancelar"
                      disabled={saving}
                    >
                      Cancelar
                    </button>
                  </>
                )}
                {item.estado !== 'Pendiente' && (
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', padding: '6px' }}>
                    Sin acciones
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Toner / General */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalWide} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {activeTab === 'Toner'
                  ? (editingToner ? 'Editar Pedido de Tóner' : 'Registrar Pedido de Tóner')
                  : (editingGeneral ? 'Editar Pedido General' : 'Registrar Pedido General')}
              </h2>
              <button className={styles.modalCloseBtn} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {activeTab === 'Toner' ? (
                <>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Tóner / Cartucho *</label>
                    <select
                      className={styles.fieldInput}
                      value={tonerForm.id_item_stock}
                      onChange={(e) => setTonerForm({ ...tonerForm, id_item_stock: e.target.value ? Number(e.target.value) : '' })}
                    >
                      <option value="">Seleccione insumo...</option>
                      {tonerItems.map((i) => (
                        <option key={i.id} value={i.id}>{i.descripcion} (Stock: {i.stock_actual})</option>
                      ))}
                    </select>
                    {errors.id_item_stock && <span className={styles.fieldError}>{errors.id_item_stock}</span>}
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Impresora Destino</label>
                      <select
                        className={styles.fieldInput}
                        value={tonerForm.id_impresora}
                        onChange={(e) => setTonerForm({ ...tonerForm, id_impresora: e.target.value ? Number(e.target.value) : '' })}
                      >
                        <option value="">Ninguna / Genérica</option>
                        {impresoras.map((imp) => (
                          <option key={imp.id_activo} value={imp.id_activo}>
                            {imp.activo?.marca?.nombre} {imp.activo?.modelo?.nombre} ({imp.ip || 'USB'})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Cantidad *</label>
                      <input
                        type="number"
                        className={styles.fieldInput}
                        value={tonerForm.cantidad}
                        onChange={(e) => setTonerForm({ ...tonerForm, cantidad: e.target.value ? Number(e.target.value) : 1 })}
                        min="1"
                      />
                      {errors.cantidad && <span className={styles.fieldError}>{errors.cantidad}</span>}
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Persona Solicitante *</label>
                      <select
                        className={styles.fieldInput}
                        value={tonerForm.id_persona_solicitante}
                        onChange={(e) => setTonerForm({ ...tonerForm, id_persona_solicitante: e.target.value ? Number(e.target.value) : '' })}
                      >
                        <option value="">Seleccione solicitante...</option>
                        {personas.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre} {p.apellido || ''}</option>
                        ))}
                      </select>
                      {errors.id_persona_solicitante && <span className={styles.fieldError}>{errors.id_persona_solicitante}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Sector *</label>
                      <select
                        className={styles.fieldInput}
                        value={tonerForm.id_sector}
                        onChange={(e) => setTonerForm({ ...tonerForm, id_sector: e.target.value ? Number(e.target.value) : '' })}
                      >
                        <option value="">Seleccione sector...</option>
                        {sectores.map((s) => (
                          <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))}
                      </select>
                      {errors.id_sector && <span className={styles.fieldError}>{errors.id_sector}</span>}
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Puesto de Trabajo</label>
                    <select
                      className={styles.fieldInput}
                      value={tonerForm.id_puesto}
                      onChange={(e) => setTonerForm({ ...tonerForm, id_puesto: e.target.value ? Number(e.target.value) : '' })}
                    >
                      <option value="">Seleccione puesto...</option>
                      {puestos.map((pst) => (
                        <option key={pst.id} value={pst.id}>{pst.codigo_puesto} — {pst.descripcion}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Observaciones</label>
                    <textarea
                      className={styles.fieldTextarea}
                      value={tonerForm.observaciones}
                      onChange={(e) => setTonerForm({ ...tonerForm, observaciones: e.target.value })}
                      placeholder="Comentarios adicionales"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Item / Insumo de Stock *</label>
                    <select
                      className={styles.fieldInput}
                      value={generalForm.id_item_stock}
                      onChange={(e) => setGeneralForm({ ...generalForm, id_item_stock: e.target.value ? Number(e.target.value) : '' })}
                    >
                      <option value="">Seleccione insumo...</option>
                      {itemsStock.map((i) => (
                        <option key={i.id} value={i.id}>{i.descripcion} (Stock: {i.stock_actual})</option>
                      ))}
                    </select>
                    {errors.id_item_stock && <span className={styles.fieldError}>{errors.id_item_stock}</span>}
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Cantidad *</label>
                      <input
                        type="number"
                        className={styles.fieldInput}
                        value={generalForm.cantidad}
                        onChange={(e) => setGeneralForm({ ...generalForm, cantidad: e.target.value ? Number(e.target.value) : 1 })}
                        min="1"
                      />
                      {errors.cantidad && <span className={styles.fieldError}>{errors.cantidad}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Motivo del Pedido</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={generalForm.motivo}
                        onChange={(e) => setGeneralForm({ ...generalForm, motivo: e.target.value })}
                        placeholder="Ej: Rotura de mouse, ingreso de personal..."
                      />
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Persona Solicitante *</label>
                      <select
                        className={styles.fieldInput}
                        value={generalForm.id_persona_solicitante}
                        onChange={(e) => setGeneralForm({ ...generalForm, id_persona_solicitante: e.target.value ? Number(e.target.value) : '' })}
                      >
                        <option value="">Seleccione solicitante...</option>
                        {personas.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre} {p.apellido || ''}</option>
                        ))}
                      </select>
                      {errors.id_persona_solicitante && <span className={styles.fieldError}>{errors.id_persona_solicitante}</span>}
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Sector *</label>
                      <select
                        className={styles.fieldInput}
                        value={generalForm.id_sector}
                        onChange={(e) => setGeneralForm({ ...generalForm, id_sector: e.target.value ? Number(e.target.value) : '' })}
                      >
                        <option value="">Seleccione sector...</option>
                        {sectores.map((s) => (
                          <option key={s.id} value={s.id}>{s.nombre}</option>
                        ))}
                      </select>
                      {errors.id_sector && <span className={styles.fieldError}>{errors.id_sector}</span>}
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Puesto de Trabajo</label>
                    <select
                      className={styles.fieldInput}
                      value={generalForm.id_puesto}
                      onChange={(e) => setGeneralForm({ ...generalForm, id_puesto: e.target.value ? Number(e.target.value) : '' })}
                    >
                      <option value="">Seleccione puesto...</option>
                      {puestos.map((pst) => (
                        <option key={pst.id} value={pst.id}>{pst.codigo_puesto} — {pst.descripcion}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Observaciones</label>
                    <textarea
                      className={styles.fieldTextarea}
                      value={generalForm.observaciones}
                      onChange={(e) => setGeneralForm({ ...generalForm, observaciones: e.target.value })}
                      placeholder="Comentarios adicionales"
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
