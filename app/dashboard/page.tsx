import { ArrowUpRight, Bot, Package, ShoppingCart, Sparkles, Users, Wallet } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";
import ManagementSummary from "@/components/dashboard/management-summary";
import AIBriefing from "@/components/dashboard/ai-briefing";
import BusinessAlerts from "@/components/dashboard/business-alerts";
import InventoryIntelligence from "@/components/dashboard/inventory-intelligence";
import {
  buildDashboardAIInsightPrompt,
  buildAIBusinessPrompt,
} from "@/lib/ai-prompt";
import { generateBusinessAIResponse } from "@/lib/ai/business-ai";



const quickActions = ["Add customer", "Add product", "Create sale", "Create invoice"];

export default async function DashboardPage() {
    const supabase = await createClient();
  const activeBusiness = await getActiveBusiness();

  const businessId = activeBusiness?.business?.id;

let totalSales = 0;
let totalCustomers = 0;
let totalProducts = 0;
let totalExpenses = 0;
let salesOutstanding = 0;
let invoiceOutstanding = 0;
let customerBalances = 0;
let inventoryValue = 0;
let lowStockProducts = 0;
let totalUnitsInStock = 0;
let inventorySalesValue = 0;
let inventoryPotentialProfit = 0;

let totalCOGS = 0;
let grossProfit = 0;
let grossMargin = 0;
let provisionalProfit = 0;
let totalCashReceived = 0;
let totalReceivables = 0;
let netCashFlow = 0;

let businessAlerts: {
  type: "warning" | "danger" | "success";
  title: string;
  message: string;
}[] = [];

let aiBusinessInsights: string[] = [];
let dashboardAIInsight = "";

let recentSales: {
  id: string;
  sale_number: string | null;
  total: number;
  balance_due: number;
  sold_at: string;
  customers: {
    name: string | null;
  } | null;
}[] = [];

let topProducts: {
  product_id: string;
  product_name: string;
  units_sold: number;
  sales: number;
  gross_profit: number;
}[] = [];

  const { data: sales } = await supabase
  .from("sales")
  .select("id, sale_number, total, balance_due, sold_at, customers(name)")
  .eq("business_id", businessId)
  .order("sold_at", { ascending: false });

  totalSales = (sales ?? []).reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0
  );

  salesOutstanding = (sales ?? []).reduce(
  (sum, sale) => sum + Number(sale.balance_due || 0),
  0
);
totalCashReceived = (sales ?? []).reduce(
  (sum, sale) =>
    sum +
    (Number(sale.total || 0) - Number(sale.balance_due || 0)),
  0
);

recentSales = (sales ?? []).slice(0, 5);

const { data: saleItems } = await supabase
  .from("sale_items")
  .select("product_id, quantity, line_total, unit_cost, products(name)")
  .eq("business_id", businessId);

  const productPerformance = new Map<
  string,
  {
    product_name: string;
    units_sold: number;
    sales: number;
    gross_profit: number;
  }
>();

(saleItems ?? []).forEach((item) => {
  const productName =
    Array.isArray(item.products)
      ? item.products[0]?.name ?? "Unknown product"
      : item.products?.name ?? "Unknown product";

  const existing = productPerformance.get(item.product_id);

  const quantity = Number(item.quantity || 0);
  const sales = Number(item.line_total || 0);
  const cost = quantity * Number(item.unit_cost || 0);
  const grossProfit = sales - cost;
  
  totalCOGS += cost;

  if (existing) {
    existing.units_sold += quantity;
    existing.sales += sales;
    existing.gross_profit += grossProfit;
  } else {
    productPerformance.set(item.product_id, {
      product_name: productName,
      units_sold: quantity,
      sales,
      gross_profit: grossProfit,
    });
  }
});

grossProfit = totalSales - totalCOGS;
grossMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

topProducts = Array.from(productPerformance.entries())
  .map(([product_id, data]) => ({
    product_id,
    ...data,
  }))
  .sort((a, b) => b.sales - a.sales)
  .slice(0, 5);

  const { count: customerCount } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId);

  totalCustomers = customerCount ?? 0;
  const { data: products, count: productCount } = await supabase
  .from("products")
  .select(
  "id, name, stock_quantity, cost_price, price, low_stock_threshold",
  { count: "exact" }
)
  .eq("business_id", businessId);

