import { getSupabaseClient } from '@/lib/supabase/client';
import { ComponentePc, CreateDTO, UpdateDTO } from '@/types/database';

export async function getComponentes(search?: string, tipo?: string, en_stock?: boolean) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('componentes_pc')
      .select('*, marca:marcas(*), modelo:modelos(*), computadora:computadoras(*)');
    
    if (tipo) {
      query = query.eq('tipo', tipo);
    }
    
    if (en_stock !== undefined) {
      query = query.eq('en_stock', en_stock);
    }
    
    if (search) {
      query = query.or(`serial.ilike.%${search}%,detalle.ilike.%${search}%,capacidad.ilike.%${search}%`);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { data: data as ComponentePc[], error: null };
  } catch (error: any) {
    console.error('Error in getComponentes:', error);
    return { data: null, error };
  }
}

export async function getComponentesByComputadora(id_computadora: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('componentes_pc')
      .select('*, marca:marcas(*), modelo:modelos(*)')
      .eq('id_computadora', id_computadora)
      .order('tipo', { ascending: true });
    if (error) throw error;
    
    return { data: data as ComponentePc[], error: null };
  } catch (error: any) {
    console.error(`Error in getComponentesByComputadora(${id_computadora}):`, error);
    return { data: null, error };
  }
}

export async function getComponenteById(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('componentes_pc')
      .select('*, marca:marcas(*), modelo:modelos(*), computadora:computadoras(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    
    return { data: data as ComponentePc, error: null };
  } catch (error: any) {
    console.error(`Error in getComponenteById(${id}):`, error);
    return { data: null, error };
  }
}

export async function createComponente(data: CreateDTO<ComponentePc>) {
  try {
    const supabase = getSupabaseClient();
    const { data: createdData, error } = await supabase
      .from('componentes_pc')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    
    return { data: createdData as ComponentePc, error: null };
  } catch (error: any) {
    console.error('Error in createComponente:', error);
    return { data: null, error };
  }
}

export async function updateComponente(id: number, data: UpdateDTO<ComponentePc>) {
  try {
    const supabase = getSupabaseClient();
    const { data: updatedData, error } = await supabase
      .from('componentes_pc')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: updatedData as ComponentePc, error: null };
  } catch (error: any) {
    console.error(`Error in updateComponente(${id}):`, error);
    return { data: null, error };
  }
}

export async function instalarComponente(id_componente: number, id_computadora: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('componentes_pc')
      .update({ id_computadora, en_stock: false })
      .eq('id', id_componente)
      .select()
      .single();
    if (error) throw error;
    
    return { data: data as ComponentePc, error: null };
  } catch (error: any) {
    console.error(`Error in instalarComponente(${id_componente}, ${id_computadora}):`, error);
    return { data: null, error };
  }
}

export async function retirarComponente(id_componente: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('componentes_pc')
      .update({ id_computadora: null, en_stock: true })
      .eq('id', id_componente)
      .select()
      .single();
    if (error) throw error;
    
    return { data: data as ComponentePc, error: null };
  } catch (error: any) {
    console.error(`Error in retirarComponente(${id_componente}):`, error);
    return { data: null, error };
  }
}
