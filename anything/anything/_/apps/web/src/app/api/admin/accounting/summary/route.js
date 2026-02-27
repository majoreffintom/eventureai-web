import sql from "@/app/api/utils/sql";
import requireAdmin from "@/app/api/utils/requireAdmin";

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(request) {
  try {
    const guard = await requireAdmin(request);
    if (!guard.ok) {
      return guard.response;
    }

    const [cashRows, arRows, apRows, profitRows, seriesRows] =
      await sql.transaction((txn) => [
        // Cash: opening balance + transactions
        txn(
          `SELECT ba.id,
                  ba.name,
                  round((ba.opening_balance + COALESCE(SUM(bt.amount), 0)), 2) AS balance
             FROM bank_accounts ba
             LEFT JOIN bank_transactions bt
               ON bt.bank_account_id = ba.id
              AND bt.is_deleted = false
            WHERE ba.is_deleted = false
            GROUP BY ba.id
            ORDER BY ba.name ASC`,
        ),

        // Accounts receivable: sum of open invoice balances
        txn(
          `SELECT round(COALESCE(SUM(ia.balance_due), 0), 2) AS total
             FROM invoice_amounts ia
             JOIN invoices i ON i.id = ia.invoice_id
            WHERE i.is_deleted = false
              AND i.workflow_status <> 'deleted'
              AND i.workflow_status <> 'void'
              AND i.payment_status IN ('unpaid', 'partial')`,
        ),

        // Accounts payable: bill amount - payments
        txn(
          `WITH bill_paid AS (
              SELECT ap.id AS accounts_payable_id,
                     COALESCE(SUM(p.amount), 0) AS paid
                FROM accounts_payable ap
                LEFT JOIN ap_payments p ON p.accounts_payable_id = ap.id
               WHERE ap.is_deleted = false
                 AND ap.workflow_status <> 'deleted'
               GROUP BY ap.id
            )
            SELECT round(
              COALESCE(
                SUM(GREATEST(ap.amount - bp.paid, 0)),
                0
              ),
              2
            ) AS total
              FROM accounts_payable ap
              JOIN bill_paid bp ON bp.accounts_payable_id = ap.id
             WHERE ap.is_deleted = false
               AND ap.workflow_status = 'open'
               AND ap.payment_status IN ('unpaid', 'partial')`,
        ),

        // Profit snapshot: last 30 days
        txn(
          `WITH revenue AS (
              SELECT round(COALESCE(SUM(ia.total), 0), 2) AS val
                FROM invoice_amounts ia
                JOIN invoices i ON i.id = ia.invoice_id
               WHERE i.is_deleted = false
                 AND i.workflow_status <> 'deleted'
                 AND i.workflow_status <> 'void'
                 AND i.invoice_date >= (CURRENT_DATE - INTERVAL '30 days')
            ),
            expenses AS (
              SELECT round(COALESCE(SUM(total_amount), 0), 2) AS val
                FROM (
                  SELECT ge.total_amount
                    FROM general_expenses ge
                   WHERE ge.is_deleted = false
                     AND ge.expense_date >= (CURRENT_DATE - INTERVAL '30 days')

                  UNION ALL

                  SELECT je.total_amount
                    FROM job_expenses je
                   WHERE je.is_deleted = false
                     AND je.expense_date >= (CURRENT_DATE - INTERVAL '30 days')
                ) x
            )
            SELECT (SELECT val FROM revenue) AS revenue_30,
                   (SELECT val FROM expenses) AS expenses_30,
                   round((SELECT val FROM revenue) - (SELECT val FROM expenses), 2) AS net_30`,
        ),

        // Revenue vs expenses by month (last 6 months incl current)
        txn(
          `WITH months AS (
              SELECT date_trunc('month', CURRENT_DATE) - (n || ' months')::interval AS month_start
                FROM generate_series(0, 5) n
            ),
            rev AS (
              SELECT date_trunc('month', i.invoice_date)::date AS month_start,
                     round(COALESCE(SUM(ia.total), 0), 2) AS revenue
                FROM invoice_amounts ia
                JOIN invoices i ON i.id = ia.invoice_id
               WHERE i.is_deleted = false
                 AND i.workflow_status <> 'deleted'
                 AND i.workflow_status <> 'void'
                 AND i.invoice_date >= (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')
               GROUP BY 1
            ),
            exp AS (
              SELECT date_trunc('month', d)::date AS month_start,
                     round(COALESCE(SUM(total_amount), 0), 2) AS expenses
                FROM (
                  SELECT ge.expense_date AS d, ge.total_amount
                    FROM general_expenses ge
                   WHERE ge.is_deleted = false
                     AND ge.expense_date >= (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')

                  UNION ALL

                  SELECT je.expense_date AS d, je.total_amount
                    FROM job_expenses je
                   WHERE je.is_deleted = false
                     AND je.expense_date >= (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')
                ) x
               GROUP BY 1
            )
            SELECT to_char(m.month_start, 'YYYY-MM') AS month,
                   COALESCE(r.revenue, 0) AS revenue,
                   COALESCE(e.expenses, 0) AS expenses
              FROM months m
              LEFT JOIN rev r ON r.month_start = m.month_start::date
              LEFT JOIN exp e ON e.month_start = m.month_start::date
             ORDER BY m.month_start ASC`,
        ),
      ]);

    const cashAccounts = (cashRows || []).map((r) => ({
      id: r.id,
      name: r.name,
      balance: toNumber(r.balance),
    }));

    const cashTotal = cashAccounts.reduce(
      (sum, a) => sum + toNumber(a.balance),
      0,
    );

    const arTotal = toNumber(arRows?.[0]?.total);
    const apTotal = toNumber(apRows?.[0]?.total);

    const profit = profitRows?.[0] || {};

    return Response.json({
      cash: {
        accounts: cashAccounts,
        total: Number(cashTotal.toFixed(2)),
      },
      ar: { total: arTotal },
      ap: { total: apTotal },
      profit: {
        revenue_30: toNumber(profit.revenue_30),
        expenses_30: toNumber(profit.expenses_30),
        net_30: toNumber(profit.net_30),
      },
      series: (seriesRows || []).map((r) => ({
        month: r.month,
        revenue: toNumber(r.revenue),
        expenses: toNumber(r.expenses),
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/accounting/summary error", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
