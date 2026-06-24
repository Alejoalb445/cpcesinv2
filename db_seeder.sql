-- ============================================================================
-- INVENTARIO CPC v2.0 - Script de Carga de Datos de Prueba (Seeder EAM v2.0)
-- Ejecutar en el SQL Editor de tu proyecto Supabase.
-- ============================================================================

-- ==========================================================================
-- 0. USUARIOS DE AUTENTICACIÓN (auth.users)
-- ==========================================================================
-- Insertar usuario admin@cpc.com si no existe
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token
)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin@cpc.com',
  '$2a$10$xW7kH/J9N/L6z4xHwGZ1K.Ue1Nl.wZ/pY7w8kS4z6WpBq9R2q3XqS',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nombre":"Admin","apellido":"Sistema"}'::jsonb,
  now(), now(), 'authenticated', 'authenticated', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE LOWER(TRIM(email)) = 'admin@cpc.com');

-- Insertar usuario tecnico@cpc.com si no existe
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token
)
SELECT 
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'tecnico@cpc.com',
  '$2a$10$xW7kH/J9N/L6z4xHwGZ1K.Ue1Nl.wZ/pY7w8kS4z6WpBq9R2q3XqS',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nombre":"Tecnico","apellido":"Mesa de Ayuda"}'::jsonb,
  now(), now(), 'authenticated', 'authenticated', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE LOWER(TRIM(email)) = 'tecnico@cpc.com');

-- Insertar usuario esteban.quito@cpc.com si no existe
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token
)
SELECT 
  '00000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'esteban.quito@cpc.com',
  '$2a$10$xW7kH/J9N/L6z4xHwGZ1K.Ue1Nl.wZ/pY7w8kS4z6WpBq9R2q3XqS',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nombre":"Esteban","apellido":"Quito"}'::jsonb,
  now(), now(), 'authenticated', 'authenticated', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE LOWER(TRIM(email)) = 'esteban.quito@cpc.com');

-- Insertar usuario monica.galindo@cpc.com si no existe
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token
)
SELECT 
  '00000000-0000-0000-0000-000000000004'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'monica.galindo@cpc.com',
  '$2a$10$xW7kH/J9N/L6z4xHwGZ1K.Ue1Nl.wZ/pY7w8kS4z6WpBq9R2q3XqS',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nombre":"Mónica","apellido":"Galindo"}'::jsonb,
  now(), now(), 'authenticated', 'authenticated', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE LOWER(TRIM(email)) = 'monica.galindo@cpc.com');

-- Insertar usuario juan.perez@cpc.com si no existe
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token
)
SELECT 
  '00000000-0000-0000-0000-000000000005'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'juan.perez@cpc.com',
  '$2a$10$xW7kH/J9N/L6z4xHwGZ1K.Ue1Nl.wZ/pY7w8kS4z6WpBq9R2q3XqS',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nombre":"Juan","apellido":"Pérez"}'::jsonb,
  now(), now(), 'authenticated', 'authenticated', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE LOWER(TRIM(email)) = 'juan.perez@cpc.com');

-- Insertar usuario ana.garcia@cpc.com si no existe
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token
)
SELECT 
  '00000000-0000-0000-0000-000000000006'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'ana.garcia@cpc.com',
  '$2a$10$xW7kH/J9N/L6z4xHwGZ1K.Ue1Nl.wZ/pY7w8kS4z6WpBq9R2q3XqS',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nombre":"Ana","apellido":"García"}'::jsonb,
  now(), now(), 'authenticated', 'authenticated', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE LOWER(TRIM(email)) = 'ana.garcia@cpc.com');

-- Insertar usuario carlos.tevez@cpc.com si no existe
INSERT INTO auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud, confirmation_token
)
SELECT 
  '00000000-0000-0000-0000-000000000007'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'carlos.tevez@cpc.com',
  '$2a$10$xW7kH/J9N/L6z4xHwGZ1K.Ue1Nl.wZ/pY7w8kS4z6WpBq9R2q3XqS',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"nombre":"Carlos","apellido":"Tevez"}'::jsonb,
  now(), now(), 'authenticated', 'authenticated', ''
WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE LOWER(TRIM(email)) = 'carlos.tevez@cpc.com');


