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

async function testRpc() {
  const { data, error } = await supabase.rpc('admin_update_order_status', {
    p_order_id: 'c38a1fd0-60b2-4d22-901b-90f772eec9a1',
    p_status: 'paid'
  });
  console.log('RPC admin_update_order_status:', { data, error: error?.message || error?.code });
}

testRpc().catch(console.error);
