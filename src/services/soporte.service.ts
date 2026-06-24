import { getSupabaseClient } from '@/lib/supabase/client';
import { TareaSoporte, CreateDTO, UpdateDTO } from '@/types/database';

export async function getTareasSoporte(
  search?: string,
  estado?: string,
  prioridad?: string,
  id_tecnico?: string
) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('tareas_soporte')
      .select(`
        *,
        solicitante:usuarios!id_solicitante(*, sector:sectores(*)),
        tecnico:usuarios!id_tecnico(*),
        puesto:puestos_trabajo(*, sector:sectores(*))
      `);
    
    if (estado) {
      query = query.eq('estado', estado);
    }
    
    if (prioridad) {
      query = query.eq('prioridad', prioridad);
    }
    
    if (id_tecnico) {
      query = query.eq('id_tecnico', id_tecnico);
    }
    
    if (search) {
      query = query.or(`titulo.ilike.%${search}%,descripcion.ilike.%${search}%`);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { data: data as TareaSoporte[], error: null };
  } catch (error: any) {
    console.error('Error in getTareasSoporte:', error);
    return { data: null, error };
  }
}

export async function getTareaById(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('tareas_soporte')
      .select(`
        *,
        solicitante:usuarios!id_solicitante(*, sector:sectores(*)),
        tecnico:usuarios!id_tecnico(*),
        puesto:puestos_trabajo(*, sector:sectores(*))
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    
    return { data: data as TareaSoporte, error: null };
  } catch (error: any) {
    console.error(`Error in getTareaById(${id}):`, error);
    return { data: null, error };
  }
}

export async function createTarea(data: CreateDTO<TareaSoporte>) {
  try {
    const supabase = getSupabaseClient();
    const { data: createdData, error } = await supabase
      .from('tareas_soporte')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    
    return { data: createdData as TareaSoporte, error: null };
  } catch (error: any) {
    console.error('Error in createTarea:', error);
    return { data: null, error };
  }
}

export async function updateTarea(id: number, data: UpdateDTO<TareaSoporte>) {
  try {
    const supabase = getSupabaseClient();
    const { data: updatedData, error } = await supabase
      .from('tareas_soporte')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: updatedData as TareaSoporte, error: null };
  } catch (error: any) {
    console.error(`Error in updateTarea(${id}):`, error);
    return { data: null, error };
  }
}
