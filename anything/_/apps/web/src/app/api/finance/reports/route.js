import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const report_type = searchParams.get("report_type"); // 'overview', 'profit_loss', 'cash_flow', 'app_performance'
    const period = searchParams.get("period"); // '2024-01', '2024-Q1', '2024', 'last_30_days'
    const app_id = searchParams.get("app_id");

    let reportData = {};

    switch (report_type) {
      case "overview":
        reportData = await generateOverviewReport(period, app_id);
        break;
      case "profit_loss":
        reportData = await generateProfitLossReport(period, app_id);
        break;
      case "cash_flow":
        reportData = await generateCashFlowReport(period, app_id);
        break;
      case "app_performance":
        reportData = await generateAppPerformanceReport(period, app_id);
        break;
      default:
        return Response.json({ error: "Invalid report type" }, { status: 400 });
    }

    return Response.json({
      success: true,
      report_type,
      period,
      app_id,
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating financial report:", error);
    return Response.json(
      { error: "Failed to generate report", details: error.message },
      { status: 500 },
    );
  }
}

async function generateOverviewReport(period, app_id) {
  const dateFilter = buildDateFilter(period);
  const appFilter = app_id ? `AND t.app_id = ${app_id}` : "";

  // Revenue summary
  const revenue = await sql`
    SELECT 
      SUM(CASE WHEN transaction_type = 'revenue' THEN amount ELSE 0 END) as total_revenue,
      SUM(CASE WHEN transaction_type = 'revenue' THEN net_amount ELSE 0 END) as net_revenue,
      COUNT(CASE WHEN transaction_type = 'revenue' THEN 1 END) as revenue_transactions
    FROM transactions t
    WHERE ${dateFilter}${appFilter}
  `;

  // Expense summary
  const expenses = await sql`
    SELECT 
      SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expenses,
      COUNT(CASE WHEN transaction_type = 'expense' THEN 1 END) as expense_transactions
    FROM transactions t
    WHERE ${dateFilter}${appFilter}
  `;

  // Customer metrics
  const customers = await sql`
    SELECT 
      COUNT(DISTINCT c.id) as total_customers,
      COUNT(DISTINCT CASE WHEN c.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN c.id END) as new_customers_30d
    FROM customers c
    ${
      app_id
        ? `
    LEFT JOIN transactions t ON t.customer_id = c.id
    WHERE t.app_id = ${app_id}
    `
        : ""
    }
  `;

  // Active subscriptions
  const subscriptions = await sql`
    SELECT 
      COUNT(*) as active_subscriptions,
      SUM(mrr) as total_mrr,
      SUM(arr) as total_arr
    FROM subscriptions s
    WHERE s.status = 'active'
    ${app_id ? `AND s.app_id = ${app_id}` : ""}
  `;

  const revenueData = revenue[0] || {};
  const expenseData = expenses[0] || {};
  const customerData = customers[0] || {};
  const subscriptionData = subscriptions[0] || {};

  return {
    revenue: {
      total: parseFloat(revenueData.total_revenue || 0),
      net: parseFloat(revenueData.net_revenue || 0),
      transactions: parseInt(revenueData.revenue_transactions || 0),
    },
    expenses: {
      total: parseFloat(expenseData.total_expenses || 0),
      transactions: parseInt(expenseData.expense_transactions || 0),
    },
    profit:
      parseFloat(revenueData.net_revenue || 0) -
      parseFloat(expenseData.total_expenses || 0),
    customers: {
      total: parseInt(customerData.total_customers || 0),
      new_30d: parseInt(customerData.new_customers_30d || 0),
    },
    subscriptions: {
      active: parseInt(subscriptionData.active_subscriptions || 0),
      mrr: parseFloat(subscriptionData.total_mrr || 0),
      arr: parseFloat(subscriptionData.total_arr || 0),
    },
  };
}

async function generateProfitLossReport(period, app_id) {
  const dateFilter = buildDateFilter(period);
  const appFilter = app_id ? `AND t.app_id = ${app_id}` : "";

  // Revenue by category
  const revenueByCategory = await sql`
    SELECT 
      rc.name as category,
      rc.category_type,
      SUM(t.amount) as total,
      SUM(t.net_amount) as net_total,
      COUNT(*) as transaction_count
    FROM transactions t
    JOIN revenue_categories rc ON t.revenue_category_id = rc.id
    WHERE t.transaction_type = 'revenue' AND ${dateFilter}${appFilter}
    GROUP BY rc.id, rc.name, rc.category_type
    ORDER BY total DESC
  `;

  // Expenses by category
  const expensesByCategory = await sql`
    SELECT 
      ec.name as category,
      ec.category_type,
      SUM(t.amount) as total,
      COUNT(*) as transaction_count,
      ec.budget_monthly
    FROM transactions t
    JOIN expense_categories ec ON t.expense_category_id = ec.id
    WHERE t.transaction_type = 'expense' AND ${dateFilter}${appFilter}
    GROUP BY ec.id, ec.name, ec.category_type, ec.budget_monthly
    ORDER BY total DESC
  `;

  // Monthly trends
  const monthlyTrends = await sql`
    SELECT 
      DATE_TRUNC('month', transaction_date) as month,
      SUM(CASE WHEN transaction_type = 'revenue' THEN net_amount ELSE 0 END) as revenue,
      SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as expenses
    FROM transactions t
    WHERE ${dateFilter}${appFilter}
    GROUP BY DATE_TRUNC('month', transaction_date)
    ORDER BY month
  `;

  return {
    revenue: {
      by_category: revenueByCategory.map((r) => ({
        category: r.category,
        type: r.category_type,
        total: parseFloat(r.total),
        net: parseFloat(r.net_total),
        count: parseInt(r.transaction_count),
      })),
      total: revenueByCategory.reduce(
        (sum, r) => sum + parseFloat(r.net_total || 0),
        0,
      ),
    },
    expenses: {
      by_category: expensesByCategory.map((e) => ({
        category: e.category,
        type: e.category_type,
        total: parseFloat(e.total),
        count: parseInt(e.transaction_count),
        budget: parseFloat(e.budget_monthly || 0),
      })),
      total: expensesByCategory.reduce(
        (sum, e) => sum + parseFloat(e.total || 0),
        0,
      ),
    },
    monthly_trends: monthlyTrends.map((m) => ({
      month: m.month,
      revenue: parseFloat(m.revenue || 0),
      expenses: parseFloat(m.expenses || 0),
      profit: parseFloat(m.revenue || 0) - parseFloat(m.expenses || 0),
    })),
  };
}

