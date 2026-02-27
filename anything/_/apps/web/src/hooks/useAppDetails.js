import { useQuery } from "@tanstack/react-query";

export function useAppDetails(selectedApp) {
  const { data: appDetails } = useQuery({
    queryKey: ["app-details", selectedApp?.id],
    queryFn: async () => {
      if (!selectedApp) return null;
      const [revenueRes, expenseRes] = await Promise.all([
        fetch(`/api/finance/reports?type=app_revenue&app_id=${selectedApp.id}`),
        fetch(
          `/api/finance/reports?type=app_expenses&app_id=${selectedApp.id}`,
        ),
      ]);

      const revenue = revenueRes.ok ? await revenueRes.json() : { total: 0 };
      const expenses = expenseRes.ok ? await expenseRes.json() : { total: 0 };

      return { revenue, expenses };
    },
    enabled: !!selectedApp,
  });

  return { appDetails };
}
