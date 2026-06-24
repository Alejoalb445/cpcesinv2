-- ============================================================================
-- INVENTARIO CPC v2.0 — CONFIGURACIÓN DE RLS Y POLÍTICAS DE ACCESO SEGURAS
-- Ejecutar este script en el SQL Editor de Supabase
-- ============================================================================

-- Habilitar RLS y crear políticas para permitir CRUD a usuarios autenticados

-- 1. UBICACIONES
ALTER TABLE public.ubicaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.ubicaciones;
CREATE POLICY "CRUD para autenticados" ON public.ubicaciones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. SECTORES
ALTER TABLE public.sectores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.sectores;
CREATE POLICY "CRUD para autenticados" ON public.sectores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. MARCAS
ALTER TABLE public.marcas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.marcas;
CREATE POLICY "CRUD para autenticados" ON public.marcas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. MODELOS
ALTER TABLE public.modelos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.modelos;
CREATE POLICY "CRUD para autenticados" ON public.modelos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. PROVEEDORES
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.proveedores;
CREATE POLICY "CRUD para autenticados" ON public.proveedores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. USUARIOS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.usuarios;
CREATE POLICY "CRUD para autenticados" ON public.usuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. PUESTOS DE TRABAJO
ALTER TABLE public.puestos_trabajo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.puestos_trabajo;
CREATE POLICY "CRUD para autenticados" ON public.puestos_trabajo FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. COMPUTADORAS
ALTER TABLE public.computadoras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.computadoras;
CREATE POLICY "CRUD para autenticados" ON public.computadoras FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. COMPONENTES PC
ALTER TABLE public.componentes_pc ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.componentes_pc;
CREATE POLICY "CRUD para autenticados" ON public.componentes_pc FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. IMPRESORAS
ALTER TABLE public.impresoras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.impresoras;
CREATE POLICY "CRUD para autenticados" ON public.impresoras FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 11. INSUMOS IMPRESORA
ALTER TABLE public.insumos_impresora ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.insumos_impresora;
CREATE POLICY "CRUD para autenticados" ON public.insumos_impresora FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 12. CONSUMOS INSUMO
ALTER TABLE public.consumos_insumo ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.consumos_insumo;
CREATE POLICY "CRUD para autenticados" ON public.consumos_insumo FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 13. DISPOSITIVOS INFRAESTRUCTURA
ALTER TABLE public.dispositivos_infraestructura ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.dispositivos_infraestructura;
CREATE POLICY "CRUD para autenticados" ON public.dispositivos_infraestructura FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 14. DETALLE RED
ALTER TABLE public.detalle_red ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.detalle_red;
CREATE POLICY "CRUD para autenticados" ON public.detalle_red FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 15. DETALLE ENERGÍA
ALTER TABLE public.detalle_energia ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.detalle_energia;
CREATE POLICY "CRUD para autenticados" ON public.detalle_energia FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 16. DETALLE CCTV
ALTER TABLE public.detalle_cctv ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.detalle_cctv;
CREATE POLICY "CRUD para autenticados" ON public.detalle_cctv FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 17. PERIFÉRICOS
ALTER TABLE public.perifericos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.perifericos;
CREATE POLICY "CRUD para autenticados" ON public.perifericos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 18. DISPOSITIVOS MÓVILES
ALTER TABLE public.dispositivos_moviles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.dispositivos_moviles;
CREATE POLICY "CRUD para autenticados" ON public.dispositivos_moviles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 19. INTERFACES RED
ALTER TABLE public.interfaces_red ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.interfaces_red;
CREATE POLICY "CRUD para autenticados" ON public.interfaces_red FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 20. LICENCIAS
ALTER TABLE public.licencias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.licencias;
CREATE POLICY "CRUD para autenticados" ON public.licencias FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 21. LICENCIAS USUARIOS
ALTER TABLE public.licencias_usuarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.licencias_usuarios;
CREATE POLICY "CRUD para autenticados" ON public.licencias_usuarios FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 22. HISTORIAL ASIGNACIONES
ALTER TABLE public.historial_asignaciones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.historial_asignaciones;
CREATE POLICY "CRUD para autenticados" ON public.historial_asignaciones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 23. TAREAS SOPORTE
ALTER TABLE public.tareas_soporte ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.tareas_soporte;
CREATE POLICY "CRUD para autenticados" ON public.tareas_soporte FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 24. LOGS AUDITORÍA
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CRUD para autenticados" ON public.logs_auditoria;
CREATE POLICY "CRUD para autenticados" ON public.logs_auditoria FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Notificar recarga de caché
NOTIFY pgrst, 'reload schema';
