export const paymentsStatements = [
  `CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    payment_method text NOT NULL,
    status text NOT NULL DEFAULT 'completed',
    amount numeric(12,2) NOT NULL,
    payment_date date NOT NULL DEFAULT CURRENT_DATE,
    stripe_payment_intent_id text,
    stripe_charge_id text,
    stripe_refund_id text,
    check_number text,
    collected_by_employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
    notes text,
    is_deleted boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT payments_method_chk CHECK (payment_method IN ('stripe_card','stripe_apple_pay','stripe_google_pay','cash','check')),
    CONSTRAINT payments_status_chk CHECK (status IN ('pending','completed','failed','refunded')),
    CONSTRAINT payments_amount_chk CHECK (amount > 0),
    CONSTRAINT payments_stripe_chk CHECK (
      (payment_method LIKE 'stripe_%' AND stripe_payment_intent_id IS NOT NULL)
      OR
      (payment_method NOT LIKE 'stripe_%')
    ),
    CONSTRAINT payments_check_chk CHECK ((payment_method <> 'check') OR (check_number IS NOT NULL)),
    CONSTRAINT payments_deleted_at_chk CHECK ((is_deleted = false AND deleted_at IS NULL) OR (is_deleted = true AND deleted_at IS NOT NULL))
  );`,
  "CREATE UNIQUE INDEX IF NOT EXISTS payments_stripe_payment_intent_uq ON payments(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;",
  "CREATE INDEX IF NOT EXISTS payments_customer_id_idx ON payments(customer_id);",

  `CREATE TABLE IF NOT EXISTS payment_allocations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    amount numeric(12,2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT payment_allocations_amount_chk CHECK (amount > 0),
    CONSTRAINT payment_allocations_unique UNIQUE(payment_id, invoice_id)
  );`,
  "CREATE INDEX IF NOT EXISTS payment_allocations_payment_id_idx ON payment_allocations(payment_id);",
  "CREATE INDEX IF NOT EXISTS payment_allocations_invoice_id_idx ON payment_allocations(invoice_id);",
];
