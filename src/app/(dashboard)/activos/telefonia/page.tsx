'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Activo, ActivoTelefonia, TipoActivo, Marca, Modelo } from '@/types/database';
import { Phone, Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

const ESTADO_OPTIONS = ['En Depósito', 'Asignado', 'En Reparación', 'De Baja', 'Extraviado'];

interface TelefoniaForm {
  // Base activo fields
  id_marca: number | '';
  id_modelo: number | '';
  serial: string;
  codigo_interno: string;
  estado: string;
  observaciones: string;
  // Telefonia detail fields
  numero_interno: string;
  ip: string;
  mac: string;
  patchera: string;
  boca_red: string;
  notas_tecnicas: string;
}

const emptyForm: TelefoniaForm = {
  id_marca: '',
  id_modelo: '',
  serial: '',
  codigo_interno: '',
  estado: 'En Depósito',
  observaciones: '',
  numero_interno: '',
  ip: '',
  mac: '',
  patchera: '',
  boca_red: '',
  notas_tecnicas: '',
};

type JoinedTelefonia = ActivoTelefonia & {
  activo: Activo & {
    marca: Marca | null;
    modelo: Modelo | null;
    tipo_activo: TipoActivo | null;
  };
};

export default function TelefoniaPage() {
  const supabase = getSupabaseClient();

  const [items, setItems] = useState<JoinedTelefonia[]>([]);
  const [tiposActivo, setTiposActivo] = useState<TipoActivo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JoinedTelefonia | null>(null);
  const [form, setForm] = useState<TelefoniaForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<JoinedTelefonia | null>(null);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof TelefoniaForm, string>>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [telRes, tiposRes, marcasRes, modelosRes] = await Promise.all([
      supabase
        .from('activos_telefonia')
        .select('*, activo:activos(*, marca:marcas(*), modelo:modelos(*), tipo_activo:tipos_activo(*))')
        .order('created_at', { ascending: false }),
      supabase.from('tipos_activo').select('*').eq('activo', true).order('nombre'),
      supabase.from('marcas').select('*').eq('activo', true).order('nombre'),
      supabase.from('modelos').select('*').eq('activo', true).order('nombre'),
    ]);

    if (telRes.error) {
      toast.error('Error al cargar equipos de telefonía');
      console.error(telRes.error);
    } else {
      const activeTels = (telRes.data as JoinedTelefonia[]).filter(t => t.activo && !t.activo.dado_de_baja);
      setItems(activeTels);
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
      (item.numero_interno || '').toLowerCase().includes(term) ||
      (item.ip || '').toLowerCase().includes(term) ||
      (item.activo?.codigo_interno || '').toLowerCase().includes(term) ||
      (item.activo?.modelo?.nombre || '').toLowerCase().includes(term);

    const matchesEstado = filterEstado ? item.activo?.estado === filterEstado : true;

    return matchesSearch && matchesEstado;
  });

  const filteredModelos = form.id_marca
    ? modelos.filter((m) => m.id_marca === Number(form.id_marca))
    : modelos;

  function openModal(item?: JoinedTelefonia) {
    if (item) {
      setEditingItem(item);
      setForm({
        id_marca: item.activo?.id_marca || '',
        id_modelo: item.activo?.id_modelo || '',
        serial: item.activo?.serial || '',
        codigo_interno: item.activo?.codigo_interno || '',
        estado: item.activo?.estado || 'En Depósito',
        observaciones: item.activo?.observaciones || '',
        numero_interno: item.numero_interno || '',
        ip: item.ip || '',
        mac: item.mac || '',
        patchera: item.patchera || '',
        boca_red: item.boca_red || '',
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
    const newErrors: Partial<Record<keyof TelefoniaForm, string>> = {};
    if (!form.id_marca) newErrors.id_marca = 'La marca es obligatoria';
    if (!form.id_modelo) newErrors.id_modelo = 'El modelo es obligatorio';
    if (!form.codigo_interno.trim()) newErrors.codigo_interno = 'El código interno es obligatorio';
    if (!form.numero_interno.trim()) newErrors.numero_interno = 'El número interno es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    let idTipoActivo = tiposActivo.find(t => 
      t.nombre.toLowerCase().includes('telefono') || 
      t.nombre.toLowerCase().includes('phone') || 
      t.nombre.toLowerCase().includes('telefonia')
    )?.id;

    if (!idTipoActivo && tiposActivo.length > 0) {
      idTipoActivo = tiposActivo[0].id;
    }

    const activoPayload = {
      id_tipo_activo: idTipoActivo || 4, // Fallback
      id_marca: Number(form.id_marca),
      id_modelo: Number(form.id_modelo),
      serial: form.serial.trim() || null,
      codigo_interno: form.codigo_interno.trim(),
      estado: form.estado,
      observaciones: form.observaciones.trim() || null,
    };

    if (editingItem) {
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

      const telPayload = {
        numero_interno: form.numero_interno.trim(),
        ip: form.ip.trim() || null,
        mac: form.mac.trim() || null,
        patchera: form.patchera.trim() || null,
        boca_red: form.boca_red.trim() || null,
        notas_tecnicas: form.notas_tecnicas.trim() || null,
      };

      const { error: telError } = await supabase
        .from('activos_telefonia')
        .update(telPayload)
        .eq('id_activo', editingItem.id_activo);

      if (telError) {
        toast.error('Error al actualizar los detalles de telefonía');
        console.error(telError);
      } else {
        toast.success('Equipo de telefonía actualizado correctamente');
        closeModal();
        loadData();
      }
    } else {
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

      const telPayload = {
        id_activo: newActivo.id,
        numero_interno: form.numero_interno.trim(),
        ip: form.ip.trim() || null,
        mac: form.mac.trim() || null,
        patchera: form.patchera.trim() || null,
        boca_red: form.boca_red.trim() || null,
        notas_tecnicas: form.notas_tecnicas.trim() || null,
      };

      const { error: telError } = await supabase
        .from('activos_telefonia')
        .insert(telPayload);

      if (telError) {
        toast.error('Error al crear los detalles de telefonía');
        console.error(telError);
        await supabase.from('activos').delete().eq('id', newActivo.id);
      } else {
        toast.success('Equipo de telefonía creado correctamente');
        closeModal();
        loadData();
      }
    }
    setSaving(false);
  }

  async function handleBaja() {
    if (!confirmDelete) return;
    if (!motivoBaja.trim()) {
      toast.error('Debe ingresar un motivo para dar de baja el equipo');
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
      toast.success('Equipo de telefonía dado de baja correctamente');
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
            <Phone size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Telefonía IP</h1>
            <p className={styles.pageSubtitle}>Inventario y asignación de internos, teléfonos VoIP y terminales analógicas</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={18} /> Agregar Teléfono
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por interno, IP, código o modelo..."
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
        <div className={styles.tableHeader} style={{ gridTemplateColumns: '2fr 100px 1.2fr 1.2fr 120px 100px' }}>
          <span>Marca / Modelo</span>
          <span>Interno</span>
          <span>IP</span>
          <span>MAC</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Cargando equipos de telefonía...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Phone size={48} className={styles.emptyIcon} />
            <p>No se encontraron equipos de telefonía</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id_activo}
              className={styles.tableRowItem}
              style={{ gridTemplateColumns: '2fr 100px 1.2fr 1.2fr 120px 100px' }}
              onClick={() => openModal(item)}
            >
              <span className={styles.rowText} style={{ fontWeight: 600 }}>
                {item.activo?.marca?.nombre} {item.activo?.modelo?.nombre}
              </span>
              <span className={styles.rowText} style={{ fontWeight: 600 }}>{item.numero_interno || '—'}</span>
              <span className={styles.rowText} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                {item.ip || '—'}
              </span>
              <span className={styles.rowText} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                {item.mac || '—'}
              </span>
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
                {editingItem ? 'Editar Teléfono' : 'Nuevo Teléfono'}
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
                    placeholder="Ej: TEL-001"
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

              {/* Telefonia Specific Section */}
              <div style={{ borderBottom: '1px solid var(--border-secondary)', paddingBottom: '10px', margin: '15px 0 10px 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                Datos de Telefonía
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Número Interno *</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.numero_interno}
                    onChange={(e) => setForm({ ...form, numero_interno: e.target.value })}
                    placeholder="Ej: 104"
                  />
                  {errors.numero_interno && <span className={styles.fieldError}>{errors.numero_interno}</span>}
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Dirección MAC</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.mac}
                    onChange={(e) => setForm({ ...form, mac: e.target.value })}
                    placeholder="00:00:00:00:00:00"
                  />
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
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Boca de Red</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.boca_red}
                    onChange={(e) => setForm({ ...form, boca_red: e.target.value })}
                    placeholder="Identificación boca"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Patchera</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={form.patchera}
                  onChange={(e) => setForm({ ...form, patchera: e.target.value })}
                  placeholder="Identificación de patchera vinculada"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Notas Técnicas</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={form.notas_tecnicas}
                  onChange={(e) => setForm({ ...form, notas_tecnicas: e.target.value })}
                  placeholder="Detalles sobre configuración SIP, codec, etc."
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
            <h3 className={styles.confirmTitle}>Dar de baja equipo</h3>
            <p className={styles.confirmMessage}>
              ¿Está seguro de que desea dar de baja el teléfono con interno <strong>{confirmDelete.numero_interno}</strong>?
            </p>
            <div className={styles.field} style={{ textAlign: 'left', marginBottom: 'var(--space-4)' }}>
              <label className={styles.fieldLabel}>Motivo de la baja *</label>
              <input
                type="text"
                className={styles.fieldInput}
                value={motivoBaja}
                onChange={(e) => setMotivoBaja(e.target.value)}
                placeholder="Ej: Falla display, reemplazo por softphone..."
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
