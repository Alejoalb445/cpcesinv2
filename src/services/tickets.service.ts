import { getSupabaseClient } from '@/lib/supabase/client';
import type { TicketSoporte, TicketComentario } from '@/types/database';

// ============================================================================
// TICKETS SOPORTE SERVICE
// ============================================================================

type TicketInsert = Omit<TicketSoporte, 'id' | 'created_at' | 'updated_at' | 'persona_afectada' | 'puesto' | 'sector' | 'activo' | 'licencia' | 'servicio'>;
type TicketUpdate = Partial<TicketInsert>;

const TICKET_SELECT = `
  *,
  persona_afectada:personas(id, nombre, apellido),
  puesto:puestos(id, codigo_puesto),
  sector:sectores(id, nombre),
  activo:activos(id, codigo_interno, serial, tipo_activo:tipos_activo(nombre)),
  licencia:licencias(id, software),
  servicio:servicios_internos(id, nombre)
`;

export async function getTickets(estado?: string, prioridad?: string, search?: string) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('tickets_soporte')
    .select(TICKET_SELECT)
    .order('fecha_creacion', { ascending: false });

  if (estado) query = query.eq('estado', estado);
  if (prioridad) query = query.eq('prioridad', prioridad);
  if (search) {
    query = query.or(`titulo.ilike.%${search}%,descripcion.ilike.%${search}%`);
  }

  const { data, error } = await query;
  return { data: data as TicketSoporte[] | null, error };
}

export async function getTicketById(id: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tickets_soporte')
    .select(TICKET_SELECT)
    .eq('id', id)
    .single();

  return { data: data as TicketSoporte | null, error };
}

export async function createTicket(data: TicketInsert) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('tickets_soporte')
    .insert(data)
    .select(TICKET_SELECT)
    .single();

  return { data: result as TicketSoporte | null, error };
}

export async function updateTicket(id: number, data: TicketUpdate) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('tickets_soporte')
    .update(data)
    .eq('id', id)
    .select(TICKET_SELECT)
    .single();

  return { data: result as TicketSoporte | null, error };
}

// ============================================================================
// TICKET COMENTARIOS
// ============================================================================

export async function getTicketComentarios(id_ticket: number) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('ticket_comentarios')
    .select('*')
    .eq('id_ticket', id_ticket)
    .order('created_at', { ascending: true });

  return { data: data as TicketComentario[] | null, error };
}

export async function addComentario(data: Omit<TicketComentario, 'id' | 'created_at'>) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from('ticket_comentarios')
    .insert(data)
    .select()
    .single();

  return { data: result as TicketComentario | null, error };
}

// ============================================================================
// CERRAR TICKET
// ============================================================================

export async function cerrarTicket(id: number, notas_resolucion: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tickets_soporte')
    .update({
      estado: 'Resuelto',
      fecha_cierre: new Date().toISOString(),
      notas_resolucion,
    })
    .eq('id', id)
    .select(TICKET_SELECT)
    .single();

  return { data: data as TicketSoporte | null, error };
}
