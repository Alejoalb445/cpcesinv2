import { getSupabaseClient } from '@/lib/supabase/client';
import type {
  ItemStock,
  CategoriaStock,
  MovimientoStock,
  ImpresoraSuministroCompatible,
  TipoMovimientoStock,
} from '@/types/database';

// ============================================================================
// STOCK SERVICE
// ============================================================================

type ItemStockInsert = Omit<ItemStock, 'id' | 'created_at' | 'updated_at' | 'categoria' | 'marca' | 'modelo'>;
type ItemStockUpdate = Partial<ItemStockInsert>;

const ITEM_SELECT = `
  *,
  categoria:categorias_stock(*),
  marca:marcas(*),
  modelo:modelos(*)
`;

export async function getItemsStock(
  search?: string,
  id_categoria?: number,
  stockBajo?: boolean
) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('items_stock')
    .select(ITEM_SELECT)
    .eq('activo', true)
    .order('descripcion');

  if (search) {
    query = query.or(`descripcion.ilike.%${search}%,codigo.ilike.%${search}%,color.ilike.%${search}%`);
  }
  if (id_categoria) query = query.eq('id_categoria', id_categoria);
  if (stockBajo) {
    // Filter where stock_actual <= stock_minimo using raw filter
    query = query.filter('stock_actual', 'lte', 'stock_minimo');
  }

  const { data, error } = await query;
  return { data: data as ItemStock[] | null, error };
}

export async function getItemStockById(id: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('items_stock')
    .select(ITEM_SELECT)
    .eq('id', id)
    .single();

  return { data: data as ItemStock | null, error };
}

export async function createItemStock(data: ItemStockInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('items_stock')
    .insert(data)
    .select(ITEM_SELECT)
    .single();

  return { data: result as ItemStock | null, error };
}

export async function updateItemStock(id: number, data: ItemStockUpdate) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('items_stock')
    .update(data)
    .eq('id', id)
    .select(ITEM_SELECT)
    .single();

  return { data: result as ItemStock | null, error };
}

// ============================================================================
// CATEGORÍAS STOCK
// ============================================================================

export async function getCategoriasStock() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('categorias_stock')
    .select('*')
    .eq('activo', true)
    .order('nombre');

  return { data: data as CategoriaStock[] | null, error };
}

// ============================================================================
// MOVIMIENTOS STOCK
// ============================================================================

export async function getMovimientosStock(id_item?: number) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('movimientos_stock')
    .select(`
      *,
      item_stock:items_stock(id, descripcion, codigo)
    `)
    .order('fecha', { ascending: false })
    .limit(100);

  if (id_item) query = query.eq('id_item_stock', id_item);

  const { data, error } = await query;
  return { data: data as MovimientoStock[] | null, error };
}

export async function ajusteStock(
  id_item: number,
  tipo: 'Ajuste positivo' | 'Ajuste negativo',
  cantidad: number,
  observaciones?: string
) {
  const supabase = getSupabaseClient();

  // Get current stock
  const { data: item, error: itemError } = await supabase
    .from('items_stock')
    .select('stock_actual')
    .eq('id', id_item)
    .single();

  if (itemError || !item) return { error: itemError || new Error('Item no encontrado') };

  const stockAntes = item.stock_actual;
  const stockDespues = tipo === 'Ajuste positivo'
    ? stockAntes + cantidad
    : stockAntes - cantidad;

  // Update stock
  const { error: updateError } = await supabase
    .from('items_stock')
    .update({ stock_actual: stockDespues })
    .eq('id', id_item);

  if (updateError) return { error: updateError };

  // Record movement
  const { data: movimiento, error: movError } = await supabase
    .from('movimientos_stock')
    .insert({
      id_item_stock: id_item,
      tipo_movimiento: tipo as TipoMovimientoStock,
      cantidad,
      stock_antes: stockAntes,
      stock_despues: stockDespues,
      observaciones,
      fecha: new Date().toISOString(),
    })
    .select()
    .single();

  return { data: movimiento as MovimientoStock | null, error: movError };
}

// ============================================================================
// SUMINISTROS COMPATIBLES
// ============================================================================

export async function getSuministrosCompatibles(id_modelo_impresora: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('impresora_suministro_compatible')
    .select(`
      *,
      item_stock:items_stock(
        *,
        categoria:categorias_stock(*),
        marca:marcas(*)
      )
    `)
    .eq('id_modelo_impresora', id_modelo_impresora);

  return { data: data as ImpresoraSuministroCompatible[] | null, error };
}
