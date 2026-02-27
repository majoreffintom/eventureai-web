export const payrollStatements = [
  `CREATE TABLE IF NOT EXISTS payroll_period_employees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_period_id uuid NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
    employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    total_billable_minutes integer NOT NULL DEFAULT 0,
    hourly_rate_snapshot numeric(12,2) NOT NULL,
    gross_pay numeric(12,2) GENERATED ALWAYS AS (round((total_billable_minutes / 60.0) * hourly_rate_snapshot, 2)) STORED,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT payroll_period_employees_unique UNIQUE (payroll_period_id, employee_id),
    CONSTRAINT payroll_period_employees_minutes_chk CHECK (total_billable_minutes >= 0)
  );`,
];
