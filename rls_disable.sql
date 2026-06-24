-- ============================================================================
-- INVENTARIO CPC v2.0 — DESACTIVACIÓN COMPLETA DE RLS
-- Ejecutar este script en el SQL Editor de Supabase si querés desactivar RLS
-- ============================================================================

ALTER TABLE public.ubicaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.marcas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.modelos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.puestos_trabajo DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.computadoras DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.componentes_pc DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.impresoras DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.insumos_impresora DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumos_insumo DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispositivos_infraestructura DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_red DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_energia DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_cctv DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.perifericos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispositivos_moviles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.interfaces_red DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.licencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.licencias_usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.historial_asignaciones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas_soporte DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_auditoria DISABLE ROW LEVEL SECURITY;

-- Notificar recarga de caché
NOTIFY pgrst, 'reload schema';
