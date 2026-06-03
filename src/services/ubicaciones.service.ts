import { getSupabaseClient } from '@/lib/supabase/client';
import type { UbicacionFisica } from '@/types/database';

// ============================================================================
// UBICACIONES FÍSICAS SERVICE
// ============================================================================

type UbicacionInsert = Omit<UbicacionFisica, 'id' | 'created_at' | 'updated_at' | 'sede'>;
type UbicacionUpdate = Partial<UbicacionInsert>;

const UBICACION_SELECT = `
  *,
  sede:sedes(*)
`;

export async function getUbicaciones(search?: string, id_sede?: number, activo?: boolean) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('ubicaciones_fisicas')
    .select(UBICACION_SELECT)
    .order('detalle');

  if (search) query = query.ilike('detalle', `%${search}%`);
  if (id_sede) query = query.eq('id_sede', id_sede);
  if (activo !== undefined) query = query.eq('activo', activo);

  const { data, error } = await query;
  return { data: data as UbicacionFisica[] | null, error };
}

export async function getUbicacionById(id: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('ubicaciones_fisicas')
    .select(UBICACION_SELECT)
    .eq('id', id)
    .single();

  return { data: data as UbicacionFisica | null, error };
}

export async function createUbicacion(data: UbicacionInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('ubicaciones_fisicas')
    .insert(data)
    .select(UBICACION_SELECT)
    .single();

  return { data: result as UbicacionFisica | null, error };
}

export async function updateUbicacion(id: number, data: UbicacionUpdate) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('ubicaciones_fisicas')
    .update(data)
    .eq('id', id)
    .select(UBICACION_SELECT)
    .single();

  return { data: result as UbicacionFisica | null, error };
}

export async function deleteUbicacion(id: number) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('ubicaciones_fisicas')
    .update({ activo: false })
    .eq('id', id);

  return { error };
}
