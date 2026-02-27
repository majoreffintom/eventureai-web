const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PHASE_1_SQL = `
-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Function to Automatically Update 'updated_at' Columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  domain text UNIQUE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  logo_url text,
  contact_email text,
  phone_number text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  google_maps_link text,
  hero_image_url text
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tenants_updated_at') THEN
    CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 4. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'customer',
  first_name text,
  last_name text,
  company_name text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_profiles_updated_at') THEN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 5. handle_new_user Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_user_tenant_id uuid;
BEGIN
    SELECT id INTO new_user_tenant_id FROM public.tenants WHERE slug = 'default_platform_tenant' LIMIT 1;
    IF new_user_tenant_id IS NOT NULL THEN
        INSERT INTO public.profiles (id, tenant_id, role)
        VALUES (NEW.id, new_user_tenant_id, 'customer');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Seed Default Tenant
INSERT INTO tenants (name, slug)
VALUES ('Default Platform Tenant', 'default_platform_tenant')
ON CONFLICT (slug) DO NOTHING;
`;

async function initDB() {
  console.log('Initializing Database (Phase 1)...');
  const { error } = await supabase.rpc('exec_sql', { sql: PHASE_1_SQL });
  
  if (error) {
    if (error.message.includes('function "exec_sql" does not exist')) {
        console.log('RPC "exec_sql" not found. Falling back to individual table creation if possible, or please run the SQL in Supabase Dashboard.');
        console.log('You should run the content of project_checklist/supabase_sql.txt in the Supabase SQL Editor.');
    } else {
        console.error('Error initializing DB:', error.message);
    }
  } else {
    console.log('Phase 1 initialization complete.');
  }
}

initDB();
