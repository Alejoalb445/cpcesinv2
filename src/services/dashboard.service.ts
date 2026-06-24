import { getSupabaseClient } from '@/lib/supabase/client';
import { InsumoImpresora, TareaSoporte } from '@/types/database';

export async function getDashboardStats() {
  try {
    const supabase = getSupabaseClient();
    
    // Using Promise.all and head:true for quick parallel count operations
    const [
      compCount,
      perCount,
      movCount,
      infCount,
      impCount,
      activeTasksCount,
      pcsInStock,
      pcsInRepair,
      insumosData
    ] = await Promise.all([
      supabase.from('computadoras').select('*', { count: 'exact', head: true }).neq('estado', 'Dado de baja'),
      supabase.from('perifericos').select('*', { count: 'exact', head: true }).neq('estado', 'Dado de baja'),
      supabase.from('dispositivos_moviles').select('*', { count: 'exact', head: true }).neq('estado', 'Dado de baja'),
      supabase.from('dispositivos_infraestructura').select('*', { count: 'exact', head: true }).neq('estado', 'Dado de baja'),
      supabase.from('impresoras').select('*', { count: 'exact', head: true }).neq('estado', 'Dado de baja'),
      supabase.from('tareas_soporte').select('*', { count: 'exact', head: true }).in('estado', ['Abierta', 'En progreso', 'En espera']),
      supabase.from('computadoras').select('*', { count: 'exact', head: true }).eq('estado', 'En stock'),
      supabase.from('computadoras').select('*', { count: 'exact', head: true }).eq('estado', 'En reparación'),
      supabase.from('insumos_impresora').select('stock_actual, stock_minimo')
    ]);

    // Handle potential errors from counts
    if (compCount.error) throw compCount.error;
    if (perCount.error) throw perCount.error;
    if (movCount.error) throw movCount.error;
    if (infCount.error) throw infCount.error;
    if (impCount.error) throw impCount.error;
    if (activeTasksCount.error) throw activeTasksCount.error;
    if (pcsInStock.error) throw pcsInStock.error;
    if (pcsInRepair.error) throw pcsInRepair.error;
    if (insumosData.error) throw insumosData.error;

    const lowStockCount = (insumosData.data || []).filter(
      (item: any) => item.stock_actual <= item.stock_minimo
    ).length;

    const totalAssets =
      (compCount.count || 0) +
      (perCount.count || 0) +
      (movCount.count || 0) +
      (infCount.count || 0) +
      (impCount.count || 0);

    return {
      data: {
        activosTotales: totalAssets,
        computadoras: compCount.count || 0,
        perifericos: perCount.count || 0,
        moviles: movCount.count || 0,
        infraestructura: infCount.count || 0,
        impresoras: impCount.count || 0,
        insumosBajoStock: lowStockCount,
        tareasSoporteActivas: activeTasksCount.count || 0,
        pcsEnStock: pcsInStock.count || 0,
        pcsEnReparacion: pcsInRepair.count || 0
      },
      error: null
    };
  } catch (error: any) {
    console.error('Error in getDashboardStats:', error);
    return { data: null, error };
  }
}

export async function getAlertasStockBajo() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('insumos_impresora')
      .select('*, marca:marcas(*)');
      
    if (error) throw error;
    
    const lowStock = (data || []).filter((item: any) => item.stock_actual <= item.stock_minimo);
    return { data: lowStock as InsumoImpresora[], error: null };
  } catch (error: any) {
    console.error('Error in getAlertasStockBajo:', error);
    return { data: null, error };
  }
}

export async function getTareasRecientes(limit = 5) {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('tareas_soporte')
      .select(`
        *,
        solicitante:usuarios!id_solicitante(*),
        tecnico:usuarios!id_tecnico(*),
        puesto:puestos_trabajo(*)
      `)
      .in('estado', ['Abierta', 'En progreso', 'En espera'])
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (error) throw error;
    
    return { data: data as TareaSoporte[], error: null };
  } catch (error: any) {
    console.error('Error in getTareasRecientes:', error);
    return { data: null, error };
  }
}
