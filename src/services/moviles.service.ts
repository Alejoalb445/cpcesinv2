import { getSupabaseClient } from '@/lib/supabase/client';
import { DispositivoMovil, CreateDTO, UpdateDTO } from '@/types/database';

export async function getMoviles(search?: string, tipo?: string, estado?: string) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('dispositivos_moviles')
      .select('*, marca:marcas(*), modelo:modelos(*), usuario:usuarios(*), sector:sectores(*), proveedor:proveedores(*)');
    
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    
    if (estado) {
      query = query.eq('estado', estado);
    }
    
    if (search) {
      query = query.or(`serial.ilike.%${search}%,imei.ilike.%${search}%,numero_linea.ilike.%${search}%,codigo_inventario.ilike.%${search}%`);
    }
    
    query = query.order('id', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { data: data as DispositivoMovil[], error: null };
  } catch (error: any) {
    console.error('Error in getMoviles:', error);
    return { data: null, error };
  }
}

export async function getMovilById(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('dispositivos_moviles')
      .select('*, marca:marcas(*), modelo:modelos(*), usuario:usuarios(*), sector:sectores(*), proveedor:proveedores(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    
    return { data: data as DispositivoMovil, error: null };
  } catch (error: any) {
    console.error(`Error in getMovilById(${id}):`, error);
    return { data: null, error };
  }
}

export async function createMovil(data: CreateDTO<DispositivoMovil>) {
  try {
    const supabase = getSupabaseClient();
    const { data: createdData, error } = await supabase
      .from('dispositivos_moviles')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    
    return { data: createdData as DispositivoMovil, error: null };
  } catch (error: any) {
    console.error('Error in createMovil:', error);
    return { data: null, error };
  }
}

export async function updateMovil(id: number, data: UpdateDTO<DispositivoMovil>) {
  try {
    const supabase = getSupabaseClient();
    const { data: updatedData, error } = await supabase
      .from('dispositivos_moviles')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: updatedData as DispositivoMovil, error: null };
  } catch (error: any) {
    console.error(`Error in updateMovil(${id}):`, error);
    return { data: null, error };
  }
}
