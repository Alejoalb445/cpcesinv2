-- ============================================================================
-- INVENTARIO CPC v2.0 — SCHEMA EAM MODULAR
-- Adaptado para Supabase (sin CREATE ROLE, sin RLS complejo)
-- PostgreSQL / Supabase
-- ============================================================================

-- ==========================================================================
-- 0. FUNCIÓN HELPER: updated_at automático
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================================================
-- 1. UBICACIONES
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.ubicaciones (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(200) NOT NULL UNIQUE,
  direccion     VARCHAR(500),
  piso          VARCHAR(50),
  notas         TEXT,
  activo        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at ON public.ubicaciones;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ubicaciones
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ==========================================================================
-- 2. SECTORES
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.sectores (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(200) NOT NULL UNIQUE,
  responsable   VARCHAR(200),
  notas         TEXT,
  activo        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at ON public.sectores;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.sectores
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ==========================================================================
-- 3. MARCAS
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.marcas (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(200) NOT NULL UNIQUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================================
-- 4. MODELOS
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.modelos (
  id            SERIAL PRIMARY KEY,
  id_marca      INT NOT NULL REFERENCES public.marcas(id) ON DELETE CASCADE,
  nombre        VARCHAR(300) NOT NULL,
  categoria     VARCHAR(100),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(id_marca, nombre)
);

-- ==========================================================================
-- 5. PROVEEDORES
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.proveedores (
  id              SERIAL PRIMARY KEY,
  razon_social    VARCHAR(300) NOT NULL,
  cuit            VARCHAR(20),
  telefono        VARCHAR(50),
  email           VARCHAR(200),
  direccion       VARCHAR(500),
  contacto_nombre VARCHAR(200),
  notas           TEXT,
  activo          BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at ON public.proveedores;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.proveedores
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ==========================================================================
-- 6. USUARIOS (vinculados a auth.users de Supabase)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         VARCHAR(300) NOT NULL,
  nombre        VARCHAR(200) NOT NULL,
  apellido      VARCHAR(200) NOT NULL,
  id_sector     INT REFERENCES public.sectores(id) ON DELETE SET NULL,
  rol           VARCHAR(20) NOT NULL DEFAULT 'Consulta'
                CHECK (rol IN ('Admin IT', 'Técnico', 'Consulta')),
  activo        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at ON public.usuarios;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ==========================================================================
-- 7. PUESTOS DE TRABAJO
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.puestos_trabajo (
  id                SERIAL PRIMARY KEY,
  codigo            VARCHAR(50) NOT NULL UNIQUE,
  id_ubicacion      INT NOT NULL REFERENCES public.ubicaciones(id),
  id_sector         INT NOT NULL REFERENCES public.sectores(id),
  descripcion       TEXT,
  usuario_asignado  UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  ip                VARCHAR(45),
  modo_ip           VARCHAR(20) DEFAULT 'DHCP'
                    CHECK (modo_ip IN ('DHCP', 'Estática', 'No aplica')),
  boca_red          VARCHAR(50),
  telefono_interno  VARCHAR(20),
  tel_modulo_central VARCHAR(100),
  tel_pachera        VARCHAR(100),
  tel_boca           VARCHAR(100),
  red_switch         VARCHAR(100),
  red_puerto         VARCHAR(100),
  notas             TEXT,
  activo            BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at ON public.puestos_trabajo;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.puestos_trabajo
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ==========================================================================
-- 8. COMPUTADORAS
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.computadoras (
  id                  SERIAL PRIMARY KEY,
  tipo                VARCHAR(20) NOT NULL DEFAULT 'Desktop'
                      CHECK (tipo IN ('Desktop', 'Notebook', 'All-in-One', 'Mini PC')),
  hostname            VARCHAR(100),
  id_marca            INT REFERENCES public.marcas(id),
  id_modelo           INT REFERENCES public.modelos(id),
  serial              VARCHAR(200),
  codigo_inventario   VARCHAR(100),
  procesador          VARCHAR(200),
  ram_total_gb        INT,
  disco_total_gb      INT,
  sistema_operativo   VARCHAR(200),
  id_puesto           INT REFERENCES public.puestos_trabajo(id) ON DELETE SET NULL,
  id_proveedor        INT REFERENCES public.proveedores(id) ON DELETE SET NULL,
  fecha_compra        DATE,
  garantia_hasta      DATE,
  estado              VARCHAR(30) NOT NULL DEFAULT 'Activo'
                      CHECK (estado IN ('Activo','En reparación','En stock','Dado de baja','Prestado','Extraviado')),
  notas               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at ON public.computadoras;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.computadoras
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ==========================================================================
-- 9. COMPONENTES DE PC
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.componentes_pc (
  id                SERIAL PRIMARY KEY,
  id_computadora    INT REFERENCES public.computadoras(id) ON DELETE SET NULL,
  tipo              VARCHAR(30) NOT NULL
                    CHECK (tipo IN ('RAM','Disco','Fuente','Placa de red','Placa de video','Motherboard','Procesador','Lectora','Otro')),
  id_marca          INT REFERENCES public.marcas(id),
  id_modelo         INT REFERENCES public.modelos(id),
  serial            VARCHAR(200),
  capacidad         VARCHAR(100),
  velocidad         VARCHAR(100),
  detalle           TEXT,
  estado            VARCHAR(30) NOT NULL DEFAULT 'Activo'
                    CHECK (estado IN ('Activo','En reparación','En stock','Dado de baja','Prestado','Extraviado')),
  en_stock          BOOLEAN DEFAULT FALSE,
  notas             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at ON public.componentes_pc;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.componentes_pc
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ==========================================================================
-- 10. IMPRESORAS
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.impresoras (
  id                  SERIAL PRIMARY KEY,
  tipo                VARCHAR(30) NOT NULL DEFAULT 'Laser'
                      CHECK (tipo IN ('Laser','Inkjet','Matricial','Térmica','Multifunción','Plotter')),
  id_marca            INT REFERENCES public.marcas(id),
  id_modelo           INT REFERENCES public.modelos(id),
  serial              VARCHAR(200),
  codigo_inventario   VARCHAR(100),
  id_ubicacion        INT REFERENCES public.ubicaciones(id) ON DELETE SET NULL,
  id_sector           INT REFERENCES public.sectores(id) ON DELETE SET NULL,
  ip                  VARCHAR(45),
  es_red              BOOLEAN DEFAULT FALSE,
  id_proveedor        INT REFERENCES public.proveedores(id) ON DELETE SET NULL,
  fecha_compra        DATE,
  garantia_hasta      DATE,
  estado              VARCHAR(30) NOT NULL DEFAULT 'Activo'
                      CHECK (estado IN ('Activo','En reparación','En stock','Dado de baja','Prestado','Extraviado')),
  notas               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at ON public.impresoras;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.impresoras
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ==========================================================================
-- 11. INSUMOS DE IMPRESORA (stock de tóner, cartuchos, etc.)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.insumos_impresora (
  id              SERIAL PRIMARY KEY,
  nombre          VARCHAR(300) NOT NULL,
  tipo            VARCHAR(20) NOT NULL DEFAULT 'Tóner'
                  CHECK (tipo IN ('Tóner','Cartucho','Cinta','Rollo','Otro')),
  codigo_oem      VARCHAR(100),
  id_marca        INT REFERENCES public.marcas(id),
  compatible_con  TEXT,
  stock_actual    INT NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo    INT NOT NULL DEFAULT 2,
  notas           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at ON public.insumos_impresora;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.insumos_impresora
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ==========================================================================
-- 12. CONSUMOS / MOVIMIENTOS DE INSUMOS
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.consumos_insumo (
  id                  SERIAL PRIMARY KEY,
  id_insumo           INT NOT NULL REFERENCES public.insumos_impresora(id),
  id_impresora        INT REFERENCES public.impresoras(id) ON DELETE SET NULL,
  tipo_movimiento     VARCHAR(20) NOT NULL DEFAULT 'Consumo'
                      CHECK (tipo_movimiento IN ('Ingreso','Consumo','Ajuste','Devolución')),
  cantidad            INT NOT NULL CHECK (cantidad > 0),
  id_sector_destino   INT REFERENCES public.sectores(id),
  solicitado_por      VARCHAR(200),
  entregado_por       VARCHAR(200),
  observaciones       TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: actualizar stock automáticamente al registrar movimiento
CREATE OR REPLACE FUNCTION public.trigger_actualizar_stock_insumo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tipo_movimiento IN ('Ingreso', 'Devolución') THEN
    UPDATE public.insumos_impresora
    SET stock_actual = stock_actual + NEW.cantidad
    WHERE id = NEW.id_insumo;
  ELSIF NEW.tipo_movimiento = 'Consumo' THEN
    -- Validar stock suficiente
    IF (SELECT stock_actual FROM public.insumos_impresora WHERE id = NEW.id_insumo) < NEW.cantidad THEN
      RAISE EXCEPTION 'Stock insuficiente para el insumo ID %', NEW.id_insumo;
    END IF;
    UPDATE public.insumos_impresora
    SET stock_actual = stock_actual - NEW.cantidad
    WHERE id = NEW.id_insumo;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_stock_insumo ON public.consumos_insumo;
CREATE TRIGGER trg_stock_insumo
  AFTER INSERT ON public.consumos_insumo
  FOR EACH ROW EXECUTE FUNCTION public.trigger_actualizar_stock_insumo();

-- ==========================================================================
-- 13. DISPOSITIVOS DE INFRAESTRUCTURA
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.dispositivos_infraestructura (
  id                  SERIAL PRIMARY KEY,
  categoria           VARCHAR(30) NOT NULL
                      CHECK (categoria IN ('Switch','Router','Access Point','Firewall','Servidor','NAS','UPS','Estabilizador','DVR','NVR','Cámara IP','Otro')),
  id_marca            INT REFERENCES public.marcas(id),
  id_modelo           INT REFERENCES public.modelos(id),
  serial              VARCHAR(200),
  codigo_inventario   VARCHAR(100),
  id_ubicacion        INT REFERENCES public.ubicaciones(id) ON DELETE SET NULL,
  ip                  VARCHAR(45),
  id_proveedor        INT REFERENCES public.proveedores(id) ON DELETE SET NULL,
  fecha_compra        DATE,
  garantia_hasta      DATE,
  estado              VARCHAR(30) NOT NULL DEFAULT 'Activo'
                      CHECK (estado IN ('Activo','En reparación','En stock','Dado de baja','Prestado','Extraviado')),
  notas               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at ON public.dispositivos_infraestructura;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.dispositivos_infraestructura
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ---------- Detalle: RED (switches, routers, APs, firewalls) ----------
CREATE TABLE IF NOT EXISTS public.detalle_red (
  id                SERIAL PRIMARY KEY,
  id_dispositivo    INT NOT NULL UNIQUE REFERENCES public.dispositivos_infraestructura(id) ON DELETE CASCADE,
  cantidad_puertos  INT,
  puertos_poe       INT,
  velocidad_gbps    NUMERIC(5,1),
  gestionable       BOOLEAN DEFAULT FALSE,
  firmware          VARCHAR(200)
);

-- ---------- Detalle: ENERGÍA (UPS, estabilizadores) ----------
CREATE TABLE IF NOT EXISTS public.detalle_energia (
  id                    SERIAL PRIMARY KEY,
  id_dispositivo        INT NOT NULL UNIQUE REFERENCES public.dispositivos_infraestructura(id) ON DELETE CASCADE,
  potencia_va           INT,
  potencia_watts        INT,
  tiempo_respaldo_min   INT,
  cantidad_tomas        INT,
  ultima_revision       DATE
);

-- ---------- Detalle: CCTV (DVR, NVR, cámaras) ----------
CREATE TABLE IF NOT EXISTS public.detalle_cctv (
  id                SERIAL PRIMARY KEY,
  id_dispositivo    INT NOT NULL UNIQUE REFERENCES public.dispositivos_infraestructura(id) ON DELETE CASCADE,
  canales           INT,
  resolucion        VARCHAR(50),
  almacenamiento_tb NUMERIC(5,1),
  poe_integrado     BOOLEAN DEFAULT FALSE,
  protocolo         VARCHAR(100)
);

-- ==========================================================================
-- 14. PERIFÉRICOS
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.perifericos (
  id                  SERIAL PRIMARY KEY,
  categoria           VARCHAR(30) NOT NULL
                      CHECK (categoria IN ('Monitor','Teclado','Mouse','Webcam','Auricular','Parlante','Lector de código','Docking','Hub USB','Otro')),
  id_marca            INT REFERENCES public.marcas(id),
  id_modelo           INT REFERENCES public.modelos(id),
  serial              VARCHAR(200),
  codigo_inventario   VARCHAR(100),
  id_puesto           INT REFERENCES public.puestos_trabajo(id) ON DELETE SET NULL,
  estado              VARCHAR(30) NOT NULL DEFAULT 'Activo'
                      CHECK (estado IN ('Activo','En reparación','En stock','Dado de baja','Prestado','Extraviado')),
  notas               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at ON public.perifericos;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.perifericos
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ==========================================================================
-- 15. DISPOSITIVOS MÓVILES
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.dispositivos_moviles (
  id                  SERIAL PRIMARY KEY,
  tipo                VARCHAR(10) NOT NULL CHECK (tipo IN ('Celular','Tablet')),
  id_marca            INT REFERENCES public.marcas(id),
  id_modelo           INT REFERENCES public.modelos(id),
  serial              VARCHAR(200),
  imei                VARCHAR(20),
  numero_linea        VARCHAR(30),
  codigo_inventario   VARCHAR(100),
  usuario_asignado    UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  id_sector           INT REFERENCES public.sectores(id) ON DELETE SET NULL,
  id_proveedor        INT REFERENCES public.proveedores(id) ON DELETE SET NULL,
  fecha_compra        DATE,
  garantia_hasta      DATE,
  estado              VARCHAR(30) NOT NULL DEFAULT 'Activo'
                      CHECK (estado IN ('Activo','En reparación','En stock','Dado de baja','Prestado','Extraviado')),
  notas               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at ON public.dispositivos_moviles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.dispositivos_moviles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ==========================================================================
-- 16. INTERFACES DE RED (polimórfica)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.interfaces_red (
  id                SERIAL PRIMARY KEY,
  id_computadora    INT REFERENCES public.computadoras(id) ON DELETE CASCADE,
  id_impresora      INT REFERENCES public.impresoras(id) ON DELETE CASCADE,
  id_infra          INT REFERENCES public.dispositivos_infraestructura(id) ON DELETE CASCADE,
  tipo              VARCHAR(20) NOT NULL DEFAULT 'Ethernet'
                    CHECK (tipo IN ('Ethernet','WiFi','Fibra')),
  mac               VARCHAR(17),
  ip                VARCHAR(45),
  mascara           VARCHAR(45),
  gateway           VARCHAR(45),
  dns               VARCHAR(200),
  vlan              VARCHAR(50),
  notas             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  -- Exactamente un FK debe ser NOT NULL
  CONSTRAINT chk_interfaz_unica CHECK (
    num_nonnulls(id_computadora, id_impresora, id_infra) = 1
  )
);

-- ==========================================================================
-- 17. LICENCIAS
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.licencias (
  id                  SERIAL PRIMARY KEY,
  nombre_software     VARCHAR(300) NOT NULL,
  version             VARCHAR(50),
  tipo_licencia       VARCHAR(30) NOT NULL DEFAULT 'Perpetua'
                      CHECK (tipo_licencia IN ('Perpetua','Suscripción mensual','Suscripción anual','OEM','Volumen','Freeware','Open Source')),
  clave_licencia      VARCHAR(500),
  cantidad_puestos    INT,
  puestos_usados      INT NOT NULL DEFAULT 0,
  id_proveedor        INT REFERENCES public.proveedores(id) ON DELETE SET NULL,
  fecha_compra        DATE,
  fecha_vencimiento   DATE,
  costo               NUMERIC(12,2),
  estado              VARCHAR(20) NOT NULL DEFAULT 'Vigente'
                      CHECK (estado IN ('Vigente','Por vencer','Vencida','Cancelada')),
  notas               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at ON public.licencias;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.licencias
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ==========================================================================
-- 18. LICENCIAS_USUARIOS (asignaciones)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.licencias_usuarios (
  id                SERIAL PRIMARY KEY,
  id_licencia       INT NOT NULL REFERENCES public.licencias(id) ON DELETE CASCADE,
  id_usuario        UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  fecha_asignacion  TIMESTAMPTZ DEFAULT NOW(),
  notas             TEXT,
  UNIQUE(id_licencia, id_usuario)
);

-- Trigger: actualizar puestos_usados al asignar/liberar
CREATE OR REPLACE FUNCTION public.trigger_licencia_puestos()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.licencias SET puestos_usados = puestos_usados + 1 WHERE id = NEW.id_licencia;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.licencias SET puestos_usados = puestos_usados - 1 WHERE id = OLD.id_licencia;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_licencia_puestos ON public.licencias_usuarios;
CREATE TRIGGER trg_licencia_puestos
  AFTER INSERT OR DELETE ON public.licencias_usuarios
  FOR EACH ROW EXECUTE FUNCTION public.trigger_licencia_puestos();

-- ==========================================================================
-- 19. HISTORIAL DE ASIGNACIONES
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.historial_asignaciones (
  id              SERIAL PRIMARY KEY,
  tipo_activo     VARCHAR(30) NOT NULL
                  CHECK (tipo_activo IN ('computadora','periferico','movil')),
  id_activo       INT NOT NULL,
  id_puesto       INT REFERENCES public.puestos_trabajo(id) ON DELETE SET NULL,
  id_usuario      UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  accion          VARCHAR(30) NOT NULL
                  CHECK (accion IN ('Asignación','Desasignación','Transferencia','Baja')),
  detalle         TEXT,
  realizado_por   VARCHAR(200),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================================
-- 20. TAREAS DE SOPORTE
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.tareas_soporte (
  id                  SERIAL PRIMARY KEY,
  titulo              VARCHAR(500) NOT NULL,
  descripcion         TEXT,
  prioridad           VARCHAR(10) NOT NULL DEFAULT 'Media'
                      CHECK (prioridad IN ('Baja','Media','Alta','Urgente')),
  estado              VARCHAR(20) NOT NULL DEFAULT 'Abierta'
                      CHECK (estado IN ('Abierta','En progreso','En espera','Resuelta','Cancelada')),
  id_solicitante      UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  id_tecnico          UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  id_puesto           INT REFERENCES public.puestos_trabajo(id) ON DELETE SET NULL,
  tipo_activo         VARCHAR(30),
  id_activo           INT,
  fecha_resolucion    TIMESTAMPTZ,
  notas_resolucion    TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
DROP TRIGGER IF EXISTS set_updated_at ON public.tareas_soporte;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.tareas_soporte
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ==========================================================================
-- 21. LOGS DE AUDITORÍA
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
  id                SERIAL PRIMARY KEY,
  tabla             VARCHAR(100) NOT NULL,
  id_registro       INT NOT NULL,
  accion            VARCHAR(10) NOT NULL CHECK (accion IN ('INSERT','UPDATE','DELETE')),
  datos_anteriores  JSONB,
  datos_nuevos      JSONB,
  usuario_id        UUID,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================================
-- 22. ÍNDICES ÚTILES
-- ==========================================================================
CREATE INDEX IF NOT EXISTS idx_computadoras_estado ON public.computadoras(estado);
CREATE INDEX IF NOT EXISTS idx_computadoras_puesto ON public.computadoras(id_puesto);
CREATE INDEX IF NOT EXISTS idx_componentes_computadora ON public.componentes_pc(id_computadora);
CREATE INDEX IF NOT EXISTS idx_impresoras_estado ON public.impresoras(estado);
CREATE INDEX IF NOT EXISTS idx_insumos_stock ON public.insumos_impresora(stock_actual);
CREATE INDEX IF NOT EXISTS idx_consumos_insumo ON public.consumos_insumo(id_insumo);
CREATE INDEX IF NOT EXISTS idx_infra_categoria ON public.dispositivos_infraestructura(categoria);
CREATE INDEX IF NOT EXISTS idx_perifericos_puesto ON public.perifericos(id_puesto);
CREATE INDEX IF NOT EXISTS idx_moviles_usuario ON public.dispositivos_moviles(usuario_asignado);
CREATE INDEX IF NOT EXISTS idx_licencias_estado ON public.licencias(estado);
CREATE INDEX IF NOT EXISTS idx_historial_activo ON public.historial_asignaciones(tipo_activo, id_activo);
CREATE INDEX IF NOT EXISTS idx_soporte_estado ON public.tareas_soporte(estado);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabla ON public.logs_auditoria(tabla, id_registro);

-- Notificar recarga de caché de PostgREST
NOTIFY pgrst, 'reload schema';