totalProducts = productCount ?? 0;
const inventoryProducts = (products ?? []).map((product) => {
  const stock = Number(product.stock_quantity || 0);
  const costPrice = Number(product.cost_price || 0);
  const sellingPrice = Number(product.price || 0);

  return {
    product_name: product.name,
    units_in_stock: stock,
    inventory_cost: stock * costPrice,
    inventory_sales_value: stock * sellingPrice,
    potential_gross_profit: stock * (sellingPrice - costPrice),
  };
});

inventoryValue = (products ?? []).reduce(
  (sum, product) =>
    sum +
    Number(product.stock_quantity || 0) *
    Number(product.cost_price || 0),
  0
);
totalUnitsInStock = (products ?? []).reduce(
  (sum, product) => sum + Number(product.stock_quantity || 0),
  0
);

inventorySalesValue = (products ?? []).reduce(
  (sum, product) =>
    sum +
    Number(product.stock_quantity || 0) *
      Number(product.price || 0),
  0
);

inventoryPotentialProfit = inventorySalesValue - inventoryValue;
lowStockProducts = (products ?? []).filter(
  (product) =>
    Number(product.stock_quantity || 0) <=
    Number(product.low_stock_threshold || 0)
).length;

const { data: expenses } = await supabase
  .from("expenses")
  .select("amount")
  .eq("business_id", businessId);

totalExpenses = (expenses ?? []).reduce(
  (sum, expense) => sum + Number(expense.amount || 0),
  0
);

provisionalProfit = grossProfit - totalExpenses;

const { data: invoices } = await supabase
  .from("invoices")
  .select("balance_due")
  .eq("business_id", businessId);

invoiceOutstanding = (invoices ?? []).reduce(
  (sum, invoice) => sum + Number(invoice.balance_due || 0),
  0
);
totalReceivables = salesOutstanding + invoiceOutstanding;
netCashFlow = totalCashReceived - totalExpenses;

if (salesOutstanding > 0) {
  businessAlerts.push({
    type: "warning",
    title: "Sales payments outstanding",
    message: `₦${salesOutstanding.toLocaleString()} is still outstanding from recorded sales.`,
  });
}

if (invoiceOutstanding > 0) {
  businessAlerts.push({
    type: "warning",
    title: "Invoices awaiting payment",
    message: `₦${invoiceOutstanding.toLocaleString()} is currently outstanding on invoices.`,
  });
}

if (lowStockProducts > 0) {
  businessAlerts.push({
    type: "danger",
    title: "Low-stock products",
    message: `${lowStockProducts} product${
      lowStockProducts === 1 ? "" : "s"
    } need inventory attention.`,
  });
}

if (grossProfit > 0) {
  businessAlerts.push({
    type: "success",
    title: "Business is generating gross profit",
    message: `Current gross profit is ₦${grossProfit.toLocaleString()} at a ${grossMargin.toFixed(
      1
    )}% gross margin.`,
  });
}

if (grossMargin >= 30) {
  aiBusinessInsights.push(
    `Your current gross margin is ${grossMargin.toFixed(
      1
    )}%, indicating that your recorded sales are generating a healthy gross profit relative to sales.`
  );
} else if (grossMargin > 0) {
  aiBusinessInsights.push(
    `Your current gross margin is ${grossMargin.toFixed(
      1
    )}%. Monitor product pricing and costs as you grow sales.`
  );
}

if (totalReceivables > 0) {
  aiBusinessInsights.push(
    `₦${totalReceivables.toLocaleString()} is currently tied up in receivables, so collecting outstanding payments could improve available cash.`
  );
}

if (inventoryValue > 0) {
  aiBusinessInsights.push(
    `Your current inventory represents ₦${inventoryValue.toLocaleString()} at cost, which means a significant amount of capital is currently tied up in stock.`
  );
}

