export const bankingStatements = [
  `CREATE TABLE IF NOT EXISTS bank_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    account_type text NOT NULL,
    chart_account_id uuid REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    last4 text,
    opening_balance numeric(12,2) NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    is_deleted boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT bank_accounts_type_chk CHECK (account_type IN ('checking','savings','credit_card')),
    CONSTRAINT bank_accounts_deleted_at_chk CHECK ((is_deleted = false AND deleted_at IS NULL) OR (is_deleted = true AND deleted_at IS NOT NULL))
  );`,

  `CREATE TABLE IF NOT EXISTS bank_imports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id uuid NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    import_date date NOT NULL DEFAULT CURRENT_DATE,
    file_url text,
    statement_start date,
    statement_end date,
    total_transactions integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT bank_imports_stmt_chk CHECK (statement_end IS NULL OR statement_start IS NULL OR statement_end >= statement_start)
  );`,

  `CREATE TABLE IF NOT EXISTS bank_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id uuid NOT NULL REFERENCES bank_accounts(id) ON DELETE RESTRICT,
    bank_import_id uuid REFERENCES bank_imports(id) ON DELETE SET NULL,
    posted_date date NOT NULL,
    amount numeric(12,2) NOT NULL,
    fit_id text,
    description text,
    counterparty text,
    memo text,
    imported boolean NOT NULL DEFAULT false,
    is_deleted boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT bank_transactions_amount_chk CHECK (amount <> 0),
    CONSTRAINT bank_transactions_deleted_at_chk CHECK ((is_deleted = false AND deleted_at IS NULL) OR (is_deleted = true AND deleted_at IS NOT NULL))
  );`,
  "CREATE INDEX IF NOT EXISTS bank_transactions_bank_account_id_idx ON bank_transactions(bank_account_id);",
  "CREATE INDEX IF NOT EXISTS bank_transactions_bank_import_id_idx ON bank_transactions(bank_import_id);",
  // If bank provides FITID (OFX), treat it as unique per bank account for non-deleted rows
  "CREATE UNIQUE INDEX IF NOT EXISTS bank_transactions_fit_id_uq ON bank_transactions(bank_account_id, fit_id) WHERE fit_id IS NOT NULL AND is_deleted = false;",

  `CREATE TABLE IF NOT EXISTS bank_transaction_payment_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_transaction_id uuid NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,
    payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT bank_tx_payment_unique UNIQUE (bank_transaction_id, payment_id)
  );`,
  // A payment should only be linked to one bank transaction (but a bank transaction can link to many payments)
  "CREATE UNIQUE INDEX IF NOT EXISTS bank_tx_payment_payment_uq ON bank_transaction_payment_links(payment_id);",

  `CREATE TABLE IF NOT EXISTS bank_transaction_job_expense_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_transaction_id uuid NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,
    job_expense_id uuid NOT NULL REFERENCES job_expenses(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT bank_tx_job_expense_unique UNIQUE (bank_transaction_id, job_expense_id)
  );`,
  // An expense receipt should only be linked once (but a bank transaction can link to many expenses for splits)
  "CREATE UNIQUE INDEX IF NOT EXISTS bank_tx_job_expense_job_expense_uq ON bank_transaction_job_expense_links(job_expense_id);",

  `CREATE TABLE IF NOT EXISTS bank_transaction_general_expense_links (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_transaction_id uuid NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,
    general_expense_id uuid NOT NULL REFERENCES general_expenses(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT bank_tx_general_expense_unique UNIQUE (bank_transaction_id, general_expense_id)
  );`,
  // Same uniqueness rule as job expenses
  "CREATE UNIQUE INDEX IF NOT EXISTS bank_tx_general_expense_general_expense_uq ON bank_transaction_general_expense_links(general_expense_id);",
];
