export const postingFunctions = [
  // -----------------------
  // Posting: Invoice
  // -----------------------
  `CREATE OR REPLACE FUNCTION post_invoice_to_gl(_invoice_id uuid)
    RETURNS uuid
    LANGUAGE plpgsql
    AS $$
    DECLARE
      existing_id uuid;
      je_id uuid;
      inv record;
      inv_amt record;
      ar_account_id uuid;
      tax_account_id uuid;
      default_rev_account_id uuid;
      grp record;
      revenue_account_id uuid;
    BEGIN
      SELECT id
      INTO existing_id
      FROM journal_entries
      WHERE source_type = 'invoice'
        AND source_id = _invoice_id
        AND is_deleted = false
      ORDER BY created_at ASC
      LIMIT 1;

      IF existing_id IS NOT NULL THEN
        RETURN existing_id;
      END IF;

      SELECT i.id, i.invoice_number, i.invoice_date, i.created_by_employee_id, c.name AS customer_name
      INTO inv
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      WHERE i.id = _invoice_id;

      IF inv.id IS NULL THEN
        RAISE EXCEPTION 'Invoice not found: %', _invoice_id;
      END IF;

      SELECT *
      INTO inv_amt
      FROM invoice_amounts
      WHERE invoice_id = _invoice_id;

      ar_account_id := (SELECT id FROM chart_of_accounts WHERE account_number = '1100' AND is_deleted = false ORDER BY created_at ASC LIMIT 1);
      tax_account_id := (SELECT id FROM chart_of_accounts WHERE account_number = '2300' AND is_deleted = false ORDER BY created_at ASC LIMIT 1);
      default_rev_account_id := (SELECT id FROM chart_of_accounts WHERE account_number = '4000' AND is_deleted = false ORDER BY created_at ASC LIMIT 1);

      IF ar_account_id IS NULL OR default_rev_account_id IS NULL THEN
        RAISE EXCEPTION 'Missing required COA accounts (need 1100 and 4000)';
      END IF;

      INSERT INTO journal_entries (
        entry_date,
        entry_type,
        source_type,
        source_id,
        description,
        posted,
        created_by_employee_id
      ) VALUES (
        inv.invoice_date,
        'invoice',
        'invoice',
        inv.id,
        'Invoice #' || inv.invoice_number || ' - ' || inv.customer_name,
        false,
        inv.created_by_employee_id
      ) RETURNING id INTO je_id;

      -- DR Accounts Receivable (invoice total includes sales tax)
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, memo)
      VALUES (je_id, ar_account_id, inv_amt.total, 'A/R for invoice #' || inv.invoice_number);

      -- CR Revenue (split by service catalog category)
      FOR grp IN
        SELECT
          COALESCE(sc.category, 'parts') AS category,
          round(SUM(ili.line_total), 2) AS amount
        FROM invoice_line_items ili
        LEFT JOIN service_catalog sc ON sc.id = ili.service_catalog_item_id
        WHERE ili.invoice_id = _invoice_id
        GROUP BY COALESCE(sc.category, 'parts')
      LOOP
        SELECT m.revenue_account_id
        INTO revenue_account_id
        FROM service_category_revenue_mapping m
        WHERE m.service_category = grp.category;

        IF revenue_account_id IS NULL THEN
          revenue_account_id := default_rev_account_id;
        END IF;

        IF grp.amount > 0 THEN
          INSERT INTO journal_entry_lines (journal_entry_id, account_id, credit, memo)
          VALUES (je_id, revenue_account_id, grp.amount, 'Revenue (' || grp.category || ') invoice #' || inv.invoice_number);
        END IF;
      END LOOP;

      -- CR Sales Tax Payable
      IF COALESCE(inv_amt.tax_amount, 0) > 0 THEN
        IF tax_account_id IS NULL THEN
          RAISE EXCEPTION 'Missing required COA account 2300 (Sales Tax Payable)';
        END IF;
        INSERT INTO journal_entry_lines (journal_entry_id, account_id, credit, memo)
        VALUES (je_id, tax_account_id, inv_amt.tax_amount, 'Sales tax for invoice #' || inv.invoice_number);
      END IF;

      PERFORM gl_mark_posted(je_id);
      RETURN je_id;
    END;
    $$;`,

  // -----------------------
  // Posting: Payment allocation (cash receipt + A/R reduction)
  // -----------------------
  `CREATE OR REPLACE FUNCTION post_payment_allocation_to_gl(_allocation_id uuid)
    RETURNS uuid
    LANGUAGE plpgsql
    AS $$
    DECLARE
      existing_id uuid;
      je_id uuid;
      rec record;
      cash_account_id uuid;
      ar_account_id uuid;
    BEGIN
      SELECT id
      INTO existing_id
      FROM journal_entries
      WHERE source_type = 'payment_allocation'
        AND source_id = _allocation_id
        AND is_deleted = false
      ORDER BY created_at ASC
      LIMIT 1;

      IF existing_id IS NOT NULL THEN
        RETURN existing_id;
      END IF;

      SELECT
        pa.id AS allocation_id,
        pa.amount AS amount,
        p.id AS payment_id,
        p.payment_date AS payment_date,
        p.payment_method AS payment_method,
        i.invoice_number AS invoice_number,
        c.name AS customer_name,
        p.collected_by_employee_id AS collected_by_employee_id
      INTO rec
      FROM payment_allocations pa
      JOIN payments p ON p.id = pa.payment_id
      JOIN invoices i ON i.id = pa.invoice_id
      JOIN customers c ON c.id = i.customer_id
      WHERE pa.id = _allocation_id;

      IF rec.allocation_id IS NULL THEN
        RAISE EXCEPTION 'Payment allocation not found: %', _allocation_id;
      END IF;

      cash_account_id := (SELECT id FROM chart_of_accounts WHERE account_number = '1000' AND is_deleted = false ORDER BY created_at ASC LIMIT 1);
      ar_account_id := (SELECT id FROM chart_of_accounts WHERE account_number = '1100' AND is_deleted = false ORDER BY created_at ASC LIMIT 1);

      IF cash_account_id IS NULL OR ar_account_id IS NULL THEN
        RAISE EXCEPTION 'Missing required COA accounts (need 1000 and 1100)';
      END IF;

      INSERT INTO journal_entries (
        entry_date,
        entry_type,
        source_type,
        source_id,
        description,
        posted,
        created_by_employee_id
      ) VALUES (
        rec.payment_date,
        'payment_allocation',
        'payment_allocation',
        rec.allocation_id,
        'Payment applied - Invoice #' || rec.invoice_number || ' - ' || rec.customer_name,
        false,
        rec.collected_by_employee_id
      ) RETURNING id INTO je_id;

      -- DR Cash
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, memo)
      VALUES (je_id, cash_account_id, rec.amount, 'Receipt (' || rec.payment_method || ')');

      -- CR Accounts Receivable
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, credit, memo)
      VALUES (je_id, ar_account_id, rec.amount, 'Applied to invoice #' || rec.invoice_number);

      PERFORM gl_mark_posted(je_id);
      RETURN je_id;
    END;
    $$;`,

  // -----------------------
  // Posting: Accounts payable bill
  // -----------------------
  `CREATE OR REPLACE FUNCTION post_accounts_payable_to_gl(_ap_id uuid)
    RETURNS uuid
    LANGUAGE plpgsql
    AS $$
    DECLARE
      existing_id uuid;
      je_id uuid;
      rec record;
      ap_account_id uuid;
    BEGIN
      SELECT id
      INTO existing_id
      FROM journal_entries
      WHERE source_type = 'accounts_payable'
        AND source_id = _ap_id
        AND is_deleted = false
      ORDER BY created_at ASC
      LIMIT 1;

      IF existing_id IS NOT NULL THEN
        RETURN existing_id;
      END IF;

      SELECT
        ap.id,
        ap.amount,
        ap.bill_date,
        ap.bill_number,
        ap.account_id,
        v.name AS vendor_name
      INTO rec
      FROM accounts_payable ap
      JOIN vendors v ON v.id = ap.vendor_id
      WHERE ap.id = _ap_id;

      IF rec.id IS NULL THEN
        RAISE EXCEPTION 'Accounts payable bill not found: %', _ap_id;
      END IF;

      ap_account_id := (SELECT id FROM chart_of_accounts WHERE account_number = '2000' AND is_deleted = false ORDER BY created_at ASC LIMIT 1);
      IF ap_account_id IS NULL THEN
        RAISE EXCEPTION 'Missing required COA account 2000 (Accounts Payable)';
      END IF;

      IF rec.account_id IS NULL THEN
        RAISE EXCEPTION 'accounts_payable.account_id is required for bill %', _ap_id;
      END IF;

      INSERT INTO journal_entries (
        entry_date,
        entry_type,
        source_type,
        source_id,
        description,
        posted
      ) VALUES (
        rec.bill_date,
        'ap_bill',
        'accounts_payable',
        rec.id,
        'Bill ' || COALESCE(rec.bill_number, '(no #)') || ' - ' || rec.vendor_name,
        false
      ) RETURNING id INTO je_id;

      -- DR Expense/COGS account on bill
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, memo)
      VALUES (je_id, rec.account_id, rec.amount, 'Bill ' || COALESCE(rec.bill_number, '(no #)'));

      -- CR Accounts Payable
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, credit, memo)
      VALUES (je_id, ap_account_id, rec.amount, 'A/P - ' || rec.vendor_name);

      PERFORM gl_mark_posted(je_id);
      RETURN je_id;
    END;
    $$;`,

  // -----------------------
  // Posting: AP payment
  // -----------------------
  `CREATE OR REPLACE FUNCTION post_ap_payment_to_gl(_ap_payment_id uuid)
    RETURNS uuid
    LANGUAGE plpgsql
    AS $$
    DECLARE
      existing_id uuid;
      je_id uuid;
      rec record;
      ap_account_id uuid;
      cash_account_id uuid;
    BEGIN
      SELECT id
      INTO existing_id
      FROM journal_entries
      WHERE source_type = 'ap_payment'
        AND source_id = _ap_payment_id
        AND is_deleted = false
      ORDER BY created_at ASC
      LIMIT 1;

      IF existing_id IS NOT NULL THEN
        RETURN existing_id;
      END IF;

      SELECT
        app.id,
        app.amount,
        app.payment_date,
        app.payment_method,
        app.check_number,
        app.bank_transaction_id,
        ap.bill_number,
        v.name AS vendor_name
      INTO rec
      FROM ap_payments app
      JOIN accounts_payable ap ON ap.id = app.accounts_payable_id
      JOIN vendors v ON v.id = ap.vendor_id
      WHERE app.id = _ap_payment_id;

      IF rec.id IS NULL THEN
        RAISE EXCEPTION 'A/P payment not found: %', _ap_payment_id;
      END IF;

      ap_account_id := (SELECT id FROM chart_of_accounts WHERE account_number = '2000' AND is_deleted = false ORDER BY created_at ASC LIMIT 1);
      IF ap_account_id IS NULL THEN
        RAISE EXCEPTION 'Missing required COA account 2000 (Accounts Payable)';
      END IF;

      IF rec.bank_transaction_id IS NOT NULL THEN
        SELECT ba.chart_account_id
        INTO cash_account_id
        FROM bank_transactions bt
        JOIN bank_accounts ba ON ba.id = bt.bank_account_id
        WHERE bt.id = rec.bank_transaction_id;
      END IF;

      IF cash_account_id IS NULL THEN
        cash_account_id := (SELECT id FROM chart_of_accounts WHERE account_number = '1000' AND is_deleted = false ORDER BY created_at ASC LIMIT 1);
      END IF;

      IF cash_account_id IS NULL THEN
        RAISE EXCEPTION 'Missing required COA cash account (1000)';
      END IF;

      INSERT INTO journal_entries (
        entry_date,
        entry_type,
        source_type,
        source_id,
        description,
        posted
      ) VALUES (
        rec.payment_date,
        'ap_payment',
        'ap_payment',
        rec.id,
        'Payment to ' || rec.vendor_name || ' - Bill ' || COALESCE(rec.bill_number, '(no #)'),
        false
      ) RETURNING id INTO je_id;

      -- DR Accounts Payable
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, memo)
      VALUES (je_id, ap_account_id, rec.amount, 'Bill payment');

      -- CR Cash
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, credit, memo)
      VALUES (
        je_id,
        cash_account_id,
        rec.amount,
        'Paid via ' || rec.payment_method || COALESCE(' #' || rec.check_number, '')
      );

      PERFORM gl_mark_posted(je_id);
      RETURN je_id;
    END;
    $$;`,

  // -----------------------
  // Posting: Job expense (cash basis)
  // -----------------------
  `CREATE OR REPLACE FUNCTION post_job_expense_to_gl(_job_expense_id uuid)
    RETURNS uuid
    LANGUAGE plpgsql
    AS $$
    DECLARE
      existing_id uuid;
      je_id uuid;
      rec record;
      cogs_account_id uuid;
      cash_account_id uuid;
      vendor_name text;
      acct_num text;
    BEGIN
      SELECT id
      INTO existing_id
      FROM journal_entries
      WHERE source_type = 'job_expense'
        AND source_id = _job_expense_id
        AND is_deleted = false
      ORDER BY created_at ASC
      LIMIT 1;

      IF existing_id IS NOT NULL THEN
        RETURN existing_id;
      END IF;

      SELECT je.id, je.expense_type, je.total_amount, je.expense_date, je.vendor_id, je.description
      INTO rec
      FROM job_expenses je
      WHERE je.id = _job_expense_id;

      IF rec.id IS NULL THEN
        RAISE EXCEPTION 'Job expense not found: %', _job_expense_id;
      END IF;

      SELECT name INTO vendor_name FROM vendors WHERE id = rec.vendor_id;

      acct_num := CASE rec.expense_type
        WHEN 'materials' THEN '5000'
        WHEN 'subcontractor' THEN '5010'
        WHEN 'permits' THEN '5020'
        WHEN 'disposal' THEN '5030'
        ELSE '5000'
      END;

      cogs_account_id := (SELECT id FROM chart_of_accounts WHERE account_number = acct_num AND is_deleted = false ORDER BY created_at ASC LIMIT 1);
      IF cogs_account_id IS NULL THEN
        RAISE EXCEPTION 'Missing required COGS account %', acct_num;
      END IF;

      -- Choose cash account from linked bank transaction if present
      SELECT ba.chart_account_id
      INTO cash_account_id
      FROM bank_transaction_job_expense_links l
      JOIN bank_transactions bt ON bt.id = l.bank_transaction_id
      JOIN bank_accounts ba ON ba.id = bt.bank_account_id
      WHERE l.job_expense_id = _job_expense_id
      LIMIT 1;

      IF cash_account_id IS NULL THEN
        cash_account_id := (SELECT id FROM chart_of_accounts WHERE account_number = '1000' AND is_deleted = false ORDER BY created_at ASC LIMIT 1);
      END IF;

      IF cash_account_id IS NULL THEN
        RAISE EXCEPTION 'Missing required COA cash account (1000)';
      END IF;

      INSERT INTO journal_entries (
        entry_date,
        entry_type,
        source_type,
        source_id,
        description,
        posted
      ) VALUES (
        rec.expense_date,
        'job_expense',
        'job_expense',
        rec.id,
        'Job expense - ' || COALESCE(vendor_name, '(vendor)') || ' - ' || COALESCE(rec.description, rec.expense_type),
        false
      ) RETURNING id INTO je_id;

      -- DR COGS
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, memo)
      VALUES (je_id, cogs_account_id, rec.total_amount, COALESCE(rec.description, rec.expense_type));

      -- CR Cash
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, credit, memo)
      VALUES (je_id, cash_account_id, rec.total_amount, 'Paid');

      PERFORM gl_mark_posted(je_id);
      RETURN je_id;
    END;
    $$;`,

  // -----------------------
  // Posting: General expense (cash basis)
  // -----------------------
  `CREATE OR REPLACE FUNCTION post_general_expense_to_gl(_general_expense_id uuid)
    RETURNS uuid
    LANGUAGE plpgsql
    AS $$
    DECLARE
      existing_id uuid;
      je_id uuid;
      rec record;
      cash_account_id uuid;
      vendor_name text;
    BEGIN
      SELECT id
      INTO existing_id
      FROM journal_entries
      WHERE source_type = 'general_expense'
        AND source_id = _general_expense_id
        AND is_deleted = false
      ORDER BY created_at ASC
      LIMIT 1;

      IF existing_id IS NOT NULL THEN
        RETURN existing_id;
      END IF;

      SELECT ge.id, ge.account_id, ge.total_amount, ge.expense_date, ge.vendor_id, ge.description
      INTO rec
      FROM general_expenses ge
      WHERE ge.id = _general_expense_id;

      IF rec.id IS NULL THEN
        RAISE EXCEPTION 'General expense not found: %', _general_expense_id;
      END IF;

      SELECT name INTO vendor_name FROM vendors WHERE id = rec.vendor_id;

      -- Choose cash account from linked bank transaction if present
      SELECT ba.chart_account_id
      INTO cash_account_id
      FROM bank_transaction_general_expense_links l
      JOIN bank_transactions bt ON bt.id = l.bank_transaction_id
      JOIN bank_accounts ba ON ba.id = bt.bank_account_id
      WHERE l.general_expense_id = _general_expense_id
      LIMIT 1;

      IF cash_account_id IS NULL THEN
        cash_account_id := (SELECT id FROM chart_of_accounts WHERE account_number = '1000' AND is_deleted = false ORDER BY created_at ASC LIMIT 1);
      END IF;

      IF cash_account_id IS NULL THEN
        RAISE EXCEPTION 'Missing required COA cash account (1000)';
      END IF;

      INSERT INTO journal_entries (
        entry_date,
        entry_type,
        source_type,
        source_id,
        description,
        posted
      ) VALUES (
        rec.expense_date,
        'general_expense',
        'general_expense',
        rec.id,
        'General expense - ' || COALESCE(vendor_name, '(vendor)') || ' - ' || COALESCE(rec.description, 'Expense'),
        false
      ) RETURNING id INTO je_id;

      -- DR Expense account
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, memo)
      VALUES (je_id, rec.account_id, rec.total_amount, COALESCE(rec.description, 'Expense'));

      -- CR Cash
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, credit, memo)
      VALUES (je_id, cash_account_id, rec.total_amount, 'Paid');

      PERFORM gl_mark_posted(je_id);
      RETURN je_id;
    END;
    $$;`,

  // -----------------------
  // Posting: Payroll period (outsourced payroll; gross only)
  // -----------------------
  `CREATE OR REPLACE FUNCTION post_payroll_period_to_gl(_payroll_period_id uuid)
    RETURNS uuid
    LANGUAGE plpgsql
    AS $$
    DECLARE
      existing_id uuid;
      je_id uuid;
      rec record;
      payroll_exp_account_id uuid;
      cash_account_id uuid;
      gross numeric;
    BEGIN
      SELECT id
      INTO existing_id
      FROM journal_entries
      WHERE source_type = 'payroll_period'
        AND source_id = _payroll_period_id
        AND is_deleted = false
      ORDER BY created_at ASC
      LIMIT 1;

      IF existing_id IS NOT NULL THEN
        RETURN existing_id;
      END IF;

      SELECT pp.id, pp.period_start, pp.period_end, pp.bank_transaction_id
      INTO rec
      FROM payroll_periods pp
      WHERE pp.id = _payroll_period_id;

      IF rec.id IS NULL THEN
        RAISE EXCEPTION 'Payroll period not found: %', _payroll_period_id;
      END IF;

      SELECT COALESCE(SUM(gross_pay), 0)
      INTO gross
      FROM payroll_period_employees
      WHERE payroll_period_id = _payroll_period_id;

      gross := round(gross, 2);
      IF gross <= 0 THEN
        RETURN NULL;
      END IF;

      payroll_exp_account_id := (SELECT id FROM chart_of_accounts WHERE account_number = '5100' AND is_deleted = false ORDER BY created_at ASC LIMIT 1);
      IF payroll_exp_account_id IS NULL THEN
        RAISE EXCEPTION 'Missing required COA account 5100 (Payroll Expense)';
      END IF;

      IF rec.bank_transaction_id IS NOT NULL THEN
        SELECT ba.chart_account_id
        INTO cash_account_id
        FROM bank_transactions bt
        JOIN bank_accounts ba ON ba.id = bt.bank_account_id
        WHERE bt.id = rec.bank_transaction_id;
      END IF;

      IF cash_account_id IS NULL THEN
        cash_account_id := (SELECT id FROM chart_of_accounts WHERE account_number = '1000' AND is_deleted = false ORDER BY created_at ASC LIMIT 1);
      END IF;

      IF cash_account_id IS NULL THEN
        RAISE EXCEPTION 'Missing required COA cash account (1000)';
      END IF;

      INSERT INTO journal_entries (
        entry_date,
        entry_type,
        source_type,
        source_id,
        description,
        posted
      ) VALUES (
        rec.period_end,
        'payroll',
        'payroll_period',
        rec.id,
        'Payroll ' || rec.period_start || ' to ' || rec.period_end,
        false
      ) RETURNING id INTO je_id;

      -- DR Payroll expense
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, memo)
      VALUES (je_id, payroll_exp_account_id, gross, 'Gross payroll');

      -- CR Cash
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, credit, memo)
      VALUES (je_id, cash_account_id, gross, 'Payroll paid');

      PERFORM gl_mark_posted(je_id);
      RETURN je_id;
    END;
    $$;`,

  // -----------------------
  // Posting: Opening balance batch
  // -----------------------
  `CREATE OR REPLACE FUNCTION post_opening_balance_batch_to_gl(_batch_id uuid)
    RETURNS uuid
    LANGUAGE plpgsql
    AS $$
    DECLARE
      existing_id uuid;
      je_id uuid;
      batch record;
      line_rec record;
    BEGIN
      SELECT journal_entry_id INTO existing_id
      FROM opening_balance_batches
      WHERE id = _batch_id;

      IF existing_id IS NOT NULL THEN
        RETURN existing_id;
      END IF;

      SELECT id, as_of_date, memo, created_by_employee_id
      INTO batch
      FROM opening_balance_batches
      WHERE id = _batch_id;

      IF batch.id IS NULL THEN
        RAISE EXCEPTION 'Opening balance batch not found: %', _batch_id;
      END IF;

      INSERT INTO journal_entries (
        entry_date,
        entry_type,
        source_type,
        source_id,
        description,
        posted,
        created_by_employee_id
      ) VALUES (
        batch.as_of_date,
        'opening_balance',
        'opening_balance_batch',
        batch.id,
        'Opening balances as of ' || batch.as_of_date,
        false,
        batch.created_by_employee_id
      ) RETURNING id INTO je_id;

      FOR line_rec IN
        SELECT account_id, debit, credit, memo
        FROM opening_balance_lines
        WHERE batch_id = _batch_id
      LOOP
        INSERT INTO journal_entry_lines (
          journal_entry_id,
          account_id,
          debit,
          credit,
          memo
        ) VALUES (
          je_id,
          line_rec.account_id,
          line_rec.debit,
          line_rec.credit,
          line_rec.memo
        );
      END LOOP;

      PERFORM gl_mark_posted(je_id);

      UPDATE opening_balance_batches
      SET journal_entry_id = je_id, updated_at = now()
      WHERE id = _batch_id;

      RETURN je_id;
    END;
    $$;`,
];
