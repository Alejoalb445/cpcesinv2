import { getSupabaseClient } from '@/lib/supabase/client';
import { Ubicacion, CreateDTO, UpdateDTO } from '@/types/database';

export async function getUbicaciones(search?: string, activo?: boolean) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase.from('ubicaciones').select('*');
    
    if (activo !== undefined) {
      query = query.eq('activo', activo);
    }
    
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,direccion.ilike.%${search}%`);
    }
    
    query = query.order('nombre', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { data: data as Ubicacion[], error: null };
  } catch (error: any) {
    console.error('Error in getUbicaciones:', error);
    return { data: null, error };
  }
}

export async function getUbicacionById(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('ubicaciones')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    
    return { data: data as Ubicacion, error: null };
  } catch (error: any) {
    console.error(`Error in getUbicacionById(${id}):`, error);
    return { data: null, error };
  }
}

export async function createUbicacion(data: CreateDTO<Ubicacion>) {
  try {
    const supabase = getSupabaseClient();
    const { data: createdData, error } = await supabase
      .from('ubicaciones')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    
    return { data: createdData as Ubicacion, error: null };
  } catch (error: any) {
    console.error('Error in createUbicacion:', error);
    return { data: null, error };
  }
}

export async function updateUbicacion(id: number, data: UpdateDTO<Ubicacion>) {
  try {
    const supabase = getSupabaseClient();
    const { data: updatedData, error } = await supabase
      .from('ubicaciones')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: updatedData as Ubicacion, error: null };
  } catch (error: any) {
    console.error(`Error in updateUbicacion(${id}):`, error);
    return { data: null, error };
  }
}

export async function deleteUbicacion(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data: deletedData, error } = await supabase
      .from('ubicaciones')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: deletedData as Ubicacion, error: null };
  } catch (error: any) {
    console.error(`Error in deleteUbicacion(${id}):`, error);
    return { data: null, error };
  }
}
