-- ============================================================================
-- INVENTARIO CPC v2.0 — LIMPIEZA DE V1 Y RECONSTRUCCIÓN DE AUTH TRIGGER
-- Ejecutar este script en el SQL Editor de Supabase
-- ============================================================================

-- 1. ELIMINAR CUALQUIER TRIGGER Y FUNCIÓN VIEJA DE AUTENTICACIÓN
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- 2. ELIMINAR TRÍGGERS Y VISTAS DE LA V1 (Para asegurar que no haya referencias rotas)
DROP VIEW IF EXISTS public.v_alertas_stock_bajo CASCADE;
DROP VIEW IF EXISTS public.v_activos_asignados_actual CASCADE;
DROP VIEW IF EXISTS public.v_resumen_puestos CASCADE;
DROP VIEW IF EXISTS public.v_inventario_general CASCADE;

-- 3. ELIMINAR TABLAS DE LA V1 QUE PUEDAN HACER REFERENCIA A usuarios_sistema U OTROS
DROP TABLE IF EXISTS public.movimientos_stock CASCADE;
DROP TABLE IF EXISTS public.solicitudes_compra CASCADE;
DROP TABLE IF EXISTS public.recepciones_compra CASCADE;
DROP TABLE IF EXISTS public.ordenes_compra CASCADE;
DROP TABLE IF EXISTS public.asignaciones_activos CASCADE;
DROP TABLE IF EXISTS public.ticket_comentarios CASCADE;
DROP TABLE IF EXISTS public.tickets_soporte CASCADE;
DROP TABLE IF EXISTS public.licencias_usuarios CASCADE;
DROP TABLE IF EXISTS public.licencias CASCADE;
DROP TABLE IF EXISTS public.items_stock CASCADE;
DROP TABLE IF EXISTS public.categorias_stock CASCADE;
DROP TABLE IF EXISTS public.componentes_pc_instalados CASCADE;
DROP TABLE IF EXISTS public.componentes_pc CASCADE;
DROP TABLE IF EXISTS public.activos_impresoras CASCADE;
DROP TABLE IF EXISTS public.activos_pc CASCADE;
DROP TABLE IF EXISTS public.activos CASCADE;
DROP TABLE IF EXISTS public.tipos_activo CASCADE;
DROP TABLE IF EXISTS public.puestos CASCADE;
DROP TABLE IF EXISTS public.personas CASCADE;
DROP TABLE IF EXISTS public.ubicaciones_fisicas CASCADE;
DROP TABLE IF EXISTS public.sedes CASCADE;
DROP TABLE IF EXISTS public.usuarios_sistema CASCADE;

-- 4. CREAR LA FUNCIÓN DEL NUEVO TRIGGER APUNTANDO A public.usuarios (EAM v2.0)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre, apellido, rol, activo)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', 'Usuario'),
    coalesce(new.raw_user_meta_data->>'apellido', 'Nuevo'),
    'Consulta', -- rol por defecto
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. CREAR EL TRIGGER EN LA TABLA auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RECARGAR EL CACHÉ DE POSTGREST
NOTIFY pgrst, 'reload schema';
