import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";

export async function getAIBusinessContext() {
  const supabase = await createClient();
  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness) {
    return null;
  }

  const businessId = activeBusiness.business.id;

  const [
  customersResult,
  productsResult,
  salesResult,
  saleItemsResult,
  ordersResult,
  invoicesResult,
  expensesResult,
  cashflowResult,
] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, balance")
      .eq("business_id", businessId),

    supabase
      .from("products")
      .select(
        "id, name, sku, price, cost_price, stock_quantity, low_stock_threshold"
      )
      .eq("business_id", businessId),

    
      supabase
  .from("sales")
  .select(
    "id, sale_number, status, subtotal, discount, tax, total, amount_paid, balance_due, sold_at"
  )
  .eq("business_id", businessId)
  .order("sold_at", { ascending: false }),

      supabase
  .from("sale_items")
  .select("id, sale_id, product_id, quantity, unit_price, unit_cost, discount, line_total, created_at")
  .eq("business_id", businessId)
  .order("created_at", { ascending: false }),

    supabase
  .from("orders")
  .select(
    "id, order_number, status, subtotal, discount, tax, total, ordered_at"
  )
  .eq("business_id", businessId)
  .order("ordered_at", { ascending: false }),

    supabase
  .from("invoices")
  .select(
    "id, invoice_number, status, subtotal, discount, tax, total, amount_paid, balance_due, issue_date, due_date"
  )
  .eq("business_id", businessId)
  .order("issue_date", { ascending: false }),
    
  supabase
  .from("expenses")
  .select(
    "id, category, description, amount, payment_method, expense_date"
  )
  .eq("business_id", businessId)
  .order("expense_date", { ascending: false }),

    supabase
  .from("cashflow_entries")
  .select(
    "id, type, category, description, amount, payment_method, entry_date, reference"
  )
  .eq("business_id", businessId)
  .order("entry_date", { ascending: false }),
  ]);

  const errors = [
  customersResult.error,
  productsResult.error,
  salesResult.error,
  saleItemsResult.error,
  ordersResult.error,
    invoicesResult.error,
    expensesResult.error,
    cashflowResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
  console.error("AI business context errors:", errors);
  throw new Error("Unable to load complete business context.");
}

  const customers = customersResult.data ?? [];
const products = productsResult.data ?? [];
const sales = salesResult.data ?? [];
const saleItems = saleItemsResult.data ?? [];
const orders = ordersResult.data ?? [];
  const invoices = invoicesResult.data ?? [];
  const expenses = expensesResult.data ?? [];
  const cashflow = cashflowResult.data ?? [];

  const totalCustomerBalance = customers.reduce(
    (sum, customer) => sum + Number(customer.balance || 0),
    0
  );

  const inventoryValueAtCost = products.reduce(
    (sum, product) =>
      sum +
      Number(product.stock_quantity || 0) *
        Number(product.cost_price || 0),
    0
  );

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.stock_quantity || 0) <=
      Number(product.low_stock_threshold || 0)
  );

  const productSalesSummary = products.map((product) => {
  const matchingSaleItems = saleItems.filter(
    (item) => item.product_id === product.id
  );

  const unitsSold = matchingSaleItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const salesValue = matchingSaleItems.reduce(
    (sum, item) => sum + Number(item.line_total || 0),
    0
  );

  return {
    product_id: product.id,
    product_name: product.name,
    sku: product.sku,
    units_sold: unitsSold,
    sales_value: salesValue,
  };
});

const productProfitabilitySummary = products.map((product) => {
  const matchingSaleItems = saleItems.filter(
    (item) => item.product_id === product.id
  );

  const unitsSold = matchingSaleItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const salesValue = matchingSaleItems.reduce(
    (sum, item) => sum + Number(item.line_total || 0),
    0
  );

  const estimatedCostOfGoodsSold = matchingSaleItems.reduce(
  (sum, item) =>
    sum + Number(item.quantity || 0) * Number(item.unit_cost || 0),
  0
);

const grossProfit = salesValue - estimatedCostOfGoodsSold;

  const grossMarginPercentage =
    salesValue > 0 ? (grossProfit / salesValue) * 100 : 0;

  const potentialGrossProfit =
    Number(product.stock_quantity || 0) *
    (Number(product.price || 0) - Number(product.cost_price || 0));

  return {
    product_id: product.id,
    product_name: product.name,
    sku: product.sku,
    units_sold: unitsSold,
    sales_value: salesValue,
    estimated_cost_of_goods_sold: estimatedCostOfGoodsSold,
    gross_profit: grossProfit,
    gross_margin_percentage: grossMarginPercentage,
    current_stock: Number(product.stock_quantity || 0),
    selling_price: Number(product.price || 0),
    cost_price: Number(product.cost_price || 0),
    potential_gross_profit: potentialGrossProfit,
  };
});
  const totalSales = sales.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0
  );

  const totalSalesOutstanding = sales.reduce(
    (sum, sale) => sum + Number(sale.balance_due || 0),
    0
  );

  const totalInvoiceOutstanding = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.balance_due || 0),
    0
  );

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const totalIncome = cashflow
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  const totalCashflowExpenses = cashflow
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  return {
    business: {
      id: activeBusiness.business.id,
      name: activeBusiness.business.name,
      currency: activeBusiness.business.currency,
      industry: activeBusiness.business.industry,
      country: activeBusiness.business.country,
    },

    summary: {
      customer_count: customers.length,
      product_count: products.length,
      sales_count: sales.length,
      order_count: orders.length,
      invoice_count: invoices.length,
      expense_count: expenses.length,
      cashflow_entry_count: cashflow.length,
      total_customer_balance: totalCustomerBalance,
      inventory_value_at_cost: inventoryValueAtCost,
      low_stock_product_count: lowStockProducts.length,
      total_sales: totalSales,
      total_sales_outstanding: totalSalesOutstanding,
      total_invoice_outstanding: totalInvoiceOutstanding,
      total_expenses: totalExpenses,
      total_cashflow_income: totalIncome,
      total_cashflow_expenses: totalCashflowExpenses,
      total_cashflow_net: totalIncome - totalCashflowExpenses,
    },

    customers,
products,
low_stock_products: lowStockProducts,
product_sales_summary: productSalesSummary,
product_profitability_summary: productProfitabilitySummary,
sales,
sale_items: saleItems,
orders,
invoices,
expenses,
cashflow,
  };
}
