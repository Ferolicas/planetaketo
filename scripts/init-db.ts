import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function initDatabase() {
  console.log('🔄 Inicializando base de datos...');

  try {
    // Test connection
    const { data, error } = await supabase.from('_prisma_migrations').select('*').limit(1);

    if (error && error.code === '42P01') {
      console.log('✅ Conexión exitosa a Supabase');
      console.log('📝 Ahora ejecuta las migraciones SQL manualmente en el SQL Editor de Supabase');
      console.log('👉 Ve a: https://supabase.com/dashboard/project/ibyeukzocqygimmwibxe/sql/new');
    } else if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Base de datos ya inicializada');
    }
  } catch (err) {
    console.error('❌ Error de conexión:', err);
  }
}

initDatabase();
