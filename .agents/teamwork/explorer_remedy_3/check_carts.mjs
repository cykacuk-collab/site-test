import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.trim().match(/^([\w_]+)=["']?(.*?)["']?$/);
  if (m) env[m[1]] = m[2];
}

const supabase = createClient(env.SUPABASE_URL, env.NUXT_SUPABASE_SECRET_KEY);

async function checkCompletedCarts() {
  const { data, error } = await supabase.from('completed_carts').select('*').limit(5);
  console.log('completed_carts:', { count: data?.length, data, error });
}

checkCompletedCarts().catch(console.error);
