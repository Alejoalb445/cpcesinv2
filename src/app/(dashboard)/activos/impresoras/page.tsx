'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Activo, ActivoImpresora, TipoActivo, Marca, Modelo } from '@/types/database';
import { Printer, Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

const TIPO_IMPRESORA_OPTIONS = [
  'Láser B/N',
  'Láser Color',
  'Tinta B/N',
  'Tinta Color',
  'Térmica',
  'Matricial',
  'Multifunción',
];
const CONEXION_OPTIONS = ['Red (Ethernet)', 'Wi-Fi', 'USB', 'Paralelo', 'Serial'];
const ESTADO_OPTIONS = ['En Depósito', 'Asignado', 'En Reparación', 'De Baja', 'Extraviado'];

interface ImpresoraForm {
  // Base activo fields
  id_marca: number | '';
  id_modelo: number | '';
  serial: string;
  codigo_interno: string;
  estado: string;
  observaciones: string;
  // Impresora detail fields
  tipo_impresora: string;
  ip: string;
  modo_conexion: string;
  contador_paginas: number | '';
  es_color: boolean;
  doble_faz: boolean;
  notas_tecnicas: string;
}

const emptyForm: ImpresoraForm = {
  id_marca: '',
  id_modelo: '',
  serial: '',
  codigo_interno: '',
  estado: 'En Depósito',
  observaciones: '',
  tipo_impresora: 'Láser B/N',
  ip: '',
  modo_conexion: 'Red (Ethernet)',
  contador_paginas: '',
  es_color: false,
  doble_faz: true,
  notas_tecnicas: '',
};

type JoinedImpresora = ActivoImpresora & {
  activo: Activo & {
    marca: Marca | null;
    modelo: Modelo | null;
    tipo_activo: TipoActivo | null;
  };
};

export default function ImpresorasPage() {
  const supabase = getSupabaseClient();

  const [items, setItems] = useState<JoinedImpresora[]>([]);
  const [tiposActivo, setTiposActivo] = useState<TipoActivo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JoinedImpresora | null>(null);
  const [form, setForm] = useState<ImpresoraForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<JoinedImpresora | null>(null);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof ImpresoraForm, string>>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [impRes, tiposRes, marcasRes, modelosRes] = await Promise.all([
      supabase
        .from('activos_impresoras')
        .select('*, activo:activos(*, marca:marcas(*), modelo:modelos(*), tipo_activo:tipos_activo(*))')
        .order('created_at', { ascending: false }),
      supabase.from('tipos_activo').select('*').eq('activo', true).order('nombre'),
      supabase.from('marcas').select('*').eq('activo', true).order('nombre'),
      supabase.from('modelos').select('*').eq('activo', true).order('nombre'),
    ]);

    if (impRes.error) {
      toast.error('Error al cargar impresoras');
      console.error(impRes.error);
    } else {
      const activeImps = (impRes.data as JoinedImpresora[]).filter(imp => imp.activo && !imp.activo.dado_de_baja);
      setItems(activeImps);
    }

    if (tiposRes.data) setTiposActivo(tiposRes.data as TipoActivo[]);
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
      (item.ip || '').toLowerCase().includes(term) ||
      (item.activo?.serial || '').toLowerCase().includes(term) ||
      (item.activo?.codigo_interno || '').toLowerCase().includes(term) ||
      (item.activo?.modelo?.nombre || '').toLowerCase().includes(term);

    const matchesEstado = filterEstado ? item.activo?.estado === filterEstado : true;

    return matchesSearch && matchesEstado;
  });

  const filteredModelos = form.id_marca
    ? modelos.filter((m) => m.id_marca === Number(form.id_marca))
    : modelos;

  function openModal(item?: JoinedImpresora) {
    if (item) {
      setEditingItem(item);
      setForm({
        id_marca: item.activo?.id_marca || '',
        id_modelo: item.activo?.id_modelo || '',
        serial: item.activo?.serial || '',
        codigo_interno: item.activo?.codigo_interno || '',
        estado: item.activo?.estado || 'En Depósito',
        observaciones: item.activo?.observaciones || '',
        tipo_impresora: item.tipo_impresora || 'Láser B/N',
        ip: item.ip || '',
        modo_conexion: item.modo_conexion || 'Red (Ethernet)',
        contador_paginas: item.contador_paginas ?? '',
        es_color: item.es_color ?? false,
        doble_faz: item.doble_faz ?? true,
        notas_tecnicas: item.notas_tecnicas || '',
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
    const newErrors: Partial<Record<keyof ImpresoraForm, string>> = {};
    if (!form.id_marca) newErrors.id_marca = 'La marca es obligatoria';
    if (!form.id_modelo) newErrors.id_modelo = 'El modelo es obligatorio';
    if (!form.codigo_interno.trim()) newErrors.codigo_interno = 'El código interno es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    let idTipoActivo = tiposActivo.find(t => 
      t.nombre.toLowerCase().includes('impresora') || 
      t.nombre.toLowerCase().includes('printer')
    )?.id;

    if (!idTipoActivo && tiposActivo.length > 0) {
      idTipoActivo = tiposActivo[0].id;
    }

    const activoPayload = {
      id_tipo_activo: idTipoActivo || 2, // Fallback
      id_marca: Number(form.id_marca),
      id_modelo: Number(form.id_modelo),
      serial: form.serial.trim() || null,
      codigo_interno: form.codigo_interno.trim(),
      estado: form.estado,
      observaciones: form.observaciones.trim() || null,
    };

    if (editingItem) {
      // Update Base Asset
      const { error: activeError } = await supabase
        .from('activos')
        .update(activoPayload)
        .eq('id', editingItem.id_activo);

      if (activeError) {
        toast.error('Error al actualizar el activo base');
        console.error(activeError);
        setSaving(false);
        return;
      }

      // Update Printer Detail
      const impPayload = {
        tipo_impresora: form.tipo_impresora,
        ip: form.ip.trim() || null,
        modo_conexion: form.modo_conexion,
        contador_paginas: form.contador_paginas ? Number(form.contador_paginas) : 0,
        es_color: form.es_color,
        doble_faz: form.doble_faz,
        notas_tecnicas: form.notas_tecnicas.trim() || null,
      };

      const { error: impError } = await supabase
        .from('activos_impresoras')
        .update(impPayload)
        .eq('id_activo', editingItem.id_activo);

      if (impError) {
        toast.error('Error al actualizar los detalles de la impresora');
        console.error(impError);
      } else {
        toast.success('Impresora actualizada correctamente');
        closeModal();
        loadData();
      }
    } else {
      // Create Base Asset First
      const { data: newActivo, error: activeError } = await supabase
        .from('activos')
        .insert(activoPayload)
        .select()
        .single();

      if (activeError) {
        toast.error('Error al crear el activo base');
        console.error(activeError);
        setSaving(false);
        return;
      }

      // Create Printer Detail linked to new activo
      const impPayload = {
        id_activo: newActivo.id,
        tipo_impresora: form.tipo_impresora,
        ip: form.ip.trim() || null,
        modo_conexion: form.modo_conexion,
        contador_paginas: form.contador_paginas ? Number(form.contador_paginas) : 0,
        es_color: form.es_color,
        doble_faz: form.doble_faz,
        notas_tecnicas: form.notas_tecnicas.trim() || null,
      };

      const { error: impError } = await supabase
        .from('activos_impresoras')
        .insert(impPayload);

      if (impError) {
        toast.error('Error al crear los detalles de la impresora');
        console.error(impError);
        // Rollback
        await supabase.from('activos').delete().eq('id', newActivo.id);
      } else {
        toast.success('Impresora creada correctamente');
        closeModal();
        loadData();
      }
    }
    setSaving(false);
  }

  async function handleBaja() {
    if (!confirmDelete) return;
    if (!motivoBaja.trim()) {
      toast.error('Debe ingresar un motivo para dar de baja la impresora');
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
      .eq('id', confirmDelete.id_activo);

    if (error) {
      toast.error('Error al dar de baja el equipo');
      console.error(error);
    } else {
      toast.success('Impresora dada de baja correctamente');
      loadData();
    }
    setConfirmDelete(null);
    setMotivoBaja('');
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
            <Printer size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Impresoras</h1>
            <p className={styles.pageSubtitle}>Gestión técnica de impresoras, multifuncionales y etiquetadoras</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={18} /> Agregar Impresora
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por IP, código, serial o modelo..."
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
        <div className={styles.tableHeader} style={{ gridTemplateColumns: '1.2fr 2fr 1.2fr 100px 80px 120px 100px' }}>
          <span>Tipo</span>
          <span>Marca / Modelo</span>
          <span>IP</span>
          <span>Conexión</span>
          <span>Color</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Cargando impresoras...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Printer size={48} className={styles.emptyIcon} />
            <p>No se encontraron impresoras</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id_activo}
              className={styles.tableRowItem}
              style={{ gridTemplateColumns: '1.2fr 2fr 1.2fr 100px 80px 120px 100px' }}
              onClick={() => openModal(item)}
            >
              <span className={styles.rowText} style={{ fontWeight: 600 }}>{item.tipo_impresora}</span>
              <span className={styles.rowText}>
                {item.activo?.marca?.nombre} {item.activo?.modelo?.nombre}
              </span>
              <span className={styles.rowText} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                {item.ip || '—'}
              </span>
              <span>{item.modo_conexion || '—'}</span>
              <span>{item.es_color ? 'Sí' : 'No'}</span>
              <span>
                <span className={`${styles.badge} ${getEstadoBadge(item.activo?.estado)}`}>
                  {item.activo?.estado}
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
                {editingItem ? 'Editar Impresora' : 'Nueva Impresora'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* Activo Base Section */}
              <div style={{ borderBottom: '1px solid var(--border-secondary)', paddingBottom: '10px', marginBottom: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Datos de Activo Base
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
                    placeholder="Ej: IMP-001"
                  />
                  {errors.codigo_interno && <span className={styles.fieldError}>{errors.codigo_interno}</span>}
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Estado Activo</label>
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
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Observaciones</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.observaciones}
                    onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                    placeholder="Observaciones generales"
                  />
                </div>
              </div>

              {/* Impresora Specific Section */}
              <div style={{ borderBottom: '1px solid var(--border-secondary)', paddingBottom: '10px', margin: '15px 0 10px 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                Datos Técnicos de Impresora
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Tipo de Impresora</label>
                  <select
                    className={styles.fieldInput}
                    value={form.tipo_impresora}
                    onChange={(e) => setForm({ ...form, tipo_impresora: e.target.value })}
                  >
                    {TIPO_IMPRESORA_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Modo de Conexión</label>
                  <select
                    className={styles.fieldInput}
                    value={form.modo_conexion}
                    onChange={(e) => setForm({ ...form, modo_conexion: e.target.value })}
                  >
                    {CONEXION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>IP</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.ip}
                    onChange={(e) => setForm({ ...form, ip: e.target.value })}
                    placeholder="192.168.x.x"
                    disabled={form.modo_conexion === 'USB'}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Contador de Páginas</label>
                  <input
                    type="number"
                    className={styles.fieldInput}
                    value={form.contador_paginas}
                    onChange={(e) => setForm({ ...form, contador_paginas: e.target.value ? Number(e.target.value) : '' })}
                    placeholder="Ej: 12500"
                  />
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <div className={styles.checkboxRow} style={{ marginTop: '10px' }}>
                    <input
                      type="checkbox"
                      id="es_color"
                      checked={form.es_color}
                      onChange={(e) => setForm({ ...form, es_color: e.target.checked })}
                    />
                    <label htmlFor="es_color" className={styles.fieldLabel}>Es Color</label>
                  </div>
                </div>
                <div className={styles.field}>
                  <div className={styles.checkboxRow} style={{ marginTop: '10px' }}>
                    <input
                      type="checkbox"
                      id="doble_faz"
                      checked={form.doble_faz}
                      onChange={(e) => setForm({ ...form, doble_faz: e.target.checked })}
                    />
                    <label htmlFor="doble_faz" className={styles.fieldLabel}>Doble Faz / Duplex</label>
                  </div>
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Notas Técnicas / Insumos Compatibles</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={form.notas_tecnicas}
                  onChange={(e) => setForm({ ...form, notas_tecnicas: e.target.value })}
                  placeholder="Detalles sobre tóner compatible (ej: CF258A), fusor, etc."
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
            <h3 className={styles.confirmTitle}>Dar de baja impresora</h3>
            <p className={styles.confirmMessage}>
              ¿Está seguro de que desea dar de baja la impresora <strong>{confirmDelete.activo?.codigo_interno}</strong>?
            </p>
            <div className={styles.field} style={{ textAlign: 'left', marginBottom: 'var(--space-4)' }}>
              <label className={styles.fieldLabel}>Motivo de la baja *</label>
              <input
                type="text"
                className={styles.fieldInput}
                value={motivoBaja}
                onChange={(e) => setMotivoBaja(e.target.value)}
                placeholder="Ej: Falla fusor insostenible, obsoleta..."
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
