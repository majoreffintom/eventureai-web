export const seedData = [
  // Seed mapping (safe if COA rows don't exist yet; will insert nothing if SELECT returns NULL)
  `INSERT INTO service_category_revenue_mapping (service_category, revenue_account_id)
   SELECT 'repair', id FROM chart_of_accounts WHERE account_number = '4000'
   ON CONFLICT (service_category) DO NOTHING;`,
  `INSERT INTO service_category_revenue_mapping (service_category, revenue_account_id)
   SELECT 'maintenance', id FROM chart_of_accounts WHERE account_number = '4100'
   ON CONFLICT (service_category) DO NOTHING;`,
  `INSERT INTO service_category_revenue_mapping (service_category, revenue_account_id)
   SELECT 'installation', id FROM chart_of_accounts WHERE account_number = '4200'
   ON CONFLICT (service_category) DO NOTHING;`,
  `INSERT INTO service_category_revenue_mapping (service_category, revenue_account_id)
   SELECT 'diagnostic', id FROM chart_of_accounts WHERE account_number = '4000'
   ON CONFLICT (service_category) DO NOTHING;`,
  `INSERT INTO service_category_revenue_mapping (service_category, revenue_account_id)
   SELECT 'parts', id FROM chart_of_accounts WHERE account_number = '4000'
   ON CONFLICT (service_category) DO NOTHING;`,
];
