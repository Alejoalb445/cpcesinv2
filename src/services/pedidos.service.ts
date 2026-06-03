import { getSupabaseClient } from '@/lib/supabase/client';
import type { PedidoToner, PedidoStockGeneral } from '@/types/database';

// ============================================================================
// PEDIDOS TONER SERVICE
// ============================================================================

type PedidoTonerInsert = Omit<PedidoToner, 'id' | 'created_at' | 'updated_at' | 'item_stock' | 'persona_solicitante' | 'sector' | 'puesto'>;
type PedidoTonerUpdate = Partial<PedidoTonerInsert>;

const PEDIDO_TONER_SELECT = `
  *,
  item_stock:items_stock(id, descripcion, codigo, color, stock_actual),
  persona_solicitante:personas(id, nombre, apellido),
  sector:sectores(id, nombre),
  puesto:puestos(id, codigo_puesto)
`;

export async function getPedidosToner(estado?: string, id_sector?: number) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('pedidos_toner')
    .select(PEDIDO_TONER_SELECT)
    .order('fecha_pedido', { ascending: false });

  if (estado) query = query.eq('estado', estado);
  if (id_sector) query = query.eq('id_sector', id_sector);

  const { data, error } = await query;
  return { data: data as PedidoToner[] | null, error };
}

export async function createPedidoToner(data: PedidoTonerInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('pedidos_toner')
    .insert(data)
    .select(PEDIDO_TONER_SELECT)
    .single();

  return { data: result as PedidoToner | null, error };
}

export async function updatePedidoToner(id: number, data: PedidoTonerUpdate) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('pedidos_toner')
    .update(data)
    .eq('id', id)
    .select(PEDIDO_TONER_SELECT)
    .single();

  return { data: result as PedidoToner | null, error };
}

export async function entregarPedidoToner(id_pedido: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('entregar_pedido_toner', {
    p_id_pedido: id_pedido,
  });

  return { data, error };
}

// ============================================================================
// PEDIDOS STOCK GENERAL SERVICE
// ============================================================================

type PedidoStockInsert = Omit<PedidoStockGeneral, 'id' | 'created_at' | 'updated_at' | 'item_stock' | 'persona_solicitante' | 'sector' | 'puesto'>;
type PedidoStockUpdate = Partial<PedidoStockInsert>;

const PEDIDO_STOCK_SELECT = `
  *,
  item_stock:items_stock(id, descripcion, codigo, stock_actual),
  persona_solicitante:personas(id, nombre, apellido),
  sector:sectores(id, nombre),
  puesto:puestos(id, codigo_puesto)
`;

export async function getPedidosStockGeneral(estado?: string, id_sector?: number) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('pedidos_stock_general')
    .select(PEDIDO_STOCK_SELECT)
    .order('fecha_pedido', { ascending: false });

  if (estado) query = query.eq('estado', estado);
  if (id_sector) query = query.eq('id_sector', id_sector);

  const { data, error } = await query;
  return { data: data as PedidoStockGeneral[] | null, error };
}

export async function createPedidoStockGeneral(data: PedidoStockInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('pedidos_stock_general')
    .insert(data)
    .select(PEDIDO_STOCK_SELECT)
    .single();

  return { data: result as PedidoStockGeneral | null, error };
}

export async function updatePedidoStockGeneral(id: number, data: PedidoStockUpdate) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('pedidos_stock_general')
    .update(data)
    .eq('id', id)
    .select(PEDIDO_STOCK_SELECT)
    .single();

  return { data: result as PedidoStockGeneral | null, error };
}

export async function entregarPedidoStockGeneral(id_pedido: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('entregar_pedido_stock_general', {
    p_id_pedido: id_pedido,
  });

  return { data, error };
}
