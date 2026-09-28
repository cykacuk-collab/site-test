import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.trim().match(/^([\w_]+)=["']?(.*?)["']?$/);
  if (m) env[m[1]] = m[2];
}

const supabase = createClient(env.SUPABASE_URL, env.NUXT_SUPABASE_SECRET_KEY);

async function probeFunctions() {
  const funcs = ['exec_sql', 'exec', 'execute_sql', 'query', 'run_sql', 'sql', 'execute', 'admin_exec'];
  for (const fn of funcs) {
    const { data, error } = await supabase.rpc(fn, { query: 'SELECT 1;' });
    console.log(`RPC ${fn}:`, error ? `${error.code} - ${error.message}` : 'FOUND!');
  }
}

probeFunctions().catch(console.error);
