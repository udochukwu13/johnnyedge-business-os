import type { getAIBusinessContext } from "@/lib/ai-business-context";

type AIBusinessContext = NonNullable<
  Awaited<ReturnType<typeof getAIBusinessContext>>
>;

export type BusinessInsight = {
  type:
    | "low_stock"
    | "sales_outstanding"
    | "invoice_outstanding"
    | "customer_balance"
    | "cashflow"
    | "expense";
  priority: "high" | "medium" | "info";
  title: string;
  description: string;
};

export function buildBusinessInsights(
  context: AIBusinessContext
): BusinessInsight[] {
  const insights: BusinessInsight[] = [];

  if (context.low_stock_products.length > 0) {
    insights.push({
      type: "low_stock",
      priority: "high",
      title: "Low-stock products need attention",
      description: `${context.low_stock_products.length} product(s) are at or below their configured low-stock threshold.`,
    });
  }

  if (context.summary.total_sales_outstanding > 0) {
    insights.push({
      type: "sales_outstanding",
      priority: "high",
      title: "Sales have outstanding balances",
      description: `Recorded sales currently have ${context.business.currency} ${context.summary.total_sales_outstanding.toLocaleString()} classified as outstanding.`,
    });
  }

  if (context.summary.total_invoice_outstanding > 0) {
    insights.push({
      type: "invoice_outstanding",
      priority: "high",
      title: "Invoices have unpaid balances",
      description: `Invoices currently have ${context.business.currency} ${context.summary.total_invoice_outstanding.toLocaleString()} outstanding.`,
    });
  }

  if (context.summary.total_customer_balance > 0) {
    insights.push({
      type: "customer_balance",
      priority: "medium",
      title: "Customer balances are recorded",
      description: `Customer records currently contain ${context.business.currency} ${context.summary.total_customer_balance.toLocaleString()} in stored balances.`,
    });
  }

  if (context.summary.total_cashflow_income > 0) {
    insights.push({
      type: "cashflow",
      priority: "info",
      title: "Cashflow income is recorded",
      description: `Recorded cashflow income is ${context.business.currency} ${context.summary.total_cashflow_income.toLocaleString()}.`,
    });
  }

  if (context.summary.total_expenses > 0) {
    insights.push({
      type: "expense",
      priority: "info",
      title: "Expenses are recorded",
      description: `Recorded expenses total ${context.business.currency} ${context.summary.total_expenses.toLocaleString()}.`,
    });
  }

  return insights;
}