-- ==========================================================================
-- 1. SECTORES (Insertar solo si no existen por nombre)
-- ==========================================================================
INSERT INTO public.sectores (nombre, responsable, notas, activo)
SELECT val.nombre, val.responsable, val.notas, val.activo
FROM (VALUES
  ('Sistemas', 'Esteban Quito', 'Área de tecnología y soporte', true),
  ('Recursos Humanos', 'Ana García', 'Gestión de personal', true),
  ('Finanzas y Administración', 'Mónica Galindo', 'Contabilidad y compras', true),
  ('Operaciones y Logística', 'Juan Pérez', 'Expedición y control físico', true),
  ('Ventas', NULL, 'Comercialización y clientes', true)
) AS val(nombre, responsable, notas, activo)
WHERE NOT EXISTS (
  SELECT 1 FROM public.sectores s WHERE LOWER(TRIM(s.nombre)) = LOWER(TRIM(val.nombre))
);


-- ==========================================================================
-- 2. UBICACIONES (Insertar solo si no existen por nombre)
-- ==========================================================================
INSERT INTO public.ubicaciones (nombre, direccion, piso, notas, activo)
SELECT val.nombre, val.direccion, val.piso, val.notas, val.activo
FROM (VALUES
  ('Sede Central CPC - Sistemas y Soporte', 'Av. Corrientes 1234, CABA', 'Piso 3', 'Ala Oeste - Frente a ascensores', true),
  ('Sede Central CPC - Administración y Finanzas', 'Av. Corrientes 1234, CABA', 'Piso 1', 'Ala Este', true),
  ('Sede Central CPC - Data Center Principal', 'Av. Corrientes 1234, CABA', 'Subsuelo', 'Acceso con tarjeta magnética', true),
  ('Sucursal Sur - Depósito de Equipos', 'Av. Paso de la Patria 450, Neuquén', 'Planta Baja', 'Sector Stock IT', true),
  ('Planta Industrial - Oficinas Planta', 'Calle 10 Nro 890, Pilar', 'Piso 1', 'Junto a expedición', true)
) AS val(nombre, direccion, piso, notas, activo)
WHERE NOT EXISTS (
  SELECT 1 FROM public.ubicaciones u WHERE LOWER(TRIM(u.nombre)) = LOWER(TRIM(val.nombre))
);


-- ==========================================================================
-- 3. ACTUALIZAR ROLES Y SECTORES EN public.usuarios
-- ==========================================================================
-- Sincronizar nombres completos y sectores en base a la carga de auth
UPDATE public.usuarios 
SET nombre = 'Admin', apellido = 'Sistema', rol = 'Admin IT'
WHERE id = '00000000-0000-0000-0000-000000000001';

UPDATE public.usuarios 
SET nombre = 'Tecnico', apellido = 'Mesa de Ayuda', rol = 'Técnico',
    id_sector = (SELECT id FROM public.sectores WHERE nombre = 'Sistemas')
WHERE id = '00000000-0000-0000-0000-000000000002';

UPDATE public.usuarios 
SET nombre = 'Esteban', apellido = 'Quito', rol = 'Técnico',
    id_sector = (SELECT id FROM public.sectores WHERE nombre = 'Sistemas')
WHERE id = '00000000-0000-0000-0000-000000000003';

UPDATE public.usuarios 
SET nombre = 'Mónica', apellido = 'Galindo', rol = 'Consulta',
    id_sector = (SELECT id FROM public.sectores WHERE nombre = 'Finanzas y Administración')
WHERE id = '00000000-0000-0000-0000-000000000004';

UPDATE public.usuarios 
SET nombre = 'Juan', apellido = 'Pérez', rol = 'Consulta',
    id_sector = (SELECT id FROM public.sectores WHERE nombre = 'Operaciones y Logística')
WHERE id = '00000000-0000-0000-0000-000000000005';

UPDATE public.usuarios 
SET nombre = 'Ana', apellido = 'García', rol = 'Consulta',
    id_sector = (SELECT id FROM public.sectores WHERE nombre = 'Recursos Humanos')
WHERE id = '00000000-0000-0000-0000-000000000006';

UPDATE public.usuarios 
SET nombre = 'Carlos', apellido = 'Tevez', rol = 'Consulta',
    id_sector = (SELECT id FROM public.sectores WHERE nombre = 'Operaciones y Logística')
WHERE id = '00000000-0000-0000-0000-000000000007';


