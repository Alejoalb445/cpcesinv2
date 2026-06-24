import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fesxxehjvkysqcjolmtp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ePYYHkoaWusZCcqat5xlNQ_Smd2Ebrh';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const tables = [
    'ubicaciones',
    'sectores',
    'marcas',
    'modelos',
    'proveedores',
    'usuarios',
    'puestos_trabajo',
    'computadoras',
    'componentes_pc',
    'impresoras',
    'insumos_impresora',
    'consumos_insumo',
    'dispositivos_infraestructura',
    'detalle_red',
    'detalle_energia',
    'detalle_cctv',
    'perifericos',
    'dispositivos_moviles',
    'interfaces_red',
    'licencias',
    'licencias_usuarios',
    'historial_asignaciones',
    'tareas_soporte'
  ];
  
  console.log('--- TESTING TABLE EXISTENCE (EAM v2.0) ---');
  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t).select('*').limit(1);
      if (error) {
        console.log(`Table ${t}: Error ${error.code} - ${error.message}`);
      } else {
        console.log(`Table ${t}: EXISTS (rows queried: ${data.length})`);
      }
    } catch (err) {
      console.log(`Table ${t}: Exception ${err.message}`);
    }
  }
}

run();
