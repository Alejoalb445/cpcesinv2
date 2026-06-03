'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Activo, ActivoDvrNvr, ActivoCamara, TipoActivo, Marca, Modelo, UbicacionFisica } from '@/types/database';
import { Camera, Plus, Search, Pencil, Trash2, X, Server } from 'lucide-react';
import { toast } from 'sonner';
import styles from '@/styles/module.module.css';

const TIPO_DVR_OPTIONS = ['DVR', 'NVR'];
const TIPO_CAMARA_OPTIONS = ['IP', 'Analógica', 'PTZ', 'Wifi'];
const ESTADO_OPTIONS = ['En Depósito', 'Asignado', 'En Reparación', 'De Baja', 'Extraviado'];

interface DvrForm {
  // Base activo fields
  id_marca: number | '';
  id_modelo: number | '';
  serial: string;
  codigo_interno: string;
  estado: string;
  observaciones: string;
  // DVR fields
  tipo: 'DVR' | 'NVR';
  ip: string;
  cantidad_canales: number;
  capacidad_almacenamiento: string;
  id_ubicacion_fisica: number | '';
  ubicacion_especifica: string;
  notas_tecnicas: string;
}

interface CamaraForm {
  // Base activo fields
  id_marca: number | '';
  id_modelo: number | '';
  serial: string;
  codigo_interno: string;
  estado: string;
  observaciones: string;
  // Camara fields
  tipo_camara: string;
  ip: string;
  id_dvr_nvr: number | '';
  canal: number | '';
  id_ubicacion_fisica: number | '';
  ubicacion_especifica: string;
  notas_tecnicas: string;
}

const emptyDvr: DvrForm = {
  id_marca: '',
  id_modelo: '',
  serial: '',
  codigo_interno: '',
  estado: 'En Depósito',
  observaciones: '',
  tipo: 'NVR',
  ip: '',
  cantidad_canales: 16,
  capacidad_almacenamiento: '4TB',
  id_ubicacion_fisica: '',
  ubicacion_especifica: '',
  notas_tecnicas: '',
};

const emptyCamara: CamaraForm = {
  id_marca: '',
  id_modelo: '',
  serial: '',
  codigo_interno: '',
  estado: 'En Depósito',
  observaciones: '',
  tipo_camara: 'IP',
  ip: '',
  id_dvr_nvr: '',
  canal: '',
  id_ubicacion_fisica: '',
  ubicacion_especifica: '',
  notas_tecnicas: '',
};

type JoinedDvr = ActivoDvrNvr & {
  activo: Activo & { marca: Marca | null; modelo: Modelo | null };
  ubicacion_fisica: UbicacionFisica | null;
};

type JoinedCamara = ActivoCamara & {
  activo: Activo & { marca: Marca | null; modelo: Modelo | null };
  ubicacion_fisica: UbicacionFisica | null;
  dvr_nvr?: {
    tipo: string;
    activo?: { codigo_interno: string | null };
  };
};

