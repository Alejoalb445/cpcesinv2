import { getSupabaseClient } from '@/lib/supabase/client';
import { Periferico, CreateDTO, UpdateDTO } from '@/types/database';

export async function getPerifericos(search?: string, categoria?: string, estado?: string) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('perifericos')
      .select('*, marca:marcas(*), modelo:modelos(*), puesto:puestos_trabajo(*)');
    
    if (categoria) {
      query = query.eq('categoria', categoria);
    }
    
    if (estado) {
      query = query.eq('estado', estado);
    }
    
    if (search) {
      query = query.or(`serial.ilike.%${search}%,codigo_inventario.ilike.%${search}%`);
    }
    
    query = query.order('id', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { data: data as Periferico[], error: null };
  } catch (error: any) {
    console.error('Error in getPerifericos:', error);
    return { data: null, error };
  }
}

export async function getPerifericoById(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('perifericos')
      .select('*, marca:marcas(*), modelo:modelos(*), puesto:puestos_trabajo(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    
    return { data: data as Periferico, error: null };
  } catch (error: any) {
    console.error(`Error in getPerifericoById(${id}):`, error);
    return { data: null, error };
  }
}

export async function createPeriferico(data: CreateDTO<Periferico>) {
  try {
    const supabase = getSupabaseClient();
    const { data: createdData, error } = await supabase
      .from('perifericos')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    
    return { data: createdData as Periferico, error: null };
  } catch (error: any) {
    console.error('Error in createPeriferico:', error);
    return { data: null, error };
  }
}

export async function updatePeriferico(id: number, data: UpdateDTO<Periferico>) {
  try {
    const supabase = getSupabaseClient();
    const { data: updatedData, error } = await supabase
      .from('perifericos')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: updatedData as Periferico, error: null };
  } catch (error: any) {
    console.error(`Error in updatePeriferico(${id}):`, error);
    return { data: null, error };
  }
}

export async function asignarPeriferico(id: number, id_puesto: number | null) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('perifericos')
      .update({ id_puesto })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: data as Periferico, error: null };
  } catch (error: any) {
    console.error(`Error in asignarPeriferico(${id}, ${id_puesto}):`, error);
    return { data: null, error };
  }
}
