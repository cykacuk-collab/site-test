import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.trim().match(/^([\w_]+)=["']?(.*?)["']?$/);
  if (m) env[m[1]] = m[2];
}

async function inspectOpenAPI() {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/`, {
    headers: {
      apikey: env.NUXT_SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${env.NUXT_SUPABASE_SECRET_KEY}`
    }
  });

  const schema = await res.json();
  console.log('Definitions/Tables in OpenAPI:');
  console.log(Object.keys(schema.definitions || {}));
  console.log('\nPaths/RPCs in OpenAPI:');
  console.log(Object.keys(schema.paths || {}));
}

inspectOpenAPI().catch(console.error);
