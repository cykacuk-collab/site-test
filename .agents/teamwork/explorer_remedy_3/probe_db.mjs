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

const supabase = createClient(supabaseUrl, serviceKey);

async function probe() {
  console.log('=== PROBING TABLES ===');
  for (const table of ['products', 'orders', 'order_items', 'webhook_events', 'profiles']) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    console.log(`Table ${table}:`, error ? `ERROR: ${error.code} - ${error.message} (hint: ${error.hint})` : `OK (count: ${data?.length})`);
  }

  console.log('\n=== PROBING KNOWN RPCS ===');
  // Check process_order_transaction
  const { data: rpc1, error: rpc1Err } = await supabase.rpc('process_order_transaction', {
    p_session_id: 'test',
    p_email: 'test@example.com',
    p_name: 'test',
    p_amount: 100,
    p_cart_id: '00000000-0000-0000-0000-000000000000',
    p_items: [],
    p_stripe_event_id: 'test'
  });
  console.log('RPC process_order_transaction:', rpc1Err ? `ERROR: ${rpc1Err.code} - ${rpc1Err.message}` : 'SUCCESS');

  // Check if there is an update_order_status RPC or similar
  const { data: rpc2, error: rpc2Err } = await supabase.rpc('update_order_status', {
    p_order_id: '00000000-0000-0000-0000-000000000000',
    p_status: 'paid'
  });
  console.log('RPC update_order_status:', rpc2Err ? `ERROR: ${rpc2Err.code} - ${rpc2Err.message}` : 'SUCCESS');

  // Check is_admin
  const { data: rpc3, error: rpc3Err } = await supabase.rpc('is_admin');
  console.log('RPC is_admin:', rpc3Err ? `ERROR: ${rpc3Err.code} - ${rpc3Err.message}` : `SUCCESS: ${rpc3}`);
}

probe().catch(console.error);
