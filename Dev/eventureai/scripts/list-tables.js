const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllTables() {
  const { data, error } = await supabase.rpc('get_tables'); // Some projects have this
  if (error) {
    // Fallback: try querying information_schema if allowed, though Supabase client usually can't
    console.log('Searching for any accessible tables...');
    const tables = ['organizations', 'tenants', 'profiles', 'users', 'project_members', 'projects'];
    for (const table of tables) {
        const { data: rows, error: tableError } = await supabase.from(table).select('*').limit(1);
        if (!tableError) {
            console.log(`Table "${table}" exists and is accessible.`);
            const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
            console.log(`Table "${table}" has ${count} rows.`);
        } else {
            console.log(`Table "${table}" error: ${tableError.message}`);
        }
    }
  } else {
    console.log('Tables:', data);
  }
}

listAllTables();
