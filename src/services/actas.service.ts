import { getSupabaseClient } from '@/lib/supabase/client';
import type { ActaEntrega, ActaEntregaDetalle } from '@/types/database';

// ============================================================================
// ACTAS DE ENTREGA SERVICE
// ============================================================================

type ActaInsert = Omit<ActaEntrega, 'id' | 'created_at' | 'updated_at' | 'persona_recibe' | 'puesto' | 'sector'>;
type ActaUpdate = Partial<ActaInsert>;

const ACTA_SELECT = `
  *,
  persona_recibe:personas(id, nombre, apellido),
  puesto:puestos(id, codigo_puesto),
  sector:sectores(id, nombre)
`;

export async function getActas(search?: string) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('actas_entrega')
    .select(ACTA_SELECT)
    .order('fecha', { ascending: false });

  if (search) {
    query = query.or(`numero.ilike.%${search}%,observaciones.ilike.%${search}%`);
  }

  const { data, error } = await query;
  return { data: data as ActaEntrega[] | null, error };
}

export async function getActaById(id: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('actas_entrega')
    .select(ACTA_SELECT)
    .eq('id', id)
    .single();

  return { data: data as ActaEntrega | null, error };
}

export async function createActa(data: ActaInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('actas_entrega')
    .insert(data)
    .select(ACTA_SELECT)
    .single();

  return { data: result as ActaEntrega | null, error };
}

export async function updateActa(id: number, data: ActaUpdate) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('actas_entrega')
    .update(data)
    .eq('id', id)
    .select(ACTA_SELECT)
    .single();

  return { data: result as ActaEntrega | null, error };
}

// ============================================================================
// ACTA DETALLE
// ============================================================================

type DetalleInsert = Omit<ActaEntregaDetalle, 'id' | 'created_at' | 'activo' | 'item_stock'>;

const DETALLE_SELECT = `
  *,
  activo:activos(
    id,
    codigo_interno,
    serial,
    tipo_activo:tipos_activo(nombre),
    marca:marcas(nombre),
    modelo:modelos(nombre)
  ),
  item_stock:items_stock(id, descripcion, codigo)
`;

export async function getActaDetalle(id_acta: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('actas_entrega_detalle')
    .select(DETALLE_SELECT)
    .eq('id_acta', id_acta)
    .order('created_at');

  return { data: data as ActaEntregaDetalle[] | null, error };
}

export async function addActaDetalle(data: DetalleInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('actas_entrega_detalle')
    .insert(data)
    .select(DETALLE_SELECT)
    .single();

  return { data: result as ActaEntregaDetalle | null, error };
}

export async function removeActaDetalle(id: number) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('actas_entrega_detalle')
    .delete()
    .eq('id', id);

  return { error };
}
