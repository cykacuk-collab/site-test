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

console.log('Testing Supabase Service Role Connection...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, serviceKey);

async function run() {
  const { data: products, error: pErr } = await supabase.from('products').select('*').limit(3);
  console.log('Products query:', { count: products?.length, error: pErr });

  const { data: orders, error: oErr } = await supabase.from('orders').select('*').limit(3);
  console.log('Orders query:', { count: orders?.length, error: oErr });

  if (orders && orders.length > 0) {
    const testOrder = orders[0];
    console.log('Found order:', testOrder.id, 'status:', testOrder.status);
    const updateRes = await supabase
      .from('orders')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', testOrder.id)
      .select()
      .single();
    console.log('Order update test:', { data: updateRes.data?.id, error: updateRes.error });
  } else {
    console.log('No orders found in database to test update.');
  }
}

run().catch(console.error);
