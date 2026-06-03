import { getSupabaseClient } from '@/lib/supabase/client';
import type {
  UsuarioSistema,
  RolSistema,
  Marca,
  Modelo,
  TipoActivo,
  CategoriaStock,
  CategoriaComponente,
  ServicioInterno,
  Proveedor,
  LogAuditoria,
  PaginatedResponse,
} from '@/types/database';

// ============================================================================
// USUARIOS SISTEMA
// ============================================================================

const USUARIO_SELECT = `
  *,
  persona:personas(id, nombre, apellido, email)
`;

export async function getUsuariosSistema(search?: string, rol?: RolSistema) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('usuarios_sistema')
    .select(USUARIO_SELECT)
    .order('created_at', { ascending: false });

  if (rol) query = query.eq('rol', rol);
  // Search on joined persona fields via the or filter on the main table isn't straightforward;
  // we filter client-side or use a view. For now, fetch all and filter if search is provided.

  const { data, error } = await query;

  if (search && data) {
    const searchLower = search.toLowerCase();
    const filtered = data.filter((u: UsuarioSistema) => {
      const persona = u.persona;
      if (!persona) return false;
      return (
        persona.nombre?.toLowerCase().includes(searchLower) ||
        persona.apellido?.toLowerCase().includes(searchLower) ||
        persona.email?.toLowerCase().includes(searchLower)
      );
    });
    return { data: filtered as UsuarioSistema[], error: null };
  }

  return { data: data as UsuarioSistema[] | null, error };
}

export async function updateUsuarioRol(id: string, rol: RolSistema) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('usuarios_sistema')
    .update({ rol })
    .eq('id', id)
    .select(USUARIO_SELECT)
    .single();

  return { data: data as UsuarioSistema | null, error };
}

export async function toggleUsuarioActivo(id: string, activo: boolean) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('usuarios_sistema')
    .update({ activo })
    .eq('id', id)
    .select(USUARIO_SELECT)
    .single();

  return { data: data as UsuarioSistema | null, error };
}

// ============================================================================
// CATÁLOGOS - RESUMEN DE CONTEOS
// ============================================================================

export async function getCatalogos() {
  const supabase = getSupabaseClient();

  const [marcas, modelos, tipos, catStock, catComp, servicios, proveedores] = await Promise.all([
    supabase.from('marcas').select('*', { count: 'exact', head: true }),
    supabase.from('modelos').select('*', { count: 'exact', head: true }),
    supabase.from('tipos_activo').select('*', { count: 'exact', head: true }),
    supabase.from('categorias_stock').select('*', { count: 'exact', head: true }),
    supabase.from('categorias_componentes').select('*', { count: 'exact', head: true }),
    supabase.from('servicios_internos').select('*', { count: 'exact', head: true }),
    supabase.from('proveedores').select('*', { count: 'exact', head: true }),
  ]);

  return {
    data: {
      marcas: marcas.count || 0,
      modelos: modelos.count || 0,
      tipos_activo: tipos.count || 0,
      categorias_stock: catStock.count || 0,
      categorias_componentes: catComp.count || 0,
      servicios_internos: servicios.count || 0,
      proveedores: proveedores.count || 0,
    },
    error: null,
  };
}

// ============================================================================
// MARCAS
// ============================================================================

export async function getMarcas() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('marcas')
    .select('*')
    .order('nombre');

  return { data: data as Marca[] | null, error };
}

export async function createMarca(data: Omit<Marca, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('marcas')
    .insert(data)
    .select()
    .single();

  return { data: result as Marca | null, error };
}

export async function updateMarca(id: number, data: Partial<Omit<Marca, 'id' | 'created_at' | 'updated_at'>>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('marcas')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  return { data: result as Marca | null, error };
}

// ============================================================================
// MODELOS
// ============================================================================

export async function getModelos() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('modelos')
    .select(`
      *,
      marca:marcas(*)
    `)
    .order('nombre');

  return { data: data as Modelo[] | null, error };
}

export async function createModelo(data: Omit<Modelo, 'id' | 'created_at' | 'updated_at' | 'marca'>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('modelos')
    .insert(data)
    .select(`*, marca:marcas(*)`)
    .single();

  return { data: result as Modelo | null, error };
}