-- ==========================================================================
-- 4. MARCAS
-- ==========================================================================
INSERT INTO public.marcas (nombre)
SELECT val.nombre
FROM (VALUES
  ('Dell'), ('HP'), ('Lenovo'), ('Cisco'), ('Logitech'), 
  ('Intel'), ('Kingston'), ('Microsoft'), ('Brother'), ('Apple')
) AS val(nombre)
WHERE NOT EXISTS (
  SELECT 1 FROM public.marcas m WHERE m.nombre = val.nombre
);


-- ==========================================================================
-- 5. MODELOS
-- ==========================================================================
INSERT INTO public.modelos (id_marca, nombre, categoria)
SELECT m.id, val.nombre, val.categoria
FROM (VALUES
  ('Optiplex 7090 Micro', 'Dell', 'Computación'),
  ('ThinkPad E14 Gen 4', 'Lenovo', 'Computación'),
  ('ProBook 450 G9', 'HP', 'Computación'),
  ('Catalyst 2960-L 24 Ports', 'Cisco', 'Red'),
  ('LaserJet Pro M404dw', 'HP', 'Impresión'),
  ('HL-L2370DW', 'Brother', 'Impresión'),
  ('MX Master 3S', 'Logitech', 'Periférico'),
  ('K120 USB', 'Logitech', 'Periférico')
) AS val(nombre, marca_nombre, categoria)
JOIN public.marcas m ON LOWER(TRIM(m.nombre)) = LOWER(TRIM(val.marca_nombre))
WHERE NOT EXISTS (
  SELECT 1 FROM public.modelos mod WHERE mod.id_marca = m.id AND mod.nombre = val.nombre
);


-- ==========================================================================
-- 6. PROVEEDORES
-- ==========================================================================
INSERT INTO public.proveedores (razon_social, cuit, telefono, email, direccion, contacto_nombre, notas, activo)
SELECT val.razon_social, val.cuit, val.telefono, val.email, val.direccion, val.contacto_nombre, val.notes, val.activo
FROM (VALUES
  ('Sistemas Globales S.A.', '30-71234567-9', '+54 11 4800-1122', 'ventas@sistemasglobales.com', 'Av. Santa Fe 2345, CABA', 'Mariano López', 'Distribuidor Dell y Cisco', true),
  ('Insumos Express SRL', '30-54321098-7', '+54 11 4900-3344', 'contacto@insumosexpress.com.ar', 'Florida 520, CABA', 'Patricia Gómez', 'Proveedor de insumos de impresión', true),
  ('Licencias Software Argentina', '30-88887777-5', '+54 11 4555-9900', 'soporte@licenciassoftware.com', 'Av. del Libertador 4567, CABA', 'Alejandro Sanz', 'Microsoft y Adobe Partner', true)
) AS val(razon_social, cuit, telefono, email, direccion, contacto_nombre, notes, activo)
WHERE NOT EXISTS (SELECT 1 FROM public.proveedores WHERE razon_social = val.razon_social);


-- ==========================================================================
-- 7. PUESTOS DE TRABAJO
-- ==========================================================================
INSERT INTO public.puestos_trabajo (codigo, id_ubicacion, id_sector, descripcion, usuario_asignado, ip, modo_ip, boca_red, telefono_interno, notas, activo)
SELECT val.codigo, u.id, sec.id, val.descripcion, us.id, val.ip, val.modo_ip, val.boca_red, val.telefono_interno, val.notas, val.activo
FROM (VALUES
  ('PUESTO-SIS-01', 'Sede Central CPC - Sistemas y Soporte', 'Sistemas', 'Puesto Coordinador de Redes', 'esteban.quito@cpc.com', '192.168.10.21', 'Estática', 'B-301', '1024', 'Área técnica', true),
  ('PUESTO-SIS-02', 'Sede Central CPC - Sistemas y Soporte', 'Sistemas', 'Puesto Técnico Pasante', 'tecnico@cpc.com', '192.168.10.22', 'DHCP', 'B-302', '1025', 'Mesa de ayuda', true),
  ('PUESTO-ADM-01', 'Sede Central CPC - Administración y Finanzas', 'Finanzas y Administración', 'Puesto Gerencia de Finanzas', 'monica.galindo@cpc.com', '192.168.20.10', 'Estática', 'B-105', '1100', 'Puesto principal administrativo', true),
  ('PUESTO-RRHH-01', 'Sede Central CPC - Administración y Finanzas', 'Recursos Humanos', 'Puesto Analista Liquidaciones', 'ana.garcia@cpc.com', '192.168.20.45', 'DHCP', 'B-112', '1250', 'Oficina de personal', true)
) AS val(codigo, ubicacion_nombre, sector_nombre, descripcion, usuario_email, ip, modo_ip, boca_red, telefono_interno, notas, activo)
JOIN public.ubicaciones u ON LOWER(TRIM(u.nombre)) = LOWER(TRIM(val.ubicacion_nombre))
JOIN public.sectores sec ON LOWER(TRIM(sec.nombre)) = LOWER(TRIM(val.sector_nombre))
LEFT JOIN public.usuarios us ON LOWER(TRIM(us.email)) = LOWER(TRIM(val.usuario_email))
WHERE NOT EXISTS (
  SELECT 1 FROM public.puestos_trabajo pt WHERE pt.codigo = val.codigo
);


