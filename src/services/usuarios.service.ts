import { getSupabaseClient } from '@/lib/supabase/client';
import { Usuario, UpdateDTO } from '@/types/database';

export async function getUsuarios(search?: string, id_sector?: number, activo?: boolean) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase.from('usuarios').select('*, sector:sectores(*)');
    
    if (activo !== undefined) {
      query = query.eq('activo', activo);
    }
    
    if (id_sector !== undefined && id_sector !== null) {
      query = query.eq('id_sector', id_sector);
    }
    
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    query = query.order('apellido', { ascending: true }).order('nombre', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { data: data as Usuario[], error: null };
  } catch (error: any) {
    console.error('Error in getUsuarios:', error);
    return { data: null, error };
  }
}

export async function getUsuarioById(id: string) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, sector:sectores(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    
    return { data: data as Usuario, error: null };
  } catch (error: any) {
    console.error(`Error in getUsuarioById(${id}):`, error);
    return { data: null, error };
  }
}

export async function updateUsuario(id: string, data: UpdateDTO<Usuario>) {
  try {
    const supabase = getSupabaseClient();
    const { data: updatedData, error } = await supabase
      .from('usuarios')
      .update(data)
      .eq('id', id)
      .select('*, sector:sectores(*)')
      .single();
    if (error) throw error;
    
    return { data: updatedData as Usuario, error: null };
  } catch (error: any) {
    console.error(`Error in updateUsuario(${id}):`, error);
    return { data: null, error };
  }
}

export async function toggleUsuarioActivo(id: string, activo: boolean) {
  try {
    const supabase = getSupabaseClient();
    const { data: updatedData, error } = await supabase
      .from('usuarios')
      .update({ activo })
      .eq('id', id)
      .select('*, sector:sectores(*)')
      .single();
    if (error) throw error;
    
    return { data: updatedData as Usuario, error: null };
  } catch (error: any) {
    console.error(`Error in toggleUsuarioActivo(${id}):`, error);
    return { data: null, error };
  }
}
