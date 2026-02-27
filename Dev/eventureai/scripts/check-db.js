const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDB() {
  console.log('Checking database status...');

  // 1. Check Organizations
  const { data: orgs, error: orgsError } = await supabase.from('organizations').select('*');
  if (orgsError) {
    console.log('Organizations table check failed:', orgsError.message);
  } else {
    console.log(`Found ${orgs.length} organizations:`, orgs.map(o => ({ id: o.id, name: o.name, slug: o.slug })));
  }

  // 2. Check Tenants
  const { data: tenants, error: tenantsError } = await supabase.from('tenants').select('*');
  if (tenantsError) {
    console.log('Tenants table check failed:', tenantsError.message);
  } else {
    console.log(`Found ${tenants.length} tenants:`, tenants.map(t => ({ id: t.id, name: t.name, slug: t.slug })));
  }

  // 3. Check Profiles
  const { data: profiles, error: profilesError } = await supabase.from('profiles').select('*');
  if (profilesError) {
    console.log('Profiles table check failed:', profilesError.message);
  } else {
    console.log(`Found ${profiles.length} profiles:`, profiles.map(p => ({ id: p.id, email: p.email, role: p.role })));
  }
}

checkDB();
