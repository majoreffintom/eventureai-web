import { useMemo } from "react";

export function useInventoryData(itemsQuery, stockRows) {
  const items = itemsQuery.data?.items || [];

  const itemById = useMemo(() => {
    const map = new Map();
    for (const i of items) {
      map.set(i.id, i);
    }
    return map;
  }, [items]);

  const stockByItemId = useMemo(() => {
    const map = new Map();
    const rows = Array.isArray(stockRows) ? stockRows : [];
    for (const r of rows) {
      const itemId = r.item_id;
      if (!map.has(itemId)) {
        map.set(itemId, []);
      }
      map.get(itemId).push(r);
    }
    return map;
  }, [stockRows]);

  return {
    items,
    itemById,
    stockByItemId,
  };
}