-- ==========================================================================
-- 8. COMPUTADORAS
-- ==========================================================================
INSERT INTO public.computadoras (tipo, hostname, id_marca, id_modelo, serial, codigo_inventario, procesador, ram_total_gb, disco_total_gb, sistema_operativo, id_puesto, id_proveedor, fecha_compra, garantia_hasta, estado, notas)
SELECT val.tipo, val.hostname, m.id, mod.id, val.serial, val.codigo_inventario, val.procesador, val.ram_total_gb, val.disco_total_gb, val.sistema_operativo, p.id, prov.id, val.fecha_compra::date, val.garantia_hasta::date, val.estado, val.notas
FROM (VALUES
  ('Desktop', 'CPC-SIS-01', 'Dell', 'Optiplex 7090 Micro', 'MX-0918-2810', 'PC-001', 'Intel Core i7 11700T', 16, 1024, 'Windows 11 Pro', 'PUESTO-SIS-01', 'Sistemas Globales S.A.', '2025-01-10', '2028-01-10', 'Activo', 'Mini PC desarrollador'),
  ('Notebook', 'CPC-ADM-LAP01', 'Lenovo', 'ThinkPad E14 Gen 4', 'LEN-PF20B1A', 'LAP-001', 'Intel Core i5 1235U', 8, 512, 'Windows 11 Pro', 'PUESTO-ADM-01', 'Sistemas Globales S.A.', '2025-03-15', '2026-03-15', 'Activo', 'Notebook gerencia')
) AS val(tipo, hostname, marca_nombre, modelo_nombre, serial, codigo_inventario, procesador, ram_total_gb, disco_total_gb, sistema_operativo, puesto_codigo, proveedor_nombre, fecha_compra, garantia_hasta, estado, notas)
JOIN public.marcas m ON LOWER(TRIM(m.nombre)) = LOWER(TRIM(val.marca_nombre))
JOIN public.modelos mod ON LOWER(TRIM(mod.nombre)) = LOWER(TRIM(val.modelo_nombre)) AND mod.id_marca = m.id
LEFT JOIN public.puestos_trabajo p ON LOWER(TRIM(p.codigo)) = LOWER(TRIM(val.puesto_codigo))
LEFT JOIN public.proveedores prov ON LOWER(TRIM(prov.razon_social)) = LOWER(TRIM(val.proveedor_nombre))
WHERE NOT EXISTS (
  SELECT 1 FROM public.computadoras c WHERE c.hostname = val.hostname
);


