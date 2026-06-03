'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Activo, TipoActivo, Marca, Modelo } from '@/types/database';
import { Monitor, Plus, Search, Pencil, Trash2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

const ESTADO_OPTIONS = ['En Depósito', 'Asignado', 'En Reparación', 'De Baja', 'Extraviado'];

interface ActivoForm {
  id_tipo_activo: number | '';
  id_marca: number | '';
  id_modelo: number | '';
  serial: string;
  codigo_interno: string;
  estado: string;
  fecha_compra: string;
  valor_estimado: number | '';
  observaciones: string;
}

const emptyForm: ActivoForm = {
  id_tipo_activo: '',
  id_marca: '',
  id_modelo: '',
  serial: '',
  codigo_interno: '',
  estado: 'En Depósito',
  fecha_compra: '',
  valor_estimado: '',
  observaciones: '',
};

export default function ActivosPage() {
  const supabase = getSupabaseClient();

  const [items, setItems] = useState<Activo[]>([]);
  const [tiposActivo, setTiposActivo] = useState<TipoActivo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterMarca, setFilterMarca] = useState('');
  const [activeTab, setActiveTab] = useState('Todos');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Activo | null>(null);
  const [form, setForm] = useState<ActivoForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Activo | null>(null);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof ActivoForm, string>>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [activosRes, tiposRes, marcasRes, modelosRes] = await Promise.all([
      supabase
        .from('activos')
        .select('*, tipo_activo:tipos_activo(*), marca:marcas(*), modelo:modelos(*)')
        .eq('dado_de_baja', false)
        .order('created_at', { ascending: false }),
      supabase.from('tipos_activo').select('*').eq('activo', true).order('nombre'),
      supabase.from('marcas').select('*').eq('activo', true).order('nombre'),
      supabase.from('modelos').select('*, marca:marcas(*)').eq('activo', true).order('nombre'),
    ]);

    if (activosRes.error) {
      toast.error('Error al cargar activos');
      console.error(activosRes.error);
    } else {
      setItems(activosRes.data as Activo[]);
    }

    if (tiposRes.data) setTiposActivo(tiposRes.data as TipoActivo[]);
    if (marcasRes.data) setMarcas(marcasRes.data as Marca[]);
    if (modelosRes.data) setModelos(modelosRes.data as Modelo[]);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tab definition
  const tabs = ['Todos', 'PCs/Notebooks', 'Impresoras', 'Monitores', 'Red', 'Telefonía', 'CCTV', 'Otros'];

  const filtered = items.filter((item) => {
    // Search
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (item.serial || '').toLowerCase().includes(term) ||
      (item.codigo_interno || '').toLowerCase().includes(term) ||
      (item.modelo?.nombre || '').toLowerCase().includes(term) ||
      (item.tipo_activo?.nombre || '').toLowerCase().includes(term);

    // Filters
    const matchesEstado = filterEstado ? item.estado === filterEstado : true;
    const matchesMarca = filterMarca ? item.id_marca === Number(filterMarca) : true;

    // Tab Filter
    let matchesTab = true;
    const categoria = (item.tipo_activo?.categoria || '').toLowerCase();
    const nombreTipo = (item.tipo_activo?.nombre || '').toLowerCase();

    if (activeTab === 'PCs/Notebooks') {
      matchesTab = categoria.includes('comput') || nombreTipo.includes('pc') || nombreTipo.includes('notebook') || nombreTipo.includes('laptop') || nombreTipo.includes('servidor');
      if (nombreTipo.includes('monitor') || nombreTipo.includes('pantalla')) {
        matchesTab = false; // Exclude monitors
      }
    } else if (activeTab === 'Impresoras') {
      matchesTab = categoria.includes('impres') || nombreTipo.includes('impresora') || nombreTipo.includes('plotter');
    } else if (activeTab === 'Monitores') {
      matchesTab = nombreTipo.includes('monitor') || nombreTipo.includes('pantalla') || categoria.includes('pantalla');
    } else if (activeTab === 'Red') {
      matchesTab = categoria.includes('red') || categoria.includes('enlace') || nombreTipo.includes('switch') || nombreTipo.includes('router') || nombreTipo.includes('access point');
    } else if (activeTab === 'Telefonía') {
      matchesTab = categoria.includes('telefon') || nombreTipo.includes('telefono') || nombreTipo.includes('interno');
    } else if (activeTab === 'CCTV') {
      matchesTab = nombreTipo.includes('camara') || nombreTipo.includes('dvr') || nombreTipo.includes('nvr') || nombreTipo.includes('cctv') || categoria.includes('cctv');
    } else if (activeTab === 'Otros') {
      const isKnown =
        categoria.includes('comput') || nombreTipo.includes('pc') || nombreTipo.includes('notebook') || nombreTipo.includes('laptop') || nombreTipo.includes('servidor') ||
        categoria.includes('impres') || nombreTipo.includes('impresora') || nombreTipo.includes('plotter') ||
        nombreTipo.includes('monitor') || nombreTipo.includes('pantalla') || categoria.includes('pantalla') ||
        categoria.includes('red') || categoria.includes('enlace') || nombreTipo.includes('switch') || nombreTipo.includes('router') ||
        categoria.includes('telefon') || nombreTipo.includes('telefono') ||
        nombreTipo.includes('camara') || nombreTipo.includes('dvr') || nombreTipo.includes('nvr') || nombreTipo.includes('cctv');
      matchesTab = !isKnown;
    }

    return matchesSearch && matchesEstado && matchesMarca && matchesTab;
  });

  // Filter models based on selected brand
  const filteredModelos = form.id_marca
    ? modelos.filter((m) => m.id_marca === Number(form.id_marca))
    : modelos;

  function openModal(item?: Activo) {
    if (item) {
      setEditingItem(item);
      setForm({
        id_tipo_activo: item.id_tipo_activo || '',
        id_marca: item.id_marca || '',
        id_modelo: item.id_modelo || '',
        serial: item.serial || '',
        codigo_interno: item.codigo_interno || '',
        estado: item.estado || 'En Depósito',
        fecha_compra: item.fecha_compra ? item.fecha_compra.substring(0, 10) : '',
        valor_estimado: item.valor_estimado || '',
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

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ActivoForm, string>> = {};
    if (!form.id_tipo_activo) newErrors.id_tipo_activo = 'El tipo de activo es obligatorio';
    if (!form.id_marca) newErrors.id_marca = 'La marca es obligatoria';
    if (!form.id_modelo) newErrors.id_modelo = 'El modelo es obligatorio';
    if (!form.codigo_interno.trim()) newErrors.codigo_interno = 'El código interno es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    const payload = {
      id_tipo_activo: Number(form.id_tipo_activo),
      id_marca: Number(form.id_marca),
      id_modelo: Number(form.id_modelo),
      serial: form.serial.trim() || null,
      codigo_interno: form.codigo_interno.trim(),
      estado: form.estado,
      fecha_compra: form.fecha_compra || null,
      valor_estimado: form.valor_estimado ? Number(form.valor_estimado) : null,
      observaciones: form.observaciones.trim() || null,
    };

    if (editingItem) {
      const { error } = await supabase
        .from('activos')
        .update(payload)
        .eq('id', editingItem.id);

      if (error) {
        toast.error('Error al actualizar el activo');
        console.error(error);
      } else {
        toast.success('Activo actualizado correctamente');
        closeModal();
        loadData();
      }
    } else {
      const { error } = await supabase
        .from('activos')
        .insert(payload);

      if (error) {
        toast.error('Error al crear el activo');
        console.error(error);
      } else {
        toast.success('Activo creado correctamente');
        closeModal();
        loadData();
      }
    }
    setSaving(false);
  }

  async function handleBaja() {
    if (!confirmDelete) return;
    if (!motivoBaja.trim()) {
      toast.error('Debe ingresar un motivo para dar de baja el activo');
      return;
    }

    const { error } = await supabase
      .from('activos')
      .update({
        estado: 'De Baja',
        dado_de_baja: true,
        fecha_baja: new Date().toISOString(),
        motivo_baja: motivoBaja.trim(),
      })
      .eq('id', confirmDelete.id);

    if (error) {
      toast.error('Error al dar de baja el activo');
      console.error(error);
    } else {
      toast.success('Activo dado de baja correctamente');
      loadData();
    }
    setConfirmDelete(null);
    setMotivoBaja('');
  }

  function getEstadoBadge(estado: string) {
    switch (estado) {
      case 'Asignado':
        return styles.badgeActive;
      case 'En Depósito':
        return styles.badgeInfo;
      case 'En Reparación':
        return styles.badgeWarning;
      case 'De Baja':
      case 'Extraviado':
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
            <Monitor size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Activos</h1>
            <p className={styles.pageSubtitle}>Inventario de equipos de computación, red, telefonía e impresión</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={18} /> Agregar Activo
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
            placeholder="Buscar por serial, código interno o modelo..."
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
        <select
          className={styles.filterSelect}
          value={filterMarca}
          onChange={(e) => setFilterMarca(e.target.value)}
        >
          <option value="">Todas las marcas</option>
          {marcas.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className={styles.table}>
        <div className={styles.tableHeader} style={{ gridTemplateColumns: '1.5fr 2fr 1.5fr 1.2fr 120px 120px' }}>
          <span>Tipo</span>
          <span>Marca / Modelo</span>
          <span>Serial</span>
          <span>Código Int.</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Cargando activos...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Monitor size={48} className={styles.emptyIcon} />
            <p>No se encontraron activos</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={styles.tableRowItem}
              style={{ gridTemplateColumns: '1.5fr 2fr 1.5fr 1.2fr 120px 120px' }}
              onClick={() => openModal(item)}
            >
              <span className={styles.rowText} style={{ fontWeight: 600 }}>
                {item.tipo_activo?.nombre || '—'}
              </span>
              <span className={styles.rowText}>
                {item.marca?.nombre} {item.modelo?.nombre}
              </span>
              <span className={styles.rowText} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                {item.serial || '—'}
              </span>
              <span className={styles.rowText}>{item.codigo_interno || '—'}</span>
              <span>
                <span className={`${styles.badge} ${getEstadoBadge(item.estado)}`}>
                  {item.estado}
                </span>
              </span>
              <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                <button className={styles.actionBtn} onClick={() => openModal(item)} title="Editar">
                  <Pencil size={14} />
                </button>
                <button className={styles.deleteBtn} onClick={() => setConfirmDelete(item)} title="Dar de baja">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalWide} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingItem ? 'Editar Activo' : 'Nuevo Activo'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Tipo de activo *</label>
                  <select
                    className={styles.fieldInput}
                    value={form.id_tipo_activo}
                    onChange={(e) => setForm({ ...form, id_tipo_activo: e.target.value ? Number(e.target.value) : '' })}
                  >
                    <option value="">Seleccione tipo...</option>
                    {tiposActivo.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                  {errors.id_tipo_activo && <span className={styles.fieldError}>{errors.id_tipo_activo}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Estado</label>
                  <select
                    className={styles.fieldInput}
                    value={form.estado}
                    onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  >
                    {ESTADO_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Marca *</label>
                  <select
                    className={styles.fieldInput}
                    value={form.id_marca}
                    onChange={(e) => setForm({ ...form, id_marca: e.target.value ? Number(e.target.value) : '', id_modelo: '' })}
                  >
                    <option value="">Seleccione marca...</option>
                    {marcas.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                  {errors.id_marca && <span className={styles.fieldError}>{errors.id_marca}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Modelo *</label>
                  <select
                    className={styles.fieldInput}
                    value={form.id_modelo}
                    onChange={(e) => setForm({ ...form, id_modelo: e.target.value ? Number(e.target.value) : '' })}
                    disabled={!form.id_marca}
                  >
                    <option value="">Seleccione modelo...</option>
                    {filteredModelos.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                  {errors.id_modelo && <span className={styles.fieldError}>{errors.id_modelo}</span>}
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Serial</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.serial}
                    onChange={(e) => setForm({ ...form, serial: e.target.value })}
                    placeholder="S/N o Service Tag"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Código Interno *</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.codigo_interno}
                    onChange={(e) => setForm({ ...form, codigo_interno: e.target.value })}
                    placeholder="Ej: PC-001"
                  />
                  {errors.codigo_interno && <span className={styles.fieldError}>{errors.codigo_interno}</span>}
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Fecha de compra</label>
                  <input
                    type="date"
                    className={styles.fieldInput}
                    value={form.fecha_compra}
                    onChange={(e) => setForm({ ...form, fecha_compra: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Valor Estimado (USD)</label>
                  <input
                    type="number"
                    className={styles.fieldInput}
                    value={form.valor_estimado}
                    onChange={(e) => setForm({ ...form, valor_estimado: e.target.value ? Number(e.target.value) : '' })}
                    placeholder="Ej: 800"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Observaciones</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  placeholder="Detalles o especificaciones adicionales del activo"
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

      {/* Confirm Dar de Baja */}
      {confirmDelete && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Dar de baja activo</h3>
            <p className={styles.confirmMessage}>
              ¿Está seguro de que desea dar de baja el activo <strong>{confirmDelete.codigo_interno} ({confirmDelete.marca?.nombre} {confirmDelete.modelo?.nombre})</strong>?
            </p>
            <div className={styles.field} style={{ textAlign: 'left', marginBottom: 'var(--space-4)' }}>
              <label className={styles.fieldLabel}>Motivo de la baja *</label>
              <input
                type="text"
                className={styles.fieldInput}
                value={motivoBaja}
                onChange={(e) => setMotivoBaja(e.target.value)}
                placeholder="Ej: Obsolescencia, rotura irreparable..."
              />
            </div>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className={styles.dangerBtn} onClick={handleBaja}>Confirmar Baja</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
