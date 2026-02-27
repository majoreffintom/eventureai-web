export const tableDefinitions = [
  // -----------------------
  // General Ledger core tables
  // -----------------------
  `CREATE TABLE IF NOT EXISTS journal_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number bigserial UNIQUE,
    entry_date date NOT NULL,
    entry_type text NOT NULL,
    source_type text,
    source_id uuid,
    description text,
    posted boolean NOT NULL DEFAULT false,
    posted_at timestamptz,
    created_by_employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
    is_deleted boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT je_entry_type_chk CHECK (entry_type IN (
      'opening_balance',
      'invoice',
      'payment_allocation',
      'job_expense',
      'general_expense',
      'payroll',
      'ap_bill',
      'ap_payment',
      'manual'
    )),
    CONSTRAINT je_posted_chk CHECK (
      (posted = false AND posted_at IS NULL)
      OR
      (posted = true AND posted_at IS NOT NULL)
    ),
    CONSTRAINT je_deleted_at_chk CHECK (
      (is_deleted = false AND deleted_at IS NULL)
      OR
      (is_deleted = true AND deleted_at IS NOT NULL)
    )
  );`,
  "CREATE INDEX IF NOT EXISTS je_entry_date_idx ON journal_entries(entry_date);",
  "CREATE INDEX IF NOT EXISTS je_source_idx ON journal_entries(source_type, source_id);",
  "CREATE INDEX IF NOT EXISTS je_posted_idx ON journal_entries(posted) WHERE posted = true;",

  `CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id uuid NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id uuid NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    debit numeric(12,2) NOT NULL DEFAULT 0,
    credit numeric(12,2) NOT NULL DEFAULT 0,
    memo text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT jel_amount_chk CHECK (debit >= 0 AND credit >= 0),
    CONSTRAINT jel_not_both_chk CHECK (NOT (debit > 0 AND credit > 0)),
    CONSTRAINT jel_one_side_chk CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
  );`,
  "CREATE INDEX IF NOT EXISTS jel_je_idx ON journal_entry_lines(journal_entry_id);",
  "CREATE INDEX IF NOT EXISTS jel_account_idx ON journal_entry_lines(account_id);",

  // -----------------------
  // Service revenue mapping (invoice line items -> revenue accounts)
  // -----------------------
  `CREATE TABLE IF NOT EXISTS service_category_revenue_mapping (
    service_category text PRIMARY KEY,
    revenue_account_id uuid NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT scrm_category_chk CHECK (service_category IN ('repair','maintenance','installation','diagnostic','parts'))
  );`,

  // -----------------------
  // Bank reconciliation tables
  // -----------------------
  `CREATE TABLE IF NOT EXISTS bank_reconciliations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id uuid NOT NULL REFERENCES bank_accounts(id) ON DELETE RESTRICT,
    statement_date date NOT NULL,
    statement_ending_balance numeric(12,2) NOT NULL,
    status text NOT NULL DEFAULT 'in_progress',
    reconciled_by_employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
    reconciled_at timestamptz,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT bank_rec_status_chk CHECK (status IN ('in_progress','completed')),
    CONSTRAINT bank_rec_reconciled_chk CHECK (
      (status = 'in_progress' AND reconciled_at IS NULL)
      OR
      (status = 'completed' AND reconciled_at IS NOT NULL)
    )
  );`,
  "CREATE INDEX IF NOT EXISTS bank_reconciliations_bank_account_id_idx ON bank_reconciliations(bank_account_id);",

  `CREATE TABLE IF NOT EXISTS bank_reconciliation_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_reconciliation_id uuid NOT NULL REFERENCES bank_reconciliations(id) ON DELETE CASCADE,
    bank_transaction_id uuid REFERENCES bank_transactions(id) ON DELETE RESTRICT,
    journal_entry_id uuid REFERENCES journal_entries(id) ON DELETE RESTRICT,
    is_cleared boolean NOT NULL DEFAULT false,
    cleared_at timestamptz,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT bri_cleared_chk CHECK (
      (is_cleared = false AND cleared_at IS NULL)
      OR
      (is_cleared = true AND cleared_at IS NOT NULL)
    )
  );`,
  "CREATE INDEX IF NOT EXISTS bank_reconciliation_items_rec_id_idx ON bank_reconciliation_items(bank_reconciliation_id);",
  "CREATE INDEX IF NOT EXISTS bank_reconciliation_items_bank_tx_idx ON bank_reconciliation_items(bank_transaction_id);",
  "CREATE INDEX IF NOT EXISTS bank_reconciliation_items_je_idx ON bank_reconciliation_items(journal_entry_id);",

  // -----------------------
  // Opening balances -> link to GL
  // -----------------------
  "ALTER TABLE opening_balance_batches ADD COLUMN IF NOT EXISTS journal_entry_id uuid REFERENCES journal_entries(id) ON DELETE SET NULL;",
  "CREATE INDEX IF NOT EXISTS opening_balance_batches_je_idx ON opening_balance_batches(journal_entry_id);",
];