export async function updateModelo(id: number, data: Partial<Omit<Modelo, 'id' | 'created_at' | 'updated_at' | 'marca'>>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('modelos')
    .update(data)
    .eq('id', id)
    .select(`*, marca:marcas(*)`)
    .single();

  return { data: result as Modelo | null, error };
}

// ============================================================================
// TIPOS DE ACTIVO
// ============================================================================

export async function getTiposActivo() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tipos_activo')
    .select('*')
    .order('nombre');

  return { data: data as TipoActivo[] | null, error };
}

export async function createTipoActivo(data: Omit<TipoActivo, 'id' | 'created_at'>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('tipos_activo')
    .insert(data)
    .select()
    .single();

  return { data: result as TipoActivo | null, error };
}

export async function updateTipoActivo(id: number, data: Partial<Omit<TipoActivo, 'id' | 'created_at'>>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('tipos_activo')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  return { data: result as TipoActivo | null, error };
}

// ============================================================================
// CATEGORÍAS STOCK
// ============================================================================

export async function getCategoriasStock() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('categorias_stock')
    .select('*')
    .order('nombre');

  return { data: data as CategoriaStock[] | null, error };
}

export async function createCategoriaStock(data: Omit<CategoriaStock, 'id' | 'created_at'>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('categorias_stock')
    .insert(data)
    .select()
    .single();

  return { data: result as CategoriaStock | null, error };
}

export async function updateCategoriaStock(id: number, data: Partial<Omit<CategoriaStock, 'id' | 'created_at'>>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('categorias_stock')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  return { data: result as CategoriaStock | null, error };
}

// ============================================================================
// CATEGORÍAS COMPONENTES
// ============================================================================

export async function getCategoriasComponentes() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('categorias_componentes')
    .select('*')
    .order('nombre');

  return { data: data as CategoriaComponente[] | null, error };
}

export async function createCategoriaComponente(data: Omit<CategoriaComponente, 'id' | 'created_at'>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('categorias_componentes')
    .insert(data)
    .select()
    .single();

  return { data: result as CategoriaComponente | null, error };
}

export async function updateCategoriaComponente(id: number, data: Partial<Omit<CategoriaComponente, 'id' | 'created_at'>>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('categorias_componentes')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  return { data: result as CategoriaComponente | null, error };
}

// ============================================================================
// SERVICIOS INTERNOS
// ============================================================================

export async function getServiciosInternos() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('servicios_internos')
    .select('*')
    .order('nombre');

  return { data: data as ServicioInterno[] | null, error };
}

export async function createServicioInterno(data: Omit<ServicioInterno, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('servicios_internos')
    .insert(data)
    .select()
    .single();

  return { data: result as ServicioInterno | null, error };
}

export async function updateServicioInterno(id: number, data: Partial<Omit<ServicioInterno, 'id' | 'created_at' | 'updated_at'>>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('servicios_internos')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  return { data: result as ServicioInterno | null, error };
}

// ============================================================================
// PROVEEDORES
// ============================================================================

export async function getProveedores() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .order('nombre');

  return { data: data as Proveedor[] | null, error };
}

export async function createProveedor(data: Omit<Proveedor, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('proveedores')
    .insert(data)
    .select()
    .single();

  return { data: result as Proveedor | null, error };
}

export async function updateProveedor(id: number, data: Partial<Omit<Proveedor, 'id' | 'created_at' | 'updated_at'>>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('proveedores')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  return { data: result as Proveedor | null, error };
}

// ============================================================================
// LOGS DE AUDITORÍA
// ============================================================================

export async function getLogsAuditoria(
  tabla?: string,
  fecha_desde?: string,
  fecha_hasta?: string,
  page: number = 1,
  pageSize: number = 50
) {
  const supabase = getSupabaseClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('logs_auditoria')
    .select('*', { count: 'exact' })
    .order('fecha', { ascending: false })
    .range(from, to);

  if (tabla) query = query.eq('tabla', tabla);
  if (fecha_desde) query = query.gte('fecha', fecha_desde);
  if (fecha_hasta) query = query.lte('fecha', fecha_hasta);

  const { data, error, count } = await query;

  if (error) return { data: null, error };

  const result: PaginatedResponse<LogAuditoria> = {
    data: (data as LogAuditoria[]) || [],
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };

  return { data: result, error: null };
}
