'use client';

import React, { useEffect, useState } from 'react';
import { getSupabaseClient } from '@/lib/supabase/client';
import styles from '@/styles/module.module.css';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  Cpu, 
  Keyboard, 
  Printer, 
  Network, 
  Ticket, 
  AlertTriangle, 
  RefreshCw,
  Clock,
  User,
  Activity,
  Layers,
  Wrench,
  CheckCircle2
} from 'lucide-react';
import type { TareaSoporte, InsumoImpresora } from '@/types/database';

interface DashboardStats {
  activosTotales: number;
  computadoras: number;
  perifericos: number;
  moviles: number;
  infraestructura: number;
  impresoras: number;
  insumosBajoStock: number;
  tareasSoporteActivas: number;
  pcsEnStock: number;
  pcsEnReparacion: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    activosTotales: 0,
    computadoras: 0,
    perifericos: 0,
    moviles: 0,
    infraestructura: 0,
    impresoras: 0,
    insumosBajoStock: 0,
    tareasSoporteActivas: 0,
    pcsEnStock: 0,
    pcsEnReparacion: 0
  });
  const [lowStockToners, setLowStockToners] = useState<InsumoImpresora[]>([]);
  const [recentTasks, setRecentTasks] = useState<TareaSoporte[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const supabase = getSupabaseClient();

      // Parallel queries for stats
      const [
        compCount,
        perCount,
        movCount,
        infCount,
        impCount,
        activeTasksCount,
        pcsInStock,
        pcsInRepair,
        insumosData,
        tasksData
      ] = await Promise.all([
        supabase.from('computadoras').select('*', { count: 'exact', head: true }).neq('estado', 'Dado de baja'),
        supabase.from('perifericos').select('*', { count: 'exact', head: true }).neq('estado', 'Dado de baja'),
        supabase.from('dispositivos_moviles').select('*', { count: 'exact', head: true }).neq('estado', 'Dado de baja'),
        supabase.from('dispositivos_infraestructura').select('*', { count: 'exact', head: true }).neq('estado', 'Dado de baja'),
        supabase.from('impresoras').select('*', { count: 'exact', head: true }).neq('estado', 'Dado de baja'),
        supabase.from('tareas_soporte').select('*', { count: 'exact', head: true }).in('estado', ['Abierta', 'En progreso', 'En espera']),
        supabase.from('computadoras').select('*', { count: 'exact', head: true }).eq('estado', 'En stock'),
        supabase.from('computadoras').select('*', { count: 'exact', head: true }).eq('estado', 'En reparación'),
        supabase.from('insumos_impresora').select('*, marca:marcas(*)'),
        supabase.from('tareas_soporte').select(`
          *,
          solicitante:usuarios!id_solicitante(id, nombre, apellido, email),
          tecnico:usuarios!id_tecnico(id, nombre, apellido, email)
        `)
        .in('estado', ['Abierta', 'En progreso', 'En espera'])
        .order('created_at', { ascending: false })
        .limit(5)
      ]);

      if (compCount.error) throw compCount.error;
      if (perCount.error) throw perCount.error;
      if (movCount.error) throw movCount.error;
      if (infCount.error) throw infCount.error;
      if (impCount.error) throw impCount.error;
      if (activeTasksCount.error) throw activeTasksCount.error;
      if (pcsInStock.error) throw pcsInStock.error;
      if (pcsInRepair.error) throw pcsInRepair.error;
      if (insumosData.error) throw insumosData.error;
      if (tasksData.error) throw tasksData.error;

      // Filter low stock toners
      const lowStockList = (insumosData.data || []).filter(
        (item: any) => item.stock_actual <= item.stock_minimo
      );

      const totalAssets =
        (compCount.count || 0) +
        (perCount.count || 0) +
        (movCount.count || 0) +
        (infCount.count || 0) +
        (impCount.count || 0);

      setStats({
        activosTotales: totalAssets,
        computadoras: compCount.count || 0,
        perifericos: perCount.count || 0,
        moviles: movCount.count || 0,
        infraestructura: infCount.count || 0,
        impresoras: impCount.count || 0,
        insumosBajoStock: lowStockList.length,
        tareasSoporteActivas: activeTasksCount.count || 0,
        pcsEnStock: pcsInStock.count || 0,
        pcsEnReparacion: pcsInRepair.count || 0
      });

      setLowStockToners(lowStockList);
      setRecentTasks(tasksData.data || []);
    } catch (err: any) {
      console.error('Error fetching dashboard statistics:', err);
      toast.error('Error al cargar datos del panel: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <span>Cargando estadísticas del sistema...</span>
      </div>
    );
  }

  // Priority color helpers
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'Urgente': return styles.badgeInactive;
      case 'Alta': return styles.badgeInactive;
      case 'Media': return styles.badgeWarning;
      case 'Baja': return styles.badgeActive;
      default: return styles.badgeInfo;
    }
  };

  // Status color helpers
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Abierta': return styles.badgeInactive;
      case 'En progreso': return styles.badgeWarning;
      case 'En espera': return styles.badgeInfo;
      case 'Resuelta': return styles.badgeActive;
      default: return styles.badgeInfo;
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageHeaderIcon}>
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Panel de Control</h1>
            <p className={styles.pageSubtitle}>Estadísticas y resumen de activos y soporte</p>
          </div>
        </div>
        <button className={styles.cancelBtn} onClick={fetchDashboardData} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Refrescar
        </button>
      </div>

      {/* Grid de Metricas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {/* Card Activos Totales */}
        <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{
            background: 'var(--accent-gradient)',
            color: 'white',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Activos Totales</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{stats.activosTotales}</div>
          </div>
        </div>

        {/* Card Computadoras */}
        <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{
            background: 'rgba(99, 102, 241, 0.1)',
            color: 'rgb(99, 102, 241)',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Cpu size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Computadoras</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {stats.computadoras}
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)', marginLeft: '8px' }}>
                ({stats.pcsEnStock} st. / {stats.pcsEnReparacion} rep.)
              </span>
            </div>
          </div>
        </div>

        {/* Card Perifericos */}
        <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            color: 'rgb(16, 185, 129)',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Keyboard size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Periféricos</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{stats.perifericos}</div>
          </div>
        </div>

        {/* Card Impresoras */}
        <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            color: 'rgb(245, 158, 11)',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Printer size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Impresoras</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{stats.impresoras}</div>
          </div>
        </div>

        {/* Card Dispositivos de Red */}
        <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            color: 'rgb(59, 130, 246)',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Network size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Red / Infra.</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{stats.infraestructura}</div>
          </div>
        </div>

        {/* Card Tareas de Soporte Activas */}
        <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{
            background: stats.tareasSoporteActivas > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: stats.tareasSoporteActivas > 0 ? 'rgb(239, 68, 68)' : 'rgb(16, 185, 129)',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Ticket size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Soporte Activo</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{stats.tareasSoporteActivas} pend.</div>
          </div>
        </div>

        {/* Card Bajo Stock */}
        <div className={styles.card} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
          <div style={{
            background: stats.insumosBajoStock > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            color: stats.insumosBajoStock > 0 ? 'rgb(245, 158, 11)' : 'rgb(16, 185, 129)',
            borderRadius: '12px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Alertas de Stock</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{stats.insumosBajoStock} bajo mín.</div>
          </div>
        </div>
      </div>

      {/* Columnas Secundarias */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
        gap: '24px'
      }}>
        {/* Tareas de soporte abiertas */}
        <div className={styles.card} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Ticket size={20} color="var(--accent-primary)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Tareas de Soporte Recientes</h2>
          </div>

          {recentTasks.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle2 size={36} className={styles.emptyIcon} style={{ color: 'var(--success)' }} />
              <h3 className={styles.emptyTitle}>¡Todo al día!</h3>
              <p className={styles.emptyText}>No hay tareas de soporte pendientes de resolución.</p>
            </div>
          ) : (
            <div className={styles.table}>
              <div className={styles.tableHeader} style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr' }}>
                <div>Título</div>
                <div>Técnico</div>
                <div>Prioridad</div>
                <div>Estado</div>
              </div>
              {recentTasks.map((task) => (
                <div key={task.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr' }}>
                  <div className={styles.rowText} title={task.titulo} style={{ fontWeight: 600 }}>
                    {task.titulo}
                  </div>
                  <div className={styles.rowText}>
                    {task.tecnico ? `${task.tecnico.nombre} ${task.tecnico.apellido || ''}` : 'Sin asignar'}
                  </div>
                  <div>
                    <span className={`${styles.badge} ${getPriorityBadgeClass(task.prioridad)}`}>
                      {task.prioridad}
                    </span>
                  </div>
                  <div>
                    <span className={`${styles.badge} ${getStatusBadgeClass(task.estado)}`}>
                      {task.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Toners y Cartuchos con Stock Bajo */}
        <div className={styles.card} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertTriangle size={20} color="rgb(245, 158, 11)" />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>Insumos bajo Stock Mínimo</h2>
          </div>

          {lowStockToners.length === 0 ? (
            <div className={styles.emptyState}>
              <CheckCircle2 size={36} className={styles.emptyIcon} style={{ color: 'var(--success)' }} />
              <h3 className={styles.emptyTitle}>Stock Saludable</h3>
              <p className={styles.emptyText}>Todos los insumos y tóners tienen niveles de stock adecuados.</p>
            </div>
          ) : (
            <div className={styles.table}>
              <div className={styles.tableHeader} style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr' }}>
                <div>Insumo</div>
                <div>Marca</div>
                <div style={{ textAlign: 'center' }}>Stock Act.</div>
                <div style={{ textAlign: 'center' }}>Mínimo</div>
              </div>
              {lowStockToners.map((insumo) => (
                <div key={insumo.id} className={styles.tableRowItem} style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr' }}>
                  <div className={styles.rowText} title={insumo.nombre} style={{ fontWeight: 600 }}>
                    {insumo.nombre}
                  </div>
                  <div className={styles.rowText}>
                    {insumo.marca?.nombre || 'Genérica'}
                  </div>
                  <div style={{ textAlign: 'center', color: 'var(--danger-text)', fontWeight: 700 }}>
                    {insumo.stock_actual}
                  </div>
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {insumo.stock_minimo}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
