/**
 * Helper to aggregate quantities by unit symbol and format them nicely.
 * Example: [{ quantity: 500, unit: '1' }, { quantity: 300, unit: '2' }] -> "500bgs, 300kg"
 */
export const formatAggregatedQuantities = (
  items: { quantity: number | string; unit?: any; itemId?: any }[] | undefined,
  units: { id: string | number; name: string; symbol: string }[]
): string => {
  if (!items || !Array.isArray(items) || items.length === 0) return "-";

  const aggregation: Record<string, { quantity: number; symbol: string }> = {};

  items.forEach((item) => {
    const qty = Number(item.quantity) || 0;
    if (qty <= 0) return;

    const unitId = item.unit;
    let symbol = "";
    if (unitId) {
      const unit = units.find((u) => String(u.id) === String(unitId));
      if (unit) {
        symbol = unit.symbol.toLowerCase();
      } else {
        symbol = String(unitId).toLowerCase();
      }
    }

    const key = symbol || "qty";
    if (!aggregation[key]) {
      aggregation[key] = { quantity: 0, symbol: symbol };
    }
    aggregation[key].quantity += qty;
  });

  const parts = Object.values(aggregation)
    .filter((a) => a.quantity > 0)
    .map((a) => `${a.quantity}${a.symbol}`);

  return parts.length > 0 ? parts.join(", ") : "-";
};

/**
 * Format a single quantity value with a unit symbol.
 * Example: (500, '1') -> "500bgs"
 */
export const formatSingleQuantity = (
  quantity: number | string,
  unitId: any,
  units: { id: string | number; name: string; symbol: string }[]
): string => {
  const qty = Number(quantity) || 0;
  if (qty <= 0) return "0";
  let symbol = "";
  if (unitId) {
    const unit = units.find((u) => String(u.id) === String(unitId));
    if (unit) {
      symbol = unit.symbol.toLowerCase();
    } else {
      symbol = String(unitId).toLowerCase();
    }
  }
  return `${qty}${symbol}`;
};
