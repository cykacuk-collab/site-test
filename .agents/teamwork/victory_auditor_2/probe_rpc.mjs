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
  console.log('Testing RPC calls with service role...');
  const tests = ['exec_sql', 'execute_sql', 'sql', 'query', 'admin_update_order_status'];
  for (const fn of tests) {
    try {
      const { data, error } = await supabase.rpc(fn, { sql: 'SELECT 1;', query: 'SELECT 1;' });
      console.log(`RPC ${fn}:`, { data, error: error?.message || error?.code });
    } catch (e) {
      console.log(`RPC ${fn} exception:`, e.message);
    }
  }
}

testRpc().catch(console.error);
