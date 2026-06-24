import { getSupabaseClient } from '@/lib/supabase/client';
import { PuestoTrabajo, CreateDTO, UpdateDTO } from '@/types/database';

export async function getPuestos(
  search?: string,
  id_sector?: number,
  id_ubicacion?: number,
  activo?: boolean
) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('puestos_trabajo')
      .select('*, ubicacion:ubicaciones(*), sector:sectores(*), usuario:usuarios(*)');
    
    if (activo !== undefined) {
      query = query.eq('activo', activo);
    }
    
    if (id_sector !== undefined && id_sector !== null) {
      query = query.eq('id_sector', id_sector);
    }
    
    if (id_ubicacion !== undefined && id_ubicacion !== null) {
      query = query.eq('id_ubicacion', id_ubicacion);
    }
    
    if (search) {
      query = query.or(`codigo.ilike.%${search}%,descripcion.ilike.%${search}%,boca_red.ilike.%${search}%`);
    }
    
    query = query.order('codigo', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { data: data as PuestoTrabajo[], error: null };
  } catch (error: any) {
    console.error('Error in getPuestos:', error);
    return { data: null, error };
  }
}

export async function getPuestoById(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('puestos_trabajo')
      .select(`
        *,
        ubicacion:ubicaciones(*),
        sector:sectores(*),
        usuario:usuarios(*),
        computadoras(*),
        perifericos(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    
    return { data: data as any, error: null };
  } catch (error: any) {
    console.error(`Error in getPuestoById(${id}):`, error);
    return { data: null, error };
  }
}

export async function createPuesto(data: CreateDTO<PuestoTrabajo>) {
  try {
    const supabase = getSupabaseClient();
    const { data: createdData, error } = await supabase
      .from('puestos_trabajo')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    
    return { data: createdData as PuestoTrabajo, error: null };
  } catch (error: any) {
    console.error('Error in createPuesto:', error);
    return { data: null, error };
  }
}

export async function updatePuesto(id: number, data: UpdateDTO<PuestoTrabajo>) {
  try {
    const supabase = getSupabaseClient();
    const { data: updatedData, error } = await supabase
      .from('puestos_trabajo')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: updatedData as PuestoTrabajo, error: null };
  } catch (error: any) {
    console.error(`Error in updatePuesto(${id}):`, error);
    return { data: null, error };
  }
}

export async function deletePuesto(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data: deletedData, error } = await supabase
      .from('puestos_trabajo')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: deletedData as PuestoTrabajo, error: null };
  } catch (error: any) {
    console.error(`Error in deletePuesto(${id}):`, error);
    return { data: null, error };
  }
}
