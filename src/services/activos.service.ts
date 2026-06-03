import { getSupabaseClient } from '@/lib/supabase/client';
import type {
  Activo,
  ActivoPc,
  ActivoImpresora,
  ActivoRed,
  ActivoTelefonia,
  AsignacionActivo,
  TipoActivo,
  Marca,
  Modelo,
  PaginatedResponse,
} from '@/types/database';

// ============================================================================
// ACTIVOS SERVICE
// ============================================================================

type ActivoInsert = Omit<Activo, 'id' | 'created_at' | 'updated_at' | 'tipo_activo' | 'marca' | 'modelo' | 'proveedor'>;
type ActivoUpdate = Partial<ActivoInsert>;

const ACTIVO_SELECT = `
  *,
  tipo_activo:tipos_activo(*),
  marca:marcas(*),
  modelo:modelos(*),
  proveedor:proveedores(*)
`;

export async function getActivos(
  search?: string,
  id_tipo?: number,
  estado?: string,
  page: number = 1,
  pageSize: number = 25
) {
  const supabase = getSupabaseClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('activos')
    .select(ACTIVO_SELECT, { count: 'exact' })
    .eq('dado_de_baja', false)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(`serial.ilike.%${search}%,codigo_interno.ilike.%${search}%,observaciones.ilike.%${search}%`);
  }
  if (id_tipo) query = query.eq('id_tipo_activo', id_tipo);
  if (estado) query = query.eq('estado', estado);

  const { data, error, count } = await query;

  if (error) return { data: null, error };

  const result: PaginatedResponse<Activo> = {
    data: (data as Activo[]) || [],
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };

  return { data: result, error: null };
}

export async function getActivoById(id: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('activos')
    .select(ACTIVO_SELECT)
    .eq('id', id)
    .single();

  return { data: data as Activo | null, error };
}

export async function createActivo(data: ActivoInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('activos')
    .insert(data)
    .select(ACTIVO_SELECT)
    .single();

  return { data: result as Activo | null, error };
}

export async function updateActivo(id: number, data: ActivoUpdate) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('activos')
    .update(data)
    .eq('id', id)
    .select(ACTIVO_SELECT)
    .single();

  return { data: result as Activo | null, error };
}

// ============================================================================
// ACTIVOS PC
// ============================================================================

export async function getActivoPcDetail(id_activo: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('activos_pc')
    .select('*')
    .eq('id_activo', id_activo)
    .single();

  return { data: data as ActivoPc | null, error };
}

export async function createActivoPc(data: ActivoPc) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('activos_pc')
    .insert(data)
    .select()
    .single();

  return { data: result as ActivoPc | null, error };
}

export async function updateActivoPc(id_activo: number, data: Partial<Omit<ActivoPc, 'id_activo' | 'created_at' | 'updated_at'>>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('activos_pc')
    .update(data)
    .eq('id_activo', id_activo)
    .select()
    .single();

  return { data: result as ActivoPc | null, error };
}

// ============================================================================
// ACTIVOS IMPRESORA
// ============================================================================

export async function getActivoImpresoraDetail(id_activo: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('activos_impresoras')
    .select('*')
    .eq('id_activo', id_activo)
    .single();

  return { data: data as ActivoImpresora | null, error };
}

export async function createActivoImpresora(data: ActivoImpresora) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('activos_impresoras')
    .insert(data)
    .select()
    .single();

  return { data: result as ActivoImpresora | null, error };
}

export async function updateActivoImpresora(id_activo: number, data: Partial<Omit<ActivoImpresora, 'id_activo' | 'created_at' | 'updated_at'>>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('activos_impresoras')
    .update(data)
    .eq('id_activo', id_activo)
    .select()
    .single();

  return { data: result as ActivoImpresora | null, error };
}

// ============================================================================
// ACTIVOS RED
// ============================================================================

export async function getActivoRedDetail(id_activo: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('activos_red')
    .select('*')
    .eq('id_activo', id_activo)
    .single();

  return { data: data as ActivoRed | null, error };
}

export async function createActivoRed(data: ActivoRed) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('activos_red')
    .insert(data)
    .select()
    .single();

  return { data: result as ActivoRed | null, error };
}

