import { getSupabaseClient } from '@/lib/supabase/client';
import type { Persona, PersonaSectorHistorial } from '@/types/database';

// ============================================================================
// PERSONAS SERVICE
// ============================================================================

type PersonaInsert = Omit<Persona, 'id' | 'created_at' | 'updated_at' | 'sector_actual'>;
type PersonaUpdate = Partial<PersonaInsert>;

const PERSONA_SELECT = `
  *,
  sector_actual:sectores(*)
`;

export async function getPersonas(search?: string, id_sector?: number, activo?: boolean) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('personas')
    .select(PERSONA_SELECT)
    .order('apellido')
    .order('nombre');

  if (search) {
    query = query.or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,legajo.ilike.%${search}%`);
  }
  if (id_sector) query = query.eq('id_sector_actual', id_sector);
  if (activo !== undefined) query = query.eq('activo', activo);

  const { data, error } = await query;
  return { data: data as Persona[] | null, error };
}

export async function getPersonaById(id: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('personas')
    .select(PERSONA_SELECT)
    .eq('id', id)
    .single();

  return { data: data as Persona | null, error };
}

export async function createPersona(data: PersonaInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('personas')
    .insert(data)
    .select(PERSONA_SELECT)
    .single();

  return { data: result as Persona | null, error };
}

export async function updatePersona(id: number, data: PersonaUpdate) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('personas')
    .update(data)
    .eq('id', id)
    .select(PERSONA_SELECT)
    .single();

  return { data: result as Persona | null, error };
}

export async function deletePersona(id: number) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('personas')
    .update({ activo: false })
    .eq('id', id);

  return { error };
}

// ============================================================================
// PERSONA SECTOR HISTORIAL
// ============================================================================

export async function getPersonaSectorHistorial(id_persona: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('persona_sector_historial')
    .select(`
      *,
      sector:sectores(*)
    `)
    .eq('id_persona', id_persona)
    .order('fecha_inicio', { ascending: false });

  return { data: data as PersonaSectorHistorial[] | null, error };
}
