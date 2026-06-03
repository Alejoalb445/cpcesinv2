'use client';

import React, { useEffect, useState } from 'react';
import {
  Monitor, CheckCircle2, Wrench, PackageX, Printer,
  Package, Ticket, Key, ShoppingCart, AlertTriangle,
  LayoutDashboard,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import styles from './dashboard.module.css';

interface DashboardStats {
  totalActivos: number;
  activosAsignados: number;
  activosReparacion: number;
  stockBajo: number;
  pedidosTonerPendientes: number;
  pedidosStockPendientes: number;
  ticketsAbiertos: number;
  licenciasVencer: number;
  solicitudesCompraPendientes: number;
}

interface AlertaStock {
  id: number;
  descripcion: string;
  stock_actual: number;
  stock_minimo: number;
  categoria_nombre?: string;
}

interface TicketAbierto {
  id: number;
  titulo: string;
  prioridad: string;
  estado: string;
  fecha_creacion: string;
  persona_afectada?: { nombre: string; apellido: string | null } | null;
}

interface PedidoPendiente {
  id: number;
  tipo: 'toner' | 'general';
  descripcion: string;
  cantidad: number;
  fecha_pedido: string;
  sector_nombre?: string;
}

const METRIC_CARDS = [
  { key: 'totalActivos', label: 'Activos Totales', icon: Monitor, color: 'cyan' },
  { key: 'activosAsignados', label: 'Asignados', icon: CheckCircle2, color: 'green' },
  { key: 'activosReparacion', label: 'En Reparación', icon: Wrench, color: 'orange' },
  { key: 'stockBajo', label: 'Stock Bajo', icon: PackageX, color: 'red' },
  { key: 'pedidosTonerPendientes', label: 'Pedidos Tóner', icon: Printer, color: 'purple' },
  { key: 'pedidosStockPendientes', label: 'Pedidos Stock', icon: Package, color: 'blue' },
  { key: 'ticketsAbiertos', label: 'Tickets Abiertos', icon: Ticket, color: 'pink' },
  { key: 'licenciasVencer', label: 'Licencias x Vencer', icon: Key, color: 'teal' },
  { key: 'solicitudesCompraPendientes', label: 'Compras Pendientes', icon: ShoppingCart, color: 'indigo' },
] as const;

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alertas, setAlertas] = useState<AlertaStock[]>([]);
  const [tickets, setTickets] = useState<TicketAbierto[]>([]);
  const [pedidos, setPedidos] = useState<PedidoPendiente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const supabase = getSupabaseClient();
    setLoading(true);

    try {
      // Fetch all counts in parallel
      const [
        totalRes,
        asignadosRes,
        reparacionRes,
        stockBajoRes,
        tonerRes,
        stockPedRes,
        ticketsRes,
        licenciasRes,
        comprasRes,
        alertasRes,
        ticketsListRes,
        pedidosTonerRes,
        pedidosStockRes,
      ] = await Promise.all([
        supabase.from('activos').select('id', { count: 'exact', head: true }).eq('dado_de_baja', false),
        supabase.from('activos').select('id', { count: 'exact', head: true }).eq('estado', 'Asignado').eq('dado_de_baja', false),
        supabase.from('activos').select('id', { count: 'exact', head: true }).eq('estado', 'En Reparación'),
        supabase.from('items_stock').select('id', { count: 'exact', head: true }).eq('activo', true).filter('stock_actual', 'lte', 'stock_minimo' as unknown as string),
        supabase.from('pedidos_toner').select('id', { count: 'exact', head: true }).eq('estado', 'Pendiente'),
        supabase.from('pedidos_stock_general').select('id', { count: 'exact', head: true }).eq('estado', 'Pendiente'),
        supabase.from('tickets_soporte').select('id', { count: 'exact', head: true }).not('estado', 'in', '("Resuelto","Cancelado")'),
        supabase.from('licencias').select('id', { count: 'exact', head: true }).eq('estado', 'Activa').lte('fecha_vencimiento', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        supabase.from('solicitudes_compra').select('id', { count: 'exact', head: true }).eq('estado', 'Pendiente'),
        // Alertas stock bajo
        supabase.from('items_stock').select('id, descripcion, stock_actual, stock_minimo, categorias_stock(nombre)').eq('activo', true).lte('stock_actual', 0).limit(10),
        // Tickets abiertos
        supabase.from('tickets_soporte').select('id, titulo, prioridad, estado, fecha_creacion, personas:id_persona_afectada(nombre, apellido)').not('estado', 'in', '("Resuelto","Cancelado")').order('fecha_creacion', { ascending: false }).limit(10),
        // Pedidos toner pendientes
        supabase.from('pedidos_toner').select('id, cantidad, fecha_pedido, items_stock:id_item_stock(descripcion), sectores:id_sector(nombre)').eq('estado', 'Pendiente').order('fecha_pedido', { ascending: false }).limit(5),
        // Pedidos stock pendientes
        supabase.from('pedidos_stock_general').select('id, cantidad, fecha_pedido, items_stock:id_item_stock(descripcion), sectores:id_sector(nombre)').eq('estado', 'Pendiente').order('fecha_pedido', { ascending: false }).limit(5),
      ]);

      setStats({
        totalActivos: totalRes.count || 0,
        activosAsignados: asignadosRes.count || 0,
        activosReparacion: reparacionRes.count || 0,
        stockBajo: stockBajoRes.count || 0,
        pedidosTonerPendientes: tonerRes.count || 0,
        pedidosStockPendientes: stockPedRes.count || 0,
        ticketsAbiertos: ticketsRes.count || 0,
        licenciasVencer: licenciasRes.count || 0,
        solicitudesCompraPendientes: comprasRes.count || 0,
      });

      // Process alertas
      if (alertasRes.data) {
        setAlertas(alertasRes.data.map((item: Record<string, unknown>) => ({
          id: item.id as number,
          descripcion: item.descripcion as string,
          stock_actual: item.stock_actual as number,
          stock_minimo: item.stock_minimo as number,
          categoria_nombre: (item.categorias_stock as Record<string, unknown>)?.nombre as string || '',
        })));
      }

      // Process tickets
      if (ticketsListRes.data) {
        setTickets(ticketsListRes.data.map((t: Record<string, unknown>) => ({
          id: t.id as number,
          titulo: t.titulo as string,
          prioridad: t.prioridad as string,
          estado: t.estado as string,
          fecha_creacion: t.fecha_creacion as string,
          persona_afectada: t.personas as { nombre: string; apellido: string | null } | null,
        })));
      }

      // Process pedidos
      const allPedidos: PedidoPendiente[] = [];
      if (pedidosTonerRes.data) {
        pedidosTonerRes.data.forEach((p: Record<string, unknown>) => {
          allPedidos.push({
            id: p.id as number,
            tipo: 'toner',
            descripcion: (p.items_stock as Record<string, unknown>)?.descripcion as string || 'Tóner',
            cantidad: p.cantidad as number,
            fecha_pedido: p.fecha_pedido as string,
            sector_nombre: (p.sectores as Record<string, unknown>)?.nombre as string || '',
          });
        });
      }
      if (pedidosStockRes.data) {
        pedidosStockRes.data.forEach((p: Record<string, unknown>) => {
          allPedidos.push({
            id: p.id as number,
            tipo: 'general',
            descripcion: (p.items_stock as Record<string, unknown>)?.descripcion as string || 'Item',
            cantidad: p.cantidad as number,
            fecha_pedido: p.fecha_pedido as string,
            sector_nombre: (p.sectores as Record<string, unknown>)?.nombre as string || '',
          });
        });
      }
      setPedidos(allPedidos);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const getPriorityBadge = (prioridad: string) => {
    switch (prioridad) {
      case 'Crítica': return styles.badgeDanger;
      case 'Alta': return styles.badgeWarning;
      case 'Media': return styles.badgeInfo;
      default: return styles.badgeSuccess;
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.pageHeaderIcon}>
          <LayoutDashboard size={24} />
        </div>
        <div className={styles.pageHeaderText}>
          <h1>Dashboard</h1>
          <p>Resumen general del sistema de inventario IT</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className={styles.statsGrid}>
        {METRIC_CARDS.map((card) => {
          const Icon = card.icon;
          const value = loading ? '—' : (stats?.[card.key as keyof DashboardStats] ?? 0);
          return (
            <div key={card.key} className={`${styles.metricCard} ${styles[card.color]}`}>
              <div className={styles.metricHeader}>
                <div className={`${styles.metricIcon} ${styles[card.color]}`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className={styles.metricValue}>{value}</div>
              <div className={styles.metricLabel}>{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Data Sections */}
      <div className={styles.sectionsGrid}>
        {/* Stock Bajo */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
              Alertas de Stock Bajo
            </span>
            {alertas.length > 0 && (
              <span className={styles.sectionBadge}>{alertas.length}</span>
            )}
          </div>
          <div className={styles.sectionBody}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.loadingRow}>
                  <div className={`${styles.skeletonLine} skeleton`} style={{ width: '80%' }} />
                  <div className={`${styles.skeletonLine} skeleton`} style={{ width: '50%' }} />
                </div>
              ))
            ) : alertas.length === 0 ? (
              <div className={styles.emptyRow}>Sin alertas de stock</div>
            ) : (
              alertas.map((alerta) => (
                <div key={alerta.id} className={styles.tableRow}>
                  <div className={styles.rowMain}>
                    <div className={styles.rowTitle}>{alerta.descripcion}</div>
                    <div className={styles.rowSub}>{alerta.categoria_nombre}</div>
                  </div>
                  <span className={styles.badgeDanger}>
                    {alerta.stock_actual} / {alerta.stock_minimo}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tickets Abiertos */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              <Ticket size={18} style={{ color: 'var(--info)' }} />
              Tickets Abiertos
            </span>
            {tickets.length > 0 && (
              <span className={styles.sectionBadge}>{tickets.length}</span>
            )}
          </div>
          <div className={styles.sectionBody}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.loadingRow}>
                  <div className={`${styles.skeletonLine} skeleton`} style={{ width: '80%' }} />
                  <div className={`${styles.skeletonLine} skeleton`} style={{ width: '50%' }} />
                </div>
              ))
            ) : tickets.length === 0 ? (
              <div className={styles.emptyRow}>Sin tickets abiertos</div>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket.id} className={styles.tableRow}>
                  <div className={styles.rowMain}>
                    <div className={styles.rowTitle}>#{ticket.id} - {ticket.titulo}</div>
                    <div className={styles.rowSub}>
                      {ticket.persona_afectada
                        ? `${ticket.persona_afectada.nombre} ${ticket.persona_afectada.apellido || ''}`
                        : 'Sin asignar'
                      } · {formatDate(ticket.fecha_creacion)}
                    </div>
                  </div>
                  <span className={getPriorityBadge(ticket.prioridad)}>
                    {ticket.prioridad}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pedidos Pendientes */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              <Package size={18} style={{ color: 'var(--accent-primary)' }} />
              Pedidos Pendientes
            </span>
            {pedidos.length > 0 && (
              <span className={styles.sectionBadge}>{pedidos.length}</span>
            )}
          </div>
          <div className={styles.sectionBody}>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.loadingRow}>
                  <div className={`${styles.skeletonLine} skeleton`} style={{ width: '80%' }} />
                  <div className={`${styles.skeletonLine} skeleton`} style={{ width: '50%' }} />
                </div>
              ))
            ) : pedidos.length === 0 ? (
              <div className={styles.emptyRow}>Sin pedidos pendientes</div>
            ) : (
              pedidos.map((pedido) => (
                <div key={`${pedido.tipo}-${pedido.id}`} className={styles.tableRow}>
                  <div className={styles.rowMain}>
                    <div className={styles.rowTitle}>{pedido.descripcion}</div>
                    <div className={styles.rowSub}>
                      Cant: {pedido.cantidad} · {pedido.sector_nombre || 'Sin sector'} · {formatDate(pedido.fecha_pedido)}
                    </div>
                  </div>
                  <span className={pedido.tipo === 'toner' ? styles.badgeInfo : styles.badgeWarning}>
                    {pedido.tipo === 'toner' ? 'Tóner' : 'Stock'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
