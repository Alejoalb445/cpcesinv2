'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Activo, ActivoRed, TipoActivo, Marca, Modelo } from '@/types/database';
import { Network, Plus, Search, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

const ESTADO_OPTIONS = ['En Depósito', 'Asignado', 'En Reparación', 'De Baja', 'Extraviado'];

interface RedForm {
  // Base activo fields
  id_marca: number | '';
  id_modelo: number | '';
  serial: string;
  codigo_interno: string;
  estado: string;
  observaciones: string;
  // Red detail fields
  ip: string;
  mac: string;
  hostname: string;
  cantidad_puertos: number | '';
  ubicacion_logica: string;
  notas_tecnicas: string;
}

const emptyForm: RedForm = {
  id_marca: '',
  id_modelo: '',
  serial: '',
  codigo_interno: '',
  estado: 'En Depósito',
  observaciones: '',
  ip: '',
  mac: '',
  hostname: '',
  cantidad_puertos: '',
  ubicacion_logica: '',
  notas_tecnicas: '',
};

type JoinedRed = ActivoRed & {
  activo: Activo & {
    marca: Marca | null;
    modelo: Modelo | null;
    tipo_activo: TipoActivo | null;
  };
};

export default function RedPage() {
  const supabase = getSupabaseClient();

  const [items, setItems] = useState<JoinedRed[]>([]);
  const [tiposActivo, setTiposActivo] = useState<TipoActivo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JoinedRed | null>(null);
  const [form, setForm] = useState<RedForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<JoinedRed | null>(null);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof RedForm, string>>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [redRes, tiposRes, marcasRes, modelosRes] = await Promise.all([
      supabase
        .from('activos_red')
        .select('*, activo:activos(*, marca:marcas(*), modelo:modelos(*), tipo_activo:tipos_activo(*))')
        .order('created_at', { ascending: false }),
      supabase.from('tipos_activo').select('*').eq('activo', true).order('nombre'),
      supabase.from('marcas').select('*').eq('activo', true).order('nombre'),
      supabase.from('modelos').select('*').eq('activo', true).order('nombre'),
    ]);

    if (redRes.error) {
      toast.error('Error al cargar equipos de red');
      console.error(redRes.error);
    } else {
      const activeReds = (redRes.data as JoinedRed[]).filter(r => r.activo && !r.activo.dado_de_baja);
      setItems(activeReds);
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
      (item.hostname || '').toLowerCase().includes(term) ||
      (item.ip || '').toLowerCase().includes(term) ||
      (item.mac || '').toLowerCase().includes(term) ||
      (item.activo?.codigo_interno || '').toLowerCase().includes(term) ||
      (item.activo?.modelo?.nombre || '').toLowerCase().includes(term);

    const matchesEstado = filterEstado ? item.activo?.estado === filterEstado : true;

    return matchesSearch && matchesEstado;
  });

  const filteredModelos = form.id_marca
    ? modelos.filter((m) => m.id_marca === Number(form.id_marca))
    : modelos;

  function openModal(item?: JoinedRed) {
    if (item) {
      setEditingItem(item);
      setForm({
        id_marca: item.activo?.id_marca || '',
        id_modelo: item.activo?.id_modelo || '',
        serial: item.activo?.serial || '',
        codigo_interno: item.activo?.codigo_interno || '',
        estado: item.activo?.estado || 'En Depósito',
        observaciones: item.activo?.observaciones || '',
        ip: item.ip || '',
        mac: item.mac || '',
        hostname: item.hostname || '',
        cantidad_puertos: item.cantidad_puertos ?? '',
        ubicacion_logica: item.ubicacion_logica || '',
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
    const newErrors: Partial<Record<keyof RedForm, string>> = {};
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
      t.nombre.toLowerCase().includes('switch') || 
      t.nombre.toLowerCase().includes('router') || 
      t.nombre.toLowerCase().includes('red')
    )?.id;

    if (!idTipoActivo && tiposActivo.length > 0) {
      idTipoActivo = tiposActivo[0].id;
    }

    const activoPayload = {
      id_tipo_activo: idTipoActivo || 3, // Fallback
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

      const redPayload = {
        ip: form.ip.trim() || null,
        mac: form.mac.trim() || null,
        hostname: form.hostname.trim() || null,
        cantidad_puertos: form.cantidad_puertos ? Number(form.cantidad_puertos) : null,
        ubicacion_logica: form.ubicacion_logica.trim() || null,
        notas_tecnicas: form.notas_tecnicas.trim() || null,
      };

      const { error: redError } = await supabase
        .from('activos_red')
        .update(redPayload)
        .eq('id_activo', editingItem.id_activo);

      if (redError) {
        toast.error('Error al actualizar los detalles de red');
        console.error(redError);
      } else {
        toast.success('Dispositivo de red actualizado correctamente');
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

      const redPayload = {
        id_activo: newActivo.id,
        ip: form.ip.trim() || null,
        mac: form.mac.trim() || null,
        hostname: form.hostname.trim() || null,
        cantidad_puertos: form.cantidad_puertos ? Number(form.cantidad_puertos) : null,
        ubicacion_logica: form.ubicacion_logica.trim() || null,
        notas_tecnicas: form.notas_tecnicas.trim() || null,
      };

      const { error: redError } = await supabase
        .from('activos_red')
        .insert(redPayload);

      if (redError) {
        toast.error('Error al crear los detalles de red');
        console.error(redError);
        await supabase.from('activos').delete().eq('id', newActivo.id);
      } else {
        toast.success('Dispositivo de red creado correctamente');
        closeModal();
        loadData();
      }
    }
    setSaving(false);
  }

  async function handleBaja() {
    if (!confirmDelete) return;
    if (!motivoBaja.trim()) {
      toast.error('Debe ingresar un motivo para dar de baja el dispositivo');
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
      toast.success('Dispositivo de red dado de baja correctamente');
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
            <Network size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Dispositivos de Red</h1>
            <p className={styles.pageSubtitle}>Inventario de switches, routers, access points y firewalls</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={18} /> Agregar Equipo
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por hostname, IP, MAC, código o modelo..."
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
        <div className={styles.tableHeader} style={{ gridTemplateColumns: '1fr 1.5fr 1.2fr 1.2fr 1.2fr 80px 100px' }}>
          <span>Tipo</span>
          <span>Marca / Modelo</span>
          <span>IP</span>
          <span>MAC</span>
          <span>Hostname</span>
          <span>Puertos</span>
          <span>Acciones</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Cargando equipos de red...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Network size={48} className={styles.emptyIcon} />
            <p>No se encontraron dispositivos de red</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id_activo}
              className={styles.tableRowItem}
              style={{ gridTemplateColumns: '1fr 1.5fr 1.2fr 1.2fr 1.2fr 80px 100px' }}
              onClick={() => openModal(item)}
            >
              <span className={styles.rowText} style={{ fontWeight: 600 }}>
                {item.activo?.tipo_activo?.nombre || '—'}
              </span>
              <span className={styles.rowText}>
                {item.activo?.marca?.nombre} {item.activo?.modelo?.nombre}
              </span>
              <span className={styles.rowText} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                {item.ip || '—'}
              </span>
              <span className={styles.rowText} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                {item.mac || '—'}
              </span>
              <span className={styles.rowText}>{item.hostname || '—'}</span>
              <span>{item.cantidad_puertos || '—'}</span>
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
                {editingItem ? 'Editar Dispositivo' : 'Nuevo Dispositivo'}
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
                    placeholder="Ej: SW-001"
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

              {/* Red Specific Section */}
              <div style={{ borderBottom: '1px solid var(--border-secondary)', paddingBottom: '10px', margin: '15px 0 10px 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                Datos de Red
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Hostname</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.hostname}
                    onChange={(e) => setForm({ ...form, hostname: e.target.value })}
                    placeholder="Ej: switch-core"
                  />
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
                  <label className={styles.fieldLabel}>IP de Gestión</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.ip}
                    onChange={(e) => setForm({ ...form, ip: e.target.value })}
                    placeholder="192.168.x.x"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Cantidad de Puertos</label>
                  <input
                    type="number"
                    className={styles.fieldInput}
                    value={form.cantidad_puertos}
                    onChange={(e) => setForm({ ...form, cantidad_puertos: e.target.value ? Number(e.target.value) : '' })}
                    placeholder="Ej: 24 o 48"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Ubicación Lógica / VLANs</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={form.ubicacion_logica}
                  onChange={(e) => setForm({ ...form, ubicacion_logica: e.target.value })}
                  placeholder="Ej: Rack Principal, VLANs: 10, 20, 30"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Notas Técnicas</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={form.notas_tecnicas}
                  onChange={(e) => setForm({ ...form, notas_tecnicas: e.target.value })}
                  placeholder="Detalles sobre firmware, credenciales de respaldo, puertos asignados..."
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
            <h3 className={styles.confirmTitle}>Dar de baja dispositivo</h3>
            <p className={styles.confirmMessage}>
              ¿Está seguro de que desea dar de baja el equipo de red <strong>{confirmDelete.activo?.codigo_interno}</strong>?
            </p>
            <div className={styles.field} style={{ textAlign: 'left', marginBottom: 'var(--space-4)' }}>
              <label className={styles.fieldLabel}>Motivo de la baja *</label>
              <input
                type="text"
                className={styles.fieldInput}
                value={motivoBaja}
                onChange={(e) => setMotivoBaja(e.target.value)}
                placeholder="Ej: Falla puertos, daño por sobretensión..."
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
