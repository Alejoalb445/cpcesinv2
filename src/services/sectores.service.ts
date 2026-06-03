import { getSupabaseClient } from '@/lib/supabase/client';
import type { Sector, SectorCorreo } from '@/types/database';

// ============================================================================
// SECTORES SERVICE
// ============================================================================

type SectorInsert = Omit<Sector, 'id' | 'created_at' | 'updated_at'>;
type SectorUpdate = Partial<SectorInsert>;
type SectorCorreoInsert = Omit<SectorCorreo, 'id' | 'created_at'>;

export async function getSectores(search?: string, activo?: boolean) {
  const supabase = getSupabaseClient();
  let query = supabase.from('sectores').select('*').order('nombre');

  if (search) query = query.ilike('nombre', `%${search}%`);
  if (activo !== undefined) query = query.eq('activo', activo);

  const { data, error } = await query;
  return { data: data as Sector[] | null, error };
}

export async function getSectorById(id: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('sectores')
    .select('*')
    .eq('id', id)
    .single();

  return { data: data as Sector | null, error };
}

export async function createSector(data: SectorInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('sectores')
    .insert(data)
    .select()
    .single();

  return { data: result as Sector | null, error };
}

export async function updateSector(id: number, data: SectorUpdate) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('sectores')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  return { data: result as Sector | null, error };
}

export async function deleteSector(id: number) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('sectores')
    .update({ activo: false })
    .eq('id', id);

  return { error };
}

// ============================================================================
// SECTOR CORREOS
// ============================================================================

export async function getSectorCorreos(id_sector: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('sector_correos')
    .select('*')
    .eq('id_sector', id_sector)
    .order('email');

  return { data: data as SectorCorreo[] | null, error };
}

export async function addSectorCorreo(data: SectorCorreoInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('sector_correos')
    .insert(data)
    .select()
    .single();

  return { data: result as SectorCorreo | null, error };
}

export async function deleteSectorCorreo(id: number) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('sector_correos')
    .delete()
    .eq('id', id);

  return { error };
}
