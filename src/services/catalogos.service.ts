import { getSupabaseClient } from '@/lib/supabase/client';
import { Marca, Modelo, Proveedor, CreateDTO, UpdateDTO } from '@/types/database';

// --------------------------------------------------------------------------
// Marcas
// --------------------------------------------------------------------------

export async function getMarcas(search?: string) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase.from('marcas').select('*');
    
    if (search) {
      query = query.ilike('nombre', `%${search}%`);
    }
    
    query = query.order('nombre', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { data: data as Marca[], error: null };
  } catch (error: any) {
    console.error('Error in getMarcas:', error);
    return { data: null, error };
  }
}

export async function createMarca(data: { nombre: string }) {
  try {
    const supabase = getSupabaseClient();
    const { data: createdData, error } = await supabase
      .from('marcas')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    
    return { data: createdData as Marca, error: null };
  } catch (error: any) {
    console.error('Error in createMarca:', error);
    return { data: null, error };
  }
}

export async function updateMarca(id: number, data: { nombre: string }) {
  try {
    const supabase = getSupabaseClient();
    const { data: updatedData, error } = await supabase
      .from('marcas')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: updatedData as Marca, error: null };
  } catch (error: any) {
    console.error(`Error in updateMarca(${id}):`, error);
    return { data: null, error };
  }
}

export async function deleteMarca(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('marcas')
      .delete()
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: data as Marca, error: null };
  } catch (error: any) {
    console.error(`Error in deleteMarca(${id}):`, error);
    return { data: null, error };
  }
}

// --------------------------------------------------------------------------
// Modelos
// --------------------------------------------------------------------------

export async function getModelos(search?: string, id_marca?: number) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase.from('modelos').select('*, marca:marcas(*)');
    
    if (id_marca !== undefined) {
      query = query.eq('id_marca', id_marca);
    }
    
    if (search) {
      query = query.ilike('nombre', `%${search}%`);
    }
    
    query = query.order('nombre', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { data: data as Modelo[], error: null };
  } catch (error: any) {
    console.error('Error in getModelos:', error);
    return { data: null, error };
  }
}

export async function createModelo(data: { id_marca: number; nombre: string; categoria?: string }) {
  try {
    const supabase = getSupabaseClient();
    const { data: createdData, error } = await supabase
      .from('modelos')
      .insert(data)
      .select('*, marca:marcas(*)')
      .single();
    if (error) throw error;
    
    return { data: createdData as Modelo, error: null };
  } catch (error: any) {
    console.error('Error in createModelo:', error);
    return { data: null, error };
  }
}

export async function updateModelo(id: number, data: { id_marca?: number; nombre?: string; categoria?: string }) {
  try {
    const supabase = getSupabaseClient();
    const { data: updatedData, error } = await supabase
      .from('modelos')
      .update(data)
      .eq('id', id)
      .select('*, marca:marcas(*)')
      .single();
    if (error) throw error;
    
    return { data: updatedData as Modelo, error: null };
  } catch (error: any) {
    console.error(`Error in updateModelo(${id}):`, error);
    return { data: null, error };
  }
}

export async function deleteModelo(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('modelos')
      .delete()
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: data as Modelo, error: null };
  } catch (error: any) {
    console.error(`Error in deleteModelo(${id}):`, error);
    return { data: null, error };
  }
}

// --------------------------------------------------------------------------
// Proveedores
// --------------------------------------------------------------------------

export async function getProveedores(search?: string, activo?: boolean) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase.from('proveedores').select('*');
    
    if (activo !== undefined) {
      query = query.eq('activo', activo);
    }
    
    if (search) {
      query = query.or(`razon_social.ilike.%${search}%,cuit.ilike.%${search}%,contacto_nombre.ilike.%${search}%`);
    }
    
    query = query.order('razon_social', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { data: data as Proveedor[], error: null };
  } catch (error: any) {
    console.error('Error in getProveedores:', error);
    return { data: null, error };
  }
}

export async function createProveedor(data: CreateDTO<Proveedor>) {
  try {
    const supabase = getSupabaseClient();
    const { data: createdData, error } = await supabase
      .from('proveedores')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    
    return { data: createdData as Proveedor, error: null };
  } catch (error: any) {
    console.error('Error in createProveedor:', error);
    return { data: null, error };
  }
}

export async function updateProveedor(id: number, data: UpdateDTO<Proveedor>) {
  try {
    const supabase = getSupabaseClient();
    const { data: updatedData, error } = await supabase
      .from('proveedores')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: updatedData as Proveedor, error: null };
  } catch (error: any) {
    console.error(`Error in updateProveedor(${id}):`, error);
    return { data: null, error };
  }
}

export async function deleteProveedor(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data: deletedData, error } = await supabase
      .from('proveedores')
      .update({ activo: false })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: deletedData as Proveedor, error: null };
  } catch (error: any) {
    console.error(`Error in deleteProveedor(${id}):`, error);
    return { data: null, error };
  }
}
