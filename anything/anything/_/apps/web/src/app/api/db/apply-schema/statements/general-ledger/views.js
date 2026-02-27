export const views = [
  // -----------------------
  // Vendor A/P balances (from AP tables; fast + simple)
  // -----------------------
  "DROP VIEW IF EXISTS ap_vendor_balances;",
  `CREATE VIEW ap_vendor_balances AS
    WITH paid AS (
      SELECT accounts_payable_id, COALESCE(SUM(amount), 0) AS paid_total
      FROM ap_payments
      GROUP BY accounts_payable_id
    )
    SELECT
      v.id AS vendor_id,
      v.name AS vendor_name,
      round(COALESCE(SUM(ap.amount - COALESCE(p.paid_total, 0)), 0), 2) AS balance
    FROM vendors v
    LEFT JOIN accounts_payable ap ON ap.vendor_id = v.id
      AND ap.is_deleted = false
      AND ap.workflow_status = 'open'
    LEFT JOIN paid p ON p.accounts_payable_id = ap.id
    WHERE v.is_deleted = false
    GROUP BY v.id, v.name;`,
];
