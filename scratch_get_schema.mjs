const SUPABASE_URL = 'https://fesxxehjvkysqcjolmtp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ePYYHkoaWusZCcqat5xlNQ_Smd2Ebrh';

async function run() {
  const url = `${SUPABASE_URL}/rest/v1/`;
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });

  if (!response.ok) {
    console.error('Failed to fetch schema:', response.status, response.statusText);
    return;
  }

  const schema = await response.json();
  console.log('--- EXPOSED TABLES & VIEWS ---');
  const paths = Object.keys(schema.paths || {});
  console.log('Endpoints:', paths);

  console.log('\n--- DEFINITIONS ---');
  const definitions = Object.keys(schema.definitions || {});
  console.log('Definitions:', definitions);

  for (const table of ['puestos_trabajo', 'puestos', 'computadoras', 'componentes_pc', 'perifericos', 'dispositivos_moviles']) {
    if (schema.definitions && schema.definitions[table]) {
      console.log(`\nColumns for ${table}:`, Object.keys(schema.definitions[table].properties || {}));
    }
  }
}

run();
