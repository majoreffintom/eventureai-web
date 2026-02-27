import { createBaseRecords } from "./utils/createBaseRecords";
import { cleanup } from "./utils/cleanup";
import { runTest } from "./utils/runTest";
import { chartOfAccountsTest } from "./tests/chartOfAccountsTest";
import { orphanJobsTest } from "./tests/orphanJobsTest";
import { customerRestrictTest } from "./tests/customerRestrictTest";
import { customerSoftDeleteTest } from "./tests/customerSoftDeleteTest";
import { uniqueJobAssignmentsTest } from "./tests/uniqueJobAssignmentsTest";
import { invoiceAllocationTest } from "./tests/invoiceAllocationTest";
import { vendorRestrictTest } from "./tests/vendorRestrictTest";
import { jobExpenseSoftDeleteTest } from "./tests/jobExpenseSoftDeleteTest";
import { timeclockTest } from "./tests/timeclockTest";
import { accountsPayableTest } from "./tests/accountsPayableTest";
import { openingBalancesTest } from "./tests/openingBalancesTest";
import { paymentAllocationTest } from "./tests/paymentAllocationTest";
import { creditMemoDraftTest } from "./tests/creditMemoDraftTest";
import { creditMemoBalanceTest } from "./tests/creditMemoBalanceTest";
import { creditMemoMultiInvoiceTest } from "./tests/creditMemoMultiInvoiceTest";
import { creditMemoFullCreditTest } from "./tests/creditMemoFullCreditTest";
import { bankImportTest } from "./tests/bankImportTest";
import { glInvoicePostingTest } from "./tests/glInvoicePostingTest";
import { glPaymentAllocationPostingTest } from "./tests/glPaymentAllocationPostingTest";

// New comprehensive tests
import { employeeConstraintsTest } from "./tests/employeeConstraintsTest";
import { generalLedgerTest } from "./tests/generalLedgerTest";
import { openingBalancesFullTest } from "./tests/openingBalancesFullTest";
import { bankReconciliationTest } from "./tests/bankReconciliationTest";
import { invoiceToGLTest } from "./tests/invoiceToGLTest";
import { paymentToGLTest } from "./tests/paymentToGLTest";
import { expenseToGLTest } from "./tests/expenseToGLTest";
import { serviceRevenueMappingTest } from "./tests/serviceRevenueMappingTest";
import { comprehensiveIntegrationTest } from "./tests/comprehensiveIntegrationTest";

export async function GET() {
  const results = [];

  results.push(
    await runTest("chart of accounts seed exists", chartOfAccountsTest),
  );

  results.push(await runTest("prevents orphan jobs", orphanJobsTest));

  // ---------- Scenario A: payment is bigger than invoice (test invoice-balance over-allocation) ----------
  const recA = await createBaseRecords({ paymentAmount: 200.0 });
  try {
    results.push(
      await runTest("prevents deleting a customer with jobs (RESTRICT)", () =>
        customerRestrictTest(recA.customerId),
      ),
    );

    results.push(
      await runTest("supports soft delete on customers", () =>
        customerSoftDeleteTest(recA.customerId),
      ),
    );

    results.push(
      await runTest("enforces unique job assignments", () =>
        uniqueJobAssignmentsTest(recA.jobId, recA.employeeId),
      ),
    );

    results.push(
      await runTest("prevents allocating more than invoice balance", () =>
        invoiceAllocationTest(recA.paymentId, recA.invoiceId),
      ),
    );

    results.push(
      await runTest("prevents deleting vendor with linked job expense", () =>
        vendorRestrictTest(recA.jobId, recA.employeeId),
      ),
    );

    results.push(
      await runTest("enforces soft delete constraints on job_expenses", () =>
        jobExpenseSoftDeleteTest(recA.jobId, recA.employeeId),
      ),
    );

    results.push(
      await runTest("prevents timeclock clock_out before clock_in", () =>
        timeclockTest(recA.employeeId, recA.jobId),
      ),
    );

    results.push(
      await runTest(
        "A/P payments: prevents overpay + recomputes bill payment_status",
        accountsPayableTest,
      ),
    );

    results.push(
      await runTest(
        "opening balances: cannot finalize unless balanced",
        openingBalancesTest,
      ),
    );
  } finally {
    await cleanup(recA);
  }

  // ---------- Scenario B: payment smaller than invoice (test payment-remaining over-allocation) ----------
  const recB = await createBaseRecords({ paymentAmount: 100.0 });
  try {
    results.push(
      await runTest("prevents allocating more than payment amount", () =>
        paymentAllocationTest(recB.paymentId, recB.invoiceId),
      ),
    );
  } finally {
    await cleanup(recB);
  }

  // ---------- Scenario C: credit memo application rules + bank import matching rules ----------
  const recC = await createBaseRecords({ paymentAmount: 10.0 });
  try {
    results.push(
      await runTest("credit memos: blocks applying draft/voided credits", () =>
        creditMemoDraftTest(recC.customerId, recC.invoiceId),
      ),
    );

    results.push(
      await runTest(
        "credit memos: blocks applying more than invoice balance",
        () => creditMemoBalanceTest(recC.customerId, recC.invoiceId),
      ),
    );

    results.push(
      await runTest(
        "credit memos: enforces remaining credit across multiple invoices + updates invoice_amounts",
        () =>
          creditMemoMultiInvoiceTest(
            recC.customerId,
            recC.invoiceId,
            recC.employeeId,
          ),
      ),
    );

    results.push(
      await runTest(
        "credit memos: can fully credit an invoice and mark it paid",
        () => creditMemoFullCreditTest(recC.customerId, recC.invoiceId),
      ),
    );

    results.push(
      await runTest(
        "bank imports: enforces unique fit_id per bank account and unique linking",
        () => bankImportTest(recC.paymentId),
      ),
    );
  } finally {
    await cleanup(recC);
  }

  results.push(
    await runTest(
      "GL: invoice posting creates a balanced journal entry",
      glInvoicePostingTest,
    ),
  );

  results.push(
    await runTest(
      "GL: payment allocation posting creates a balanced journal entry",
      glPaymentAllocationPostingTest,
    ),
  );

  // ---------- New Comprehensive Tests ----------
  results.push(
    await runTest(
      "Employee constraints: pay types, email uniqueness, soft delete",
      employeeConstraintsTest,
    ),
  );

  results.push(
    await runTest(
      "General Ledger: journal entries, balanced lines, posting",
      generalLedgerTest,
    ),
  );

  results.push(
    await runTest(
      "Opening Balances: full workflow with batch posting",
      openingBalancesFullTest,
    ),
  );

  results.push(
    await runTest(
      "Bank Reconciliation: create, add items, complete workflow",
      bankReconciliationTest,
    ),
  );

  results.push(
    await runTest(
      "Invoice to GL: create invoice, line items, send, GL posting",
      invoiceToGLTest,
    ),
  );

  results.push(
    await runTest(
      "Payment to GL: allocate payment, update status, GL posting",
      paymentToGLTest,
    ),
  );

  results.push(
    await runTest(
      "Expense to GL: job & general expenses, approval, GL posting",
      expenseToGLTest,
    ),
  );

  results.push(
    await runTest(
      "Service Revenue Mapping: category to account mapping",
      serviceRevenueMappingTest,
    ),
  );

  results.push(
    await runTest(
      "Comprehensive Integration: full business workflow end-to-end",
      comprehensiveIntegrationTest,
    ),
  );

  const passed = results.every((r) => r.passed);
  return Response.json({ ok: passed, results });
}
