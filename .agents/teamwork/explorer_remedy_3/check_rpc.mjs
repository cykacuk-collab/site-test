import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.trim().match(/^([\w_]+)=["']?(.*?)["']?$/);
  if (m) env[m[1]] = m[2];
}

async function checkRpcDetails() {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/`, {
    headers: {
      apikey: env.NUXT_SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${env.NUXT_SUPABASE_SECRET_KEY}`
    }
  });

  const schema = await res.json();
  console.log('rls_auto_enable:', schema.paths['/rpc/rls_auto_enable']);
}

checkRpcDetails().catch(console.error);
