// ============================================================================
// INVENTARIO CPC v2.0 — TypeScript Types
// Mapeo completo del esquema EAM modular
// ============================================================================

// --------------------------------------------------------------------------
// Enums / Literal Types
// --------------------------------------------------------------------------

export type RolSistema = 'Admin IT' | 'Técnico' | 'Consulta';

export type EstadoActivo =
  | 'Activo'
  | 'En reparación'
  | 'En stock'
  | 'Dado de baja'
  | 'Prestado'
  | 'Extraviado';

export type TipoComponente =
  | 'RAM'
  | 'Disco'
  | 'Fuente'
  | 'Placa de red'
  | 'Placa de video'
  | 'Motherboard'
  | 'Procesador'
  | 'Lectora'
  | 'Otro';

export type CategoriaPeriferico =
  | 'Monitor'
  | 'Teclado'
  | 'Mouse'
  | 'Webcam'
  | 'Auricular'
  | 'Parlante'
  | 'Lector de código'
  | 'Docking'
  | 'Hub USB'
  | 'Otro';

export type CategoriaInfra =
  | 'Switch'
  | 'Router'
  | 'Access Point'
  | 'Firewall'
  | 'Servidor'
  | 'NAS'
  | 'UPS'
  | 'Estabilizador'
  | 'DVR'
  | 'NVR'
  | 'Cámara IP'
  | 'Otro';

export type TipoImpresora =
  | 'Laser'
  | 'Inkjet'
  | 'Matricial'
  | 'Térmica'
  | 'Multifunción'
  | 'Plotter';

export type TipoInsumo = 'Tóner' | 'Cartucho' | 'Cinta' | 'Rollo' | 'Otro';

export type TipoMovil = 'Celular' | 'Tablet';

export type TipoLicencia =
  | 'Perpetua'
  | 'Suscripción mensual'
  | 'Suscripción anual'
  | 'OEM'
  | 'Volumen'
  | 'Freeware'
  | 'Open Source';

export type EstadoLicencia = 'Vigente' | 'Por vencer' | 'Vencida' | 'Cancelada';

export type PrioridadSoporte = 'Baja' | 'Media' | 'Alta' | 'Urgente';

export type EstadoSoporte =
  | 'Abierta'
  | 'En progreso'
  | 'En espera'
  | 'Resuelta'
  | 'Cancelada';

export type TipoMovimientoInsumo = 'Ingreso' | 'Consumo' | 'Ajuste' | 'Devolución';

export type ModoIP = 'DHCP' | 'Estática' | 'No aplica';

// --------------------------------------------------------------------------
// Catálogos Base
// --------------------------------------------------------------------------

