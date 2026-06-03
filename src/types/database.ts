// ============================================================================
// INVENTARIO CPC - Database Types
// TypeScript types matching the Supabase PostgreSQL schema
// ============================================================================

// ============================================================================
// ENUMS
// ============================================================================
export type RolSistema = 'SuperAdmin' | 'Admin' | 'Tecnico' | 'Consulta';
export type EstadoGeneral = 'Activo' | 'Inactivo';
export type EstadoActivo = 'En Depósito' | 'Asignado' | 'En Reparación' | 'De Baja' | 'Extraviado';
export type EstadoAsignacion = 'Asignado' | 'Devuelto' | 'Transferido' | 'En Reparación' | 'De Baja';
export type TipoPc = 'Desktop' | 'Notebook' | 'Servidor' | 'All-in-One' | 'Mini PC' | 'Tablet';
export type TipoImpresora = 'Láser B/N' | 'Láser Color' | 'Tinta B/N' | 'Tinta Color' | 'Térmica' | 'Matricial' | 'Multifunción';
export type TipoDvr = 'DVR' | 'NVR';
export type TipoCamara = 'IP' | 'Analógica' | 'PTZ' | 'Wifi';
export type EstadoPedido = 'Pendiente' | 'En revisión' | 'Sin stock' | 'Entregado' | 'Cancelado' | 'Rechazado';
export type TipoMovimientoStock = 'Entrada' | 'Entrega' | 'Ajuste positivo' | 'Ajuste negativo' | 'Devolución' | 'Baja' | 'Recepción compra';
export type PrioridadTicket = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export type EstadoTicket = 'Pendiente' | 'En proceso' | 'Esperando tercero' | 'Resuelto' | 'Cancelado';
export type EstadoCompra = 'Pendiente' | 'Solicitado' | 'Aprobado' | 'Comprado' | 'Recibido' | 'Cancelado';
export type TipoActa = 'Entrega' | 'Devolución' | 'Cambio' | 'Préstamo';

// ============================================================================
// TABLE TYPES
// ============================================================================

