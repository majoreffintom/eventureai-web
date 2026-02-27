export const viewsAndTriggersStatements = [
  // When evolving the view schema (adding columns), drop + recreate to avoid column-position rename errors.
  "DROP VIEW IF EXISTS invoice_amounts;",
  `CREATE VIEW invoice_amounts AS
    WITH item_sums AS (
      SELECT
        ili.invoice_id,
        COALESCE(SUM(ili.line_total), 0) AS subtotal,
        COALESCE(SUM(CASE WHEN ili.is_taxable THEN ili.line_total ELSE 0 END), 0) AS taxable_subtotal
      FROM invoice_line_items ili
      GROUP BY ili.invoice_id
    ),
    paid_sums AS (
      SELECT
        pa.invoice_id,
        COALESCE(SUM(pa.amount), 0) AS amount_paid
      FROM payment_allocations pa
      GROUP BY pa.invoice_id
    ),
    credit_sums AS (
      SELECT
        cma.invoice_id,
        COALESCE(SUM(cma.amount), 0) AS credit_applied
      FROM credit_memo_applications cma
      JOIN credit_memos cm ON cm.id = cma.credit_memo_id
      WHERE cm.is_deleted = false
        AND cm.status <> 'voided'
      GROUP BY cma.invoice_id
    )
    SELECT
      i.id AS invoice_id,
      i.customer_id,
      i.job_id,
      i.tax_rate,
      COALESCE(s.subtotal, 0) AS subtotal,
      round(COALESCE(s.taxable_subtotal, 0) * i.tax_rate, 2) AS tax_amount,
      round(COALESCE(s.subtotal, 0) + (COALESCE(s.taxable_subtotal, 0) * i.tax_rate), 2) AS total,
      COALESCE(p.amount_paid, 0) AS amount_paid,
      COALESCE(c.credit_applied, 0) AS credit_applied,
      round((COALESCE(s.subtotal, 0) + (COALESCE(s.taxable_subtotal, 0) * i.tax_rate)) - COALESCE(p.amount_paid, 0) - COALESCE(c.credit_applied, 0), 2) AS balance_due
    FROM invoices i
    LEFT JOIN item_sums s ON s.invoice_id = i.id
    LEFT JOIN paid_sums p ON p.invoice_id = i.id
    LEFT JOIN credit_sums c ON c.invoice_id = i.id;`,

  `CREATE OR REPLACE FUNCTION _invoice_total_for_allocation(_invoice_id uuid)
    RETURNS numeric
    LANGUAGE plpgsql
    AS $$
    DECLARE
      subtotal_val numeric;
      taxable_val numeric;
      tax_rate_val numeric;
    BEGIN
      SELECT COALESCE(SUM(line_total), 0), COALESCE(SUM(CASE WHEN is_taxable THEN line_total ELSE 0 END), 0)
      INTO subtotal_val, taxable_val
      FROM invoice_line_items
      WHERE invoice_id = _invoice_id;

      SELECT tax_rate INTO tax_rate_val FROM invoices WHERE id = _invoice_id;

      RETURN round(subtotal_val + (taxable_val * COALESCE(tax_rate_val, 0)), 2);
    END;
    $$;`,

  `CREATE OR REPLACE FUNCTION _invoice_paid_for_allocation(_invoice_id uuid, _exclude_allocation_id uuid)
    RETURNS numeric
    LANGUAGE plpgsql
    AS $$
    DECLARE
      paid_val numeric;
    BEGIN
      SELECT COALESCE(SUM(amount), 0)
      INTO paid_val
      FROM payment_allocations
      WHERE invoice_id = _invoice_id
        AND (_exclude_allocation_id IS NULL OR id <> _exclude_allocation_id);

      RETURN round(paid_val, 2);
    END;
    $$;`,

  `CREATE OR REPLACE FUNCTION _payment_allocated_total(_payment_id uuid, _exclude_allocation_id uuid)
    RETURNS numeric
    LANGUAGE plpgsql
    AS $$
    DECLARE
      alloc_val numeric;
    BEGIN
      SELECT COALESCE(SUM(amount), 0)
      INTO alloc_val
      FROM payment_allocations
      WHERE payment_id = _payment_id
        AND (_exclude_allocation_id IS NULL OR id <> _exclude_allocation_id);

      RETURN round(alloc_val, 2);
    END;
    $$;`,

  // -----------------------
  // Credit memo allocation helpers
  // -----------------------
  `CREATE OR REPLACE FUNCTION _invoice_credits_for_allocation(_invoice_id uuid, _exclude_credit_app_id uuid)
    RETURNS numeric
    LANGUAGE plpgsql
    AS $$
    DECLARE
      credit_val numeric;
    BEGIN
      SELECT COALESCE(SUM(cma.amount), 0)
      INTO credit_val
      FROM credit_memo_applications cma
      JOIN credit_memos cm ON cm.id = cma.credit_memo_id
      WHERE cma.invoice_id = _invoice_id
        AND cm.is_deleted = false
        AND cm.status <> 'voided'
        AND (_exclude_credit_app_id IS NULL OR cma.id <> _exclude_credit_app_id);

      RETURN round(credit_val, 2);
    END;
    $$;`,

  `CREATE OR REPLACE FUNCTION _credit_memo_applied_total(_credit_memo_id uuid, _exclude_credit_app_id uuid)
    RETURNS numeric
    LANGUAGE plpgsql
    AS $$
    DECLARE
      applied_val numeric;
    BEGIN
      SELECT COALESCE(SUM(amount), 0)
      INTO applied_val
      FROM credit_memo_applications
      WHERE credit_memo_id = _credit_memo_id
        AND (_exclude_credit_app_id IS NULL OR id <> _exclude_credit_app_id);

      RETURN round(applied_val, 2);
    END;
    $$;`,

  `CREATE OR REPLACE FUNCTION enforce_credit_memo_application_limits()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      invoice_total numeric;
      invoice_paid numeric;
      invoice_credits numeric;
      invoice_balance numeric;
      credit_amount numeric;
      credit_applied numeric;
      credit_remaining numeric;
      credit_status text;
      credit_deleted boolean;
      exclude_id uuid;
    BEGIN
      exclude_id := NULL;
      IF TG_OP = 'UPDATE' THEN
        exclude_id := OLD.id;
      END IF;

      SELECT amount, status, is_deleted
      INTO credit_amount, credit_status, credit_deleted
      FROM credit_memos
      WHERE id = NEW.credit_memo_id;

      IF credit_amount IS NULL THEN
        RAISE EXCEPTION 'Credit memo not found: %', NEW.credit_memo_id;
      END IF;

      IF credit_deleted THEN
        RAISE EXCEPTION 'Cannot apply a deleted credit memo.';
      END IF;

      IF credit_status IN ('draft','voided') THEN
        RAISE EXCEPTION 'Cannot apply a credit memo in status=%', credit_status;
      END IF;

      invoice_total := _invoice_total_for_allocation(NEW.invoice_id);
      invoice_paid := _invoice_paid_for_allocation(NEW.invoice_id, NULL);
      invoice_credits := _invoice_credits_for_allocation(NEW.invoice_id, exclude_id);
      invoice_balance := round(invoice_total - invoice_paid - invoice_credits, 2);

      credit_applied := _credit_memo_applied_total(NEW.credit_memo_id, exclude_id);
      credit_remaining := round(credit_amount - credit_applied, 2);

      IF NEW.amount > invoice_balance THEN
        RAISE EXCEPTION 'Credit exceeds invoice balance. Invoice balance=%, attempted=%', invoice_balance, NEW.amount;
      END IF;

      IF NEW.amount > credit_remaining THEN
        RAISE EXCEPTION 'Credit exceeds credit memo remaining. Remaining=%, attempted=%', credit_remaining, NEW.amount;
      END IF;

      RETURN NEW;
    END;
    $$;`,

  "DROP TRIGGER IF EXISTS trg_enforce_credit_memo_application_limits ON credit_memo_applications;",
  `CREATE TRIGGER trg_enforce_credit_memo_application_limits
    BEFORE INSERT OR UPDATE ON credit_memo_applications
    FOR EACH ROW
    EXECUTE FUNCTION enforce_credit_memo_application_limits();`,

  `CREATE OR REPLACE FUNCTION recompute_credit_memo_status()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      cm_id uuid;
      applied_total numeric;
      curr_status text;
    BEGIN
      cm_id := COALESCE(NEW.credit_memo_id, OLD.credit_memo_id);

      SELECT status INTO curr_status
      FROM credit_memos
      WHERE id = cm_id;

      IF curr_status IN ('draft','voided') THEN
        RETURN NULL;
      END IF;

      applied_total := _credit_memo_applied_total(cm_id, NULL);

      UPDATE credit_memos
      SET status = CASE
          WHEN applied_total <= 0 THEN 'issued'
          ELSE 'applied'
        END,
        updated_at = now()
      WHERE id = cm_id;

      RETURN NULL;
    END;
    $$;`,

  "DROP TRIGGER IF EXISTS trg_recompute_credit_memo_status ON credit_memo_applications;",
  `CREATE TRIGGER trg_recompute_credit_memo_status
    AFTER INSERT OR UPDATE OR DELETE ON credit_memo_applications
    FOR EACH ROW
    EXECUTE FUNCTION recompute_credit_memo_status();`,

  `CREATE OR REPLACE FUNCTION enforce_payment_allocation_limits()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      invoice_total numeric;
      invoice_paid numeric;
      invoice_credits numeric;
      invoice_balance numeric;
      payment_amount numeric;
      payment_allocated numeric;
      payment_remaining numeric;
      exclude_id uuid;
    BEGIN
      exclude_id := NULL;
      IF TG_OP = 'UPDATE' THEN
        exclude_id := OLD.id;
      END IF;

      invoice_total := _invoice_total_for_allocation(NEW.invoice_id);
      invoice_paid := _invoice_paid_for_allocation(NEW.invoice_id, exclude_id);
      invoice_credits := _invoice_credits_for_allocation(NEW.invoice_id, NULL);
      invoice_balance := round(invoice_total - invoice_paid - invoice_credits, 2);

      SELECT amount INTO payment_amount FROM payments WHERE id = NEW.payment_id;
      payment_allocated := _payment_allocated_total(NEW.payment_id, exclude_id);
      payment_remaining := round(payment_amount - payment_allocated, 2);

      IF NEW.amount > invoice_balance THEN
        RAISE EXCEPTION 'Allocation exceeds invoice balance. Invoice balance=%, attempted=%', invoice_balance, NEW.amount;
      END IF;

      IF NEW.amount > payment_remaining THEN
        RAISE EXCEPTION 'Allocation exceeds payment remaining. Payment remaining=%, attempted=%', payment_remaining, NEW.amount;
      END IF;

      RETURN NEW;
    END;
    $$;`,

  "DROP TRIGGER IF EXISTS trg_enforce_payment_allocation_limits ON payment_allocations;",
  `CREATE TRIGGER trg_enforce_payment_allocation_limits
    BEFORE INSERT OR UPDATE ON payment_allocations
    FOR EACH ROW
    EXECUTE FUNCTION enforce_payment_allocation_limits();`,

  `CREATE OR REPLACE FUNCTION recompute_invoice_payment_status()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      inv_id uuid;
      invoice_total numeric;
      invoice_paid numeric;
      invoice_credits numeric;
      effective_total numeric;
    BEGIN
      inv_id := COALESCE(NEW.invoice_id, OLD.invoice_id);

      invoice_total := _invoice_total_for_allocation(inv_id);
      invoice_paid := _invoice_paid_for_allocation(inv_id, NULL);
      invoice_credits := _invoice_credits_for_allocation(inv_id, NULL);
      effective_total := round(invoice_total - invoice_credits, 2);

      UPDATE invoices
      SET payment_status = CASE
          WHEN effective_total <= 0 THEN 'paid'
          WHEN invoice_paid <= 0 THEN 'unpaid'
          WHEN invoice_paid >= effective_total THEN 'paid'
          ELSE 'partial'
        END,
        updated_at = now()
      WHERE id = inv_id;

      RETURN NULL;
    END;
    $$;`,

  "DROP TRIGGER IF EXISTS trg_recompute_invoice_payment_status ON payment_allocations;",
  `CREATE TRIGGER trg_recompute_invoice_payment_status
    AFTER INSERT OR DELETE OR UPDATE ON payment_allocations
    FOR EACH ROW
    EXECUTE FUNCTION recompute_invoice_payment_status();`,

  // Keep invoice payment_status in sync when credits are applied/updated/removed
  "DROP TRIGGER IF EXISTS trg_recompute_invoice_payment_status_on_credits ON credit_memo_applications;",
  `CREATE TRIGGER trg_recompute_invoice_payment_status_on_credits
    AFTER INSERT OR DELETE OR UPDATE ON credit_memo_applications
    FOR EACH ROW
    EXECUTE FUNCTION recompute_invoice_payment_status();`,

  // -----------------------
  // Accounts Payable helpers + triggers
  // -----------------------
  `CREATE OR REPLACE FUNCTION _ap_paid_for_allocation(_ap_id uuid, _exclude_ap_payment_id uuid)
    RETURNS numeric
    LANGUAGE plpgsql
    AS $$
    DECLARE
      paid_val numeric;
    BEGIN
      SELECT COALESCE(SUM(amount), 0)
      INTO paid_val
      FROM ap_payments
      WHERE accounts_payable_id = _ap_id
        AND (_exclude_ap_payment_id IS NULL OR id <> _exclude_ap_payment_id);

      RETURN round(paid_val, 2);
    END;
    $$;`,

  `CREATE OR REPLACE FUNCTION enforce_ap_payment_limits()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      bill_amount numeric;
      bill_paid numeric;
      bill_balance numeric;
      exclude_id uuid;
    BEGIN
      exclude_id := NULL;
      IF TG_OP = 'UPDATE' THEN
        exclude_id := OLD.id;
      END IF;

      SELECT amount INTO bill_amount
      FROM accounts_payable
      WHERE id = NEW.accounts_payable_id;

      bill_paid := _ap_paid_for_allocation(NEW.accounts_payable_id, exclude_id);
      bill_balance := round(COALESCE(bill_amount, 0) - COALESCE(bill_paid, 0), 2);

      IF NEW.amount > bill_balance THEN
        RAISE EXCEPTION 'A/P payment exceeds bill balance. Bill balance=%, attempted=%', bill_balance, NEW.amount;
      END IF;

      RETURN NEW;
    END;
    $$;`,

  "DROP TRIGGER IF EXISTS trg_enforce_ap_payment_limits ON ap_payments;",
  `CREATE TRIGGER trg_enforce_ap_payment_limits
    BEFORE INSERT OR UPDATE ON ap_payments
    FOR EACH ROW
    EXECUTE FUNCTION enforce_ap_payment_limits();`,

  `CREATE OR REPLACE FUNCTION recompute_ap_payment_status()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    DECLARE
      ap_id uuid;
      bill_amount numeric;
      bill_paid numeric;
    BEGIN
      ap_id := COALESCE(NEW.accounts_payable_id, OLD.accounts_payable_id);

      SELECT amount INTO bill_amount
      FROM accounts_payable
      WHERE id = ap_id;

      bill_paid := _ap_paid_for_allocation(ap_id, NULL);

      UPDATE accounts_payable
      SET payment_status = CASE
          WHEN COALESCE(bill_amount, 0) <= 0 THEN 'unpaid'
          WHEN bill_paid <= 0 THEN 'unpaid'
          WHEN bill_paid >= bill_amount THEN 'paid'
          ELSE 'partial'
        END,
        updated_at = now()
      WHERE id = ap_id;

      RETURN NULL;
    END;
    $$;`,

  "DROP TRIGGER IF EXISTS trg_recompute_ap_payment_status ON ap_payments;",
  `CREATE TRIGGER trg_recompute_ap_payment_status
    AFTER INSERT OR UPDATE OR DELETE ON ap_payments
    FOR EACH ROW
    EXECUTE FUNCTION recompute_ap_payment_status();`,
];
