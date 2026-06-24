import { getSupabaseClient } from '@/lib/supabase/client';
import { Licencia, LicenciaUsuario, CreateDTO, UpdateDTO } from '@/types/database';

export async function getLicencias(search?: string, estado?: string) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase.from('licencias').select('*, proveedor:proveedores(*)');
    
    if (estado) {
      query = query.eq('estado', estado);
    }
    
    if (search) {
      query = query.or(`nombre_software.ilike.%${search}%,version.ilike.%${search}%,clave_licencia.ilike.%${search}%`);
    }
    
    query = query.order('nombre_software', { ascending: true });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { data: data as Licencia[], error: null };
  } catch (error: any) {
    console.error('Error in getLicencias:', error);
    return { data: null, error };
  }
}

export async function getLicenciaById(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('licencias')
      .select(`
        *,
        proveedor:proveedores(*),
        asignaciones:licencias_usuarios(
          *,
          usuario:usuarios(*)
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    
    return { data: data as Licencia, error: null };
  } catch (error: any) {
    console.error(`Error in getLicenciaById(${id}):`, error);
    return { data: null, error };
  }
}

export async function createLicencia(data: CreateDTO<Licencia>) {
  try {
    const supabase = getSupabaseClient();
    const { data: createdData, error } = await supabase
      .from('licencias')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    
    return { data: createdData as Licencia, error: null };
  } catch (error: any) {
    console.error('Error in createLicencia:', error);
    return { data: null, error };
  }
}

export async function updateLicencia(id: number, data: UpdateDTO<Licencia>) {
  try {
    const supabase = getSupabaseClient();
    const { data: updatedData, error } = await supabase
      .from('licencias')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: updatedData as Licencia, error: null };
  } catch (error: any) {
    console.error(`Error in updateLicencia(${id}):`, error);
    return { data: null, error };
  }
}

export async function asignarLicencia(id_licencia: number, id_usuario: string, notas?: string) {
  try {
    const supabase = getSupabaseClient();
    
    // 1. Check if already assigned
    const { data: existing } = await supabase
      .from('licencias_usuarios')
      .select('id')
      .eq('id_licencia', id_licencia)
      .eq('id_usuario', id_usuario)
      .maybeSingle();
      
    if (existing) {
      throw new Error('La licencia ya está asignada a este usuario');
    }
    
    // 2. Fetch license to check seats
    const { data: licencia, error: licError } = await supabase
      .from('licencias')
      .select('puestos_usados, cantidad_puestos')
      .eq('id', id_licencia)
      .single();
      
    if (licError) throw licError;
    if (!licencia) throw new Error('Licencia no encontrada');
    
    if (licencia.cantidad_puestos !== null && licencia.puestos_usados >= licencia.cantidad_puestos) {
      throw new Error('No hay puestos disponibles para esta licencia');
    }
    
    // 3. Insert assignment
    const { data: asignacion, error: insertError } = await supabase
      .from('licencias_usuarios')
      .insert({
        id_licencia,
        id_usuario,
        notas: notas || null,
        fecha_asignacion: new Date().toISOString()
      })
      .select()
      .single();
      
    if (insertError) throw insertError;
    
    // 4. Increment seats used
    const { error: updateError } = await supabase
      .from('licencias')
      .update({ puestos_usados: licencia.puestos_usados + 1 })
      .eq('id', id_licencia);
      
    if (updateError) throw updateError;
    
    return { data: asignacion as LicenciaUsuario, error: null };
  } catch (error: any) {
    console.error('Error in asignarLicencia:', error);
    return { data: null, error };
  }
}

export async function liberarLicencia(id_licencia: number, id_usuario: string) {
  try {
    const supabase = getSupabaseClient();
    
    // 1. Check if assignment exists
    const { data: existing } = await supabase
      .from('licencias_usuarios')
      .select('id')
      .eq('id_licencia', id_licencia)
      .eq('id_usuario', id_usuario)
      .maybeSingle();
      
    if (!existing) {
      throw new Error('No existe la asignación de la licencia para este usuario');
    }
    
    // 2. Fetch license
    const { data: licencia, error: licError } = await supabase
      .from('licencias')
      .select('puestos_usados')
      .eq('id', id_licencia)
      .single();
      
    if (licError) throw licError;
    if (!licencia) throw new Error('Licencia no encontrada');
    
    // 3. Delete assignment
    const { error: deleteError } = await supabase
      .from('licencias_usuarios')
      .delete()
      .eq('id_licencia', id_licencia)
      .eq('id_usuario', id_usuario);
      
    if (deleteError) throw deleteError;
    
    // 4. Decrement seats used
    const nuevoPuestosUsados = Math.max(0, licencia.puestos_usados - 1);
    const { error: updateError } = await supabase
      .from('licencias')
      .update({ puestos_usados: nuevoPuestosUsados })
      .eq('id', id_licencia);
      
    if (updateError) throw updateError;
    
    return { data: true, error: null };
  } catch (error: any) {
    console.error('Error in liberarLicencia:', error);
    return { data: null, error };
  }
}
