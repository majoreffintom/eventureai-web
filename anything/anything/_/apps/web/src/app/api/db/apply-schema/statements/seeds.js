export const seedStatements = [
  // ---- Starter Chart of Accounts (editable; inserted only if missing) ----
  `INSERT INTO chart_of_accounts (account_number, account_name, account_type, account_subtype, normal_balance, sort_order, is_system)
   VALUES
    ('1000', 'Cash - Operating', 'asset', 'cash', 'debit', 10, false),
    ('1010', 'Cash - Savings', 'asset', 'cash', 'debit', 11, false),
    ('1100', 'Accounts Receivable', 'asset', 'accounts_receivable', 'debit', 20, false),
    ('1200', 'Inventory / Parts', 'asset', 'inventory', 'debit', 30, false),

    ('2000', 'Accounts Payable', 'liability', 'accounts_payable', 'credit', 100, false),
    ('2100', 'Credit Card Payable', 'liability', 'credit_card', 'credit', 110, false),
    ('2200', 'Payroll Payable', 'liability', 'payroll', 'credit', 120, false),
    ('2300', 'Sales Tax Payable', 'liability', 'sales_tax', 'credit', 130, false),

    ('3000', 'Owner''s Equity', 'equity', 'owners_equity', 'credit', 200, false),
    ('3100', 'Owner''s Draw', 'equity', 'owners_draw', 'debit', 210, false),

    ('4000', 'Service Revenue', 'revenue', 'service', 'credit', 300, false),
    ('4100', 'Maintenance Revenue', 'revenue', 'maintenance', 'credit', 310, false),
    ('4200', 'Installation Revenue', 'revenue', 'installation', 'credit', 320, false),

    ('5000', 'COGS - Materials', 'expense', 'cogs_materials', 'debit', 400, false),
    ('5010', 'COGS - Subcontractors', 'expense', 'cogs_subcontractors', 'debit', 410, false),
    ('5020', 'COGS - Permits/Fees', 'expense', 'cogs_permits', 'debit', 420, false),
    ('5030', 'COGS - Disposal', 'expense', 'cogs_disposal', 'debit', 430, false),
    ('5100', 'Payroll Expense', 'expense', 'payroll', 'debit', 450, false),

    ('6100', 'Fuel', 'expense', 'fuel', 'debit', 500, false),
    ('6200', 'Vehicle Expense', 'expense', 'vehicle', 'debit', 510, false),
    ('6300', 'Tools & Equipment', 'expense', 'tools', 'debit', 520, false),
    ('6400', 'Insurance', 'expense', 'insurance', 'debit', 530, false),
    ('6500', 'Rent', 'expense', 'rent', 'debit', 540, false),
    ('6600', 'Utilities', 'expense', 'utilities', 'debit', 550, false),
    ('6700', 'Marketing', 'expense', 'marketing', 'debit', 560, false),
    ('6800', 'Office Supplies', 'expense', 'office_supplies', 'debit', 570, false),
    ('6900', 'Software & Subscriptions', 'expense', 'software', 'debit', 580, false),
    ('6950', 'Bank Fees', 'expense', 'bank_fees', 'debit', 590, false),
    ('7000', 'Other Expense', 'expense', 'other', 'debit', 600, false)
   ON CONFLICT (account_number) DO NOTHING;`,
];
