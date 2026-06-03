'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Activo, ActivoPc, TipoActivo, Marca, Modelo } from '@/types/database';
import { Cpu, Plus, Search, Pencil, Trash2, X, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

const TIPO_PC_OPTIONS = ['Desktop', 'Notebook', 'Servidor', 'All-in-One', 'Mini PC', 'Tablet'];
const SO_OPTIONS = ['Windows 10 Pro', 'Windows 11 Pro', 'Windows Server 2019', 'Windows Server 2022', 'Ubuntu LTS', 'Debian', 'macOS', 'Otro'];
const MODO_IP_OPTIONS = ['DHCP', 'Estática', 'No aplica'];
const ESTADO_OPTIONS = ['En Depósito', 'Asignado', 'En Reparación', 'De Baja', 'Extraviado'];

interface PcForm {
  // Base activo fields
  id_marca: number | '';
  id_modelo: number | '';
  serial: string;
  codigo_interno: string;
  estado: string;
  observaciones: string;
  // PC detail fields
  tipo_pc: string;
  hostname: string;
  mac: string;
  sistema_operativo: string;
  arquitectura: string;
  dominio_ad: boolean;
  usuario_ad: string;
  ip: string;
  modo_ip: string;
  notas_tecnicas: string;
}

const emptyForm: PcForm = {
  id_marca: '',
  id_modelo: '',
  serial: '',
  codigo_interno: '',
  estado: 'En Depósito',
  observaciones: '',
  tipo_pc: 'Desktop',
  hostname: '',
  mac: '',
  sistema_operativo: 'Windows 10 Pro',
  arquitectura: 'x64',
  dominio_ad: true,
  usuario_ad: '',
  ip: '',
  modo_ip: 'DHCP',
  notas_tecnicas: '',
};

type JoinedPc = ActivoPc & {
  activo: Activo & {
    marca: Marca | null;
    modelo: Modelo | null;
    tipo_activo: TipoActivo | null;
  };
};

export default function PcsPage() {
  const supabase = getSupabaseClient();

  const [items, setItems] = useState<JoinedPc[]>([]);
  const [tiposActivo, setTiposActivo] = useState<TipoActivo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JoinedPc | null>(null);
  const [form, setForm] = useState<PcForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<JoinedPc | null>(null);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof PcForm, string>>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [pcsRes, tiposRes, marcasRes, modelosRes] = await Promise.all([
      supabase
        .from('activos_pc')
        .select('*, activo:activos(*, marca:marcas(*), modelo:modelos(*), tipo_activo:tipos_activo(*))')
        .order('created_at', { ascending: false }),
      supabase.from('tipos_activo').select('*').eq('activo', true).order('nombre'),
      supabase.from('marcas').select('*').eq('activo', true).order('nombre'),
      supabase.from('modelos').select('*').eq('activo', true).order('nombre'),
    ]);

    if (pcsRes.error) {
      toast.error('Error al cargar computadoras');
      console.error(pcsRes.error);
    } else {
      // Filter out items where base asset is already dado_de_baja
      const activePcs = (pcsRes.data as JoinedPc[]).filter(pc => pc.activo && !pc.activo.dado_de_baja);
      setItems(activePcs);
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
      (item.activo?.serial || '').toLowerCase().includes(term) ||
      (item.activo?.codigo_interno || '').toLowerCase().includes(term) ||
      (item.activo?.modelo?.nombre || '').toLowerCase().includes(term);

    const matchesEstado = filterEstado ? item.activo?.estado === filterEstado : true;

    return matchesSearch && matchesEstado;
  });

  const filteredModelos = form.id_marca
    ? modelos.filter((m) => m.id_marca === Number(form.id_marca))
    : modelos;

  function openModal(item?: JoinedPc) {
    if (item) {
      setEditingItem(item);
      setForm({
        id_marca: item.activo?.id_marca || '',
        id_modelo: item.activo?.id_modelo || '',
        serial: item.activo?.serial || '',
        codigo_interno: item.activo?.codigo_interno || '',
        estado: item.activo?.estado || 'En Depósito',
        observaciones: item.activo?.observaciones || '',
        tipo_pc: item.tipo_pc || 'Desktop',
        hostname: item.hostname || '',
        mac: item.mac || '',
        sistema_operativo: item.sistema_operativo || 'Windows 10 Pro',
        arquitectura: item.arquitectura || 'x64',
        dominio_ad: item.dominio_ad ?? true,
        usuario_ad: item.usuario_ad || '',
        ip: item.ip || '',
        modo_ip: item.modo_ip || 'DHCP',
        notes_tecnicas: item.notas_tecnicas || '', // fallback
      } as any);
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
    const newErrors: Partial<Record<keyof PcForm, string>> = {};
    if (!form.id_marca) newErrors.id_marca = 'La marca es obligatoria';
    if (!form.id_modelo) newErrors.id_modelo = 'El modelo es obligatorio';
    if (!form.codigo_interno.trim()) newErrors.codigo_interno = 'El código interno es obligatorio';
    if (!form.hostname.trim()) newErrors.hostname = 'El hostname es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    // 1. Find type for "PC / Notebook"
    let idTipoActivo = tiposActivo.find(t => 
      t.nombre.toLowerCase().includes('pc') || 
      t.nombre.toLowerCase().includes('notebook') || 
      t.nombre.toLowerCase().includes('computadora')
    )?.id;

    if (!idTipoActivo && tiposActivo.length > 0) {
      idTipoActivo = tiposActivo[0].id;
    }

    const activoPayload = {
      id_tipo_activo: idTipoActivo || 1, // Fallback to 1 if not found
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

      // Update PC Detail
      const pcPayload = {
        tipo_pc: form.tipo_pc,
        hostname: form.hostname.trim() || null,
        mac: form.mac.trim() || null,
        sistema_operativo: form.sistema_operativo,
        arquitectura: form.arquitectura || null,
        dominio_ad: form.dominio_ad,
        usuario_ad: form.usuario_ad.trim() || null,
        ip: form.ip.trim() || null,
        modo_ip: form.modo_ip,
        notas_tecnicas: form.notas_tecnicas.trim() || null,
      };

      const { error: pcError } = await supabase
        .from('activos_pc')
        .update(pcPayload)
        .eq('id_activo', editingItem.id_activo);

      if (pcError) {
        toast.error('Error al actualizar los detalles de la PC');
        console.error(pcError);
      } else {
        toast.success('PC actualizada correctamente');
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

      // Create PC Detail linked to new activo
      const pcPayload = {
        id_activo: newActivo.id,
        tipo_pc: form.tipo_pc,
        hostname: form.hostname.trim() || null,
        mac: form.mac.trim() || null,
        sistema_operativo: form.sistema_operativo,
        arquitectura: form.arquitectura || null,
        dominio_ad: form.dominio_ad,
        usuario_ad: form.usuario_ad.trim() || null,
        ip: form.ip.trim() || null,
        modo_ip: form.modo_ip,
        notas_tecnicas: form.notas_tecnicas.trim() || null,
      };

      const { error: pcError } = await supabase
        .from('activos_pc')
        .insert(pcPayload);

      if (pcError) {
        toast.error('Error al crear los detalles de la PC');
        console.error(pcError);
        // Try to rollback base asset to keep consistency
        await supabase.from('activos').delete().eq('id', newActivo.id);
      } else {
        toast.success('PC creada correctamente');
        closeModal();
        loadData();
      }
    }
    setSaving(false);
  }

  async function handleBaja() {
    if (!confirmDelete) return;
    if (!motivoBaja.trim()) {
      toast.error('Debe ingresar un motivo para dar de baja la PC');
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
      toast.success('PC dada de baja correctamente');
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
            <Cpu size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>PCs / Notebooks</h1>
            <p className={styles.pageSubtitle}>Administración detallada de computadoras, servidores y portátiles</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={18} /> Agregar PC
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por hostname, IP, código o serial..."
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
        <div className={styles.tableHeader} style={{ gridTemplateColumns: '100px 1.2fr 1.5fr 1.5fr 1.2fr 120px 100px' }}>
          <span>Tipo</span>
          <span>Hostname</span>
          <span>Marca / Modelo</span>
          <span>S.O.</span>
          <span>IP</span>
          <span>Estado</span>
          <span>Acciones</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Cargando equipos...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <Cpu size={48} className={styles.emptyIcon} />
            <p>No se encontraron computadoras</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id_activo}
              className={styles.tableRowItem}
              style={{ gridTemplateColumns: '100px 1.2fr 1.5fr 1.5fr 1.2fr 120px 100px' }}
              onClick={() => openModal(item)}
            >
              <span className={styles.rowText} style={{ fontWeight: 600 }}>{item.tipo_pc}</span>
              <span className={styles.rowText} style={{ fontFamily: 'var(--font-mono)' }}>{item.hostname || '—'}</span>
              <span className={styles.rowText}>
                {item.activo?.marca?.nombre} {item.activo?.modelo?.nombre}
              </span>
              <span className={styles.rowText}>{item.sistema_operativo || '—'}</span>
              <span className={styles.rowText} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                {item.ip || '—'}
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
                {editingItem ? 'Editar Computadora' : 'Nueva Computadora'}
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
                    placeholder="Ej: PC-001"
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

              {/* PC Specific Section */}
              <div style={{ borderBottom: '1px solid var(--border-secondary)', paddingBottom: '10px', margin: '15px 0 10px 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                Datos Técnicos de PC
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Tipo de Computadora</label>
                  <select
                    className={styles.fieldInput}
                    value={form.tipo_pc}
                    onChange={(e) => setForm({ ...form, tipo_pc: e.target.value })}
                  >
                    {TIPO_PC_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Hostname *</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.hostname}
                    onChange={(e) => setForm({ ...form, hostname: e.target.value })}
                    placeholder="Ej: CPC-PC01"
                  />
                  {errors.hostname && <span className={styles.fieldError}>{errors.hostname}</span>}
                </div>
              </div>

              <div className={styles.fieldRow}>
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
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Sistema Operativo</label>
                  <select
                    className={styles.fieldInput}
                    value={form.sistema_operativo}
                    onChange={(e) => setForm({ ...form, sistema_operativo: e.target.value })}
                  >
                    {SO_OPTIONS.map((opt) => (
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
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Modo IP</label>
                  <select
                    className={styles.fieldInput}
                    value={form.modo_ip}
                    onChange={(e) => setForm({ ...form, modo_ip: e.target.value })}
                  >
                    {MODO_IP_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field} style={{ display: 'flex', justifyContent: 'center' }}>
                  <div className={styles.checkboxRow} style={{ marginTop: '24px' }}>
                    <input
                      type="checkbox"
                      id="dominio_ad"
                      checked={form.dominio_ad}
                      onChange={(e) => setForm({ ...form, dominio_ad: e.target.checked })}
                    />
                    <label htmlFor="dominio_ad" className={styles.fieldLabel}>Unido a Dominio AD</label>
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Usuario AD</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={form.usuario_ad}
                    onChange={(e) => setForm({ ...form, usuario_ad: e.target.value })}
                    placeholder="Ej: jdoe"
                    disabled={!form.dominio_ad}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Notas Técnicas / Upgrades</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={form.notas_tecnicas}
                  onChange={(e) => setForm({ ...form, notas_tecnicas: e.target.value })}
                  placeholder="Detalles sobre memoria RAM, disco, procesador, upgrades instalados..."
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
            <h3 className={styles.confirmTitle}>Dar de baja PC</h3>
            <p className={styles.confirmMessage}>
              ¿Está seguro de que desea dar de baja la computadora <strong>{confirmDelete.activo?.codigo_interno} (Hostname: {confirmDelete.hostname})</strong>?
            </p>
            <div className={styles.field} style={{ textAlign: 'left', marginBottom: 'var(--space-4)' }}>
              <label className={styles.fieldLabel}>Motivo de la baja *</label>
              <input
                type="text"
                className={styles.fieldInput}
                value={motivoBaja}
                onChange={(e) => setMotivoBaja(e.target.value)}
                placeholder="Ej: Falla placa madre, obsoleto..."
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
