'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { ComponentePc, CategoriaComponente, Marca, Modelo } from '@/types/database';
import { HardDrive, Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

const ESTADO_OPTIONS = ['En Depósito', 'Asignado', 'En Reparación', 'De Baja'];

interface ComponenteForm {
  id_categoria: number | '';
  id_marca: number | '';
  id_modelo: number | '';
  serial: string;
  codigo_interno: string;
  capacidad_gb: number | '';
  velocidad_mhz: number | '';
  tecnologia: string;
  watts: number | '';
  estado: string;
  fecha_compra: string;
  observaciones: string;
}

const emptyForm: ComponenteForm = {
  id_categoria: '',
  id_marca: '',
  id_modelo: '',
  serial: '',
  codigo_interno: '',
  capacidad_gb: '',
  velocidad_mhz: '',
  tecnologia: '',
  watts: '',
  estado: 'En Depósito',
  fecha_compra: '',
  observaciones: '',
};

type JoinedComponente = ComponentePc & {
  categoria: CategoriaComponente | null;
  marca: Marca | null;
  modelo: Modelo | null;
};

export default function ComponentesPage() {
  const supabase = getSupabaseClient();

  const [items, setItems] = useState<JoinedComponente[]>([]);
  const [categorias, setCategorias] = useState<CategoriaComponente[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JoinedComponente | null>(null);
  const [form, setForm] = useState<ComponenteForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<JoinedComponente | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ComponenteForm, string>>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [compRes, catRes, marcasRes, modelosRes] = await Promise.all([
      supabase
        .from('componentes_pc')
        .select('*, categoria:categorias_componentes(*), marca:marcas(*), modelo:modelos(*)')
        .order('created_at', { ascending: false }),
      supabase.from('categorias_componentes').select('*').eq('activo', true).order('nombre'),
      supabase.from('marcas').select('*').eq('activo', true).order('nombre'),
      supabase.from('modelos').select('*').eq('activo', true).order('nombre'),
    ]);

    if (compRes.error) {
      toast.error('Error al cargar componentes');
      console.error(compRes.error);
    } else {
      setItems(compRes.data as JoinedComponente[]);
    }

    if (catRes.data) setCategorias(catRes.data as CategoriaComponente[]);
    if (marcasRes.data) setMarcas(marcasRes.data as Marca[]);
    if (modelosRes.data) setModelos(modelosRes.data as Modelo[]);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = items.filter((item) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (item.serial || '').toLowerCase().includes(term) ||
      (item.codigo_interno || '').toLowerCase().includes(term) ||
      (item.categoria?.nombre || '').toLowerCase().includes(term) ||
      (item.modelo?.nombre || '').toLowerCase().includes(term);

    const matchesCategoria = filterCategoria ? item.id_categoria === Number(filterCategoria) : true;

    return matchesSearch && matchesCategoria;
  });

  const filteredModelos = form.id_marca
    ? modelos.filter((m) => m.id_marca === Number(form.id_marca))
    : modelos;

  function openModal(item?: JoinedComponente) {
    if (item) {
      setEditingItem(item);
      setForm({
        id_categoria: item.id_categoria || '',
        id_marca: item.id_marca || '',
        id_modelo: item.id_modelo || '',
        serial: item.serial || '',
        codigo_interno: item.codigo_interno || '',
        capacidad_gb: item.capacidad_gb ?? '',
        velocidad_mhz: item.velocidad_mhz ?? '',
        tecnologia: item.tecnologia || '',
        watts: item.watts ?? '',
        estado: item.estado || 'En Depósito',
        fecha_compra: item.fecha_compra ? item.fecha_compra.substring(0, 10) : '',
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
    const newErrors: Partial<Record<keyof ComponenteForm, string>> = {};
    if (!form.id_categoria) newErrors.id_categoria = 'La categoría es obligatoria';
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
      id_categoria: Number(form.id_categoria),
      id_marca: Number(form.id_marca),
      id_modelo: Number(form.id_modelo),
      serial: form.serial.trim() || null,
      codigo_interno: form.codigo_interno.trim(),
      capacidad_gb: form.capacidad_gb ? Number(form.capacidad_gb) : null,
      velocidad_mhz: form.velocidad_mhz ? Number(form.velocidad_mhz) : null,
      tecnologia: form.tecnologia.trim() || null,
      watts: form.watts ? Number(form.watts) : null,
      estado: form.estado as any,
      fecha_compra: form.fecha_compra || null,
      observaciones: form.observaciones.trim() || null,
    };

    if (editingItem) {
      const { error } = await supabase
        .from('componentes_pc')
        .update(payload)
        .eq('id', editingItem.id);

      if (error) {
        toast.error('Error al actualizar el componente');
        console.error(error);
      } else {
        toast.success('Componente actualizado correctamente');
        closeModal();
        loadData();
      }
    } else {
      const { error } = await supabase
        .from('componentes_pc')
        .insert(payload);

      if (error) {
        toast.error('Error al crear el componente');
        console.error(error);
      } else {
        toast.success('Componente creado correctamente');
        closeModal();
        loadData();
      }
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const { error } = await supabase
      .from('componentes_pc')
      .update({ estado: 'De Baja' })
      .eq('id', confirmDelete.id);

    if (error) {
      toast.error('Error al dar de baja el componente');
      console.error(error);
    } else {
      toast.success('Componente dado de baja correctamente');
      loadData();
    }
    setConfirmDelete(null);
  }

  function getEstadoBadge(estado?: string) {
    switch (estado) {
      case 'Asignado':
        return styles.badgeActive;
      case 'En Depósito':
        return styles.badgeInfo;
      case 'En Reparación':
        return styles.badgeWarning;
      case 'De Baja':
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
            <HardDrive size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Componentes de PC</h1>
            <p className={styles.pageSubtitle}>Inventario de discos, memorias RAM, procesadores y placas de video para upgrades</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={18} /> Agregar Componente
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por serial, código, categoría o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filterCategoria}
          onChange={(e) => setFilterCategoria(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className={styles.table}>
        <div className={styles.tableHeader} style={{ gridTemplateColumns: '1.5fr 2fr 1.5fr 100px 120px 100px' }}>
          <span>Categoría</span>
          <span>Marca / Modelo</span>
          <span>Serial</span>
          <span>Capacidad</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Cargando componentes...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <HardDrive size={48} className={styles.emptyIcon} />
            <p>No se encontraron componentes</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={styles.tableRowItem}
              style={{ gridTemplateColumns: '1.5fr 2fr 1.5fr 100px 120px 100px' }}
              onClick={() => openModal(item)}
            >
              <span className={styles.rowText} style={{ fontWeight: 600 }}>{item.categoria?.nombre}</span>
              <span className={styles.rowText}>
                {item.marca?.nombre} {item.modelo?.nombre}
              </span>
              <span className={styles.rowText} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                {item.serial || '—'}
              </span>
              <span>{item.capacidad_gb ? `${item.capacidad_gb} GB` : '—'}</span>
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
                {editingItem ? 'Editar Componente' : 'Nuevo Componente'}
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
                    placeholder="S/N"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Código Interno *</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.codigo_interno}
                    onChange={(e) => setForm({ ...form, codigo_interno: e.target.value })}
                    placeholder="Ej: HD-001"
                  />
                  {errors.codigo_interno && <span className={styles.fieldError}>{errors.codigo_interno}</span>}
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Capacidad (GB)</label>
                  <input
                    type="number"
                    className={styles.fieldInput}
                    value={form.capacidad_gb}
                    onChange={(e) => setForm({ ...form, capacidad_gb: e.target.value ? Number(e.target.value) : '' })}
                    placeholder="Ej: 512, 1024, 16"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Velocidad (MHz)</label>
                  <input
                    type="number"
                    className={styles.fieldInput}
                    value={form.velocidad_mhz}
                    onChange={(e) => setForm({ ...form, velocidad_mhz: e.target.value ? Number(e.target.value) : '' })}
                    placeholder="Ej: 3200, 4800"
                  />
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Tecnología / Tipo</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.tecnologia}
                    onChange={(e) => setForm({ ...form, tecnologia: e.target.value })}
                    placeholder="Ej: NVMe PCIe 4.0, DDR4, GDDR6"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Consumo (Watts)</label>
                  <input
                    type="number"
                    className={styles.fieldInput}
                    value={form.watts}
                    onChange={(e) => setForm({ ...form, watts: e.target.value ? Number(e.target.value) : '' })}
                    placeholder="Ej: 75, 250"
                  />
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
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Observaciones</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  placeholder="Detalles sobre slot compatible, etc."
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

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>¿Dar de baja componente?</h3>
            <p className={styles.confirmMessage}>
              ¿Está seguro de que desea dar de baja el componente <strong>{confirmDelete.codigo_interno}</strong>?
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className={styles.dangerBtn} onClick={handleDelete}>Dar de Baja</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
