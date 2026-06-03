import { getSupabaseClient } from '@/lib/supabase/client';
import type { ComponentePc, ComponentePcInstalado, CategoriaComponente } from '@/types/database';

// ============================================================================
// COMPONENTES PC SERVICE
// ============================================================================

type ComponenteInsert = Omit<ComponentePc, 'id' | 'created_at' | 'updated_at' | 'categoria' | 'marca' | 'modelo'>;
type ComponenteUpdate = Partial<ComponenteInsert>;

const COMPONENTE_SELECT = `
  *,
  categoria:categorias_componentes(*),
  marca:marcas(*),
  modelo:modelos(*)
`;

export async function getComponentes(search?: string, id_categoria?: number) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('componentes_pc')
    .select(COMPONENTE_SELECT)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`serial.ilike.%${search}%,codigo_interno.ilike.%${search}%,tecnologia.ilike.%${search}%`);
  }
  if (id_categoria) query = query.eq('id_categoria', id_categoria);

  const { data, error } = await query;
  return { data: data as ComponentePc[] | null, error };
}

export async function getComponenteById(id: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('componentes_pc')
    .select(COMPONENTE_SELECT)
    .eq('id', id)
    .single();

  return { data: data as ComponentePc | null, error };
}

export async function createComponente(data: ComponenteInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('componentes_pc')
    .insert(data)
    .select(COMPONENTE_SELECT)
    .single();

  return { data: result as ComponentePc | null, error };
}

export async function updateComponente(id: number, data: ComponenteUpdate) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('componentes_pc')
    .update(data)
    .eq('id', id)
    .select(COMPONENTE_SELECT)
    .single();

  return { data: result as ComponentePc | null, error };
}

// ============================================================================
// COMPONENTES INSTALADOS
// ============================================================================

export async function getComponentesInstalados(id_pc: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('componentes_pc_instalados')
    .select(`
      *,
      componente:componentes_pc(
        *,
        categoria:categorias_componentes(*),
        marca:marcas(*),
        modelo:modelos(*)
      )
    `)
    .eq('id_pc', id_pc)
    .is('fecha_retiro', null)
    .order('fecha_instalacion', { ascending: false });

  return { data: data as ComponentePcInstalado[] | null, error };
}

export async function instalarComponente(data: Omit<ComponentePcInstalado, 'id' | 'created_at' | 'componente'>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('componentes_pc_instalados')
    .insert(data)
    .select(`
      *,
      componente:componentes_pc(*)
    `)
    .single();

  return { data: result as ComponentePcInstalado | null, error };
}

export async function retirarComponente(id_instalacion: number, retirado_por: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('componentes_pc_instalados')
    .update({
      fecha_retiro: new Date().toISOString(),
      retirado_por,
    })
    .eq('id', id_instalacion)
    .select()
    .single();

  return { data: data as ComponentePcInstalado | null, error };
}

// ============================================================================
// CATEGORÍAS COMPONENTES
// ============================================================================

export async function getCategoriasComponentes() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('categorias_componentes')
    .select('*')
    .eq('activo', true)
    .order('nombre');

  return { data: data as CategoriaComponente[] | null, error };
}
