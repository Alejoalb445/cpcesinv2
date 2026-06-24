'use client';

import React, { useState, useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import styles from '@/styles/module.module.css';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Keyboard 
} from 'lucide-react';
import { Periferico, Marca, Modelo, PuestoTrabajo } from '@/types/database';

export default function PerifericosPage() {
  const supabase = getSupabaseClient();

  // Lists
  const [perifericos, setPerifericos] = useState<Periferico[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [puestos, setPuestos] = useState<PuestoTrabajo[]>([]);

  // State
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    categoria: 'Monitor' as Periferico['categoria'],
    id_marca: '',
    id_modelo: '',
    serial: '',
    codigo_inventario: '',
    id_puesto: '',
    estado: 'En stock' as Periferico['estado'],
    notas: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Confirm delete state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [perifRes, marcasRes, modelosRes, puestosRes] = await Promise.all([
        supabase.from('perifericos').select('*, marca:marcas(*), modelo:modelos(*), puesto:puestos_trabajo(*)'),
        supabase.from('marcas').select('*').order('nombre'),
        supabase.from('modelos').select('*').order('nombre'),
        supabase.from('puestos_trabajo').select('*').eq('activo', true).order('codigo')
      ]);

      if (perifRes.error) throw perifRes.error;
      if (marcasRes.error) throw marcasRes.error;
      if (modelosRes.error) throw modelosRes.error;
      if (puestosRes.error) throw puestosRes.error;

      setPerifericos(perifRes.data || []);
      setMarcas(marcasRes.data || []);
      setModelos(modelosRes.data || []);
      setPuestos(puestosRes.data || []);
    } catch (error: any) {
      console.error(error);
      toast.error('Error al cargar datos del módulo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setFormData({
      categoria: 'Monitor',
      id_marca: '',
      id_modelo: '',
      serial: '',
      codigo_inventario: '',
      id_puesto: '',
      estado: 'En stock',
      notas: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (per: Periferico) => {
    setEditingId(per.id);
    setFormData({
      categoria: per.categoria,
      id_marca: per.id_marca?.toString() || '',
      id_modelo: per.id_modelo?.toString() || '',
      serial: per.serial || '',
      codigo_inventario: per.codigo_inventario || '',
      id_puesto: per.id_puesto?.toString() || '',
      estado: per.estado,
      notas: per.notas || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.categoria) errors.categoria = 'La categoría es requerida';
    if (!formData.estado) errors.estado = 'El estado es requerido';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      const payload = {
        categoria: formData.categoria,
        id_marca: formData.id_marca ? parseInt(formData.id_marca) : null,
        id_modelo: formData.id_modelo ? parseInt(formData.id_modelo) : null,
        serial: formData.serial.trim() || null,
        codigo_inventario: formData.codigo_inventario.trim() || null,
        id_puesto: formData.id_puesto ? parseInt(formData.id_puesto) : null,
        estado: formData.estado,
        notas: formData.notas.trim() || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('perifericos')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Periférico actualizado con éxito');
      } else {
        const { error } = await supabase
          .from('perifericos')
          .insert([payload]);
        if (error) throw error;
        toast.success('Periférico registrado con éxito');
      }

      setIsModalOpen(false);
      fetchInitialData();
    } catch (error: any) {
      toast.error('Error al guardar: ' + error.message);
    }
  };

  const handleDeleteClick = (per: Periferico) => {
    setDeletingId(per.id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase
        .from('perifericos')
        .delete()
        .eq('id', deletingId);
      
      if (error) throw error;
      toast.success('Periférico eliminado con éxito');
      setIsConfirmOpen(false);
      fetchInitialData();
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  // Filter models based on selected brand
  const filteredModelosForm = modelos.filter(m => !formData.id_marca || m.id_marca === parseInt(formData.id_marca));

  // Search & Filter
  const filteredPerifericos = perifericos.filter(p => {
    const matchesSearch = 
      p.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.serial && p.serial.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.codigo_inventario && p.codigo_inventario.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.marca?.nombre && p.marca.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.modelo?.nombre && p.modelo.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.puesto?.codigo && p.puesto.codigo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.notas && p.notas.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategoria = filterCategoria === '' || p.categoria === filterCategoria;
    const matchesEstado = filterEstado === '' || p.estado === filterEstado;

    return matchesSearch && matchesCategoria && matchesEstado;
  });

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <Keyboard size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Periféricos</h1>
            <p className={styles.pageSubtitle}>Inventario de monitores, teclados, mouses, webcams, dockings y accesorios</p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={handleOpenCreateModal}>
          <Plus size={16} />
          Registrar Periférico
        </button>
      </div>

      {/* Toolbar Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por categoría, marca, serial, puesto..."
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
          <option value="Monitor">Monitor</option>
          <option value="Teclado">Teclado</option>
          <option value="Mouse">Mouse</option>
          <option value="Webcam">Webcam</option>
          <option value="Auricular">Auricular</option>
          <option value="Parlante">Parlante</option>
          <option value="Lector de código">Lector de código</option>
          <option value="Docking">Docking</option>
          <option value="Hub USB">Hub USB</option>
          <option value="Otro">Otro</option>
        </select>

        <select
          className={styles.filterSelect}
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="Activo">Activos</option>
          <option value="En reparación">En reparación</option>
          <option value="En stock">En stock</option>
          <option value="Dado de baja">Dados de baja</option>
          <option value="Prestado">Prestado</option>
          <option value="Extraviado">Extraviado</option>
        </select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          Cargando periféricos...
        </div>
      ) : filteredPerifericos.length === 0 ? (
        /* Empty State */
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Keyboard size={48} />
          </div>
          <h3 className={styles.emptyTitle}>No se encontraron periféricos</h3>
          <p className={styles.emptyText}>No hay accesorios registrados o ninguno coincide con los filtros aplicados.</p>
        </div>
      ) : (
        /* Table Grid */
        <div className={styles.tableWrapper}>
          <div className={styles.table}>
            <div className={styles.tableHeader} style={{ gridTemplateColumns: '1.2fr 1.2fr 1.2fr 1.2fr 1.2fr 1fr 120px' }}>
              <div>Categoría</div>
              <div>Marca/Modelo</div>
              <div>Serial</div>
              <div>Código Inventario</div>
              <div>Puesto Asignado</div>
              <div>Estado</div>
              <div style={{ textAlign: 'right' }}>Acciones</div>
            </div>

            {filteredPerifericos.map((per) => (
              <div
                key={per.id}
                className={styles.tableRowItem}
                style={{ gridTemplateColumns: '1.2fr 1.2fr 1.2fr 1.2fr 1.2fr 1fr 120px', cursor: 'default' }}
              >
                <div style={{ fontWeight: 600 }}>{per.categoria}</div>
                <div className={styles.rowText}>
                  {per.marca?.nombre || 'N/A'} {per.modelo?.nombre || ''}
                </div>
                <div className={styles.rowText}>{per.serial || 'N/A'}</div>
                <div className={styles.rowText}>{per.codigo_inventario || 'N/A'}</div>
                <div className={styles.rowText} style={{ color: per.puesto ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  {per.puesto?.codigo || 'En depósito / Stock'}
                </div>
                <div>
                  <span className={`${styles.badge} ${
                    per.estado === 'Activo' ? styles.badgeActive : 
                    per.estado === 'En stock' ? styles.badgeInfo : 
                    per.estado === 'En reparación' ? styles.badgeWarning : 
                    styles.badgeInactive
                  }`}>
                    {per.estado}
                  </span>
                </div>
                <div className={styles.actionsCell} style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleOpenEditModal(per)}
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeleteClick(per)}
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingId ? 'Editar Periférico' : 'Registrar Periférico'}
              </h2>
              <button className={styles.modalCloseBtn} onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className={styles.modalBody}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Categoría *</label>
                  <select
                    className={styles.fieldInput}
                    value={formData.categoria}
                    onChange={e => setFormData({ ...formData, categoria: e.target.value as any })}
                  >
                    <option value="Monitor">Monitor</option>
                    <option value="Teclado">Teclado</option>
                    <option value="Mouse">Mouse</option>
                    <option value="Webcam">Webcam</option>
                    <option value="Auricular">Auricular</option>
                    <option value="Parlante">Parlante</option>
                    <option value="Lector de código">Lector de código</option>
                    <option value="Docking">Docking</option>
                    <option value="Hub USB">Hub USB</option>
                    <option value="Otro">Otro</option>
                  </select>
                  {formErrors.categoria && <span className={styles.fieldError}>{formErrors.categoria}</span>}
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Marca</label>
                    <select
                      className={styles.fieldInput}
                      value={formData.id_marca}
                      onChange={e => setFormData({ ...formData, id_marca: e.target.value, id_modelo: '' })}
                    >
                      <option value="">Seleccione marca...</option>
                      {marcas.map(m => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Modelo</label>
                    <select
                      className={styles.fieldInput}
                      value={formData.id_modelo}
                      onChange={e => setFormData({ ...formData, id_modelo: e.target.value })}
                      disabled={!formData.id_marca}
                    >
                      <option value="">Seleccione modelo...</option>
                      {filteredModelosForm.map(m => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Número de Serie</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={formData.serial}
                    onChange={e => setFormData({ ...formData, serial: e.target.value })}
                    placeholder="S/N del fabricante"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Código de Inventario</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    value={formData.codigo_inventario}
                    onChange={e => setFormData({ ...formData, codigo_inventario: e.target.value })}
                    placeholder="Ej. MON-045, KEY-012"
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Puesto de Trabajo Asignado</label>
                  <select
                    className={styles.fieldInput}
                    value={formData.id_puesto}
                    onChange={e => setFormData({ ...formData, id_puesto: e.target.value })}
                  >
                    <option value="">En depósito / Stock</option>
                    {puestos.map(p => (
                      <option key={p.id} value={p.id}>{p.codigo}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Estado Activo *</label>
                    <select
                      className={styles.fieldInput}
                      value={formData.estado}
                      onChange={e => setFormData({ ...formData, estado: e.target.value as any })}
                    >
                      <option value="Activo">Activo</option>
                      <option value="En reparación">En reparación</option>
                      <option value="En stock">En stock</option>
                      <option value="Dado de baja">Dado de baja</option>
                      <option value="Prestado">Prestado</option>
                      <option value="Extraviado">Extraviado</option>
                    </select>
                    {formErrors.estado && <span className={styles.fieldError}>{formErrors.estado}</span>}
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Notas / Comentarios</label>
                  <textarea
                    className={styles.fieldTextarea}
                    value={formData.notas}
                    onChange={e => setFormData({ ...formData, notas: e.target.value })}
                    placeholder="Detalles adicionales, estado físico, etc..."
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {isConfirmOpen && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmModal}>
            <h3 className={styles.confirmTitle}>Confirmar eliminación</h3>
            <p className={styles.confirmMessage}>
              ¿Estás seguro de que deseas eliminar este periférico? Esta acción es irreversible.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setIsConfirmOpen(false)}>
                Cancelar
              </button>
              <button className={styles.dangerBtn} onClick={confirmDelete}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