-- ==========================================================================
-- 9. COMPONENTES DE PC
-- ==========================================================================
INSERT INTO public.componentes_pc (id_computadora, tipo, id_marca, id_modelo, serial, capacidad, velocidad, detalle, estado, en_stock, notas)
SELECT c.id, val.tipo, m.id, NULL::integer, val.serial, val.capacidad, val.velocidad, val.detalle, val.estado, val.en_stock, val.notas
FROM (VALUES
  ('CPC-SIS-01', 'RAM', 'Kingston', 'RAM-S01', '16 GB', '3200 MHz', 'DDR4 Kingston Fury', 'Activo', false, 'Instalación de fábrica'),
  ('CPC-SIS-01', 'Disco', 'Kingston', 'SSD-S01', '1024 GB', '3500 MB/s', 'SSD NVMe M.2', 'Activo', false, 'Disco principal'),
  (NULL, 'RAM', 'Kingston', 'RAM-S02', '8 GB', '3200 MHz', 'DDR4 de repuesto', 'Activo', true, 'Stock IT'),
  (NULL, 'Disco', 'Kingston', 'SSD-S02', '480 GB', '500 MB/s', 'SATA SSD 2.5 repuesto', 'Activo', true, 'Stock IT')
) AS val(pc_hostname, tipo, marca_nombre, serial, capacidad, velocidad, detalle, estado, en_stock, notas)
LEFT JOIN public.computadoras c ON LOWER(TRIM(c.hostname)) = LOWER(TRIM(val.pc_hostname))
JOIN public.marcas m ON LOWER(TRIM(m.nombre)) = LOWER(TRIM(val.marca_nombre))
WHERE NOT EXISTS (
  SELECT 1 FROM public.componentes_pc comp WHERE comp.serial = val.serial
);


-- ==========================================================================
-- 10. IMPRESORAS
-- ==========================================================================
INSERT INTO public.impresoras (tipo, id_marca, id_modelo, serial, codigo_inventario, id_ubicacion, id_sector, ip, es_red, id_proveedor, fecha_compra, garantia_hasta, estado, notas)
SELECT val.tipo, m.id, mod.id, val.serial, val.codigo_inventario, u.id, sec.id, val.ip, val.es_red, prov.id, val.fecha_compra::date, val.garantia_hasta::date, val.estado, val.notas
FROM (VALUES
  ('Laser', 'HP', 'LaserJet Pro M404dw', 'HP-LJP404-9812', 'IMP-001', 'Sede Central CPC - Administración y Finanzas', 'Finanzas y Administración', '192.168.20.250', true, 'Insumos Express SRL', '2024-06-20', '2025-06-20', 'Activo', 'Impresora pasillo central'),
  ('Laser', 'Brother', 'HL-L2370DW', 'BRO-HLL2370-1122', 'IMP-002', 'Sede Central CPC - Sistemas y Soporte', 'Sistemas', NULL, false, 'Insumos Express SRL', '2025-02-15', '2026-02-15', 'Activo', 'Conectada USB local')
) AS val(tipo, model_name, marca_name, serial, codigo_inventario, ubicacion_name, sector_name, ip, es_red, provider_name, fecha_compra, garantia_hasta, estado, notas)
JOIN public.marcas m ON LOWER(TRIM(m.nombre)) = LOWER(TRIM(val.marca_name))
JOIN public.modelos mod ON LOWER(TRIM(mod.nombre)) = LOWER(TRIM(val.model_name)) AND mod.id_marca = m.id
LEFT JOIN public.ubicaciones u ON LOWER(TRIM(u.nombre)) = LOWER(TRIM(val.ubicacion_name))
LEFT JOIN public.sectores sec ON LOWER(TRIM(sec.nombre)) = LOWER(TRIM(val.sector_name))
LEFT JOIN public.proveedores prov ON LOWER(TRIM(prov.razon_social)) = LOWER(TRIM(val.provider_name))
WHERE NOT EXISTS (
  SELECT 1 FROM public.impresoras imp WHERE imp.serial = val.serial
);


-- ==========================================================================
-- 11. INSUMOS DE IMPRESORA
-- ==========================================================================
INSERT INTO public.insumos_impresora (nombre, tipo, codigo_oem, id_marca, compatible_con, stock_actual, stock_minimo, notas)
SELECT val.nombre, val.tipo, val.codigo_oem, m.id, val.compatible_con, val.stock_actual, val.stock_minimo, val.notas
FROM (VALUES
  ('Tóner HP 58A Negro', 'Tóner', 'CF258A', 'HP', 'LaserJet Pro M404 / M428', 12, 3, 'Tóner estándar de 3000 páginas'),
  ('Tóner Brother TN2410 Negro', 'Tóner', 'TN2410', 'Brother', 'HL-L2370DW / DCP-L2550DW', 2, 2, 'Tóner estándar de 1200 páginas'),
  ('Cartucho HP 667 XL Negro', 'Cartucho', '3YM79AL', 'HP', 'HP DeskJet 1275 / 2375', 5, 2, 'Cartucho de tinta XL negro')
) AS val(nombre, tipo, codigo_oem, marca_name, compatible_con, stock_actual, stock_minimo, notas)
JOIN public.marcas m ON LOWER(TRIM(m.nombre)) = LOWER(TRIM(val.marca_name))
WHERE NOT EXISTS (
  SELECT 1 FROM public.insumos_impresora ins WHERE ins.codigo_oem = val.codigo_oem
);


