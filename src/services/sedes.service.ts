import { getSupabaseClient } from '@/lib/supabase/client';
import type { Sede } from '@/types/database';

// ============================================================================
// SEDES SERVICE
// ============================================================================

type SedeInsert = Omit<Sede, 'id' | 'created_at' | 'updated_at'>;
type SedeUpdate = Partial<SedeInsert>;

export async function getSedes(search?: string, activo?: boolean) {
  const supabase = getSupabaseClient();
  let query = supabase.from('sedes').select('*').order('nombre');

  if (search) query = query.ilike('nombre', `%${search}%`);
  if (activo !== undefined) query = query.eq('activo', activo);

  const { data, error } = await query;
  return { data: data as Sede[] | null, error };
}

export async function getSedeById(id: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('sedes')
    .select('*')
    .eq('id', id)
    .single();

  return { data: data as Sede | null, error };
}

export async function createSede(data: SedeInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('sedes')
    .insert(data)
    .select()
    .single();

  return { data: result as Sede | null, error };
}

export async function updateSede(id: number, data: SedeUpdate) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('sedes')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  return { data: result as Sede | null, error };
}

export async function deleteSede(id: number) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('sedes')
    .update({ activo: false })
    .eq('id', id);

  return { error };
}
