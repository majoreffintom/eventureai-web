export const accountsPayableStatements = [
  `CREATE TABLE IF NOT EXISTS accounts_payable (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    bill_number text,
    bill_date date NOT NULL DEFAULT CURRENT_DATE,
    due_date date,
    amount numeric(12,2) NOT NULL,
    account_id uuid REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    workflow_status text NOT NULL DEFAULT 'open',
    payment_status text NOT NULL DEFAULT 'unpaid',
    description text,
    is_deleted boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ap_amount_chk CHECK (amount > 0),
    CONSTRAINT ap_workflow_status_chk CHECK (workflow_status IN ('open','void','deleted')),
    CONSTRAINT ap_payment_status_chk CHECK (payment_status IN ('unpaid','partial','paid')),
    CONSTRAINT ap_due_date_chk CHECK (due_date IS NULL OR due_date >= bill_date),
    CONSTRAINT ap_deleted_at_chk CHECK ((workflow_status <> 'deleted' AND is_deleted = false AND deleted_at IS NULL) OR (workflow_status = 'deleted' AND is_deleted = true AND deleted_at IS NOT NULL))
  );`,

  // Ensure account_id exists (older DBs)
  "ALTER TABLE accounts_payable ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES chart_of_accounts(id) ON DELETE RESTRICT;",

  // Ensure we always have a safe default expense account available for backfill
  `INSERT INTO chart_of_accounts (account_number, account_name, account_type, account_subtype, normal_balance, sort_order, is_system)
   VALUES ('7000', 'Other Expense', 'expense', 'other', 'debit', 600, false)
   ON CONFLICT (account_number) DO NOTHING;`,

  // Backfill existing rows (if any) so we can make the column required
  `UPDATE accounts_payable
   SET account_id = (
     SELECT id FROM chart_of_accounts
     WHERE account_number = '7000' AND is_deleted = false
     ORDER BY created_at ASC
     LIMIT 1
   )
   WHERE account_id IS NULL;`,

  // Enforce mandatory account_id going forward
  "ALTER TABLE accounts_payable ALTER COLUMN account_id SET NOT NULL;",

  `CREATE TABLE IF NOT EXISTS ap_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    accounts_payable_id uuid NOT NULL REFERENCES accounts_payable(id) ON DELETE RESTRICT,
    amount numeric(12,2) NOT NULL,
    payment_date date NOT NULL DEFAULT CURRENT_DATE,
    payment_method text NOT NULL DEFAULT 'ach',
    check_number text,
    bank_transaction_id uuid REFERENCES bank_transactions(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT ap_payments_amount_chk CHECK (amount > 0),
    CONSTRAINT ap_payments_method_chk CHECK (payment_method IN ('check','ach','credit_card','cash')),
    CONSTRAINT ap_payments_check_chk CHECK ((payment_method <> 'check') OR (check_number IS NOT NULL))
  );`,
  "CREATE INDEX IF NOT EXISTS ap_payments_ap_id_idx ON ap_payments(accounts_payable_id);",
];
