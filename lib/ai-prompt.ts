export function buildDashboardAIInsightPrompt(data: any) {
  // Safe helper function for formatting numbers
  const fmt = (val: any) => (typeof val === "number" ? val.toLocaleString() : "0");
  const currency = data?.currency || "NGN";

  const topProductsText =
    data?.topProducts && data.topProducts.length > 0
      ? data.topProducts
          .map(
            (p: any) =>
              `- ${p.name || "Unknown Product"}: ${currency}${fmt(p.sales ?? p.totalSales)} sales, ${currency}${fmt(p.profit ?? p.grossProfit)} gross profit (${fmt(p.units ?? p.unitsSold)} units sold)`
          )
          .join("\n")
      : "No top products data available.";

  const inventoryProductsText =
    data?.inventoryProducts && data.inventoryProducts.length > 0
      ? data.inventoryProducts
          .map((p: any) => {
            const name = p.name || p.product_name || p.title || p.item_name || "Uncategorized Item";
            
            const units =
              p.units ??
              p.unitsInStock ??
              p.units_in_stock ??
              p.quantity ??
              p.stock_quantity ??
              p.stock_qty ??
              p.quantity_on_hand ??
              p.stock ??
              p.qty ??
              0;
            
            const unitCost = p.unit_cost ?? p.unitCost ?? p.cost_price ?? p.costPrice ?? 0;
            const cost = p.cost ?? p.total_cost ?? p.inventory_cost ?? (unitCost * units);
            
            const potentialProfit =
              p.potentialProfit ??
              p.potential_profit ??
              p.potential_gross_profit ??
              p.projected_profit ??
              p.expected_profit ??
              p.profit ??
              0;

            return `- ${name}: ${currency}${fmt(cost)} cost, ${fmt(units)} units, ${currency}${fmt(potentialProfit)} potential gross profit`;
          })
          .join("\n")
      : "No inventory product data available.";

  const alertsText =
    data?.alerts && data.alerts.length > 0
      ? data.alerts.map((a: any) => `- [${(a.type || "INFO").toUpperCase()}] ${a.message}`).join("\n")
      : "No active business alerts.";

  const grossProfit = data?.grossProfit ?? 0;
  const grossMargin = typeof data?.grossMargin === "number" ? data.grossMargin.toFixed(1) : "0.0";
  const totalReceivables = data?.totalReceivables ?? 0;
  const inventoryValue = data?.inventoryValue ?? 0;
  const inventoryPotentialProfit = data?.inventoryPotentialProfit ?? 0;
  const totalSales = data?.totalSales ?? 0;
  const totalCOGS = data?.totalCOGS ?? 0;
  const totalExpenses = data?.totalExpenses ?? 0;
  const provisionalProfit = data?.provisionalProfit ?? 0;
  const totalCashReceived = data?.totalCashReceived ?? 0;
  const salesOutstanding = data?.salesOutstanding ?? 0;
  const invoiceOutstanding = data?.invoiceOutstanding ?? 0;
  const totalUnitsInStock = data?.totalUnitsInStock ?? 0;
  const lowStockProducts = data?.lowStockProducts ?? 0;

  return `
You are an expert executive CFO and management intelligence assistant for ${data?.businessName || "Johnny Edge Limited"}.

Prepare a clear, structured Executive Briefing using ONLY the verified figures supplied below.

CRITICAL INSTRUCTIONS FOR FORMATTING:
1. Start directly with an "Executive Status Matrix" using a Markdown table.
2. Follow the matrix with concise sections for key performance facts and management action items.
3. Keep the tone professional, direct, and actionable for decision-makers.

Required Structure:

## Executive Status Matrix
| Focus Area | Status | Key Metric | Strategic Assessment |
| :--- | :--- | :--- | :--- |
| **Gross Profit** | 🟢 Positive | ${currency}${fmt(grossProfit)} | ${grossMargin}% gross margin |
| **Receivables** | 🟡 Attention | ${currency}${fmt(totalReceivables)} | Sales + invoice balances |
| **Inventory Capital** | 🟠 High Concentration | ${currency}${fmt(inventoryValue)} | Total stock at cost |
| **Potential Gross Profit** | 🔵 Opportunity | ${currency}${fmt(inventoryPotentialProfit)} | Embedded in current stock |

## Financial & Cash Breakdown
- **Sales & Margins:** Total sales of ${currency}${fmt(totalSales)} with COGS of ${currency}${fmt(totalCOGS)} yielding ${currency}${fmt(grossProfit)} gross profit (${grossMargin}%).
- **Profitability:** Operating expenses at ${currency}${fmt(totalExpenses)}, leaving a provisional profit of ${currency}${fmt(provisionalProfit)} (this is provisional and not net profit).
- **Cash Position:** ${currency}${fmt(totalCashReceived)} cash collected vs. ${currency}${fmt(totalReceivables)} in total receivables (${currency}${fmt(salesOutstanding)} sales outstanding + ${currency}${fmt(invoiceOutstanding)} invoices). Do NOT treat receivables as cash received.

## Inventory & Product Exposure
- **Inventory Position:** Total inventory value of ${currency}${fmt(inventoryValue)} across ${fmt(totalUnitsInStock)} units (${lowStockProducts} low-stock items).
- **Potential Revenue:** Inventory sales value is ${currency}${fmt(data?.inventorySalesValue)} with potential future gross profit of ${currency}${fmt(inventoryPotentialProfit)}.
- **Product Details:**
${inventoryProductsText}

## Management Action Items
- **Collections:** Follow up on receivables to improve cash availability.
- **Inventory Concentration:** Monitor product concentration in inventory to manage demand risk.
- **Expense Control:** Maintain current margin relative to operating expenses.

VERIFIED DATA CONTEXT:
Business: ${data?.businessName || "Johnny Edge Limited"}
Top Products Data:
${topProductsText}

Alerts Data:
${alertsText}
`.trim();
}

// Backwards compatibility alias for components referencing buildAIBusinessPrompt
export const buildAIBusinessPrompt = buildDashboardAIInsightPrompt;