export default function CctvPage() {
  const supabase = getSupabaseClient();

  const [activeTab, setActiveTab] = useState<'Dvr' | 'Camaras'>('Dvr');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Data
  const [dvrs, setDvrs] = useState<JoinedDvr[]>([]);
  const [camaras, setCamaras] = useState<JoinedCamara[]>([]);

  // Catalogs
  const [tiposActivo, setTiposActivo] = useState<TipoActivo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [ubicaciones, setUbicaciones] = useState<UbicacionFisica[]>([]);

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDvr, setEditingDvr] = useState<JoinedDvr | null>(null);
  const [editingCamara, setEditingCamara] = useState<JoinedCamara | null>(null);

  // Forms
  const [dvrForm, setDvrForm] = useState<DvrForm>(emptyDvr);
  const [camForm, setCamForm] = useState<CamaraForm>(emptyCamara);

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    const [dvrRes, camRes, tiposRes, marcasRes, modelosRes, ubicRes] = await Promise.all([
      supabase
        .from('activos_dvr_nvr')
        .select('*, activo:activos(*, marca:marcas(*), modelo:modelos(*)), ubicacion_fisica:ubicaciones_fisicas(*)')
        .order('created_at', { ascending: false }),
      supabase
        .from('activos_camaras')
        .select('*, activo:activos(*, marca:marcas(*), modelo:modelos(*)), dvr_nvr:activos_dvr_nvr(*, activo:activos(*)), ubicacion_fisica:ubicaciones_fisicas(*)')
        .order('created_at', { ascending: false }),
      supabase.from('tipos_activo').select('*').eq('activo', true).order('nombre'),
      supabase.from('marcas').select('*').eq('activo', true).order('nombre'),
      supabase.from('modelos').select('*').eq('activo', true).order('nombre'),
      supabase.from('ubicaciones_fisicas').select('*, sede:sedes(nombre)').eq('activo', true).order('detalle'),
    ]);

    if (dvrRes.data) {
      const activeDvrs = (dvrRes.data as JoinedDvr[]).filter(d => d.activo && !d.activo.dado_de_baja);
      setDvrs(activeDvrs);
    }
    if (camRes.data) {
      const activeCams = (camRes.data as JoinedCamara[]).filter(c => c.activo && !c.activo.dado_de_baja);
      setCamaras(activeCams);
    }

    if (tiposRes.data) setTiposActivo(tiposRes.data as TipoActivo[]);
    if (marcasRes.data) setMarcas(marcasRes.data as Marca[]);
    if (modelosRes.data) setModelos(modelosRes.data as Modelo[]);
    if (ubicRes.data) setUbicaciones(ubicRes.data as UbicacionFisica[]);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtering
  const filteredDvrs = dvrs.filter((d) => {
    const term = searchTerm.toLowerCase();
    return (
      (d.ip || '').toLowerCase().includes(term) ||
      (d.activo?.codigo_interno || '').toLowerCase().includes(term) ||
      (d.activo?.modelo?.nombre || '').toLowerCase().includes(term)
    );
  });

  const filteredCamaras = camaras.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.ip || '').toLowerCase().includes(term) ||
      (c.activo?.codigo_interno || '').toLowerCase().includes(term) ||
      (c.activo?.modelo?.nombre || '').toLowerCase().includes(term)
    );
  });

  // Handle marca-model filtering
  const currentMarcaId = activeTab === 'Dvr' ? dvrForm.id_marca : camForm.id_marca;
  const filteredModelos = currentMarcaId
    ? modelos.filter(m => m.id_marca === Number(currentMarcaId))
    : modelos;

  function openModal(item?: any) {
    setErrors({});
    if (activeTab === 'Dvr') {
      if (item) {
        setEditingDvr(item);
        setDvrForm({
          id_marca: item.activo?.id_marca || '',
          id_modelo: item.activo?.id_modelo || '',
          serial: item.activo?.serial || '',
          codigo_interno: item.activo?.codigo_interno || '',
          estado: item.activo?.estado || 'En Depósito',
          observaciones: item.activo?.observaciones || '',
          tipo: item.tipo || 'NVR',
          ip: item.ip || '',
          cantidad_canales: item.cantidad_canales || 16,
          capacidad_almacenamiento: item.capacidad_almacenamiento || '',
          id_ubicacion_fisica: item.id_ubicacion_fisica || '',
          ubicacion_especifica: item.ubicacion_especifica || '',
          notas_tecnicas: item.notas_tecnicas || '',
        });
      } else {
        setEditingDvr(null);
        setDvrForm(emptyDvr);
      }
    } else {
      if (item) {
        setEditingCamara(item);
        setCamForm({
          id_marca: item.activo?.id_marca || '',
          id_modelo: item.activo?.id_modelo || '',
          serial: item.activo?.serial || '',
          codigo_interno: item.activo?.codigo_interno || '',
          estado: item.activo?.estado || 'En Depósito',
          observaciones: item.activo?.observaciones || '',
          tipo_camara: item.tipo_camara || 'IP',
          ip: item.ip || '',
          id_dvr_nvr: item.id_dvr_nvr || '',
          canal: item.canal || '',
          id_ubicacion_fisica: item.id_ubicacion_fisica || '',
          ubicacion_especifica: item.ubicacion_especifica || '',
          notas_tecnicas: item.notas_tecnicas || '',
        });
      } else {
        setEditingCamara(null);
        setCamForm(emptyCamara);
      }
    }
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingDvr(null);
    setEditingCamara(null);
    setDvrForm(emptyDvr);
    setCamForm(emptyCamara);
    setErrors({});
  }

  function validate(): boolean {
    const newErrors: Partial<Record<string, string>> = {};
    const base = activeTab === 'Dvr' ? dvrForm : camForm;
    if (!base.id_marca) newErrors.id_marca = 'La marca es obligatoria';
    if (!base.id_modelo) newErrors.id_modelo = 'El modelo es obligatorio';
    if (!base.codigo_interno.trim()) newErrors.codigo_interno = 'El código interno es obligatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);

    if (activeTab === 'Dvr') {
      // Find DVR type
      let idTipoActivo = tiposActivo.find(t => t.nombre.toLowerCase().includes('dvr') || t.nombre.toLowerCase().includes('nvr'))?.id;
      if (!idTipoActivo && tiposActivo.length > 0) idTipoActivo = tiposActivo[0].id;

      const activoPayload = {
        id_tipo_activo: idTipoActivo || 5, // Fallback
        id_marca: Number(dvrForm.id_marca),
        id_modelo: Number(dvrForm.id_modelo),
        serial: dvrForm.serial.trim() || null,
        codigo_interno: dvrForm.codigo_interno.trim(),
        estado: dvrForm.estado,
        observaciones: dvrForm.observaciones.trim() || null,
      };

      if (editingDvr) {
        const { error: activeError } = await supabase
          .from('activos')
          .update(activoPayload)
          .eq('id', editingDvr.id_activo);

        if (activeError) {
          toast.error('Error al actualizar el activo base');
          setSaving(false);
          return;
        }

        const dvrPayload = {
          tipo: dvrForm.tipo,
          ip: dvrForm.ip.trim() || null,
          cantidad_canales: Number(dvrForm.cantidad_canales),
          capacidad_almacenamiento: dvrForm.capacidad_almacenamiento.trim() || null,
          id_ubicacion_fisica: dvrForm.id_ubicacion_fisica ? Number(dvrForm.id_ubicacion_fisica) : null,
          ubicacion_especifica: dvrForm.ubicacion_especifica.trim() || null,
          notas_tecnicas: dvrForm.notas_tecnicas.trim() || null,
        };

        const { error: dvrError } = await supabase
          .from('activos_dvr_nvr')
          .update(dvrPayload)
          .eq('id_activo', editingDvr.id_activo);

        if (dvrError) {
          toast.error('Error al actualizar detalles de grabador');
          console.error(dvrError);
        } else {
          toast.success('Grabador DVR/NVR actualizado correctamente');
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
          setSaving(false);
          return;
        }

        const dvrPayload = {
          id_activo: newActivo.id,
          tipo: dvrForm.tipo,
          ip: dvrForm.ip.trim() || null,
          cantidad_canales: Number(dvrForm.cantidad_canales),
          capacidad_almacenamiento: dvrForm.capacidad_almacenamiento.trim() || null,
          id_ubicacion_fisica: dvrForm.id_ubicacion_fisica ? Number(dvrForm.id_ubicacion_fisica) : null,
          ubicacion_especifica: dvrForm.ubicacion_especifica.trim() || null,
          notas_tecnicas: dvrForm.notas_tecnicas.trim() || null,
        };

        const { error: dvrError } = await supabase
          .from('activos_dvr_nvr')
          .insert(dvrPayload);

        if (dvrError) {
          toast.error('Error al crear detalles de grabador');
          await supabase.from('activos').delete().eq('id', newActivo.id);
        } else {
          toast.success('Grabador DVR/NVR creado correctamente');
          closeModal();
          loadData();
        }
      }
    } else {
      // Camera
      let idTipoActivo = tiposActivo.find(t => t.nombre.toLowerCase().includes('camara') || t.nombre.toLowerCase().includes('camera'))?.id;
      if (!idTipoActivo && tiposActivo.length > 0) idTipoActivo = tiposActivo[0].id;

      const activoPayload = {
        id_tipo_activo: idTipoActivo || 6, // Fallback
        id_marca: Number(camForm.id_marca),
        id_modelo: Number(camForm.id_modelo),
        serial: camForm.serial.trim() || null,
        codigo_interno: camForm.codigo_interno.trim(),
        estado: camForm.estado,
        observaciones: camForm.observaciones.trim() || null,
      };

      if (editingCamara) {
        const { error: activeError } = await supabase
          .from('activos')
          .update(activoPayload)
          .eq('id', editingCamara.id_activo);

        if (activeError) {
          toast.error('Error al actualizar el activo base');
          setSaving(false);
          return;
        }

        const camPayload = {
          tipo_camara: camForm.tipo_camara,
          ip: camForm.ip.trim() || null,
          id_dvr_nvr: camForm.id_dvr_nvr ? Number(camForm.id_dvr_nvr) : null,
          canal: camForm.canal ? Number(camForm.canal) : null,
          id_ubicacion_fisica: camForm.id_ubicacion_fisica ? Number(camForm.id_ubicacion_fisica) : null,
          ubicacion_especifica: camForm.ubicacion_especifica.trim() || null,
          notas_tecnicas: camForm.notas_tecnicas.trim() || null,
        };

        const { error: camError } = await supabase
          .from('activos_camaras')
          .update(camPayload)
          .eq('id_activo', editingCamara.id_activo);

        if (camError) {
          toast.error('Error al actualizar detalles de cámara');
          console.error(camError);
        } else {
          toast.success('Cámara actualizada correctamente');
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
          setSaving(false);
          return;
        }

        const camPayload = {
          id_activo: newActivo.id,
          tipo_camara: camForm.tipo_camara,
          ip: camForm.ip.trim() || null,
          id_dvr_nvr: camForm.id_dvr_nvr ? Number(camForm.id_dvr_nvr) : null,
          canal: camForm.canal ? Number(camForm.canal) : null,
          id_ubicacion_fisica: camForm.id_ubicacion_fisica ? Number(camForm.id_ubicacion_fisica) : null,
          ubicacion_especifica: camForm.ubicacion_especifica.trim() || null,
          notas_tecnicas: camForm.notas_tecnicas.trim() || null,
        };

        const { error: camError } = await supabase
          .from('activos_camaras')
          .insert(camPayload);

        if (camError) {
          toast.error('Error al crear detalles de cámara');
          await supabase.from('activos').delete().eq('id', newActivo.id);
        } else {
          toast.success('Cámara de CCTV creada correctamente');
          closeModal();
          loadData();
        }
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
      .eq('id', confirmDelete.id_activo);

    if (error) {
      toast.error('Error al dar de baja el equipo');
      console.error(error);
    } else {
      toast.success('Dispositivo dado de baja de CCTV correctamente');
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

  function getUbicacionLabel(u: UbicacionFisica | null) {
    if (!u) return '—';
    return (u as any).sede ? `${u.detalle} (${(u as any).sede.nombre})` : u.detalle;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <Camera size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Grabadores y Cámaras CCTV</h1>
            <p className={styles.pageSubtitle}>Inventario de grabadores DVR/NVR y cámaras de seguridad física</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => openModal()}>
          <Plus size={18} /> {activeTab === 'Dvr' ? 'Agregar Grabador' : 'Agregar Cámara'}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-2)' }}>
        <button
          onClick={() => { setActiveTab('Dvr'); setSearchTerm(''); }}
          style={{
            padding: '8px 16px',
            background: activeTab === 'Dvr' ? 'var(--accent-bg)' : 'transparent',
            color: activeTab === 'Dvr' ? 'var(--accent-text)' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'Dvr' ? '2px solid var(--accent-primary)' : 'none',
            fontWeight: activeTab === 'Dvr' ? '600' : '500',
            cursor: 'pointer',
            borderRadius: 'var(--radius-md)',
          }}
        >
          Grabadores (DVR / NVR)
        </button>
        <button
          onClick={() => { setActiveTab('Camaras'); setSearchTerm(''); }}
          style={{
            padding: '8px 16px',
            background: activeTab === 'Camaras' ? 'var(--accent-bg)' : 'transparent',
            color: activeTab === 'Camaras' ? 'var(--accent-text)' : 'var(--text-secondary)',
            border: 'none',
            borderBottom: activeTab === 'Camaras' ? '2px solid var(--accent-primary)' : 'none',
            fontWeight: activeTab === 'Camaras' ? '600' : '500',
            cursor: 'pointer',
            borderRadius: 'var(--radius-md)',
          }}
        >
          Cámaras de Seguridad
        </button>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder={`Buscar por IP, código o modelo...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table grid */}
      <div className={styles.table}>
        {activeTab === 'Dvr' ? (
          <>
            <div className={styles.tableHeader} style={{ gridTemplateColumns: '80px 2fr 1.2fr 90px 1.2fr 1.5fr 100px' }}>
              <span>Tipo</span>
              <span>Marca / Modelo</span>
              <span>IP Grabador</span>
              <span>Canales</span>
              <span>Disco</span>
              <span>Ubicación</span>
              <span>Acciones</span>
            </div>
            {loading ? (
              <div className={styles.loadingState}><div className={styles.spinner} /><span>Cargando DVR/NVR...</span></div>
            ) : filteredDvrs.length === 0 ? (
              <div className={styles.emptyState}><Server size={48} className={styles.emptyIcon} /><p>No hay grabadores CCTV registrados</p></div>
            ) : (
              filteredDvrs.map((item) => (
                <div key={item.id_activo} className={styles.tableRowItem} style={{ gridTemplateColumns: '80px 2fr 1.2fr 90px 1.2fr 1.5fr 100px' }} onClick={() => openModal(item)}>
                  <span style={{ fontWeight: 600 }}>{item.tipo}</span>
                  <span className={styles.rowText}>{item.activo?.marca?.nombre} {item.activo?.modelo?.nombre}</span>
                  <span className={styles.rowText} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{item.ip || '—'}</span>
                  <span>{item.cantidad_canales} ch</span>
                  <span>{item.capacidad_almacenamiento || '—'}</span>
                  <span className={styles.rowText}>{getUbicacionLabel(item.ubicacion_fisica)}</span>
                  <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.actionBtn} onClick={() => openModal(item)} title="Editar"><Pencil size={14} /></button>
                    <button className={styles.deleteBtn} onClick={() => setConfirmDelete(item)} title="Dar de baja"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <div className={styles.tableHeader} style={{ gridTemplateColumns: '80px 2fr 1.2fr 1.2fr 80px 1.5fr 100px' }}>
              <span>Tipo</span>
              <span>Marca / Modelo</span>
              <span>IP Cámara</span>
              <span>Vía NVR/DVR</span>
              <span>Canal</span>
              <span>Ubicación</span>
              <span>Acciones</span>
            </div>
            {loading ? (
              <div className={styles.loadingState}><div className={styles.spinner} /><span>Cargando cámaras...</span></div>
            ) : filteredCamaras.length === 0 ? (
              <div className={styles.emptyState}><Camera size={48} className={styles.emptyIcon} /><p>No hay cámaras de seguridad registradas</p></div>
            ) : (
              filteredCamaras.map((item) => (
                <div key={item.id_activo} className={styles.tableRowItem} style={{ gridTemplateColumns: '80px 2fr 1.2fr 1.2fr 80px 1.5fr 100px' }} onClick={() => openModal(item)}>
                  <span style={{ fontWeight: 600 }}>{item.tipo_camara}</span>
                  <span className={styles.rowText}>{item.activo?.marca?.nombre} {item.activo?.modelo?.nombre}</span>
                  <span className={styles.rowText} style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>{item.ip || '—'}</span>
                  <span className={styles.rowText}>{item.dvr_nvr?.activo?.codigo_interno || '—'}</span>
                  <span>{item.canal || '—'}</span>
                  <span className={styles.rowText}>{getUbicacionLabel(item.ubicacion_fisica)}</span>
                  <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.actionBtn} onClick={() => openModal(item)} title="Editar"><Pencil size={14} /></button>
                    <button className={styles.deleteBtn} onClick={() => setConfirmDelete(item)} title="Dar de baja"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Modal wide */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalWide} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {activeTab === 'Dvr'
                  ? (editingDvr ? 'Editar Grabador DVR/NVR' : 'Nuevo Grabador DVR/NVR')
                  : (editingCamara ? 'Editar Cámara CCTV' : 'Nueva Cámara CCTV')}
              </h2>
              <button className={styles.modalCloseBtn} onClick={closeModal}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              {/* Activo Base Section */}
              <div style={{ borderBottom: '1px solid var(--border-secondary)', paddingBottom: '10px', marginBottom: '10px', fontWeight: 600 }}>
                Datos de Activo Base
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Marca *</label>
                  <select
                    className={styles.fieldInput}
                    value={activeTab === 'Dvr' ? dvrForm.id_marca : camForm.id_marca}
                    onChange={(e) => activeTab === 'Dvr'
                      ? setDvrForm({ ...dvrForm, id_marca: e.target.value ? Number(e.target.value) : '', id_modelo: '' })
                      : setCamForm({ ...camForm, id_marca: e.target.value ? Number(e.target.value) : '', id_modelo: '' })
                    }
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
                    value={activeTab === 'Dvr' ? dvrForm.id_modelo : camForm.id_modelo}
                    onChange={(e) => activeTab === 'Dvr'
                      ? setDvrForm({ ...dvrForm, id_modelo: e.target.value ? Number(e.target.value) : '' })
                      : setCamForm({ ...camForm, id_modelo: e.target.value ? Number(e.target.value) : '' })
                    }
                    disabled={activeTab === 'Dvr' ? !dvrForm.id_marca : !camForm.id_marca}
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
                    value={activeTab === 'Dvr' ? dvrForm.serial : camForm.serial}
                    onChange={(e) => activeTab === 'Dvr'
                      ? setDvrForm({ ...dvrForm, serial: e.target.value })
                      : setCamForm({ ...camForm, serial: e.target.value })
                    }
                    placeholder="S/N"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Código Interno *</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={activeTab === 'Dvr' ? dvrForm.codigo_interno : camForm.codigo_interno}
                    onChange={(e) => activeTab === 'Dvr'
                      ? setDvrForm({ ...dvrForm, codigo_interno: e.target.value })
                      : setCamForm({ ...camForm, codigo_interno: e.target.value })
                    }
                    placeholder="Ej: DVR-01, CAM-05"
                  />
                  {errors.codigo_interno && <span className={styles.fieldError}>{errors.codigo_interno}</span>}
                </div>
              </div>

              {/* CCTV Specific Section */}
              <div style={{ borderBottom: '1px solid var(--border-secondary)', paddingBottom: '10px', margin: '15px 0 10px 0', fontWeight: 600 }}>
                Datos de Circuito Cerrado
              </div>

              {activeTab === 'Dvr' ? (
                <>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Tipo Grabador</label>
                      <select
                        className={styles.fieldInput}
                        value={dvrForm.tipo}
                        onChange={(e) => setDvrForm({ ...dvrForm, tipo: e.target.value as any })}
                      >
                        {TIPO_DVR_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>IP</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={dvrForm.ip}
                        onChange={(e) => setDvrForm({ ...dvrForm, ip: e.target.value })}
                        placeholder="192.168.x.x"
                      />
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Cantidad Canales</label>
                      <input
                        type="number"
                        className={styles.fieldInput}
                        value={dvrForm.cantidad_canales}
                        onChange={(e) => setDvrForm({ ...dvrForm, cantidad_canales: Number(e.target.value) })}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Capacidad Almacenamiento</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={dvrForm.capacidad_almacenamiento}
                        onChange={(e) => setDvrForm({ ...dvrForm, capacidad_almacenamiento: e.target.value })}
                        placeholder="Ej: 4TB, 8TB, 12TB"
                      />
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Ubicación Física</label>
                      <select
                        className={styles.fieldInput}
                        value={dvrForm.id_ubicacion_fisica}
                        onChange={(e) => setDvrForm({ ...dvrForm, id_ubicacion_fisica: e.target.value ? Number(e.target.value) : '' })}
                      >
                        <option value="">Ninguna</option>
                        {ubicaciones.map((u) => (
                          <option key={u.id} value={u.id}>{getUbicacionLabel(u)}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Referencia Específica</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={dvrForm.ubicacion_especifica}
                        onChange={(e) => setDvrForm({ ...dvrForm, ubicacion_especifica: e.target.value })}
                        placeholder="Ej: Rack de Sistemas, entrepiso"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Tipo de Cámara</label>
                      <select
                        className={styles.fieldInput}
                        value={camForm.tipo_camara}
                        onChange={(e) => setCamForm({ ...camForm, tipo_camara: e.target.value })}
                      >
                        {TIPO_CAMARA_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>IP</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={camForm.ip}
                        onChange={(e) => setCamForm({ ...camForm, ip: e.target.value })}
                        placeholder="192.168.x.x"
                        disabled={camForm.tipo_camara === 'Analógica'}
                      />
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Grabador DVR/NVR</label>
                      <select
                        className={styles.fieldInput}
                        value={camForm.id_dvr_nvr}
                        onChange={(e) => setCamForm({ ...camForm, id_dvr_nvr: e.target.value ? Number(e.target.value) : '' })}
                      >
                        <option value="">Ninguno / Autónomo</option>
                        {dvrs.map((d) => (
                          <option key={d.id_activo} value={d.id_activo}>
                            {d.activo?.codigo_interno} ({d.tipo}) — {d.activo?.marca?.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Canal del grabador</label>
                      <input
                        type="number"
                        className={styles.fieldInput}
                        value={camForm.canal}
                        onChange={(e) => setCamForm({ ...camForm, canal: e.target.value ? Number(e.target.value) : '' })}
                        placeholder="Canal asignado"
                      />
                    </div>
                  </div>

                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Ubicación Física</label>
                      <select
                        className={styles.fieldInput}
                        value={camForm.id_ubicacion_fisica}
                        onChange={(e) => setCamForm({ ...camForm, id_ubicacion_fisica: e.target.value ? Number(e.target.value) : '' })}
                      >
                        <option value="">Ninguna</option>
                        {ubicaciones.map((u) => (
                          <option key={u.id} value={u.id}>{getUbicacionLabel(u)}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}>Referencia Específica</label>
                      <input
                        type="text"
                        className={styles.fieldInput}
                        value={camForm.ubicacion_especifica}
                        onChange={(e) => setCamForm({ ...camForm, ubicacion_especifica: e.target.value })}
                        placeholder="Ej: Pasillo principal, ingreso oeste"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className={styles.field} style={{ marginTop: '10px' }}>
                <label className={styles.fieldLabel}>Notas Técnicas</label>
                <textarea
                  className={styles.fieldTextarea}
                  value={activeTab === 'Dvr' ? dvrForm.notas_tecnicas : camForm.notas_tecnicas}
                  onChange={(e) => activeTab === 'Dvr'
                    ? setDvrForm({ ...dvrForm, notas_tecnicas: e.target.value })
                    : setCamForm({ ...camForm, notas_tecnicas: e.target.value })
                  }
                  placeholder="Detalles sobre resolución, contraseñas de cámara, enlaces rtsp..."
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

      {/* Confirm Baja */}
      {confirmDelete && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmDelete(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Dar de baja equipo</h3>
            <p className={styles.confirmMessage}>
              ¿Está seguro de que desea dar de baja el activo de CCTV <strong>{confirmDelete.activo?.codigo_interno}</strong>?
            </p>
            <div className={styles.field} style={{ textAlign: 'left', marginBottom: 'var(--space-4)' }}>
              <label className={styles.fieldLabel}>Motivo de la baja *</label>
              <input
                type="text"
                className={styles.fieldInput}
                value={motivoBaja}
                onChange={(e) => setMotivoBaja(e.target.value)}
                placeholder="Ej: Deterioro por intemperie, quemado..."
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
