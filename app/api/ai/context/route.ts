import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAIBusinessContext } from "@/lib/ai-business-context";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const context = await getAIBusinessContext();

    if (!context) {
      return NextResponse.json(
        { error: "No active business found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      business: context.business,
      summary: context.summary,
      counts: {
        customers: context.customers.length,
        products: context.products.length,
        low_stock_products: context.low_stock_products.length,
        sales: context.sales.length,
        orders: context.orders.length,
        invoices: context.invoices.length,
        expenses: context.expenses.length,
        cashflow: context.cashflow.length,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load business context." },
      { status: 500 }
    );
  }
}
