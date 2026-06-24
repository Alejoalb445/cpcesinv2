import { getSupabaseClient } from '@/lib/supabase/client';
import { Computadora, CreateDTO, UpdateDTO } from '@/types/database';

export async function getComputadoras(search?: string, estado?: string, tipo?: string) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('computadoras')
      .select('*, marca:marcas(*), modelo:modelos(*), puesto:puestos_trabajo(*)');
    
    if (estado) {
      query = query.eq('estado', estado);
    }
    
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    
    if (search) {
      query = query.or(`hostname.ilike.%${search}%,serial.ilike.%${search}%,codigo_inventario.ilike.%${search}%`);
    }
    
    query = query.order('hostname', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { data: data as Computadora[], error: null };
  } catch (error: any) {
    console.error('Error in getComputadoras:', error);
    return { data: null, error };
  }
}

export async function getComputadoraById(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('computadoras')
      .select(`
        *,
        marca:marcas(*),
        modelo:modelos(*),
        puesto:puestos_trabajo(*),
        proveedor:proveedores(*),
        componentes:componentes_pc(*),
        interfaces_red:interfaces_red(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    
    return { data: data as Computadora, error: null };
  } catch (error: any) {
    console.error(`Error in getComputadoraById(${id}):`, error);
    return { data: null, error };
  }
}

export async function createComputadora(data: CreateDTO<Computadora>) {
  try {
    const supabase = getSupabaseClient();
    const { data: createdData, error } = await supabase
      .from('computadoras')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    
    return { data: createdData as Computadora, error: null };
  } catch (error: any) {
    console.error('Error in createComputadora:', error);
    return { data: null, error };
  }
}

export async function updateComputadora(id: number, data: UpdateDTO<Computadora>) {
  try {
    const supabase = getSupabaseClient();
    const { data: updatedData, error } = await supabase
      .from('computadoras')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: updatedData as Computadora, error: null };
  } catch (error: any) {
    console.error(`Error in updateComputadora(${id}):`, error);
    return { data: null, error };
  }
}

export async function deleteComputadora(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data: deletedData, error } = await supabase
      .from('computadoras')
      .update({ estado: 'Dado de baja' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: deletedData as Computadora, error: null };
  } catch (error: any) {
    console.error(`Error in deleteComputadora(${id}):`, error);
    return { data: null, error };
  }
}
