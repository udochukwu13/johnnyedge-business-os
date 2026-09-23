import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";
import ExpensesPageClient from "@/components/expenses/expenses-page-client";

export default async function ExpensesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness) {
    redirect("/onboarding");
  }

  const { data: expenses, error } = await supabase
    .from("expenses")
    .select(
      `
      id,
      business_id,
      category,
      description,
      amount,
      payment_method,
      expense_date,
      notes,
      created_at,
      updated_at
    `
    )
    .eq("business_id", activeBusiness.business.id)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <ExpensesPageClient
      initialExpenses={expenses ?? []}
    />
  );
}