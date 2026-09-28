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

async function inspectProducts() {
  const { data, error } = await supabase.from('products').select('*').limit(2);
  console.log('Error:', error);
  if (data && data.length > 0) {
    console.log('Product keys:', Object.keys(data[0]));
    console.log('Sample product:', data[0]);
  }
}

inspectProducts().catch(console.error);
