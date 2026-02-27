const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seed() {
  console.log('Seeding Organizations...');
  
  const { data: goldeyOrg, error: goldeyError } = await supabase
    .from('organizations')
    .upsert({ name: 'Goldey', slug: 'goldey' })
    .select()
    .single();
    
  if (goldeyError) console.error('Goldey Org Error:', goldeyError.message);
  else console.log('Goldey Org Created:', goldeyOrg.id);

  const { data: rosebudOrg, error: rosebudError } = await supabase
    .from('organizations')
    .upsert({ name: 'Rosebud', slug: 'rosebud' })
    .select()
    .single();

  if (rosebudError) console.error('Rosebud Org Error:', rosebudError.message);
  else console.log('Rosebud Org Created:', rosebudOrg.id);

  console.log('Creating Auth Users...');

  const usersToCreate = [
    { email: 'majoreffintom+goldey@gmail.com', password: 'TempPass123!$', orgId: goldeyOrg?.id, role: 'owner' },
    { email: 'majoreffintom+rosebud@gmail.com', password: 'TempPass123!$', orgId: rosebudOrg?.id, role: 'owner' }
  ];

  for (const u of usersToCreate) {
    if (!u.orgId) continue;
    
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true
    });

    if (userError) {
      if (userError.message.includes('already registered')) {
        console.log(`User ${u.email} already exists.`);
        // Try to get the user ID
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(eu => eu.email === u.email);
        if (existingUser) {
           await linkUser(existingUser.id, u.orgId, u.role, u.email);
        }
      } else {
        console.error(`Error creating user ${u.email}:`, userError.message);
      }
    } else {
      console.log(`User ${u.email} created:`, userData.user.id);
      await linkUser(userData.user.id, u.orgId, u.role, u.email);
    }
  }
}

async function linkUser(userId, orgId, role, email) {
    // Insert into profiles
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: userId, email: email, full_name: email.includes('goldey') ? 'Goldey' : 'Rosebud' });
    
    if (profileError) console.error('Profile Error:', profileError.message);
    else console.log(`Profile linked for ${email}`);

    // Insert into user_organizations
    const { error: memberError } = await supabase
        .from('user_organizations')
        .upsert({ user_id: userId, organization_id: orgId, role: role });
    
    if (memberError) console.error('Membership Error:', memberError.message);
    else console.log(`Membership assigned for ${email} in ${orgId}`);
}

seed();
