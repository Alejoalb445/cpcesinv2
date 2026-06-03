import { getSupabaseClient } from '@/lib/supabase/client';
import type { ActivoDvrNvr, ActivoCamara, Activo } from '@/types/database';

// ============================================================================
// CCTV SERVICE - DVR/NVR
// ============================================================================

const DVR_SELECT = `
  *,
  activo:activos(
    *,
    tipo_activo:tipos_activo(*),
    marca:marcas(*),
    modelo:modelos(*)
  ),
  ubicacion_fisica:ubicaciones_fisicas(
    *,
    sede:sedes(*)
  )
`;

type DvrNvrWithActivo = ActivoDvrNvr & {
  activo?: Activo;
};

export async function getDvrNvr(search?: string) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('activos_dvr_nvr')
    .select(DVR_SELECT)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`ip.ilike.%${search}%,tipo.ilike.%${search}%,ubicacion_especifica.ilike.%${search}%`);
  }

  const { data, error } = await query;
  return { data: data as DvrNvrWithActivo[] | null, error };
}

export async function getDvrNvrById(id: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('activos_dvr_nvr')
    .select(DVR_SELECT)
    .eq('id_activo', id)
    .single();

  return { data: data as DvrNvrWithActivo | null, error };
}

export async function createDvrNvr(
  activo_data: Omit<Activo, 'id' | 'created_at' | 'updated_at' | 'tipo_activo' | 'marca' | 'modelo' | 'proveedor'>,
  dvr_data: Omit<ActivoDvrNvr, 'id_activo' | 'created_at' | 'updated_at'>
) {
  const supabase = getSupabaseClient();

  // Create the base activo first
  const { data: activo, error: activoError } = await supabase
    .from('activos')
    .insert(activo_data)
    .select()
    .single();

  if (activoError || !activo) return { data: null, error: activoError };

  // Create the DVR/NVR detail
  const { data: dvr, error: dvrError } = await supabase
    .from('activos_dvr_nvr')
    .insert({ ...dvr_data, id_activo: activo.id })
    .select(DVR_SELECT)
    .single();

  if (dvrError) {
    // Rollback: delete the activo if DVR creation fails
    await supabase.from('activos').delete().eq('id', activo.id);
    return { data: null, error: dvrError };
  }

  return { data: dvr as DvrNvrWithActivo | null, error: null };
}

export async function updateDvrNvr(id: number, data: Partial<Omit<ActivoDvrNvr, 'id_activo' | 'created_at' | 'updated_at'>>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('activos_dvr_nvr')
    .update(data)
    .eq('id_activo', id)
    .select(DVR_SELECT)
    .single();

  return { data: result as DvrNvrWithActivo | null, error };
}

// ============================================================================
// CCTV SERVICE - CÁMARAS
// ============================================================================

const CAMARA_SELECT = `
  *,
  activo:activos(
    *,
    tipo_activo:tipos_activo(*),
    marca:marcas(*),
    modelo:modelos(*)
  ),
  ubicacion_fisica:ubicaciones_fisicas(
    *,
    sede:sedes(*)
  )
`;

type CamaraWithActivo = ActivoCamara & {
  activo?: Activo;
};

export async function getCamaras(id_dvr?: number) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('activos_camaras')
    .select(CAMARA_SELECT)
    .order('created_at', { ascending: false });

  if (id_dvr) query = query.eq('id_dvr_nvr', id_dvr);

  const { data, error } = await query;
  return { data: data as CamaraWithActivo[] | null, error };
}

export async function getCamaraById(id: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('activos_camaras')
    .select(CAMARA_SELECT)
    .eq('id_activo', id)
    .single();

  return { data: data as CamaraWithActivo | null, error };
}

export async function createCamara(
  activo_data: Omit<Activo, 'id' | 'created_at' | 'updated_at' | 'tipo_activo' | 'marca' | 'modelo' | 'proveedor'>,
  camara_data: Omit<ActivoCamara, 'id_activo' | 'created_at' | 'updated_at'>
) {
  const supabase = getSupabaseClient();

  // Create the base activo first
  const { data: activo, error: activoError } = await supabase
    .from('activos')
    .insert(activo_data)
    .select()
    .single();

  if (activoError || !activo) return { data: null, error: activoError };

  // Create the camera detail
  const { data: camara, error: camaraError } = await supabase
    .from('activos_camaras')
    .insert({ ...camara_data, id_activo: activo.id })
    .select(CAMARA_SELECT)
    .single();

  if (camaraError) {
    // Rollback: delete the activo if camera creation fails
    await supabase.from('activos').delete().eq('id', activo.id);
    return { data: null, error: camaraError };
  }

  return { data: camara as CamaraWithActivo | null, error: null };
}

export async function updateCamara(id: number, data: Partial<Omit<ActivoCamara, 'id_activo' | 'created_at' | 'updated_at'>>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('activos_camaras')
    .update(data)
    .eq('id_activo', id)
    .select(CAMARA_SELECT)
    .single();

  return { data: result as CamaraWithActivo | null, error };
}

export async function asignarCamaraDvr(id_camara: number, id_dvr: number, canal: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('activos_camaras')
    .update({
      id_dvr_nvr: id_dvr,
      canal,
    })
    .eq('id_activo', id_camara)
    .select(CAMARA_SELECT)
    .single();

  return { data: data as CamaraWithActivo | null, error };
}
