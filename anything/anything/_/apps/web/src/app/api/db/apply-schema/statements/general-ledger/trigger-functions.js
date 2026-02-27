export const triggerFunctions = [
  // -----------------------
  // Trigger wrapper functions (triggers cannot pass NEW.id as args)
  // -----------------------
  `CREATE OR REPLACE FUNCTION trg_post_invoice_to_gl()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      PERFORM post_invoice_to_gl(NEW.id);
      RETURN NEW;
    END;
    $$;`,

  `CREATE OR REPLACE FUNCTION trg_post_payment_allocation_to_gl()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      PERFORM post_payment_allocation_to_gl(NEW.id);
      RETURN NEW;
    END;
    $$;`,

  `CREATE OR REPLACE FUNCTION trg_post_accounts_payable_to_gl()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      PERFORM post_accounts_payable_to_gl(NEW.id);
      RETURN NEW;
    END;
    $$;`,

  `CREATE OR REPLACE FUNCTION trg_post_ap_payment_to_gl()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      PERFORM post_ap_payment_to_gl(NEW.id);
      RETURN NEW;
    END;
    $$;`,

  `CREATE OR REPLACE FUNCTION trg_post_job_expense_to_gl()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      PERFORM post_job_expense_to_gl(NEW.id);
      RETURN NEW;
    END;
    $$;`,

  `CREATE OR REPLACE FUNCTION trg_post_general_expense_to_gl()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      PERFORM post_general_expense_to_gl(NEW.id);
      RETURN NEW;
    END;
    $$;`,

  `CREATE OR REPLACE FUNCTION trg_post_payroll_period_to_gl()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      PERFORM post_payroll_period_to_gl(NEW.id);
      RETURN NEW;
    END;
    $$;`,

  `CREATE OR REPLACE FUNCTION trg_post_opening_balance_batch_to_gl()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      PERFORM post_opening_balance_batch_to_gl(NEW.id);
      RETURN NEW;
    END;
    $$;`,
];
