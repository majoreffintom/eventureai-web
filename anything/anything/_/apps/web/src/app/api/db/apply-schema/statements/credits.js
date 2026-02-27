export const creditsStatements = [
  `CREATE TABLE IF NOT EXISTS credit_memos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_memo_number bigserial UNIQUE,
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    invoice_id uuid REFERENCES invoices(id) ON DELETE RESTRICT,
    amount numeric(12,2) NOT NULL,
    credit_date date NOT NULL DEFAULT CURRENT_DATE,
    reason_type text NOT NULL DEFAULT 'refund',
    description text,
    status text NOT NULL DEFAULT 'issued',
    stripe_refund_id text,
    stripe_status text,
    created_by_employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
    is_deleted boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT credit_memos_amount_chk CHECK (amount > 0),
    CONSTRAINT credit_memos_reason_chk CHECK (reason_type IN ('refund','overpayment','adjustment','goodwill','other')),
    CONSTRAINT credit_memos_status_chk CHECK (status IN ('draft','issued','applied','voided')),
    CONSTRAINT credit_memos_stripe_status_chk CHECK (stripe_status IS NULL OR stripe_status IN ('pending','succeeded','failed')),
    CONSTRAINT credit_memos_deleted_at_chk CHECK ((is_deleted = false AND deleted_at IS NULL) OR (is_deleted = true AND deleted_at IS NOT NULL))
  );`,
  "CREATE UNIQUE INDEX IF NOT EXISTS credit_memos_stripe_refund_uq ON credit_memos(stripe_refund_id) WHERE stripe_refund_id IS NOT NULL;",

  // ---- Credit memo applications (allow credits to reduce invoice balance due) ----
  `CREATE TABLE IF NOT EXISTS credit_memo_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_memo_id uuid NOT NULL REFERENCES credit_memos(id) ON DELETE CASCADE,
    invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    amount numeric(12,2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT credit_memo_app_amount_chk CHECK (amount > 0),
    CONSTRAINT credit_memo_app_unique UNIQUE (credit_memo_id, invoice_id)
  );`,
  "CREATE INDEX IF NOT EXISTS credit_memo_applications_invoice_id_idx ON credit_memo_applications(invoice_id);",
  "CREATE INDEX IF NOT EXISTS credit_memo_applications_credit_memo_id_idx ON credit_memo_applications(credit_memo_id);",
];