-- ==========================================================================
-- 12. INFRAESTRUCTURA DE RED Y DETALLES
-- ==========================================================================
INSERT INTO public.dispositivos_infraestructura (id, categoria, id_marca, id_modelo, serial, codigo_inventario, id_ubicacion, ip, id_proveedor, fecha_compra, garantia_hasta, estado, notas)
SELECT 100, 'Switch', m.id, mod.id, 'CIS-9812-3344', 'SW-001', u.id, '192.168.10.2', prov.id, '2024-03-10'::date, '2027-03-10'::date, 'Activo', 'Switch distribución planta'
FROM public.marcas m, public.modelos mod, public.ubicaciones u, public.proveedores prov
WHERE m.nombre = 'Cisco' AND mod.nombre = 'Catalyst 2960-L 24 Ports' 
  AND u.nombre = 'Sede Central CPC - Data Center Principal' 
  AND prov.razon_social = 'Sistemas Globales S.A.'
  AND NOT EXISTS (SELECT 1 FROM public.dispositivos_infraestructura WHERE id = 100);

INSERT INTO public.detalle_red (id_dispositivo, cantidad_puertos, puertos_poe, velocidad_gbps, gestionable, firmware)
SELECT 100, 24, 12, 1.0, true, 'Cisco IOS 15.2(7)'
WHERE NOT EXISTS (SELECT 1 FROM public.detalle_red WHERE id_dispositivo = 100);


-- ==========================================================================
-- 13. PERIFÉRICOS
-- ==========================================================================
INSERT INTO public.perifericos (categoria, id_marca, id_modelo, serial, codigo_inventario, id_puesto, estado, notas)
SELECT val.categoria, m.id, mod.id, val.serial, val.codigo_inventario, p.id, val.estado, val.notas
FROM (VALUES
  ('Mouse', 'Logitech', 'MX Master 3S', 'LOG-MX3S-8821', 'PER-001', 'PUESTO-SIS-01', 'Activo', 'Ergonómico inalámbrico'),
  ('Teclado', 'Logitech', 'K120 USB', 'LOG-K120-7744', 'PER-002', 'PUESTO-SIS-01', 'Activo', 'Teclado cableado estándar')
) AS val(categoria, marca_name, model_name, serial, codigo_inventario, puesto_codigo, estado, notas)
JOIN public.marcas m ON LOWER(TRIM(m.nombre)) = LOWER(TRIM(val.marca_name))
JOIN public.modelos mod ON LOWER(TRIM(mod.nombre)) = LOWER(TRIM(val.model_name)) AND mod.id_marca = m.id
LEFT JOIN public.puestos_trabajo p ON LOWER(TRIM(p.codigo)) = LOWER(TRIM(val.puesto_codigo))
WHERE NOT EXISTS (
  SELECT 1 FROM public.perifericos per WHERE per.serial = val.serial
);


-- ==========================================================================
-- 14. DISPOSITIVOS MÓVILES
-- ==========================================================================
INSERT INTO public.dispositivos_moviles (tipo, id_marca, id_modelo, serial, imei, numero_linea, codigo_inventario, usuario_asignado, id_sector, id_proveedor, fecha_compra, garantia_hasta, estado, notas)
SELECT val.tipo, m.id, NULL::integer, val.serial, val.imei, val.numero_linea, val.codigo_inventario, u.id, sec.id, prov.id, val.fecha_compra::date, val.garantia_hasta::date, val.estado, val.notas
FROM (VALUES
  ('Celular', 'Apple', 'SER-IPH-1313', '351234567890123', '+54 11 9988-7766', 'MOV-001', 'esteban.quito@cpc.com', 'Sistemas', 'Sistemas Globales S.A.', '2025-05-10', '2026-05-10', 'Activo', 'Celular corporativo')
) AS val(tipo, marca_name, serial, imei, numero_linea, codigo_inventario, usuario_email, sector_name, provider_name, fecha_compra, garantia_hasta, estado, notas)
JOIN public.marcas m ON LOWER(TRIM(m.nombre)) = LOWER(TRIM(val.marca_name))
LEFT JOIN public.usuarios u ON LOWER(TRIM(u.email)) = LOWER(TRIM(val.usuario_email))
LEFT JOIN public.sectores sec ON LOWER(TRIM(sec.nombre)) = LOWER(TRIM(val.sector_name))
LEFT JOIN public.proveedores prov ON LOWER(TRIM(prov.razon_social)) = LOWER(TRIM(val.provider_name))
WHERE NOT EXISTS (
  SELECT 1 FROM public.dispositivos_moviles dm WHERE dm.serial = val.serial
);


