import { getSupabaseClient } from '@/lib/supabase/client';
import type { Licencia, LicenciaAsignada } from '@/types/database';

// ============================================================================
// LICENCIAS SERVICE
// ============================================================================

type LicenciaInsert = Omit<Licencia, 'id' | 'created_at' | 'updated_at' | 'proveedor'>;
type LicenciaUpdate = Partial<LicenciaInsert>;

const LICENCIA_SELECT = `
  *,
  proveedor:proveedores(id, nombre)
`;

export async function getLicencias(search?: string, estado?: string) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('licencias')
    .select(LICENCIA_SELECT)
    .order('software');

  if (search) {
    query = query.or(`software.ilike.%${search}%,fabricante.ilike.%${search}%,clave_producto.ilike.%${search}%`);
  }
  if (estado) query = query.eq('estado', estado);

  const { data, error } = await query;
  return { data: data as Licencia[] | null, error };
}

export async function getLicenciaById(id: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('licencias')
    .select(LICENCIA_SELECT)
    .eq('id', id)
    .single();

  return { data: data as Licencia | null, error };
}

export async function createLicencia(data: LicenciaInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('licencias')
    .insert(data)
    .select(LICENCIA_SELECT)
    .single();

  return { data: result as Licencia | null, error };
}

export async function updateLicencia(id: number, data: LicenciaUpdate) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('licencias')
    .update(data)
    .eq('id', id)
    .select(LICENCIA_SELECT)
    .single();

  return { data: result as Licencia | null, error };
}

// ============================================================================
// LICENCIAS ASIGNADAS
// ============================================================================

type LicenciaAsignadaInsert = Omit<LicenciaAsignada, 'id' | 'created_at' | 'updated_at' | 'licencia' | 'persona' | 'puesto' | 'sector'>;

const ASIGNACION_SELECT = `
  *,
  licencia:licencias(id, software, tipo),
  persona:personas(id, nombre, apellido),
  puesto:puestos(id, codigo_puesto),
  sector:sectores(id, nombre)
`;

export async function getLicenciasAsignadas(id_licencia: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('licencias_asignadas')
    .select(ASIGNACION_SELECT)
    .eq('id_licencia', id_licencia)
    .order('fecha_asignado', { ascending: false });

  return { data: data as LicenciaAsignada[] | null, error };
}

export async function asignarLicencia(data: LicenciaAsignadaInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('licencias_asignadas')
    .insert(data)
    .select(ASIGNACION_SELECT)
    .single();

  if (error) return { data: null, error };

  // Increment cantidad_en_uso
  await supabase.rpc('incrementar_uso_licencia', { p_id_licencia: data.id_licencia });

  return { data: result as LicenciaAsignada | null, error: null };
}

export async function liberarLicencia(id_asignacion: number) {
  const supabase = getSupabaseClient();

  // Get assignment to find licencia id
  const { data: asignacion, error: fetchError } = await supabase
    .from('licencias_asignadas')
    .select('id_licencia')
    .eq('id', id_asignacion)
    .single();

  if (fetchError) return { error: fetchError };

  // Update assignment
  const { error: updateError } = await supabase
    .from('licencias_asignadas')
    .update({
      estado: 'Liberada',
      fecha_liberado: new Date().toISOString(),
    })
    .eq('id', id_asignacion);

  if (updateError) return { error: updateError };

  // Decrement cantidad_en_uso
  if (asignacion) {
    await supabase.rpc('decrementar_uso_licencia', { p_id_licencia: asignacion.id_licencia });
  }

  return { error: null };
}
