'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { ActaEntrega, ActaEntregaDetalle, Persona, Puesto, Sector, Activo, ItemStock } from '@/types/database';
import { FileText, Plus, Search, Pencil, Trash2, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

const TIPO_ACTA_OPTIONS = ['Entrega', 'Devolución', 'Cambio', 'Préstamo'];

interface ActaForm {
  numero: string;
  tipo: string;
  id_persona_recibe: number | '';
  id_puesto: number | '';
  id_sector: number | '';
  observaciones: string;
  items: Array<{
    id_activo: number | '';
    id_item_stock: number | '';
    cantidad: number;
    descripcion_manual: string;
    observaciones: string;
  }>;
}

const emptyForm: ActaForm = {
  numero: '',
  tipo: 'Entrega',
  id_persona_recibe: '',
  id_puesto: '',
  id_sector: '',
  observaciones: '',
  items: [{ id_activo: '', id_item_stock: '', cantidad: 1, descripcion_manual: '', observaciones: '' }],
};

export default function ActasPage() {
  const supabase = getSupabaseClient();

  const [items, setItems] = useState<ActaEntrega[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [sectores, setSectores] = useState<Sector[]>([]);
  const [activos, setActivos] = useState<Activo[]>([]);
  const [itemsStock, setItemsStock] = useState<ItemStock[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Details panel
  const [selectedItem, setSelectedItem] = useState<ActaEntrega | null>(null);
  const [details, setDetails] = useState<ActaEntregaDetalle[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ActaForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ActaForm, string>>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [actaRes, persRes, puestoRes, secRes, actRes, stockRes] = await Promise.all([
      supabase
        .from('actas_entrega')
        .select('*, persona_recibe:personas(*), puesto:puestos(*), sector:sectores(*)')
        .order('fecha', { ascending: false }),
      supabase.from('personas').select('*').eq('activo', true).order('nombre'),
      supabase.from('puestos').select('*').order('codigo_puesto'),
      supabase.from('sectores').select('*').eq('activo', true).order('nombre'),
      supabase.from('activos').select('*, marca:marcas(*), modelo:modelos(*)').eq('dado_de_baja', false),
      supabase.from('items_stock').select('*').eq('activo', true).order('descripcion'),
    ]);

    if (actaRes.data) setItems(actaRes.data as ActaEntrega[]);
    if (persRes.data) setPersonas(persRes.data as Persona[]);
    if (puestoRes.data) setPuestos(puestoRes.data as Puesto[]);
    if (secRes.data) setSectores(secRes.data as Sector[]);
    if (actRes.data) setActivos(actRes.data as Activo[]);
    if (stockRes.data) setItemsStock(stockRes.data as ItemStock[]);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load details
  const loadDetails = useCallback(async (actaId: number) => {
    setLoadingDetails(true);
    const { data, error } = await supabase
      .from('actas_entrega_detalle')
      .select('*, activo:activos(*, marca:marcas(*), modelo:modelos(*)), item_stock:items_stock(*)')
      .eq('id_acta', actaId);

    if (error) {
      toast.error('Error al cargar detalle del acta');
      console.error(error);
    } else {
      setDetails(data as ActaEntregaDetalle[]);
    }
    setLoadingDetails(false);
  }, [supabase]);

  useEffect(() => {
    if (selectedItem) {
      loadDetails(selectedItem.id);
    } else {
      setDetails([]);
    }
  }, [selectedItem, loadDetails]);

  const filtered = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.numero || '').toLowerCase().includes(term) ||
      (item.persona_recibe?.nombre || '').toLowerCase().includes(term) ||
      (item.persona_recibe?.apellido || '').toLowerCase().includes(term) ||
      (item.sector?.nombre || '').toLowerCase().includes(term)
    );
  });

  function openModal() {
    setErrors({});
    setForm({
      ...emptyForm,
      numero: `ACT-${new Date().getFullYear()}-${String(items.length + 1).padStart(3, '0')}`,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setForm(emptyForm);
    setErrors({});
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ActaForm, string>> = {};
    if (!form.numero.trim()) newErrors.numero = 'El número de acta es obligatorio';
    if (!form.id_persona_recibe) newErrors.id_persona_recibe = 'El receptor es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      numero: form.numero.trim(),
      tipo: form.tipo as any,
      id_persona_recibe: Number(form.id_persona_recibe),
      id_puesto: form.id_puesto ? Number(form.id_puesto) : null,
      id_sector: form.id_sector ? Number(form.id_sector) : null,
      fecha: new Date().toISOString(),
      observaciones: form.observaciones.trim() || null,
    };

    // 1. Create header
    const { data: newActa, error: actError } = await supabase
      .from('actas_entrega')
      .insert(payload)
      .select()
      .single();

    if (actError) {
      toast.error('Error al crear el acta de entrega');
      console.error(actError);
      setSaving(false);
      return;
    }

    // 2. Create detail lines
    const detailPayloads = form.items
      .filter(it => it.id_activo || it.id_item_stock || it.descripcion_manual.trim())
      .map((it) => ({
        id_acta: newActa.id,
        id_activo: it.id_activo ? Number(it.id_activo) : null,
        id_item_stock: it.id_item_stock ? Number(it.id_item_stock) : null,
        cantidad: Number(it.cantidad),
        descripcion_manual: it.descripcion_manual.trim() || null,
        observaciones: it.observaciones.trim() || null,
      }));

    if (detailPayloads.length > 0) {
      const { error: detError } = await supabase
        .from('actas_entrega_detalle')
        .insert(detailPayloads);

      if (detError) {
        toast.error('Acta creada pero falló el registro de detalles');
        console.error(detError);
      } else {
        toast.success('Acta de entrega creada correctamente');
      }
    } else {
      toast.success('Acta de entrega creada correctamente (sin items)');
    }

    closeModal();
    loadData();
    setSaving(false);
  }

  function addItemLine() {
    setForm({
      ...form,
      items: [...form.items, { id_activo: '', id_item_stock: '', cantidad: 1, descripcion_manual: '', observaciones: '' }],
    });
  }

  function removeItemLine(index: number) {
    const list = [...form.items];
    list.splice(index, 1);
    setForm({ ...form, items: list });
  }

  function getTipoBadge(tipo: string) {
    switch (tipo) {
      case 'Entrega':
        return styles.badgeActive;
      case 'Devolución':
        return styles.badgeInfo;
      case 'Cambio':
        return styles.badgeWarning;
      case 'Préstamo':
        return styles.badgeNeutral;
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
            <FileText size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Actas de Entrega</h1>
            <p className={styles.pageSubtitle}>Registro formal y generación de comprobantes de entrega/devolución de activos</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={18} /> Crear Acta
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por número de acta, receptor o sector..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedItem ? '1.8fr 1.2fr' : '1fr', gap: 'var(--space-5)', transition: 'all 0.3s' }}>
        {/* Table List */}
        <div className={styles.table}>
          <div className={styles.tableHeader} style={{ gridTemplateColumns: '1fr 100px 1.5fr 1fr 1.2fr 110px 80px' }}>
            <span>Número</span>
            <span>Tipo</span>
            <span>Recibe</span>
            <span>Puesto</span>
            <span>Sector</span>
            <span>Fecha</span>
            <span>Acciones</span>
          </div>

          {loading ? (
            <div className={styles.loadingState}><div className={styles.spinner} /><span>Cargando actas...</span></div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}><FileText size={48} className={styles.emptyIcon} /><p>No se encontraron actas registradas</p></div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`${styles.tableRowItem} ${selectedItem?.id === item.id ? styles.activeRow : ''}`}
                style={{ gridTemplateColumns: '1fr 100px 1.5fr 1fr 1.2fr 110px 80px', background: selectedItem?.id === item.id ? 'var(--bg-hover)' : undefined }}
                onClick={() => setSelectedItem(item)}
              >
                <span style={{ fontWeight: 600 }}>{item.numero}</span>
                <span><span className={`${styles.badge} ${getTipoBadge(item.tipo)}`}>{item.tipo}</span></span>
                <span className={styles.rowText}>
                  {item.persona_recibe?.nombre} {item.persona_recibe?.apellido || ''}
                </span>
                <span className={styles.rowText}>{item.puesto?.codigo_puesto || '—'}</span>
                <span className={styles.rowText}>{item.sector?.nombre || '—'}</span>
                <span>{new Date(item.fecha).toLocaleDateString()}</span>
                <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                  <button className={styles.actionBtn} onClick={() => setSelectedItem(item)} title="Ver Detalle">
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Slips Details Panel */}
        {selectedItem && (
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-secondary)', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>Detalle del Acta</h3>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>Nro: {selectedItem.numero} ({selectedItem.tipo})</span>
              </div>
              <button className={styles.modalCloseBtn} onClick={() => setSelectedItem(null)}><X size={18} /></button>
            </div>

            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: 'var(--space-4)', background: 'var(--bg-tertiary)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
              <div><strong>Persona que recibe:</strong> {selectedItem.persona_recibe?.nombre} {selectedItem.persona_recibe?.apellido || ''}</div>
              {selectedItem.puesto && <div><strong>Puesto de trabajo:</strong> {selectedItem.puesto.codigo_puesto}</div>}
              {selectedItem.sector && <div><strong>Sector:</strong> {selectedItem.sector.nombre}</div>}
              <div><strong>Fecha de firma:</strong> {new Date(selectedItem.fecha).toLocaleString()}</div>
              {selectedItem.observaciones && <div><strong>Observaciones:</strong> {selectedItem.observaciones}</div>}
            </div>

            <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Elementos Incluidos
            </div>

            {loadingDetails ? (
              <div className={styles.loadingState}><div className={styles.spinner} /></div>
            ) : details.length === 0 ? (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>No hay elementos registrados en este acta.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {details.map((d) => (
                  <div key={d.id} style={{ padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {d.id_activo && `Activo: ${d.activo?.codigo_interno} (${d.activo?.marca?.nombre} ${d.activo?.modelo?.nombre})`}
                      {d.id_item_stock && `Stock: ${d.item_stock?.descripcion}`}
                      {d.descripcion_manual && `Manual: ${d.descripcion_manual}`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Cantidad: {d.cantidad}</span>
                      {d.observaciones && <span>Obs: {d.observaciones}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Create Acta */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalWide} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Nueva Acta de Entrega</h2>
              <button className={styles.modalCloseBtn} onClick={closeModal}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Número de Acta *</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.numero}
                    onChange={(e) => setForm({ ...form, numero: e.target.value })}
                  />
                  {errors.numero && <span className={styles.fieldError}>{errors.numero}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Tipo de Transacción</label>
                  <select
                    className={styles.fieldInput}
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  >
                    {TIPO_ACTA_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Persona que Recibe *</label>
                  <select
                    className={styles.fieldInput}
                    value={form.id_persona_recibe}
                    onChange={(e) => setForm({ ...form, id_persona_recibe: e.target.value ? Number(e.target.value) : '' })}
                  >
                    <option value="">Seleccione persona...</option>
                    {personas.map((p) => (
                      <option key={p.id} value={p.id}>{p.nombre} {p.apellido || ''}</option>
                    ))}
                  </select>
                  {errors.id_persona_recibe && <span className={styles.fieldError}>{errors.id_persona_recibe}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Sector</label>
                  <select
                    className={styles.fieldInput}
                    value={form.id_sector}
                    onChange={(e) => setForm({ ...form, id_sector: e.target.value ? Number(e.target.value) : '' })}
                  >
                    <option value="">Ninguno</option>
                    {sectores.map((s) => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Puesto de Trabajo</label>
                  <select
                    className={styles.fieldInput}
                    value={form.id_puesto}
                    onChange={(e) => setForm({ ...form, id_puesto: e.target.value ? Number(e.target.value) : '' })}
                  >
                    <option value="">Ninguno</option>
                    {puestos.map((pst) => (
                      <option key={pst.id} value={pst.id}>{pst.codigo_puesto} — {pst.descripcion}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Observaciones Generales</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  placeholder="Detalles del acta"
                />
              </div>

              {/* Items Detail Creator */}
              <div style={{ marginTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 600 }}>Elementos a Entregar / Devolver</span>
                  <button type="button" className={styles.actionBtn} onClick={addItemLine}>+ Agregar Elemento</button>
                </div>

                {form.items.map((item, index) => (
                  <div key={index} style={{ border: '1px solid var(--border-secondary)', padding: '10px', borderRadius: 'var(--radius-md)', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                    
                    {form.items.length > 1 && (
                      <button type="button" className={styles.modalCloseBtn} style={{ position: 'absolute', right: '6px', top: '6px' }} onClick={() => removeItemLine(index)}>
                        <X size={16} />
                      </button>
                    )}

                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Opción A: Activo de Hardware</label>
                        <select
                          className={styles.fieldInput}
                          value={item.id_activo}
                          onChange={(e) => {
                            const list = [...form.items];
                            list[index].id_activo = e.target.value ? Number(e.target.value) : '';
                            list[index].id_item_stock = '';
                            list[index].descripcion_manual = '';
                            setForm({ ...form, items: list });
                          }}
                        >
                          <option value="">Seleccione activo...</option>
                          {activos.map((a) => (
                            <option key={a.id} value={a.id}>{a.codigo_interno} ({a.marca?.nombre} {a.modelo?.nombre})</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Opción B: Item de Stock General</label>
                        <select
                          className={styles.fieldInput}
                          value={item.id_item_stock}
                          onChange={(e) => {
                            const list = [...form.items];
                            list[index].id_item_stock = e.target.value ? Number(e.target.value) : '';
                            list[index].id_activo = '';
                            list[index].descripcion_manual = '';
                            setForm({ ...form, items: list });
                          }}
                        >
                          <option value="">Seleccione stock...</option>
                          {itemsStock.map((s) => (
                            <option key={s.id} value={s.id}>{s.descripcion} (Stock: {s.stock_actual})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {!item.id_activo && !item.id_item_stock && (
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Opción C: Descripción Manual</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={item.descripcion_manual}
                          onChange={(e) => {
                            const list = [...form.items];
                            list[index].descripcion_manual = e.target.value;
                            setForm({ ...form, items: list });
                          }}
                          placeholder="Ej: Licencia física en papel..."
                        />
                      </div>
                    )}

                    <div className={styles.fieldRow}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Cantidad</label>
                        <input
                          type="number"
                          className={styles.fieldInput}
                          value={item.cantidad}
                          onChange={(e) => {
                            const list = [...form.items];
                            list[index].cantidad = Number(e.target.value);
                            setForm({ ...form, items: list });
                          }}
                          min="1"
                        />
                      </div>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}>Observaciones específicas</label>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          value={item.observaciones}
                          onChange={(e) => {
                            const list = [...form.items];
                            list[index].observaciones = e.target.value;
                            setForm({ ...form, items: list });
                          }}
                          placeholder="Ej: Con caja, sin cargador..."
                        />
                      </div>
                    </div>

                  </div>
                ))}
              </div>

            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={closeModal}>Cancelar</button>
              <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Generar Acta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
