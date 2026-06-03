import { getSupabaseClient } from '@/lib/supabase/client';
import type { ItemStock, TicketSoporte, PedidoToner, PedidoStockGeneral } from '@/types/database';

// ============================================================================
// DASHBOARD SERVICE
// ============================================================================

export interface DashboardStats {
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

export async function getDashboardStats(): Promise<{ data: DashboardStats | null; error: Error | null }> {
  const supabase = getSupabaseClient();

  try {
    // Calculate date 30 days from now for license expiry check
    const treintaDias = new Date();
    treintaDias.setDate(treintaDias.getDate() + 30);
    const fechaLimite = treintaDias.toISOString().split('T')[0];

    const [
      totalActivos,
      activosAsignados,
      activosReparacion,
      stockBajo,
      pedidosTonerPendientes,
      pedidosStockPendientes,
      ticketsAbiertos,
      licenciasVencer,
      solicitudesCompraPendientes,
    ] = await Promise.all([
      supabase
        .from('activos')
        .select('*', { count: 'exact', head: true })
        .eq('dado_de_baja', false),
      supabase
        .from('activos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Asignado')
        .eq('dado_de_baja', false),
      supabase
        .from('activos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'En Reparación')
        .eq('dado_de_baja', false),
      supabase
        .from('items_stock')
        .select('*', { count: 'exact', head: true })
        .eq('activo', true)
        .filter('stock_actual', 'lte', 'stock_minimo'),
      supabase
        .from('pedidos_toner')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Pendiente'),
      supabase
        .from('pedidos_stock_general')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Pendiente'),
      supabase
        .from('tickets_soporte')
        .select('*', { count: 'exact', head: true })
        .not('estado', 'in', '("Resuelto","Cancelado")'),
      supabase
        .from('licencias')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Activa')
        .lte('fecha_vencimiento', fechaLimite)
        .not('fecha_vencimiento', 'is', null),
      supabase
        .from('solicitudes_compra')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'Pendiente'),
    ]);

    return {
      data: {
        totalActivos: totalActivos.count || 0,
        activosAsignados: activosAsignados.count || 0,
        activosReparacion: activosReparacion.count || 0,
        stockBajo: stockBajo.count || 0,
        pedidosTonerPendientes: pedidosTonerPendientes.count || 0,
        pedidosStockPendientes: pedidosStockPendientes.count || 0,
        ticketsAbiertos: ticketsAbiertos.count || 0,
        licenciasVencer: licenciasVencer.count || 0,
        solicitudesCompraPendientes: solicitudesCompraPendientes.count || 0,
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

// ============================================================================
// ALERTAS STOCK BAJO
// ============================================================================

export async function getAlertasStockBajo() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('items_stock')
    .select(`
      *,
      categoria:categorias_stock(*)
    `)
    .eq('activo', true)
    .filter('stock_actual', 'lte', 'stock_minimo')
    .order('descripcion');

  return { data: data as ItemStock[] | null, error };
}

// ============================================================================
// TICKETS ABIERTOS (RECIENTES)
// ============================================================================

export async function getTicketsAbiertos() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tickets_soporte')
    .select(`
      *,
      persona_afectada:personas(id, nombre, apellido),
      puesto:puestos(id, codigo_puesto)
    `)
    .not('estado', 'in', '("Resuelto","Cancelado")')
    .order('fecha_creacion', { ascending: false })
    .limit(10);

  return { data: data as TicketSoporte[] | null, error };
}

// ============================================================================
// PEDIDOS PENDIENTES
// ============================================================================

export async function getPedidosPendientes() {
  const supabase = getSupabaseClient();

  const [tonerResult, stockResult] = await Promise.all([
    supabase
      .from('pedidos_toner')
      .select(`
        *,
        item_stock:items_stock(id, descripcion, codigo, color),
        persona_solicitante:personas(id, nombre, apellido),
        sector:sectores(id, nombre)
      `)
      .eq('estado', 'Pendiente')
      .order('fecha_pedido', { ascending: false })
      .limit(5),
    supabase
      .from('pedidos_stock_general')
      .select(`
        *,
        item_stock:items_stock(id, descripcion, codigo),
        persona_solicitante:personas(id, nombre, apellido),
        sector:sectores(id, nombre)
      `)
      .eq('estado', 'Pendiente')
      .order('fecha_pedido', { ascending: false })
      .limit(5),
  ]);

  return {
    pedidosToner: tonerResult.data as PedidoToner[] | null,
    pedidosStock: stockResult.data as PedidoStockGeneral[] | null,
    error: tonerResult.error || stockResult.error,
  };
}
