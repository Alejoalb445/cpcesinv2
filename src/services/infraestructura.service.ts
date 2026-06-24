import { getSupabaseClient } from '@/lib/supabase/client';
import { DispositivoInfraestructura, CreateDTO, UpdateDTO, CategoriaInfra } from '@/types/database';

// Helper to determine the detail table based on category
export function getDetailTableName(categoria: CategoriaInfra): 'detalle_red' | 'detalle_energia' | 'detalle_cctv' | null {
  switch (categoria) {
    case 'Switch':
    case 'Router':
    case 'Access Point':
    case 'Firewall':
    case 'Servidor':
    case 'NAS':
      return 'detalle_red';
    case 'UPS':
    case 'Estabilizador':
      return 'detalle_energia';
    case 'DVR':
    case 'NVR':
    case 'Cámara IP':
      return 'detalle_cctv';
    default:
      return null;
  }
}

export async function getDispositivosInfra(search?: string, categoria?: string, estado?: string) {
  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('dispositivos_infraestructura')
      .select('*, marca:marcas(*), modelo:modelos(*), ubicacion:ubicaciones(*)');
    
    if (categoria) {
      query = query.eq('categoria', categoria);
    }
    
    if (estado) {
      query = query.eq('estado', estado);
    }
    
    if (search) {
      query = query.or(`serial.ilike.%${search}%,codigo_inventario.ilike.%${search}%,ip.ilike.%${search}%`);
    }
    
    query = query.order('id', { ascending: false });
    
    const { data, error } = await query;
    if (error) throw error;
    
    return { data: data as DispositivoInfraestructura[], error: null };
  } catch (error: any) {
    console.error('Error in getDispositivosInfra:', error);
    return { data: null, error };
  }
}

export async function getDispositivoById(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('dispositivos_infraestructura')
      .select(`
        *,
        marca:marcas(*),
        modelo:modelos(*),
        ubicacion:ubicaciones(*),
        proveedor:proveedores(*),
        detalle_red(*),
        detalle_energia(*),
        detalle_cctv(*),
        interfaces_red:interfaces_red(*)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    
    // Normalize detail fields to be objects (PostgREST returns relations as objects if 1-1, or arrays if 1-M)
    const normalizedData = { ...data };
    if (Array.isArray(normalizedData.detalle_red)) normalizedData.detalle_red = normalizedData.detalle_red[0] || null;
    if (Array.isArray(normalizedData.detalle_energia)) normalizedData.detalle_energia = normalizedData.detalle_energia[0] || null;
    if (Array.isArray(normalizedData.detalle_cctv)) normalizedData.detalle_cctv = normalizedData.detalle_cctv[0] || null;
    
    return { data: normalizedData as DispositivoInfraestructura, error: null };
  } catch (error: any) {
    console.error(`Error in getDispositivoById(${id}):`, error);
    return { data: null, error };
  }
}

export async function createDispositivo(data: CreateDTO<DispositivoInfraestructura>, detail: any) {
  try {
    const supabase = getSupabaseClient();
    
    // 1. Insert device into base table
    const { data: createdDevice, error: devError } = await supabase
      .from('dispositivos_infraestructura')
      .insert(data)
      .select()
      .single();
      
    if (devError) throw devError;
    
    // 2. Insert detail based on category if detail data is provided
    const detailTable = getDetailTableName(createdDevice.categoria);
    let createdDetail = null;
    
    if (detailTable && detail) {
      const detailToInsert = {
        ...detail,
        id_dispositivo: createdDevice.id
      };
      
      const { data: detailData, error: detailError } = await supabase
        .from(detailTable)
        .insert(detailToInsert)
        .select()
        .single();
        
      if (detailError) throw detailError;
      createdDetail = detailData;
    }
    
    return {
      data: {
        ...createdDevice,
        [detailTable || 'detalle']: createdDetail
      },
      error: null
    };
  } catch (error: any) {
    console.error('Error in createDispositivo:', error);
    return { data: null, error };
  }
}

export async function updateDispositivo(id: number, data: UpdateDTO<DispositivoInfraestructura>, detail?: any) {
  try {
    const supabase = getSupabaseClient();
    
    // 1. Update device
    const { data: updatedDevice, error: devError } = await supabase
      .from('dispositivos_infraestructura')
      .update(data)
      .eq('id', id)
      .select()
      .single();
      
    if (devError) throw devError;
    
    // 2. Update or insert detail row if detail is provided
    const detailTable = getDetailTableName(updatedDevice.categoria);
    let updatedDetail = null;
    
    if (detailTable && detail) {
      const { data: existingDetail } = await supabase
        .from(detailTable)
        .select('id')
        .eq('id_dispositivo', id)
        .maybeSingle();
        
      if (existingDetail) {
        const { data: detailData, error: detailError } = await supabase
          .from(detailTable)
          .update(detail)
          .eq('id_dispositivo', id)
          .select()
          .single();
          
        if (detailError) throw detailError;
        updatedDetail = detailData;
      } else {
        const detailToInsert = {
          ...detail,
          id_dispositivo: id
        };
        
        const { data: detailData, error: detailError } = await supabase
          .from(detailTable)
          .insert(detailToInsert)
          .select()
          .single();
          
        if (detailError) throw detailError;
        updatedDetail = detailData;
      }
    }
    
    return {
      data: {
        ...updatedDevice,
        [detailTable || 'detalle']: updatedDetail
      },
      error: null
    };
  } catch (error: any) {
    console.error(`Error in updateDispositivo(${id}):`, error);
    return { data: null, error };
  }
}

export async function deleteDispositivo(id: number) {
  try {
    const supabase = getSupabaseClient();
    const { data: deletedData, error } = await supabase
      .from('dispositivos_infraestructura')
      .update({ estado: 'Dado de baja' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    
    return { data: deletedData as DispositivoInfraestructura, error: null };
  } catch (error: any) {
    console.error(`Error in deleteDispositivo(${id}):`, error);
    return { data: null, error };
  }
}