async function generateCashFlowReport(period, app_id) {
  const dateFilter = buildDateFilter(period);
  const appFilter = app_id ? `AND app_id = ${app_id}` : "";

  // Daily cash flow
  const dailyCashFlow = await sql`
    SELECT 
      transaction_date,
      SUM(CASE WHEN transaction_type = 'revenue' THEN net_amount ELSE -amount END) as net_flow,
      SUM(CASE WHEN transaction_type = 'revenue' THEN net_amount ELSE 0 END) as inflow,
      SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as outflow
    FROM transactions
    WHERE ${dateFilter}${appFilter}
    GROUP BY transaction_date
    ORDER BY transaction_date
  `;

  // Calculate running balance
  let runningBalance = 0;
  const cashFlowWithBalance = dailyCashFlow.map((day) => {
    runningBalance += parseFloat(day.net_flow || 0);
    return {
      date: day.transaction_date,
      inflow: parseFloat(day.inflow || 0),
      outflow: parseFloat(day.outflow || 0),
      net_flow: parseFloat(day.net_flow || 0),
      running_balance: runningBalance,
    };
  });

  return {
    daily_flow: cashFlowWithBalance,
    summary: {
      total_inflow: cashFlowWithBalance.reduce((sum, d) => sum + d.inflow, 0),
      total_outflow: cashFlowWithBalance.reduce((sum, d) => sum + d.outflow, 0),
      net_flow: cashFlowWithBalance.reduce((sum, d) => sum + d.net_flow, 0),
      final_balance: runningBalance,
    },
  };
}

async function generateAppPerformanceReport(period, app_id) {
  const dateFilter = buildDateFilter(period);

  // Performance by app
  const appPerformance = await sql`
    SELECT 
      a.id,
      a.name,
      a.app_type,
      SUM(CASE WHEN t.transaction_type = 'revenue' THEN t.net_amount ELSE 0 END) as revenue,
      SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END) as expenses,
      COUNT(DISTINCT t.customer_id) as unique_customers,
      COUNT(CASE WHEN t.transaction_type = 'revenue' THEN 1 END) as revenue_transactions
    FROM apps a
    LEFT JOIN transactions t ON t.app_id = a.id AND ${dateFilter}
    ${app_id ? `WHERE a.id = ${app_id}` : ""}
    GROUP BY a.id, a.name, a.app_type
    ORDER BY revenue DESC
  `;

  // Subscription metrics per app
  const subscriptionMetrics = await sql`
    SELECT 
      a.id as app_id,
      a.name as app_name,
      COUNT(s.id) as active_subscriptions,
      SUM(s.mrr) as total_mrr,
      AVG(s.plan_price) as avg_plan_price
    FROM apps a
    LEFT JOIN subscriptions s ON s.app_id = a.id AND s.status = 'active'
    ${app_id ? `WHERE a.id = ${app_id}` : ""}
    GROUP BY a.id, a.name
  `;

  return {
    apps: appPerformance.map((app) => {
      const subMetrics =
        subscriptionMetrics.find((s) => s.app_id === app.id) || {};
      return {
        id: app.id,
        name: app.name,
        type: app.app_type,
        revenue: parseFloat(app.revenue || 0),
        expenses: parseFloat(app.expenses || 0),
        profit: parseFloat(app.revenue || 0) - parseFloat(app.expenses || 0),
        customers: parseInt(app.unique_customers || 0),
        transactions: parseInt(app.revenue_transactions || 0),
        subscriptions: {
          active: parseInt(subMetrics.active_subscriptions || 0),
          mrr: parseFloat(subMetrics.total_mrr || 0),
          avg_price: parseFloat(subMetrics.avg_plan_price || 0),
        },
      };
    }),
  };
}

function buildDateFilter(period) {
  if (!period) return "true";

  if (period === "last_30_days") {
    return `transaction_date >= CURRENT_DATE - INTERVAL '30 days'`;
  }

  if (period === "last_90_days") {
    return `transaction_date >= CURRENT_DATE - INTERVAL '90 days'`;
  }

  if (period.includes("Q")) {
    // Handle quarters like '2024-Q1'
    const [year, quarter] = period.split("-Q");
    const startMonth = (parseInt(quarter) - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    return `transaction_date >= '${year}-${startMonth.toString().padStart(2, "0")}-01' 
            AND transaction_date <= '${year}-${endMonth.toString().padStart(2, "0")}-31'`;
  }

  if (period.length === 4) {
    // Year like '2024'
    return `EXTRACT(year FROM transaction_date) = ${period}`;
  }

  if (period.length === 7) {
    // Month like '2024-01'
    return `DATE_TRUNC('month', transaction_date) = '${period}-01'::date`;
  }

  return "true";
}
