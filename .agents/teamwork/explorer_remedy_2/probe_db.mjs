import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.trim().match(/^([\w_]+)=["']?(.*?)["']?$/);
  if (m) env[m[1]] = m[2];
}

const supabaseUrl = env.SUPABASE_URL;
const serviceKey = env.NUXT_SUPABASE_SECRET_KEY;
const anonKey = env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function inspect() {
  console.log('--- 1. Fetching PostgREST Schema ---');
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    const schema = await res.json();
    console.log('Swagger/OpenAPI title:', schema.info?.title);
    console.log('Definitions/Tables in schema:', Object.keys(schema.definitions || {}));
    console.log('Paths / RPC in schema:', Object.keys(schema.paths || {}));
  } catch (err) {
    console.error('Failed to fetch schema:', err.message);
  }

  console.log('\n--- 2. Testing Tables with Service Role ---');
  const tables = ['products', 'orders', 'order_items', 'webhook_events', 'completed_carts'];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    console.log(`Table ${t}:`, error ? `ERROR: ${error.code} - ${error.message} (${error.hint || ''})` : `OK (count: ${data?.length})`);
  }

  console.log('\n--- 3. Testing Known RPC Functions ---');
  const rpcs = [
    { name: 'is_admin', args: {} },
    { name: 'increment_stock', args: { p_id: '00000000-0000-0000-0000-000000000000', p_amount: 1 } },
    { name: 'process_cart_lock', args: { cart_items: [] } },
    { name: 'release_cart_lock', args: { cart_items: [] } },
    { name: 'process_order_transaction', args: {
        p_session_id: 'test', p_email: 'test@example.com', p_name: 'test', p_amount: 100,
        p_cart_id: '00000000-0000-0000-0000-000000000000', p_items: [], p_stripe_event_id: 'evt_test'
      }
    }
  ];

  for (const r of rpcs) {
    const { data, error } = await supabase.rpc(r.name, r.args);
    console.log(`RPC ${r.name}:`, error ? `ERROR: ${error.code} - ${error.message}` : `OK: ${JSON.stringify(data)}`);
  }
}

inspect().catch(console.error);
