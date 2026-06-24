import { getSupabaseClient } from '@/lib/supabase/client';
import { Sector, CreateDTO, UpdateDTO } from '@/types/database';

export async function getSectores(search?: string, activo?: boolean) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase.from('sectores').select('*');
    
    if (activo !== undefined) {
      query = query.eq('activo', activo);
    }
    
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,responsable.ilike.%${search}%`);
    }
    
    query = query.order('nombre', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { data: data as Sector[], error: null };
  } catch (error: any) {
    console.error('Error in getSectores:', error);
    return { data: null, error };
  }
}

export async function getSectorById(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('sectores')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    
    return { data: data as Sector, error: null };
  } catch (error: any) {
    console.error(`Error in getSectorById(${id}):`, error);
    return { data: null, error };
  }
}

export async function createSector(data: CreateDTO<Sector>) {
  try {
    const supabase = getSupabaseClient();
    const { data: createdData, error } = await supabase
      .from('sectores')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    
    return { data: createdData as Sector, error: null };
  } catch (error: any) {
    console.error('Error in createSector:', error);
    return { data: null, error };
  }
}

export async function updateSector(id: number, data: UpdateDTO<Sector>) {
  try {
    const supabase = getSupabaseClient();
    const { data: updatedData, error } = await supabase
      .from('sectores')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: updatedData as Sector, error: null };
  } catch (error: any) {
    console.error(`Error in updateSector(${id}):`, error);
    return { data: null, error };
  }
}

export async function deleteSector(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data: deletedData, error } = await supabase
      .from('sectores')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: deletedData as Sector, error: null };
  } catch (error: any) {
    console.error(`Error in deleteSector(${id}):`, error);
    return { data: null, error };
  }
}