export interface Ubicacion {
  id: number;
  nombre: string;
  direccion: string | null;
  piso: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sector {
  id: number;
  nombre: string;
  responsable: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Marca {
  id: number;
  nombre: string;
  created_at: string;
}

export interface Modelo {
  id: number;
  id_marca: number;
  nombre: string;
  categoria: string | null;
  created_at: string;
  // Joins
  marca?: Marca;
}

export interface Proveedor {
  id: number;
  razon_social: string;
  cuit: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  contacto_nombre: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

// --------------------------------------------------------------------------
// Usuarios (vinculado a auth.users de Supabase)
// --------------------------------------------------------------------------

export interface Usuario {
  id: string; // UUID from auth.users
  email: string;
  nombre: string;
  apellido: string;
  id_sector: number | null;
  rol: RolSistema;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  sector?: Sector;
}

// --------------------------------------------------------------------------
// Puestos de Trabajo
// --------------------------------------------------------------------------

export interface PuestoTrabajo {
  id: number;
  codigo: string;
  id_ubicacion: number;
  id_sector: number;
  descripcion: string | null;
  usuario_asignado: string | null; // UUID → usuario
  ip: string | null;
  modo_ip: ModoIP;
  boca_red: string | null;
  telefono_interno: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  ubicacion?: Ubicacion;
  sector?: Sector;
  usuario?: Usuario;
}

// --------------------------------------------------------------------------
// Computadoras
// --------------------------------------------------------------------------

export interface Computadora {
  id: number;
  tipo: 'Desktop' | 'Notebook' | 'All-in-One' | 'Mini PC';
  hostname: string | null;
  id_marca: number | null;
  id_modelo: number | null;
  serial: string | null;
  codigo_inventario: string | null;
  procesador: string | null;
  ram_total_gb: number | null;
  disco_total_gb: number | null;
  sistema_operativo: string | null;
  id_puesto: number | null;
  id_proveedor: number | null;
  fecha_compra: string | null;
  garantia_hasta: string | null;
  estado: EstadoActivo;
  notas: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  marca?: Marca;
  modelo?: Modelo;
  puesto?: PuestoTrabajo;
  proveedor?: Proveedor;
  componentes?: ComponentePc[];
  interfaces_red?: InterfazRed[];
}

// --------------------------------------------------------------------------
// Componentes de PC
// --------------------------------------------------------------------------

export interface ComponentePc {
  id: number;
  id_computadora: number | null;
  tipo: TipoComponente;
  id_marca: number | null;
  id_modelo: number | null;
  serial: string | null;
  capacidad: string | null;
  velocidad: string | null;
  detalle: string | null;
  estado: EstadoActivo;
  en_stock: boolean;
  notas: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  marca?: Marca;
  modelo?: Modelo;
  computadora?: Computadora;
}

// --------------------------------------------------------------------------
// Impresoras
// --------------------------------------------------------------------------

export interface Impresora {
  id: number;
  tipo: TipoImpresora;
  id_marca: number | null;
  id_modelo: number | null;
  serial: string | null;
  codigo_inventario: string | null;
  id_ubicacion: number | null;
  id_sector: number | null;
  ip: string | null;
  es_red: boolean;
  id_proveedor: number | null;
  fecha_compra: string | null;
  garantia_hasta: string | null;
  estado: EstadoActivo;
  notas: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  marca?: Marca;
  modelo?: Modelo;
  ubicacion?: Ubicacion;
  sector?: Sector;
  proveedor?: Proveedor;
  interfaces_red?: InterfazRed[];
}

// --------------------------------------------------------------------------
// Insumos de Impresora (stock de tóner/cartuchos)
// --------------------------------------------------------------------------

export interface InsumoImpresora {
  id: number;
  nombre: string;
  tipo: TipoInsumo;
  codigo_oem: string | null;
  id_marca: number | null;
  compatible_con: string | null;
  stock_actual: number;
  stock_minimo: number;
  notas: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  marca?: Marca;
}

// --------------------------------------------------------------------------
// Consumos / Movimientos de Insumos
// --------------------------------------------------------------------------

export interface ConsumoInsumo {
  id: number;
  id_insumo: number;
  id_impresora: number | null;
  tipo_movimiento: TipoMovimientoInsumo;
  cantidad: number;
  id_sector_destino: number | null;
  solicitado_por: string | null;
  entregado_por: string | null;
  observaciones: string | null;
  created_at: string;
  // Joins
  insumo?: InsumoImpresora;
  impresora?: Impresora;
  sector_destino?: Sector;
}

// --------------------------------------------------------------------------
// Dispositivos de Infraestructura
// --------------------------------------------------------------------------

export interface DispositivoInfraestructura {
  id: number;
  categoria: CategoriaInfra;
  id_marca: number | null;
  id_modelo: number | null;
  serial: string | null;
  codigo_inventario: string | null;
  id_ubicacion: number | null;
  ip: string | null;
  id_proveedor: number | null;
  fecha_compra: string | null;
  garantia_hasta: string | null;
  estado: EstadoActivo;
  notas: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  marca?: Marca;
  modelo?: Modelo;
  ubicacion?: Ubicacion;
  proveedor?: Proveedor;
  detalle_red?: DetalleRed;
  detalle_energia?: DetalleEnergia;
  detalle_cctv?: DetalleCctv;
  interfaces_red?: InterfazRed[];
}

export interface DetalleRed {
  id: number;
  id_dispositivo: number;
  cantidad_puertos: number | null;
  puertos_poe: number | null;
  velocidad_gbps: number | null;
  gestionable: boolean;
  firmware: string | null;
}

export interface DetalleEnergia {
  id: number;
  id_dispositivo: number;
  potencia_va: number | null;
  potencia_watts: number | null;
  tiempo_respaldo_min: number | null;
  cantidad_tomas: number | null;
  ultima_revision: string | null;
}

export interface DetalleCctv {
  id: number;
  id_dispositivo: number;
  canales: number | null;
  resolucion: string | null;
  almacenamiento_tb: number | null;
  poe_integrado: boolean;
  protocolo: string | null;
}

// --------------------------------------------------------------------------
// Periféricos
// --------------------------------------------------------------------------

export interface Periferico {
  id: number;
  categoria: CategoriaPeriferico;
  id_marca: number | null;
  id_modelo: number | null;
  serial: string | null;
  codigo_inventario: string | null;
  id_puesto: number | null;
  estado: EstadoActivo;
  notas: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  marca?: Marca;
  modelo?: Modelo;
  puesto?: PuestoTrabajo;
}

// --------------------------------------------------------------------------
// Dispositivos Móviles
// --------------------------------------------------------------------------

export interface DispositivoMovil {
  id: number;
  tipo: TipoMovil;
  id_marca: number | null;
  id_modelo: number | null;
  serial: string | null;
  imei: string | null;
  numero_linea: string | null;
  codigo_inventario: string | null;
  usuario_asignado: string | null;
  id_sector: number | null;
  id_proveedor: number | null;
  fecha_compra: string | null;
  garantia_hasta: string | null;
  estado: EstadoActivo;
  notas: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  marca?: Marca;
  modelo?: Modelo;
  usuario?: Usuario;
  sector?: Sector;
  proveedor?: Proveedor;
}

// --------------------------------------------------------------------------
// Interfaces de Red (polimórfica)
// --------------------------------------------------------------------------

export interface InterfazRed {
  id: number;
  id_computadora: number | null;
  id_impresora: number | null;
  id_infra: number | null;
  tipo: 'Ethernet' | 'WiFi' | 'Fibra';
  mac: string | null;
  ip: string | null;
  mascara: string | null;
  gateway: string | null;
  dns: string | null;
  vlan: string | null;
  notas: string | null;
  created_at: string;
}

// --------------------------------------------------------------------------
// Licencias
// --------------------------------------------------------------------------

export interface Licencia {
  id: number;
  nombre_software: string;
  version: string | null;
  tipo_licencia: TipoLicencia;
  clave_licencia: string | null;
  cantidad_puestos: number | null;
  puestos_usados: number;
  id_proveedor: number | null;
  fecha_compra: string | null;
  fecha_vencimiento: string | null;
  costo: number | null;
  estado: EstadoLicencia;
  notas: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  proveedor?: Proveedor;
  asignaciones?: LicenciaUsuario[];
}

export interface LicenciaUsuario {
  id: number;
  id_licencia: number;
  id_usuario: string;
  fecha_asignacion: string;
  notas: string | null;
  // Joins
  licencia?: Licencia;
  usuario?: Usuario;
}

// --------------------------------------------------------------------------
// Historial de Asignaciones
// --------------------------------------------------------------------------

export interface HistorialAsignacion {
  id: number;
  tipo_activo: 'computadora' | 'periferico' | 'movil';
  id_activo: number;
  id_puesto: number | null;
  id_usuario: string | null;
  accion: 'Asignación' | 'Desasignación' | 'Transferencia' | 'Baja';
  detalle: string | null;
  realizado_por: string | null;
  created_at: string;
  // Joins (for display)
  usuario?: Usuario;
  puesto?: PuestoTrabajo;
}

// --------------------------------------------------------------------------
// Soporte / Tareas
// --------------------------------------------------------------------------

export interface TareaSoporte {
  id: number;
  titulo: string;
  descripcion: string | null;
  prioridad: PrioridadSoporte;
  estado: EstadoSoporte;
  id_solicitante: string | null;
  id_tecnico: string | null;
  id_puesto: number | null;
  tipo_activo: string | null;
  id_activo: number | null;
  fecha_resolucion: string | null;
  notas_resolucion: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  solicitante?: Usuario;
  tecnico?: Usuario;
  puesto?: PuestoTrabajo;
}

// --------------------------------------------------------------------------
// Log de Auditoría
// --------------------------------------------------------------------------

export interface LogAuditoria {
  id: number;
  tabla: string;
  id_registro: number;
  accion: 'INSERT' | 'UPDATE' | 'DELETE';
  datos_anteriores: Record<string, unknown> | null;
  datos_nuevos: Record<string, unknown> | null;
  usuario_id: string | null;
  created_at: string;
}

// --------------------------------------------------------------------------
// Auth Context User
// --------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  role: RolSistema;
  nombre: string;
  apellido: string;
  activo: boolean;
  id_sector: number | null;
  sector?: Sector;
}

// --------------------------------------------------------------------------
// Form / Helper Types
// --------------------------------------------------------------------------

export type CreateDTO<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;
export type UpdateDTO<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;

// Select option for dropdowns
export interface SelectOption {
  value: string | number;
  label: string;
}
