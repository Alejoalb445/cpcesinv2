import { getSupabaseClient } from '@/lib/supabase/client';
import { Impresora, InsumoImpresora, ConsumoInsumo, CreateDTO, UpdateDTO } from '@/types/database';

// --------------------------------------------------------------------------
// Impresoras
// --------------------------------------------------------------------------

export async function getImpresoras(search?: string, estado?: string) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('impresoras')
      .select('*, marca:marcas(*), modelo:modelos(*), ubicacion:ubicaciones(*), sector:sectores(*)');
    
    if (estado) {
      query = query.eq('estado', estado);
    }
    
    if (search) {
      query = query.or(`serial.ilike.%${search}%,codigo_inventario.ilike.%${search}%,ip.ilike.%${search}%`);
    }
    
    query = query.order('id', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { data: data as Impresora[], error: null };
  } catch (error: any) {
    console.error('Error in getImpresoras:', error);
    return { data: null, error };
  }
}

export async function getImpresoraById(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('impresoras')
      .select('*, marca:marcas(*), modelo:modelos(*), ubicacion:ubicaciones(*), sector:sectores(*), proveedor:proveedores(*), interfaces_red:interfaces_red(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    
    return { data: data as Impresora, error: null };
  } catch (error: any) {
    console.error(`Error in getImpresoraById(${id}):`, error);
    return { data: null, error };
  }
}

export async function createImpresora(data: CreateDTO<Impresora>) {
  try {
    const supabase = getSupabaseClient();
    const { data: createdData, error } = await supabase
      .from('impresoras')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    
    return { data: createdData as Impresora, error: null };
  } catch (error: any) {
    console.error('Error in createImpresora:', error);
    return { data: null, error };
  }
}

export async function updateImpresora(id: number, data: UpdateDTO<Impresora>) {
  try {
    const supabase = getSupabaseClient();
    const { data: updatedData, error } = await supabase
      .from('impresoras')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: updatedData as Impresora, error: null };
  } catch (error: any) {
    console.error(`Error in updateImpresora(${id}):`, error);
    return { data: null, error };
  }
}

// --------------------------------------------------------------------------
// Insumos
// --------------------------------------------------------------------------

export async function getInsumos(search?: string, stockBajo?: boolean) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase.from('insumos_impresora').select('*, marca:marcas(*)');
    
    if (search) {
      query = query.or(`nombre.ilike.%${search}%,codigo_oem.ilike.%${search}%,compatible_con.ilike.%${search}%`);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    let result = data as InsumoImpresora[];
    if (stockBajo) {
      result = result.filter(item => item.stock_actual <= item.stock_minimo);
    }
    
    result.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    return { data: result, error: null };
  } catch (error: any) {
    console.error('Error in getInsumos:', error);
    return { data: null, error };
  }
}

export async function getInsumoById(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('insumos_impresora')
      .select('*, marca:marcas(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    
    return { data: data as InsumoImpresora, error: null };
  } catch (error: any) {
    console.error(`Error in getInsumoById(${id}):`, error);
    return { data: null, error };
  }
}

export async function createInsumo(data: CreateDTO<InsumoImpresora>) {
  try {
    const supabase = getSupabaseClient();
    const { data: createdData, error } = await supabase
      .from('insumos_impresora')
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    
    return { data: createdData as InsumoImpresora, error: null };
  } catch (error: any) {
    console.error('Error in createInsumo:', error);
    return { data: null, error };
  }
}

export async function updateInsumo(id: number, data: UpdateDTO<InsumoImpresora>) {
  try {
    const supabase = getSupabaseClient();
    const { data: updatedData, error } = await supabase
      .from('insumos_impresora')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: updatedData as InsumoImpresora, error: null };
  } catch (error: any) {
    console.error(`Error in updateInsumo(${id}):`, error);
    return { data: null, error };
  }
}

// --------------------------------------------------------------------------
// Consumos / Movimientos de Insumos
// --------------------------------------------------------------------------

export async function getConsumos(id_insumo?: number, id_impresora?: number) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('consumos_insumo')
      .select('*, insumo:insumos_impresora(*), impresora:impresoras(*), sector_destino:sectores(*)');
    
    if (id_insumo !== undefined && id_insumo !== null) {
      query = query.eq('id_insumo', id_insumo);
    }
    
    if (id_impresora !== undefined && id_impresora !== null) {
      query = query.eq('id_impresora', id_impresora);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { data: data as ConsumoInsumo[], error: null };
  } catch (error: any) {
    console.error('Error in getConsumos:', error);
    return { data: null, error };
  }
}

export async function registrarConsumo(data: Omit<ConsumoInsumo, 'id' | 'created_at'>) {
  try {
    const supabase = getSupabaseClient();
    
    // First, fetch the insumo to verify stock or know the current stock
    const { data: insumo, error: fetchError } = await supabase
      .from('insumos_impresora')
      .select('stock_actual')
      .eq('id', data.id_insumo)
      .single();
      
    if (fetchError) throw fetchError;
    if (!insumo) throw new Error('Insumo no encontrado');
    
    // Calculate new stock based on the movement type
    let nuevoStock = insumo.stock_actual;
    if (data.tipo_movimiento === 'Ingreso' || data.tipo_movimiento === 'Devolución') {
      nuevoStock += data.cantidad;
    } else if (data.tipo_movimiento === 'Consumo' || data.tipo_movimiento === 'Ajuste') {
      // For Ajuste we assume quantity is the change, or positive/negative could be handled.
      // But standard is that Consumo and Ajuste subtract from stock. If Ajuste has negative quantity,
      // you subtract. Let's subtract for Consumo and Ajuste (treating quantity as positive subtraction).
      nuevoStock -= data.cantidad;
    }
    
    // 1. Insert consumption log
    const { data: consumoInsertado, error: insertError } = await supabase
      .from('consumos_insumo')
      .insert(data)
      .select()
      .single();
      
    if (insertError) throw insertError;
    
    // 2. Update insumos_impresora stock
    const { error: updateError } = await supabase
      .from('insumos_impresora')
      .update({ stock_actual: nuevoStock })
      .eq('id', data.id_insumo);
      
    if (updateError) throw updateError;
    
    return { data: consumoInsertado as ConsumoInsumo, error: null };
  } catch (error: any) {
    console.error('Error in registrarConsumo:', error);
    return { data: null, error };
  }
}