if (topProducts.length > 0) {
  const topProduct = topProducts[0];
  aiBusinessInsights.push(
    `${topProduct.product_name} is currently your leading product by sales, generating ₦${topProduct.sales.toLocaleString()} from ${topProduct.units_sold.toLocaleString()} unit${
      topProduct.units_sold === 1 ? "" : "s"
    }.`
  );
}

const dashboardPrompt = buildDashboardAIInsightPrompt({
  businessName: activeBusiness?.business?.name ?? "Business",
  currency: activeBusiness?.business?.currency ?? "₦",
  totalSales,
  totalCOGS,
  grossProfit,
  grossMargin,
  totalExpenses,
  provisionalProfit,
  totalCashReceived,
  salesOutstanding,
  invoiceOutstanding,
  totalReceivables,
  inventoryValue,
  inventorySalesValue,
  inventoryPotentialProfit,
  totalUnitsInStock,
  lowStockProducts,
    topProducts,
  inventoryProducts,
  alerts: businessAlerts,
});

try {
  dashboardAIInsight = await generateBusinessAIResponse(dashboardPrompt);
} catch (error) {
  console.error("Dashboard AI insight error:", error);
  dashboardAIInsight = "";
}

const { data: customers } = await supabase
  .from("customers")
  .select("balance")
  .eq("business_id", businessId);

customerBalances = (customers ?? []).reduce(
  (sum, customer) => sum + Number(customer.balance || 0),
  0
);
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-500">Dashboard</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Business overview</h1>
        <p className="mt-2 text-slate-600">Your JohnnyEdge business workspace is ready.</p>
      </div>
<ManagementSummary
  currency={activeBusiness?.business?.currency ?? "₦"}
  grossProfit={grossProfit}
  grossMargin={grossMargin}
  totalReceivables={totalReceivables}
  inventoryValue={inventoryValue}
  totalUnitsInStock={totalUnitsInStock}
/>
      <section className="mb-8 rounded-3xl bg-slate-950 p-8 text-white">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300"><Sparkles size={17} /> JohnnyEdge AI</div>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">Your intelligent business assistant is being built here.</h2>
            <p className="mt-3 leading-7 text-slate-400">
              Soon you will be able to ask questions such as “How much did I sell this month?”,
              “Which customers owe me?” and “Which products are running low?”
            </p>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10"><Bot size={30} /></div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
        <ShoppingCart size={19} />
      </div>
      <ArrowUpRight size={17} className="text-slate-400" />
    </div>

    <div className="mt-5 text-sm text-slate-500">Total Sales</div>

    <div className="mt-1 text-2xl font-bold text-slate-950">
      ₦{totalSales.toLocaleString()}
    </div>

    <div className="mt-1 text-xs text-slate-500">
      Total recorded sales
    </div>
  </div>

  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
        <Users size={19} />
      </div>
      <ArrowUpRight size={17} className="text-slate-400" />
    </div>

    <div className="mt-5 text-sm text-slate-500">Customers</div>

    <div className="mt-1 text-2xl font-bold text-slate-950">
      {totalCustomers.toLocaleString()}
    </div>

    <div className="mt-1 text-xs text-slate-500">
      Total registered customers
    </div>
  </div>

  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
        <Package size={19} />
      </div>
      <ArrowUpRight size={17} className="text-slate-400" />
    </div>

    <div className="mt-5 text-sm text-slate-500">Products</div>

    <div className="mt-1 text-2xl font-bold text-slate-950">
      {totalProducts.toLocaleString()}
    </div>

    <div className="mt-1 text-xs text-slate-500">
      Total registered products
    </div>
  </div>
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
      <Wallet size={19} />
    </div>
    <ArrowUpRight size={17} className="text-slate-400" />
  </div>

  <div className="mt-5 text-sm text-slate-500">Expenses</div>

  <div className="mt-1 text-2xl font-bold text-slate-950">
    ₦{totalExpenses.toLocaleString()}
  </div>

  <div className="mt-1 text-xs text-slate-500">
    Total recorded expenses
  </div>
</div>
</section>

