export const openingBalancesStatements = [
  `CREATE TABLE IF NOT EXISTS opening_balance_batches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    as_of_date date NOT NULL,
    status text NOT NULL DEFAULT 'draft',
    memo text,
    created_by_employee_id uuid REFERENCES employees(id) ON DELETE SET NULL,
    is_deleted boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT opening_balance_batches_status_chk CHECK (status IN ('draft','finalized')),
    CONSTRAINT opening_balance_batches_deleted_at_chk CHECK ((is_deleted = false AND deleted_at IS NULL) OR (is_deleted = true AND deleted_at IS NOT NULL))
  );`,

  `CREATE TABLE IF NOT EXISTS opening_balance_lines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id uuid NOT NULL REFERENCES opening_balance_batches(id) ON DELETE CASCADE,
    account_id uuid NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    debit numeric(12,2) NOT NULL DEFAULT 0,
    credit numeric(12,2) NOT NULL DEFAULT 0,
    memo text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT opening_balance_lines_amount_chk CHECK (
      (debit > 0 AND credit = 0)
      OR
      (credit > 0 AND debit = 0)
    ),
    CONSTRAINT opening_balance_lines_debit_chk CHECK (debit >= 0),
    CONSTRAINT opening_balance_lines_credit_chk CHECK (credit >= 0),
    CONSTRAINT opening_balance_lines_unique_account_per_batch UNIQUE (batch_id, account_id)
  );`,

  `CREATE OR REPLACE FUNCTION validate_opening_balance_batch_finalize()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      net numeric;
      line_count integer;
    BEGIN
      IF NEW.status = 'finalized' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        SELECT COUNT(*) INTO line_count
        FROM opening_balance_lines
        WHERE batch_id = NEW.id;

        IF line_count <= 0 THEN
          RAISE EXCEPTION 'Cannot finalize opening balance batch with no lines.';
        END IF;

        SELECT round(COALESCE(SUM(debit) - SUM(credit), 0), 2) INTO net
        FROM opening_balance_lines
        WHERE batch_id = NEW.id;

        IF net <> 0 THEN
          RAISE EXCEPTION 'Opening balance batch must balance (debits - credits = 0). Current net=%', net;
        END IF;
      END IF;

      RETURN NEW;
    END;
    $$;`,

  "DROP TRIGGER IF EXISTS trg_validate_opening_balance_batch_finalize ON opening_balance_batches;",
  `CREATE TRIGGER trg_validate_opening_balance_batch_finalize
    BEFORE UPDATE ON opening_balance_batches
    FOR EACH ROW
    EXECUTE FUNCTION validate_opening_balance_batch_finalize();`,

  `CREATE OR REPLACE VIEW opening_balances_by_account AS
    SELECT
      obl.account_id,
      round(COALESCE(SUM(obl.debit) - SUM(obl.credit), 0), 2) AS opening_balance
    FROM opening_balance_lines obl
    JOIN opening_balance_batches obb ON obb.id = obl.batch_id
    WHERE obb.status = 'finalized'
      AND obb.is_deleted = false
    GROUP BY obl.account_id;`,
];