-- ==========================================================================
-- 15. LICENCIAS DE SOFTWARE
-- ==========================================================================
INSERT INTO public.licencias (nombre_software, version, tipo_licencia, clave_licencia, cantidad_puestos, id_proveedor, fecha_compra, costo, estado, notas)
SELECT val.nombre_software, val.version, val.tipo_licencia, val.clave_licencia, val.cantidad_puestos, prov.id, val.fecha_compra::date, val.costo, val.estado, val.notes
FROM (VALUES
  ('Windows 11 Pro OEM', '23H2', 'OEM', 'A1B2C-D3E4F-G5H6I-J7K8L-M9N0O', 50, 'Licencias Software Argentina', '2024-12-01', 120.00, 'Vigente', 'Licencias asignadas por placa base'),
  ('Office 2021 LTSC Standard', 'v16.0', 'Volumen', 'X9Y8Z-W7V6U-T5S4R-Q3P2O-N1M0L', 20, 'Licencias Software Argentina', '2024-12-15', 350.00, 'Vigente', 'MAK volume licensing')
) AS val(nombre_software, version, tipo_licencia, clave_licencia, cantidad_puestos, provider_name, fecha_compra, costo, estado, notes)
LEFT JOIN public.proveedores prov ON LOWER(TRIM(prov.razon_social)) = LOWER(TRIM(val.provider_name))
WHERE NOT EXISTS (
  SELECT 1 FROM public.licencias l WHERE l.nombre_software = val.nombre_software
);

-- Asignar una licencia a un usuario
INSERT INTO public.licencias_usuarios (id_licencia, id_usuario, notas)
SELECT l.id, u.id, 'Asignación automática sistemas'
FROM public.licencias l, public.usuarios u
WHERE l.nombre_software = 'Office 2021 LTSC Standard' AND u.email = 'esteban.quito@cpc.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.licencias_usuarios lu WHERE lu.id_licencia = l.id AND lu.id_usuario = u.id
  );


-- ==========================================================================
-- 16. TAREAS DE SOPORTE (Tickets)
-- ==========================================================================
INSERT INTO public.tareas_soporte (titulo, prioridad, estado, id_solicitante, id_tecnico, id_puesto, created_at)
SELECT val.titulo, val.prioridad, val.estado, us_sol.id, us_tec.id, p.id, val.fecha_creacion::timestamp
FROM (VALUES
  ('Falla de Red en Puesto de Liquidaciones', 'Alta', 'En progreso', 'ana.garcia@cpc.com', 'tecnico@cpc.com', 'PUESTO-RRHH-01', '2026-06-01 10:30:00'),
  ('Impresora sin tóner en Administración', 'Media', 'Abierta', 'monica.galindo@cpc.com', NULL, 'PUESTO-ADM-01', '2026-06-03 14:15:00')
) AS val(titulo, prioridad, estado, sol_email, tec_email, puesto_codigo, fecha_creacion)
LEFT JOIN public.usuarios us_sol ON LOWER(TRIM(us_sol.email)) = LOWER(TRIM(val.sol_email))
LEFT JOIN public.usuarios us_tec ON LOWER(TRIM(us_tec.email)) = LOWER(TRIM(val.tec_email))
LEFT JOIN public.puestos_trabajo p ON LOWER(TRIM(p.codigo)) = LOWER(TRIM(val.puesto_codigo))
WHERE NOT EXISTS (
  SELECT 1 FROM public.tareas_soporte ts WHERE ts.titulo = val.titulo AND ts.created_at = val.fecha_creacion::timestamp
);

-- Notificar recarga de caché de PostgREST
NOTIFY pgrst, 'reload schema';

