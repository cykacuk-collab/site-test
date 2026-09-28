import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.trim().match(/^([\w_]+)=["']?(.*?)["']?$/);
  if (m) env[m[1]] = m[2];
}

const supabaseUrl = env.SUPABASE_URL;
const anonKey = env.SUPABASE_KEY;
const serviceKey = env.NUXT_SUPABASE_SECRET_KEY;

console.log('Testing Product Insertion on Live Supabase...');

async function testInsert() {
  // Test with service role key
  const serviceClient = createClient(supabaseUrl, serviceKey);
  const testProduct = {
    name_fr: 'Test Produit Audit',
    name_en: 'Test Product Audit',
    category: 'sweet',
    price_cents: 999,
    stock: 50,
    is_active: true
  };

  const { data: created, error: createErr } = await serviceClient
    .from('products')
    .insert(testProduct)
    .select()
    .single();

  console.log('Service role insert product result:', { id: created?.id, error: createErr });

  if (created?.id) {
    // Clean up
    const { error: delErr } = await serviceClient
      .from('products')
      .delete()
      .eq('id', created.id);
    console.log('Product cleanup result:', { error: delErr });
  }

  // Also test with anon key (client-side)
  const anonClient = createClient(supabaseUrl, anonKey);
  const { data: anonCreated, error: anonErr } = await anonClient
    .from('products')
    .insert({
      name_fr: 'Anon Test Product',
      name_en: 'Anon Test Product',
      category: 'savory',
      price_cents: 500,
      stock: 10
    })
    .select()
    .single();

  console.log('Anon client insert product result:', { id: anonCreated?.id, error: anonErr });
  if (anonCreated?.id) {
    await serviceClient.from('products').delete().eq('id', anonCreated.id);
  }
}

testInsert().catch(console.error);