export async function updateActivoRed(id_activo: number, data: Partial<Omit<ActivoRed, 'id_activo' | 'created_at' | 'updated_at'>>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('activos_red')
    .update(data)
    .eq('id_activo', id_activo)
    .select()
    .single();

  return { data: result as ActivoRed | null, error };
}

// ============================================================================
// ACTIVOS TELEFONÍA
// ============================================================================

export async function getActivoTelefoniaDetail(id_activo: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('activos_telefonia')
    .select('*')
    .eq('id_activo', id_activo)
    .single();

  return { data: data as ActivoTelefonia | null, error };
}

export async function createActivoTelefonia(data: ActivoTelefonia) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('activos_telefonia')
    .insert(data)
    .select()
    .single();

  return { data: result as ActivoTelefonia | null, error };
}

export async function updateActivoTelefonia(id_activo: number, data: Partial<Omit<ActivoTelefonia, 'id_activo' | 'created_at' | 'updated_at'>>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('activos_telefonia')
    .update(data)
    .eq('id_activo', id_activo)
    .select()
    .single();

  return { data: result as ActivoTelefonia | null, error };
}

// ============================================================================
// ASIGNACIONES DE ACTIVOS
// ============================================================================

type AsignacionInsert = Omit<AsignacionActivo, 'id' | 'created_at' | 'updated_at' | 'activo' | 'puesto' | 'persona' | 'sector'>;

export async function asignarActivo(data: AsignacionInsert) {
  const supabase = getSupabaseClient();

  // Create assignment
  const { data: result, error } = await supabase
    .from('asignaciones_activos')
    .insert(data)
    .select(`
      *,
      activo:activos(*),
      puesto:puestos(*),
      persona:personas(*),
      sector:sectores(*)
    `)
    .single();

  if (error) return { data: null, error };

  // Update activo status
  await supabase
    .from('activos')
    .update({ estado: 'Asignado' })
    .eq('id', data.id_activo);

  return { data: result as AsignacionActivo | null, error: null };
}

export async function devolverActivo(id_asignacion: number) {
  const supabase = getSupabaseClient();

  // Get assignment to find activo id
  const { data: asignacion, error: fetchError } = await supabase
    .from('asignaciones_activos')
    .select('id_activo')
    .eq('id', id_asignacion)
    .single();

  if (fetchError) return { error: fetchError };

  // Update assignment
  const { error: updateError } = await supabase
    .from('asignaciones_activos')
    .update({
      estado: 'Devuelto',
      fecha_fin: new Date().toISOString(),
    })
    .eq('id', id_asignacion);

  if (updateError) return { error: updateError };

  // Update activo status back to depot
  const { error: activoError } = await supabase
    .from('activos')
    .update({ estado: 'En Depósito' })
    .eq('id', asignacion.id_activo);

  return { error: activoError };
}

export async function getHistorialAsignacionesActivo(id_activo: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('asignaciones_activos')
    .select(`
      *,
      puesto:puestos(codigo_puesto, descripcion),
      persona:personas(nombre, apellido),
      sector:sectores(nombre)
    `)
    .eq('id_activo', id_activo)
    .order('fecha_inicio', { ascending: false });

  return { data: data as AsignacionActivo[] | null, error };
}

// ============================================================================
// DAR DE BAJA
// ============================================================================

export async function darDeBajaActivo(id: number, motivo: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('activos')
    .update({
      estado: 'De Baja',
      dado_de_baja: true,
      fecha_baja: new Date().toISOString(),
      motivo_baja: motivo,
    })
    .eq('id', id)
    .select()
    .single();

  return { data: data as Activo | null, error };
}

// ============================================================================
// CATÁLOGOS
// ============================================================================

export async function getTiposActivo() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tipos_activo')
    .select('*')
    .eq('activo', true)
    .order('nombre');

  return { data: data as TipoActivo[] | null, error };
}

export async function getMarcas() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('marcas')
    .select('*')
    .eq('activo', true)
    .order('nombre');

  return { data: data as Marca[] | null, error };
}

export async function getModelos(id_marca?: number) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('modelos')
    .select(`
      *,
      marca:marcas(*)
    `)
    .eq('activo', true)
    .order('nombre');

  if (id_marca) query = query.eq('id_marca', id_marca);

  const { data, error } = await query;
  return { data: data as Modelo[] | null, error };
}
