import { getSupabaseClient } from '@/lib/supabase/client';
import type {
  SolicitudCompra,
  OrdenCompra,
  OrdenCompraDetalle,
  RecepcionCompra,
} from '@/types/database';

// ============================================================================
// SOLICITUDES DE COMPRA SERVICE
// ============================================================================

type SolicitudInsert = Omit<SolicitudCompra, 'id' | 'created_at' | 'updated_at' | 'item_stock' | 'proveedor'>;
type SolicitudUpdate = Partial<SolicitudInsert>;

const SOLICITUD_SELECT = `
  *,
  item_stock:items_stock(id, descripcion, codigo, stock_actual, stock_minimo),
  proveedor:proveedores(id, nombre)
`;

export async function getSolicitudesCompra(estado?: string) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('solicitudes_compra')
    .select(SOLICITUD_SELECT)
    .order('fecha_solicitud', { ascending: false });

  if (estado) query = query.eq('estado', estado);

  const { data, error } = await query;
  return { data: data as SolicitudCompra[] | null, error };
}

export async function createSolicitudCompra(data: SolicitudInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('solicitudes_compra')
    .insert(data)
    .select(SOLICITUD_SELECT)
    .single();

  return { data: result as SolicitudCompra | null, error };
}

export async function updateSolicitudCompra(id: number, data: SolicitudUpdate) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('solicitudes_compra')
    .update(data)
    .eq('id', id)
    .select(SOLICITUD_SELECT)
    .single();

  return { data: result as SolicitudCompra | null, error };
}

// ============================================================================
// ORDENES DE COMPRA SERVICE
// ============================================================================

type OrdenInsert = Omit<OrdenCompra, 'id' | 'created_at' | 'updated_at' | 'proveedor'>;
type OrdenUpdate = Partial<OrdenInsert>;

const ORDEN_SELECT = `
  *,
  proveedor:proveedores(id, nombre, contacto, email)
`;

export async function getOrdenesCompra(estado?: string) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('ordenes_compra')
    .select(ORDEN_SELECT)
    .order('fecha_orden', { ascending: false });

  if (estado) query = query.eq('estado', estado);

  const { data, error } = await query;
  return { data: data as OrdenCompra[] | null, error };
}

export async function createOrdenCompra(data: OrdenInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('ordenes_compra')
    .insert(data)
    .select(ORDEN_SELECT)
    .single();

  return { data: result as OrdenCompra | null, error };
}

export async function updateOrdenCompra(id: number, data: OrdenUpdate) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('ordenes_compra')
    .update(data)
    .eq('id', id)
    .select(ORDEN_SELECT)
    .single();

  return { data: result as OrdenCompra | null, error };
}

// ============================================================================
// ORDEN COMPRA DETALLE
// ============================================================================

const DETALLE_SELECT = `
  *,
  item_stock:items_stock(id, descripcion, codigo),
  solicitud_compra:solicitudes_compra(id, descripcion_manual, cantidad_sugerida)
`;

export async function getOrdenCompraDetalle(id_orden: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('ordenes_compra_detalle')
    .select(DETALLE_SELECT)
    .eq('id_orden_compra', id_orden)
    .order('created_at');

  return { data: data as OrdenCompraDetalle[] | null, error };
}

// ============================================================================
// RECEPCIONES DE COMPRA
// ============================================================================

export async function registrarRecepcionCompra(data: {
  p_id_orden_compra: number;
  p_id_item_stock: number;
  p_cantidad_recibida: number;
  p_observaciones?: string;
}) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase.rpc('registrar_recepcion_compra', data);

  return { data: result as RecepcionCompra | null, error };
}