<section className="mt-8">
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-slate-500">
          Inventory Value at Cost
        </div>

        <div className="mt-2 text-2xl font-bold text-slate-950">
          ₦{inventoryValue.toLocaleString()}
        </div>

        <div className="mt-1 text-xs text-slate-500">
          Estimated value of current stock at cost
        </div>
      </div>

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
        <Package size={19} />
      </div>
    </div>
  </div>
</section>
<section className="mt-8">
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-slate-500">
          Low Stock Products
        </div>

        <div className="mt-2 text-2xl font-bold text-slate-950">
          {lowStockProducts}
        </div>

        <div className="mt-1 text-xs text-slate-500">
          Products at or below their low-stock threshold
        </div>
      </div>

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
        <Package size={19} />
      </div>
    </div>
  </div>
</section>
<section className="mt-8 grid gap-6 md:grid-cols-2">
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-slate-500">
          Sales Outstanding
        </div>

        <div className="mt-2 text-2xl font-bold text-slate-950">
          ₦{salesOutstanding.toLocaleString()}
        </div>

        <div className="mt-1 text-xs text-slate-500">
          Unpaid balance from recorded sales
        </div>
      </div>

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
        <Wallet size={19} />
      </div>
    </div>
  </div>

  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-slate-500">
          Invoice Outstanding
        </div>

        <div className="mt-2 text-2xl font-bold text-slate-950">
          ₦{invoiceOutstanding.toLocaleString()}
        </div>

        <div className="mt-1 text-xs text-slate-500">
          Unpaid invoice balances
        </div>
      </div>

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
        <Wallet size={19} />
      </div>
    </div>
  </div>
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <div className="text-sm font-medium text-slate-500">
        Customer Balances
      </div>

      <div className="mt-2 text-2xl font-bold text-slate-950">
        ₦{customerBalances.toLocaleString()}
      </div>

      <div className="mt-1 text-xs text-slate-500">
        Total customer account balances
      </div>
    </div>

    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
      <Users size={19} />
    </div>
  </div>
</div>
</section>

<section className="mt-8">
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5">
      <div className="text-sm font-medium text-slate-500">
        Cash Flow Overview
      </div>

      <div className="mt-1 text-lg font-semibold text-slate-950">
        Current cash position
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl bg-slate-50 p-4">
        <div className="text-sm text-slate-500">
          Cash Received
        </div>

        <div className="mt-2 text-2xl font-semibold text-slate-950">
          ₦{totalCashReceived.toLocaleString()}
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <div className="text-sm text-slate-500">
          Sales Outstanding
        </div>

        <div className="mt-2 text-2xl font-semibold text-slate-950">
          ₦{salesOutstanding.toLocaleString()}
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <div className="text-sm text-slate-500">
          Total Receivables
        </div>

        <div className="mt-2 text-2xl font-semibold text-slate-950">
          ₦{totalReceivables.toLocaleString()}
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <div className="text-sm text-slate-500">
          Net Cash Flow
        </div>

        <div className="mt-2 text-2xl font-semibold text-emerald-600">
          ₦{netCashFlow.toLocaleString()}
        </div>
      </div>
    </div>
  </div>
</section>


<AIBriefing
  currency={activeBusiness?.business?.currency ?? "₦"}
  dashboardAIInsight={dashboardAIInsight}
  grossProfit={grossProfit}
  grossMargin={grossMargin}
  totalReceivables={totalReceivables}
  inventoryValue={inventoryValue}
  totalUnitsInStock={totalUnitsInStock}
/>

<BusinessAlerts
  businessAlerts={businessAlerts}
/>

<InventoryIntelligence
  currency={activeBusiness?.business?.currency ?? "₦"}
  inventoryValue={inventoryValue}
  totalUnitsInStock={totalUnitsInStock}
  totalProducts={totalProducts}
  inventorySalesValue={inventorySalesValue}
  inventoryPotentialProfit={inventoryPotentialProfit}
  lowStockProducts={lowStockProducts}