export interface Sede {
  id: number;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface UbicacionFisica {
  id: number;
  id_sede: number;
  detalle: string;
  piso: string | null;
  referencia: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  sede?: Sede;
}

export interface Sector {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface SectorCorreo {
  id: number;
  id_sector: number;
  email: string;
  tipo_correo: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
}

export interface Marca {
  id: number;
  nombre: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Modelo {
  id: number;
  nombre: string;
  id_marca: number;
  tipo_dispositivo: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  marca?: Marca;
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServicioInterno {
  id: number;
  nombre: string;
  categoria: string | null;
  descripcion: string | null;
  criticidad: string;
  responsable: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Persona {
  id: number;
  nombre: string;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  legajo: string | null;
  id_sector_actual: number | null;
  interno: boolean;
  activo: boolean;
  notas: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  sector_actual?: Sector;
}

export interface PersonaSectorHistorial {
  id: number;
  id_persona: number;
  id_sector: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  activo: boolean;
  notas: string | null;
  created_at: string;
  // Joins
  sector?: Sector;
  persona?: Persona;
}

export interface UsuarioSistema {
  id: string;
  id_persona: number | null;
  rol: RolSistema;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  persona?: Persona;
}

export interface Puesto {
  id: number;
  codigo_puesto: string;
  id_sector: number | null;
  id_ubicacion_fisica: number | null;
  descripcion: string | null;
  ip: string | null;
  modo_ip: string;
  vlan: string | null;
  boca_red: string | null;
  patchera: string | null;
  switch_referencia: string | null;
  puerto_switch: string | null;
  telefono_interno: string | null;
  estado: string;
  notas: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  sector?: Sector;
  ubicacion_fisica?: UbicacionFisica;
}

export interface PuestoPersonaHistorial {
  id: number;
  id_puesto: number;
  id_persona: number;
  turno: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  activo: boolean;
  notas: string | null;
  created_at: string;
  // Joins
  persona?: Persona;
  puesto?: Puesto;
}

export interface TipoActivo {
  id: number;
  nombre: string;
  categoria: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
}

export interface Activo {
  id: number;
  id_tipo_activo: number;
  id_marca: number | null;
  id_modelo: number | null;
  serial: string | null;
  codigo_interno: string | null;
  estado: EstadoActivo;
  fecha_compra: string | null;
  id_proveedor: number | null;
  valor_estimado: number | null;
  garantia_hasta: string | null;
  observaciones: string | null;
  dado_de_baja: boolean;
  fecha_baja: string | null;
  motivo_baja: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  tipo_activo?: TipoActivo;
  marca?: Marca;
  modelo?: Modelo;
  proveedor?: Proveedor;
}

export interface ActivoPc {
  id_activo: number;
  tipo_pc: TipoPc;
  hostname: string | null;
  mac: string | null;
  sistema_operativo: string | null;
  arquitectura: string | null;
  dominio_ad: boolean;
  usuario_ad: string | null;
  ip: string | null;
  modo_ip: string;
  notas_tecnicas: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivoImpresora {
  id_activo: number;
  tipo_impresora: TipoImpresora;
  ip: string | null;
  modo_conexion: string;
  contador_paginas: number;
  es_color: boolean;
  doble_faz: boolean;
  notas_tecnicas: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivoRed {
  id_activo: number;
  ip: string | null;
  mac: string | null;
  hostname: string | null;
  cantidad_puertos: number | null;
  ubicacion_logica: string | null;
  notas_tecnicas: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivoTelefonia {
  id_activo: number;
  numero_interno: string | null;
  ip: string | null;
  mac: string | null;
  patchera: string | null;
  boca_red: string | null;
  notas_tecnicas: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivoDvrNvr {
  id_activo: number;
  tipo: TipoDvr;
  ip: string | null;
  cantidad_canales: number;
  capacidad_almacenamiento: string | null;
  id_ubicacion_fisica: number | null;
  ubicacion_especifica: string | null;
  notas_tecnicas: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivoCamara {
  id_activo: number;
  tipo_camara: TipoCamara;
  ip: string | null;
  id_dvr_nvr: number | null;
  canal: number | null;
  id_ubicacion_fisica: number | null;
  ubicacion_especifica: string | null;
  notas_tecnicas: string | null;
  created_at: string;
  updated_at: string;
}

export interface AsignacionActivo {
  id: number;
  id_activo: number;
  id_puesto: number | null;
  id_persona: number | null;
  id_sector: number | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: EstadoAsignacion;
  asignado_por: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  activo?: Activo;
  puesto?: Puesto;
  persona?: Persona;
  sector?: Sector;
}

export interface CategoriaComponente {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
}

export interface ComponentePc {
  id: number;
  id_categoria: number;
  id_marca: number | null;
  id_modelo: number | null;
  serial: string | null;
  codigo_interno: string | null;
  capacidad_gb: number | null;
  velocidad_mhz: number | null;
  tecnologia: string | null;
  watts: number | null;
  estado: EstadoActivo;
  fecha_compra: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  categoria?: CategoriaComponente;
  marca?: Marca;
  modelo?: Modelo;
}

export interface ComponentePcInstalado {
  id: number;
  id_componente: number;
  id_pc: number;
  fecha_instalacion: string;
  fecha_retiro: string | null;
  instalado_por: string | null;
  retirado_por: string | null;
  observaciones: string | null;
  created_at: string;
  // Joins
  componente?: ComponentePc;
}

export interface CategoriaStock {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
}

export interface ItemStock {
  id: number;
  id_categoria: number;
  descripcion: string;
  id_marca: number | null;
  id_modelo: number | null;
  codigo: string | null;
  color: string | null;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  stock_reposicion: number;
  permite_serial: boolean;
  observaciones: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  categoria?: CategoriaStock;
  marca?: Marca;
  modelo?: Modelo;
}

export interface MovimientoStock {
  id: number;
  id_item_stock: number;
  tipo_movimiento: TipoMovimientoStock;
  cantidad: number;
  stock_antes: number | null;
  stock_despues: number | null;
  id_persona_destino: number | null;
  id_puesto_destino: number | null;
  id_sector_destino: number | null;
  id_pedido_toner: number | null;
  id_pedido_stock_general: number | null;
  id_solicitud_compra: number | null;
  realizado_por: string | null;
  observaciones: string | null;
  fecha: string;
  // Joins
  item_stock?: ItemStock;
}

export interface ImpresoraSuministroCompatible {
  id: number;
  id_modelo_impresora: number;
  id_item_stock: number;
  observaciones: string | null;
  created_at: string;
  // Joins
  item_stock?: ItemStock;
  modelo_impresora?: Modelo;
}

export interface PedidoToner {
  id: number;
  id_impresora: number | null;
  id_item_stock: number;
  id_persona_solicitante: number | null;
  id_sector: number | null;
  id_puesto: number | null;
  cantidad: number;
  estado: EstadoPedido;
  origen: string;
  email_origen: string | null;
  asunto_email: string | null;
  fecha_pedido: string;
  fecha_entrega: string | null;
  entregado_por: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  item_stock?: ItemStock;
  persona_solicitante?: Persona;
  sector?: Sector;
  puesto?: Puesto;
}

export interface PedidoStockGeneral {
  id: number;
  id_item_stock: number;
  id_persona_solicitante: number | null;
  id_sector: number | null;
  id_puesto: number | null;
  cantidad: number;
  motivo: string | null;
  estado: EstadoPedido;
  origen: string;
  fecha_pedido: string;
  fecha_entrega: string | null;
  entregado_por: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  item_stock?: ItemStock;
  persona_solicitante?: Persona;
  sector?: Sector;
  puesto?: Puesto;
}

export interface ActaEntrega {
  id: number;
  numero: string | null;
  tipo: TipoActa;
  id_persona_recibe: number | null;
  id_puesto: number | null;
  id_sector: number | null;
  fecha: string;
  generado_por: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  persona_recibe?: Persona;
  puesto?: Puesto;
  sector?: Sector;
}

export interface ActaEntregaDetalle {
  id: number;
  id_acta: number;
  id_activo: number | null;
  id_item_stock: number | null;
  cantidad: number;
  descripcion_manual: string | null;
  observaciones: string | null;
  created_at: string;
  // Joins
  activo?: Activo;
  item_stock?: ItemStock;
}

export interface SolicitudCompra {
  id: number;
  id_item_stock: number | null;
  descripcion_manual: string | null;
  cantidad_sugerida: number;
  motivo: string | null;
  estado: EstadoCompra;
  proveedor_sugerido: number | null;
  solicitada_por: string | null;
  fecha_solicitud: string;
  fecha_cierre: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  item_stock?: ItemStock;
  proveedor?: Proveedor;
}

export interface OrdenCompra {
  id: number;
  numero: string | null;
  id_proveedor: number | null;
  estado: EstadoCompra;
  fecha_orden: string;
  fecha_estimada_recepcion: string | null;
  creada_por: string | null;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  proveedor?: Proveedor;
}

export interface OrdenCompraDetalle {
  id: number;
  id_orden_compra: number;
  id_solicitud_compra: number | null;
  id_item_stock: number | null;
  descripcion_manual: string | null;
  cantidad: number;
  precio_unitario: number | null;
  observaciones: string | null;
  created_at: string;
  // Joins
  item_stock?: ItemStock;
  solicitud_compra?: SolicitudCompra;
}

export interface RecepcionCompra {
  id: number;
  id_orden_compra: number | null;
  id_item_stock: number;
  cantidad_recibida: number;
  recibido_por: string | null;
  fecha_recepcion: string;
  observaciones: string | null;
  created_at: string;
  // Joins
  item_stock?: ItemStock;
  orden_compra?: OrdenCompra;
}

export interface Licencia {
  id: number;
  software: string;
  fabricante: string | null;
  tipo: string;
  clave_producto: string | null;
  cantidad_total: number;
  cantidad_en_uso: number;
  id_proveedor: number | null;
  fecha_compra: string | null;
  fecha_vencimiento: string | null;
  estado: string;
  notas: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  proveedor?: Proveedor;
}

export interface LicenciaAsignada {
  id: number;
  id_licencia: number;
  id_pc: number | null;
  id_persona: number | null;
  id_puesto: number | null;
  id_sector: number | null;
  fecha_asignado: string;
  fecha_liberado: string | null;
  estado: string;
  notas: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  licencia?: Licencia;
  persona?: Persona;
  puesto?: Puesto;
  sector?: Sector;
}

export interface TicketSoporte {
  id: number;
  titulo: string;
  descripcion: string | null;
  id_persona_afectada: number | null;
  id_puesto: number | null;
  id_sector: number | null;
  id_activo: number | null;
  id_licencia: number | null;
  id_servicio: number | null;
  prioridad: PrioridadTicket;
  estado: EstadoTicket;
  origen: string;
  asignado_a: string | null;
  creado_por: string | null;
  fecha_creacion: string;
  fecha_cierre: string | null;
  notas_resolucion: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  persona_afectada?: Persona;
  puesto?: Puesto;
  sector?: Sector;
  activo?: Activo;
  licencia?: Licencia;
  servicio?: ServicioInterno;
}

export interface TicketComentario {
  id: number;
  id_ticket: number;
  comentario: string;
  creado_por: string | null;
  created_at: string;
}

export interface LogAuditoria {
  id: number;
  fecha: string;
  user_id: string | null;
  tabla: string;
  registro_id: string | null;
  accion: 'INSERT' | 'UPDATE' | 'DELETE';
  datos_anteriores: Record<string, unknown> | null;
  datos_nuevos: Record<string, unknown> | null;
}

// ============================================================================
// AUTH CONTEXT TYPES
// ============================================================================
export interface AuthUser {
  id: string;
  email: string;
  role: RolSistema;
  persona: Persona | null;
  activo: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SelectOption {
  value: string | number;
  label: string;
}
