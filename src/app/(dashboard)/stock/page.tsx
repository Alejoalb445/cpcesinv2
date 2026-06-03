'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { ItemStock, CategoriaStock, Marca } from '@/types/database';
import { Package, Plus, Search, Pencil, Trash2, X, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

const ESTADO_OPTIONS = ['OK', 'Bajo', 'Sin Stock'];

interface StockForm {
  id_categoria: number | '';
  id_marca: number | '';
  descripcion: string;
  codigo: string;
  color: string;
  unidad_medida: string;
  stock_actual: number | '';
  stock_minimo: number | '';
  stock_reposicion: number | '';
  observaciones: string;
}

const emptyForm: StockForm = {
  id_categoria: '',
  id_marca: '',
  descripcion: '',
  codigo: '',
  color: '',
  unidad_medida: 'Unidades',
  stock_actual: 0,
  stock_minimo: 5,
  stock_reposicion: 10,
  observaciones: '',
};

interface AjusteForm {
  tipo: 'Ajuste positivo' | 'Ajuste negativo';
  cantidad: number | '';
  observaciones: string;
}

type JoinedItemStock = ItemStock & {
  categoria: CategoriaStock | null;
  marca: Marca | null;
};

export default function StockPage() {
  const supabase = getSupabaseClient();

  const [items, setItems] = useState<JoinedItemStock[]>([]);
  const [categorias, setCategorias] = useState<CategoriaStock[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Todos');

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JoinedItemStock | null>(null);
  const [form, setForm] = useState<StockForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  
  const [ajusteOpen, setAjusteOpen] = useState(false);
  const [ajusteItem, setAjusteItem] = useState<JoinedItemStock | null>(null);
  const [ajusteForm, setAjusteForm] = useState<AjusteForm>({
    tipo: 'Ajuste positivo',
    cantidad: '',
    observaciones: '',
  });

  const [confirmDelete, setConfirmDelete] = useState<JoinedItemStock | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof StockForm, string>>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [stockRes, catRes, marcasRes] = await Promise.all([
      supabase
        .from('items_stock')
        .select('*, categoria:categorias_stock(*), marca:marcas(*)')
        .eq('activo', true)
        .order('descripcion'),
      supabase.from('categorias_stock').select('*').eq('activo', true).order('nombre'),
      supabase.from('marcas').select('*').eq('activo', true).order('nombre'),
    ]);

    if (stockRes.error) {
      toast.error('Error al cargar items de stock');
      console.error(stockRes.error);
    } else {
      setItems(stockRes.data as JoinedItemStock[]);
    }

    if (catRes.data) setCategorias(catRes.data as CategoriaStock[]);
    if (marcasRes.data) setMarcas(marcasRes.data as Marca[]);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabs = ['Todos', 'Tóner / Tinta', 'Periféricos', 'Cables / Adaptadores', 'Otros'];

  const filtered = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      item.descripcion.toLowerCase().includes(term) ||
      (item.codigo || '').toLowerCase().includes(term) ||
      (item.categoria?.nombre || '').toLowerCase().includes(term);

    // Tab filtering based on category name
    let matchesTab = true;
    const catName = (item.categoria?.nombre || '').toLowerCase();

    if (activeTab === 'Tóner / Tinta') {
      matchesTab = catName.includes('tóner') || catName.includes('toner') || catName.includes('tinta') || catName.includes('cartucho');
    } else if (activeTab === 'Periféricos') {
      matchesTab = catName.includes('perifer') || catName.includes('teclado') || catName.includes('mouse') || catName.includes('auricular');
    } else if (activeTab === 'Cables / Adaptadores') {
      matchesTab = catName.includes('cable') || catName.includes('adaptador') || catName.includes('conector');
    } else if (activeTab === 'Otros') {
      matchesTab =
        !catName.includes('tóner') && !catName.includes('toner') && !catName.includes('tinta') && !catName.includes('cartucho') &&
        !catName.includes('perifer') && !catName.includes('teclado') && !catName.includes('mouse') && !catName.includes('auricular') &&
        !catName.includes('cable') && !catName.includes('adaptador') && !catName.includes('conector');
    }

    return matchesSearch && matchesTab;
  });

  function openModal(item?: JoinedItemStock) {
    if (item) {
      setEditingItem(item);
      setForm({
        id_categoria: item.id_categoria || '',
        id_marca: item.id_marca || '',
        descripcion: item.descripcion || '',
        codigo: item.codigo || '',
        color: item.color || '',
        unidad_medida: item.unidad_medida || 'Unidades',
        stock_actual: item.stock_actual ?? 0,
        stock_minimo: item.stock_minimo ?? 5,
        stock_reposicion: item.stock_reposicion ?? 10,
        observaciones: item.observaciones || '',
      });
    } else {
      setEditingItem(null);
      setForm(emptyForm);
    }
    setErrors({});
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
    setErrors({});
  }

  function openAjuste(item: JoinedItemStock, tipo: 'Ajuste positivo' | 'Ajuste negativo') {
    setAjusteItem(item);
    setAjusteForm({
      tipo,
      cantidad: '',
      observaciones: '',
    });
    setAjusteOpen(true);
  }

  function closeAjuste() {
    setAjusteOpen(false);
    setAjusteItem(null);
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof StockForm, string>> = {};
    if (!form.id_categoria) newErrors.id_categoria = 'La categoría es obligatoria';
    if (!form.descripcion.trim()) newErrors.descripcion = 'La descripción es obligatoria';
    if (form.stock_actual === '') newErrors.stock_actual = 'El stock actual es obligatorio';
    if (form.stock_minimo === '') newErrors.stock_minimo = 'El stock mínimo es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      id_categoria: Number(form.id_categoria),
      id_marca: form.id_marca ? Number(form.id_marca) : null,
      descripcion: form.descripcion.trim(),
      codigo: form.codigo.trim() || null,
      color: form.color.trim() || null,
      unidad_medida: form.unidad_medida,
      stock_actual: Number(form.stock_actual),
      stock_minimo: Number(form.stock_minimo),
      stock_reposicion: Number(form.stock_reposicion),
      observaciones: form.observaciones.trim() || null,
    };

    if (editingItem) {
      const oldStock = editingItem.stock_actual;
      const { error } = await supabase
        .from('items_stock')
        .update(payload)
        .eq('id', editingItem.id);

      if (error) {
        toast.error('Error al actualizar el item');
        console.error(error);
      } else {
        // If stock changed directly, create a movement record
        const diff = payload.stock_actual - oldStock;
        if (diff !== 0) {
          await supabase.from('movimientos_stock').insert({
            id_item_stock: editingItem.id,
            tipo_movimiento: diff > 0 ? 'Ajuste positivo' : 'Ajuste negativo',
            cantidad: Math.abs(diff),
            stock_antes: oldStock,
            stock_despues: payload.stock_actual,
            observaciones: 'Modificación directa de item en catálogo',
          });
        }
        toast.success('Item actualizado correctamente');
        closeModal();
        loadData();
      }
    } else {
      const { data: newItem, error } = await supabase
        .from('items_stock')
        .insert(payload)
        .select()
        .single();

      if (error) {
        toast.error('Error al crear el item');
        console.error(error);
      } else {
        // Create initial movement
        if (payload.stock_actual > 0) {
          await supabase.from('movimientos_stock').insert({
            id_item_stock: newItem.id,
            tipo_movimiento: 'Entrada',
            cantidad: payload.stock_actual,
            stock_antes: 0,
            stock_despues: payload.stock_actual,
            observaciones: 'Stock inicial al registrar item',
          });
        }
        toast.success('Item creado correctamente');
        closeModal();
        loadData();
      }
    }
    setSaving(false);
  }

  async function handleAjuste() {
    if (!ajusteItem) return;
    const cant = Number(ajusteForm.cantidad);
    if (!cant || cant <= 0) {
      toast.error('Ingrese una cantidad válida');
      return;
    }

    setSaving(true);
    const oldStock = ajusteItem.stock_actual;
    const finalStock = ajusteForm.tipo === 'Ajuste positivo' ? oldStock + cant : oldStock - cant;

    if (finalStock < 0) {
      toast.error('El stock no puede ser menor a 0');
      setSaving(false);
      return;
    }

    // 1. Update stock_actual
    const { error: updateError } = await supabase
      .from('items_stock')
      .update({ stock_actual: finalStock })
      .eq('id', ajusteItem.id);

    if (updateError) {
      toast.error('Error al aplicar el ajuste');
      console.error(updateError);
      setSaving(false);
      return;
    }

    // 2. Insert movement log
    const { error: moveError } = await supabase.from('movimientos_stock').insert({
      id_item_stock: ajusteItem.id,
      tipo_movimiento: ajusteForm.tipo,
      cantidad: cant,
      stock_antes: oldStock,
      stock_despues: finalStock,
      observaciones: ajusteForm.observaciones.trim() || 'Ajuste de inventario manual',
    });

    if (moveError) {
      toast.error('Ajuste aplicado pero no se registró el movimiento');
      console.error(moveError);
    } else {
      toast.success('Ajuste de stock aplicado correctamente');
      closeAjuste();
      loadData();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const { error } = await supabase
      .from('items_stock')
      .update({ activo: false })
      .eq('id', confirmDelete.id);

    if (error) {
      toast.error('Error al desactivar el item');
      console.error(error);
    } else {
      toast.success('Item desactivado correctamente');
      loadData();
    }
    setConfirmDelete(null);
  }

  function getStockStatus(item: JoinedItemStock) {
    if (item.stock_actual <= 0) return { label: 'Sin Stock', class: styles.badgeInactive };
    if (item.stock_actual <= item.stock_minimo) return { label: 'Bajo', class: styles.badgeWarning };
    return { label: 'OK', class: styles.badgeActive };
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <Package size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Stock Central</h1>
            <p className={styles.pageSubtitle}>Control de insumos, periféricos, toners y cables en depósito</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={18} /> Agregar Insumo
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer} style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-2)', overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab ? 'var(--accent-bg)' : 'transparent',
              color: activeTab === tab ? 'var(--accent-text)' : 'var(--text-secondary)',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent-primary)' : 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: activeTab === tab ? '600' : '500',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all var(--transition-fast)',
            }}
          >
            {tab}
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
            placeholder="Buscar por descripción, código o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className={styles.table}>
        <div className={styles.tableHeader} style={{ gridTemplateColumns: '1.2fr 2.5fr 1fr 80px 80px 100px 150px' }}>
          <span>Categoría</span>
          <span>Descripción</span>
          <span>Código</span>
          <span>Stock</span>
          <span>Mínimo</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Cargando stock...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Package size={48} className={styles.emptyIcon} />
            <p>No se encontraron insumos</p>
          </div>
        ) : (
          filtered.map((item) => {
            const status = getStockStatus(item);
            return (
              <div
                key={item.id}
                className={styles.tableRowItem}
                style={{ gridTemplateColumns: '1.2fr 2.5fr 1fr 80px 80px 100px 150px' }}
                onClick={() => openModal(item)}
              >
                <span className={styles.rowText}>{item.categoria?.nombre || '—'}</span>
                <span className={styles.rowText} style={{ fontWeight: 600 }}>{item.descripcion}</span>
                <span className={styles.rowText} style={{ fontFamily: 'var(--font-mono)' }}>{item.codigo || '—'}</span>
                <span style={{ fontWeight: 600 }}>{item.stock_actual}</span>
                <span>{item.stock_minimo}</span>
                <span>
                  <span className={`${styles.badge} ${status.class}`}>
                    {status.label}
                  </span>
                </span>
                <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                  <button className={styles.actionBtn} onClick={() => openAjuste(item, 'Ajuste positivo')} title="Entrada / Ajuste +" style={{ color: 'var(--success)' }}>
                    <ArrowUpRight size={14} />
                  </button>
                  <button className={styles.actionBtn} onClick={() => openAjuste(item, 'Ajuste negativo')} title="Salida / Ajuste -" style={{ color: 'var(--danger)' }}>
                    <ArrowDownRight size={14} />
                  </button>
                  <button className={styles.actionBtn} onClick={() => openModal(item)} title="Editar">
                    <Pencil size={14} />
                  </button>
                  <button className={styles.deleteBtn} onClick={() => setConfirmDelete(item)} title="Eliminar">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail/Create/Edit Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalWide} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingItem ? 'Editar Item de Stock' : 'Nuevo Item de Stock'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Categoría *</label>
                  <select
                    className={styles.fieldInput}
                    value={form.id_categoria}
                    onChange={(e) => setForm({ ...form, id_categoria: e.target.value ? Number(e.target.value) : '' })}
                  >
                    <option value="">Seleccione categoría...</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                  {errors.id_categoria && <span className={styles.fieldError}>{errors.id_categoria}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Marca</label>
                  <select
                    className={styles.fieldInput}
                    value={form.id_marca}
                    onChange={(e) => setForm({ ...form, id_marca: e.target.value ? Number(e.target.value) : '' })}
                  >
                    <option value="">Ninguna</option>
                    {marcas.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Descripción / Detalle *</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Ej: Teclado USB Logitech K120"
                />
                {errors.descripcion && <span className={styles.fieldError}>{errors.descripcion}</span>}
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Código (Part Number / SKU)</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    placeholder="Ej: 920-002478"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Color (Insumos de Impresión)</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    placeholder="Ej: Negro, Cian, Amarillo, Magenta"
                  />
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Stock Actual *</label>
                  <input
                    type="number"
                    className={styles.fieldInput}
                    value={form.stock_actual}
                    onChange={(e) => setForm({ ...form, stock_actual: e.target.value ? Number(e.target.value) : '' })}
                  />
                  {errors.stock_actual && <span className={styles.fieldError}>{errors.stock_actual}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Stock Mínimo *</label>
                  <input
                    type="number"
                    className={styles.fieldInput}
                    value={form.stock_minimo}
                    onChange={(e) => setForm({ ...form, stock_minimo: e.target.value ? Number(e.target.value) : '' })}
                  />
                  {errors.stock_minimo && <span className={styles.fieldError}>{errors.stock_minimo}</span>}
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Stock Reposición / Óptimo</label>
                  <input
                    type="number"
                    className={styles.fieldInput}
                    value={form.stock_reposicion}
                    onChange={(e) => setForm({ ...form, stock_reposicion: e.target.value ? Number(e.target.value) : '' })}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Unidad de Medida</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.unidad_medida}
                    onChange={(e) => setForm({ ...form, unidad_medida: e.target.value })}
                    placeholder="Ej: Unidades, Cajas, Metros"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Observaciones</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  placeholder="Detalles adicionales o compatibilidades..."
                />
              </div>
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

      {/* Ajuste Modal */}
      {ajusteOpen && ajusteItem && (
        <div className={styles.modalOverlay} onClick={closeAjuste}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {ajusteForm.tipo === 'Ajuste positivo' ? 'Incrementar Stock' : 'Disminuir Stock'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={closeAjuste}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Item: <strong>{ajusteItem.descripcion}</strong></div>
                <div>Stock actual: <strong>{ajusteItem.stock_actual} {ajusteItem.unidad_medida}</strong></div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Cantidad a {ajusteForm.tipo === 'Ajuste positivo' ? 'incrementar' : 'disminuir'} *</label>
                <input
                  type="number"
                  className={styles.fieldInput}
                  value={ajusteForm.cantidad}
                  onChange={(e) => setAjusteForm({ ...ajusteForm, cantidad: e.target.value ? Number(e.target.value) : '' })}
                  placeholder="Cantidad"
                  min="1"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Observaciones / Motivo *</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={ajusteForm.observaciones}
                  onChange={(e) => setAjusteForm({ ...ajusteForm, observaciones: e.target.value })}
                  placeholder="Ej: Ingreso de compra Nro 125, Entrega a sistemas..."
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={closeAjuste}>Cancelar</button>
              <button className={styles.saveBtn} onClick={handleAjuste} disabled={saving}>
                {saving ? 'Guardando...' : 'Aplicar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>¿Desactivar item?</h3>
            <p className={styles.confirmMessage}>
              ¿Está seguro de que desea desactivar <strong>{confirmDelete.descripcion}</strong> del catálogo de stock?
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className={styles.dangerBtn} onClick={handleDelete}>Desactivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
