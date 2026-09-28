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

async function testProductLifecycle() {
  console.log('Testing Product Creation on live Supabase...');
  const testRef = `AUDIT-${Date.now()}`;
  const newProduct = {
    name_fr: 'Audit Test Amlou Argan',
    name_en: 'Audit Test Amlou Argan EN',
    description_fr: 'Produit de test créé par victory_auditor_2 pour valider R1.',
    description_en: 'Test product created by victory_auditor_2.',
    price_cents: 3450,
    category: 'sweet',
    stock: 25,
    reference_code: testRef,
    is_active: true
  };

  const { data: created, error: createErr } = await supabase
    .from('products')
    .insert([newProduct])
    .select()
    .single();

  if (createErr) {
    console.error('FAILED to create product:', createErr);
    process.exit(1);
  }

  console.log('Created product successfully, ID:', created.id, 'reference_code:', created.reference_code);

  // Verify fetch
  const { data: fetched, error: fetchErr } = await supabase
    .from('products')
    .select('*')
    .eq('id', created.id)
    .single();

  if (fetchErr || !fetched) {
    console.error('FAILED to fetch created product:', fetchErr);
    process.exit(1);
  }

  console.log('Verified product in Supabase database:', fetched.name_fr, 'Stock:', fetched.stock, 'Price Cents:', fetched.price_cents);

  // Verify stock update
  const { data: updated, error: updateErr } = await supabase
    .from('products')
    .update({ stock: 35 })
    .eq('id', created.id)
    .select()
    .single();

  if (updateErr) {
    console.error('FAILED to update stock:', updateErr);
    process.exit(1);
  }

  console.log('Stock updated successfully to:', updated.stock);

  // Clean up
  const { error: delErr } = await supabase
    .from('products')
    .delete()
    .eq('id', created.id);

  if (delErr) {
    console.error('FAILED to clean up product:', delErr);
  } else {
    console.log('Cleaned up test product cleanly.');
  }

  console.log('PRODUCT LIFECYCLE TEST ON LIVE SUPABASE: PASS');
}

testProductLifecycle().catch(err => {
  console.error(err);
  process.exit(1);
});
