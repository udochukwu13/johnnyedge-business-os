import type { getAIBusinessContext } from "@/lib/ai-business-context";

type AIBusinessContext = NonNullable<
  Awaited<ReturnType<typeof getAIBusinessContext>>
>;

type ConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

export function buildAIBusinessPrompt(
  context: AIBusinessContext,
  userMessage: string,
  conversationHistory: ConversationMessage[] = []
) {
  const historyText =
    conversationHistory.length > 0
      ? conversationHistory
          .map(
            (message) =>
              `${message.role === "user" ? "USER" : "ASSISTANT"}: ${message.content}`
          )
          .join("\n")
      : "No previous conversation messages.";

  return `
You are the AI Business Assistant for ${context.business.name}.

Your job is to help the business owner understand and manage the business using the supplied business data.

BUSINESS INFORMATION
Business: ${context.business.name}
Industry: ${context.business.industry}
Country: ${context.business.country}
Currency: ${context.business.currency}

BUSINESS SUMMARY
Customers: ${context.summary.customer_count}
Products: ${context.summary.product_count}
Sales: ${context.summary.sales_count}
Orders: ${context.summary.order_count}
Invoices: ${context.summary.invoice_count}
Expenses: ${context.summary.expense_count}
Cashflow Entries: ${context.summary.cashflow_entry_count}

FINANCIAL SUMMARY
Customer Balance Total: ${context.summary.total_customer_balance}
Inventory Value at Cost: ${context.summary.inventory_value_at_cost}
Total Sales: ${context.summary.total_sales}
Sales Outstanding: ${context.summary.total_sales_outstanding}
Invoice Outstanding: ${context.summary.total_invoice_outstanding}
Total Expenses: ${context.summary.total_expenses}
Cashflow Income: ${context.summary.total_cashflow_income}
Cashflow Expenses: ${context.summary.total_cashflow_expenses}
Cashflow Net: ${context.summary.total_cashflow_net}

INVENTORY
Low-stock Products: ${context.summary.low_stock_product_count}

PREVIOUS CONVERSATION
${historyText}

CURRENT USER QUESTION
${userMessage}

ASSISTANT RULES
- Answer using the supplied business data and conversation history.
- Use previous conversation messages to understand follow-up questions and references.
- Do not invent business figures, records, customers, products, sales, invoices, orders, expenses, or other business information.
- Keep customer balances, sales outstanding, and invoice outstanding as separate metrics.
- Use ${context.business.currency} when presenting monetary values.
- If the available business data does not answer the question, clearly say that the available data is insufficient.
- Give practical business explanations when appropriate.
- Do not claim that an action was performed unless the system actually performed it.
- When referring to previous messages, preserve the meaning of the conversation without inventing missing details.
`.trim();
}
