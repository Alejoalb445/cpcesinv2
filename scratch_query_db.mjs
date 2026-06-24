import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fesxxehjvkysqcjolmtp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ePYYHkoaWusZCcqat5xlNQ_Smd2Ebrh';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log('--- AUTHENTICATING ---');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@cpc.com',
    password: 'password123',
  });

  if (authError) {
    console.error('Auth Error:', authError.message);
    return;
  }

  console.log('Authenticated successfully! User ID:', authData.user.id);

  // Let's test querying the tables
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
    'perifericos',
    'dispositivos_moviles',
    'licencias',
    'tareas_soporte'
  ];

  console.log('--- QUERYING TABLES ---');
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table ${t}: Error ${error.code} - ${error.message}`);
    } else {
      console.log(`Table ${t}: SUCCESS! Row count returned: ${data.length}`);
      if (data.length > 0) {
        console.log(`Sample row for ${t}:`, Object.keys(data[0]));
      }
    }
  }
}

run();
