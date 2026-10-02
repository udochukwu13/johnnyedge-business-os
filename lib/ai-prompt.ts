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

export function buildAIBusinessPrompt(
  context: any,
  userMessage = "Provide an executive briefing based on the verified business data.",
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
  }> = []
) {
  const currency = context?.business?.currency || "NGN";

  const formatNumber = (value: unknown) => {
    const number = Number(value || 0);

    return Number.isFinite(number)
      ? number.toLocaleString("en-NG", {
          maximumFractionDigits: 2,
        })
      : "0";
  };

  const historyText =
    conversationHistory.length > 0
      ? conversationHistory
          .map(
            (message) =>
              `${message.role === "user" ? "USER" : "ASSISTANT"}: ${
                message.content
              }`
          )
          .join("\n")
      : "No previous conversation.";

  const summaryText = Object.entries(context?.summary || {})
    .map(([key, value]) => `- ${key}: ${formatNumber(value)}`)
    .join("\n");

  const customersText =
    context?.customers?.length > 0
      ? context.customers.map((item: any) => JSON.stringify(item)).join("\n")
      : "No customer records.";

  const productsText =
    context?.products?.length > 0
      ? context.products.map((item: any) => JSON.stringify(item)).join("\n")
      : "No product records.";

  const lowStockText =
    context?.low_stock_products?.length > 0
      ? context.low_stock_products
          .map((item: any) => JSON.stringify(item))
          .join("\n")
      : "No low-stock products.";

  const productSalesText =
    context?.product_sales_summary?.length > 0
      ? context.product_sales_summary
          .map((item: any) => JSON.stringify(item))
          .join("\n")
      : "No product sales summary.";

  const profitabilityText =
    context?.product_profitability_summary?.length > 0
      ? context.product_profitability_summary
          .map((item: any) => JSON.stringify(item))
          .join("\n")
      : "No product profitability data.";

  const salesText =
    context?.sales?.length > 0
      ? context.sales.map((item: any) => JSON.stringify(item)).join("\n")
      : "No sales records.";

  const saleItemsText =
    context?.sale_items?.length > 0
      ? context.sale_items
          .map((item: any) => JSON.stringify(item))
          .join("\n")
      : "No sale-item records.";

  const ordersText =
    context?.orders?.length > 0
      ? context.orders.map((item: any) => JSON.stringify(item)).join("\n")
      : "No order records.";

  const invoicesText =
    context?.invoices?.length > 0
      ? context.invoices.map((item: any) => JSON.stringify(item)).join("\n")
      : "No invoice records.";

  const expensesText =
    context?.expenses?.length > 0
      ? context.expenses.map((item: any) => JSON.stringify(item)).join("\n")
      : "No expense records.";

  const cashflowText =
    context?.cashflow?.length > 0
      ? context.cashflow.map((item: any) => JSON.stringify(item)).join("\n")
      : "No cashflow records.";

  return `
You are the AI Business Assistant inside JohnnyEdge AI Business OS.

You help the business owner understand and manage the business using the verified live business data supplied below.

BUSINESS
- Name: ${context?.business?.name || "Business"}
- Industry: ${context?.business?.industry || "Not specified"}
- Country: ${context?.business?.country || "Not specified"}
- Currency: ${currency}

CORE RULES

1. Use the supplied business data as the source of truth for business-specific facts.
2. Never invent sales, expenses, customers, products, stock, orders, invoices, cashflow, payments, or profitability figures.
3. If the supplied data cannot answer a question, say so clearly.
4. Distinguish between sales/revenue, cash received, receivables, invoice balances, expenses, inventory value, gross profit, and cashflow.
5. Never treat outstanding receivables as cash received.
6. When calculating a figure, show the calculation briefly when useful.
7. Use the business currency for monetary amounts.
8. Do not expose internal database IDs unless specifically requested.
9. Use previous conversation messages when answering follow-up questions.
10. Do not claim that an action was performed unless the system actually performed it.
11. For analytical questions, distinguish verified facts from analysis and suggested actions.
12. Do not invent missing dates, trends, or comparisons.

BUSINESS SUMMARY

${summaryText}

CUSTOMERS

${customersText}

PRODUCTS

${productsText}

LOW-STOCK PRODUCTS

${lowStockText}

PRODUCT SALES SUMMARY

${productSalesText}

PRODUCT PROFITABILITY

${profitabilityText}

SALES

${salesText}

SALE ITEMS

${saleItemsText}

ORDERS

${ordersText}

INVOICES

${invoicesText}

EXPENSES

${expensesText}

CASHFLOW

${cashflowText}

CONVERSATION HISTORY

${historyText}

CURRENT USER QUESTION

${userMessage}

RESPONSE GUIDELINES

Answer the current question directly first.

For simple factual questions, be concise.

For analytical questions:
- state the relevant figures,
- explain the calculation or comparison,
- provide a practical interpretation.

For management questions, use these sections when appropriate:

## Verified Facts

## Analysis

## Possible Actions

Do not dump raw database records unless the user asks for them.

Remember: the supplied live business context is the authoritative source for business-specific information.
`.trim();
}