/>
<section className="mt-8">
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5">
      <div className="text-sm font-medium text-slate-500">
        Profitability Overview
      </div>

      <div className="mt-1 text-lg font-semibold text-slate-950">
        Business profit performance
      </div>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-xl bg-slate-50 p-4">
        <div className="text-sm text-slate-500">
          Gross Sales
        </div>

        <div className="mt-2 text-2xl font-semibold text-slate-950">
          ₦{totalSales.toLocaleString()}
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <div className="text-sm text-slate-500">
          Cost of Goods Sold
        </div>

        <div className="mt-2 text-2xl font-semibold text-slate-950">
          ₦{totalCOGS.toLocaleString()}
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <div className="text-sm text-slate-500">
          Gross Profit
        </div>

        <div className="mt-2 text-2xl font-semibold text-emerald-600">
          ₦{grossProfit.toLocaleString()}
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <div className="text-sm text-slate-500">
          Gross Margin
        </div>

        <div className="mt-2 text-2xl font-semibold text-slate-950">
          {grossMargin.toFixed(1)}%
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <div className="text-sm text-slate-500">
          Operating Expenses
        </div>

        <div className="mt-2 text-2xl font-semibold text-slate-950">
          ₦{totalExpenses.toLocaleString()}
        </div>
      </div>

      <div className="rounded-xl bg-slate-50 p-4">
        <div className="text-sm text-slate-500">
          Provisional Profit
        </div>

        <div className="mt-2 text-2xl font-semibold text-emerald-600">
          ₦{provisionalProfit.toLocaleString()}
        </div>
      </div>
    </div>
  </div>
</section>

<section className="mt-8">
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5">
      <div className="text-sm font-medium text-slate-500">
        Top Products
      </div>

      <div className="mt-1 text-lg font-semibold text-slate-950">
        Sales performance by product
      </div>
    </div>

    <div className="overflow-x-auto">
      {topProducts.length === 0 ? (
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          No product sales have been recorded yet.
        </div>
      ) : (
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-3 font-medium">Product</th>
              <th className="pb-3 text-right font-medium">Units Sold</th>
              <th className="pb-3 text-right font-medium">Sales</th>
              <th className="pb-3 text-right font-medium">Gross Profit</th>
            </tr>
          </thead>

          <tbody>
            {topProducts.map((product) => (
              <tr
                key={product.product_id}
                className="border-b border-slate-100 last:border-0"
              >
                <td className="py-4 font-medium text-slate-950">
                  {product.product_name}
                </td>

                <td className="py-4 text-right text-slate-700">
                  {product.units_sold.toLocaleString()}
                </td>

                <td className="py-4 text-right font-medium text-slate-950">
                  ₦{product.sales.toLocaleString()}
                </td>

                <td className="py-4 text-right font-semibold text-emerald-600">
                  ₦{product.gross_profit.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  </div>
</section>

<section className="mt-8">
  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5">
      <div className="text-sm font-medium text-slate-500">
        Recent Sales
      </div>

      <div className="mt-1 text-lg font-semibold text-slate-950">
        Latest recorded sales
      </div>
    </div>

    <div className="space-y-4">
      {recentSales.length === 0 ? (
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          No sales have been recorded yet.
        </div>
      ) : (
        recentSales.map((sale) => (
          <div
            key={sale.id}
            className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="font-medium text-slate-950">
                {sale.sale_number || "Sale"}
              </div>

              <div className="mt-1 text-sm text-slate-700">
                {sale.customers?.name || "Unknown customer"}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                {new Date(sale.sold_at).toLocaleDateString()}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="font-semibold text-slate-950">
                ₦{Number(sale.total || 0).toLocaleString()}
              </div>

              <div className="mt-1 text-xs text-slate-500">
                Balance due: ₦
                {Number(sale.balance_due || 0).toLocaleString()}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
</section>
 

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-950">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-500">Common actions you will use to run your business.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <button key={action} className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
                + {action}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-950">Getting started</h2>
          <div className="mt-5 space-y-4">
            {["Business workspace created", "Authentication secured", "Database security enabled", "Customer management coming next"].map((item, index) => (
              <div key={item} className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">{index + 1}</div>
                <span className="text-sm text-slate-600">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}