import { getSupabaseClient } from '@/lib/supabase/client';
import type { Puesto, PuestoPersonaHistorial, AsignacionActivo } from '@/types/database';

// ============================================================================
// PUESTOS SERVICE
// ============================================================================

type PuestoInsert = Omit<Puesto, 'id' | 'created_at' | 'updated_at' | 'sector' | 'ubicacion_fisica'>;
type PuestoUpdate = Partial<PuestoInsert>;

const PUESTO_SELECT = `
  *,
  sector:sectores(*),
  ubicacion_fisica:ubicaciones_fisicas(
    *,
    sede:sedes(*)
  )
`;

export async function getPuestos(search?: string, id_sector?: number, estado?: string) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('puestos')
    .select(PUESTO_SELECT)
    .order('codigo_puesto');

  if (search) {
    query = query.or(`codigo_puesto.ilike.%${search}%,descripcion.ilike.%${search}%,ip.ilike.%${search}%`);
  }
  if (id_sector) query = query.eq('id_sector', id_sector);
  if (estado) query = query.eq('estado', estado);

  const { data, error } = await query;
  return { data: data as Puesto[] | null, error };
}

export async function getPuestoById(id: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('puestos')
    .select(PUESTO_SELECT)
    .eq('id', id)
    .single();

  return { data: data as Puesto | null, error };
}

export async function createPuesto(data: PuestoInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('puestos')
    .insert(data)
    .select(PUESTO_SELECT)
    .single();

  return { data: result as Puesto | null, error };
}

export async function updatePuesto(id: number, data: PuestoUpdate) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('puestos')
    .update(data)
    .eq('id', id)
    .select(PUESTO_SELECT)
    .single();

  return { data: result as Puesto | null, error };
}

export async function deletePuesto(id: number) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('puestos')
    .update({ estado: 'Inactivo' })
    .eq('id', id);

  return { error };
}

// ============================================================================
// PUESTO - PERSONA HISTORIAL
// ============================================================================

export async function getPuestoPersonas(id_puesto: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('puesto_persona_historial')
    .select(`
      *,
      persona:personas(*)
    `)
    .eq('id_puesto', id_puesto)
    .eq('activo', true)
    .order('fecha_inicio', { ascending: false });

  return { data: data as PuestoPersonaHistorial[] | null, error };
}

export async function asignarPersonaPuesto(data: Omit<PuestoPersonaHistorial, 'id' | 'created_at' | 'persona' | 'puesto'>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('puesto_persona_historial')
    .insert(data)
    .select(`
      *,
      persona:personas(*)
    `)
    .single();

  return { data: result as PuestoPersonaHistorial | null, error };
}

export async function finalizarAsignacionPersona(id: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('puesto_persona_historial')
    .update({
      activo: false,
      fecha_fin: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  return { data: data as PuestoPersonaHistorial | null, error };
}

// ============================================================================
// PUESTO - ACTIVOS ASIGNADOS
// ============================================================================

export async function getPuestoActivos(id_puesto: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('asignaciones_activos')
    .select(`
      *,
      activo:activos(
        *,
        tipo_activo:tipos_activo(*),
        marca:marcas(*),
        modelo:modelos(*)
      ),
      persona:personas(*),
      sector:sectores(*)
    `)
    .eq('id_puesto', id_puesto)
    .eq('estado', 'Asignado')
    .order('fecha_inicio', { ascending: false });

  return { data: data as AsignacionActivo[] | null, error };
}

export async function getHistorialAsignaciones(id_puesto: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('asignaciones_activos')
    .select(`
      *,
      activo:activos(
        *,
        tipo_activo:tipos_activo(*),
        marca:marcas(*),
        modelo:modelos(*)
      ),
      persona:personas(*),
      sector:sectores(*)
    `)
    .eq('id_puesto', id_puesto)
    .order('fecha_inicio', { ascending: false });

  return { data: data as AsignacionActivo[] | null, error };
}
