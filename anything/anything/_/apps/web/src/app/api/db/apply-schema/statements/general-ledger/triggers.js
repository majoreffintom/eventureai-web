export const triggers = [
  // -----------------------
  // Triggers wiring
  // -----------------------
  // Invoices must be created as draft, have line items added, then be transitioned to 'sent'
  // so we have correct totals when posting to the GL.
  "DROP TRIGGER IF EXISTS trg_post_invoice_to_gl_on_insert ON invoices;",

  "DROP TRIGGER IF EXISTS trg_post_invoice_to_gl_on_update ON invoices;",
  `CREATE TRIGGER trg_post_invoice_to_gl_on_update
    AFTER UPDATE ON invoices
    FOR EACH ROW
    WHEN (NEW.workflow_status = 'sent' AND OLD.workflow_status IS DISTINCT FROM 'sent')
    EXECUTE FUNCTION trg_post_invoice_to_gl();`,

  // Payment allocations create cash receipt + AR reduction
  "DROP TRIGGER IF EXISTS trg_post_payment_allocation_to_gl ON payment_allocations;",
  `CREATE TRIGGER trg_post_payment_allocation_to_gl
    AFTER INSERT ON payment_allocations
    FOR EACH ROW
    EXECUTE FUNCTION trg_post_payment_allocation_to_gl();`,

  // Accounts payable bill
  "DROP TRIGGER IF EXISTS trg_post_accounts_payable_to_gl ON accounts_payable;",
  `CREATE TRIGGER trg_post_accounts_payable_to_gl
    AFTER INSERT ON accounts_payable
    FOR EACH ROW
    WHEN (NEW.workflow_status = 'open' AND NEW.is_deleted = false)
    EXECUTE FUNCTION trg_post_accounts_payable_to_gl();`,

  // A/P payment
  "DROP TRIGGER IF EXISTS trg_post_ap_payment_to_gl ON ap_payments;",
  `CREATE TRIGGER trg_post_ap_payment_to_gl
    AFTER INSERT ON ap_payments
    FOR EACH ROW
    EXECUTE FUNCTION trg_post_ap_payment_to_gl();`,

  // Job expense approval
  "DROP TRIGGER IF EXISTS trg_post_job_expense_to_gl ON job_expenses;",
  `CREATE TRIGGER trg_post_job_expense_to_gl
    AFTER UPDATE ON job_expenses
    FOR EACH ROW
    WHEN (NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved')
    EXECUTE FUNCTION trg_post_job_expense_to_gl();`,

  // General expense approval
  "DROP TRIGGER IF EXISTS trg_post_general_expense_to_gl ON general_expenses;",
  `CREATE TRIGGER trg_post_general_expense_to_gl
    AFTER UPDATE ON general_expenses
    FOR EACH ROW
    WHEN (NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved')
    EXECUTE FUNCTION trg_post_general_expense_to_gl();`,

  // Payroll period paid
  "DROP TRIGGER IF EXISTS trg_post_payroll_period_to_gl ON payroll_periods;",
  `CREATE TRIGGER trg_post_payroll_period_to_gl
    AFTER UPDATE ON payroll_periods
    FOR EACH ROW
    WHEN (NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid')
    EXECUTE FUNCTION trg_post_payroll_period_to_gl();`,

  // Opening balance batch finalized
  "DROP TRIGGER IF EXISTS trg_post_opening_balance_batch_to_gl ON opening_balance_batches;",
  `CREATE TRIGGER trg_post_opening_balance_batch_to_gl
    AFTER UPDATE ON opening_balance_batches
    FOR EACH ROW
    WHEN (NEW.status = 'finalized' AND OLD.status IS DISTINCT FROM 'finalized')
    EXECUTE FUNCTION trg_post_opening_balance_batch_to_gl();`,
];
