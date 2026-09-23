import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";
import CashflowPageClient from "@/components/cashflow/cashflow-page-client";

export default async function CashflowPage() {
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

  const { data: entries, error } = await supabase
    .from("cashflow_entries")
    .select(
      `
      id,
      business_id,
      type,
      category,
      description,
      amount,
      payment_method,
      entry_date,
      reference,
      notes,
      created_by,
      created_at,
      updated_at
    `
    )
    .eq("business_id", activeBusiness.business.id)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <CashflowPageClient
      initialEntries={entries ?? []}
    />
  );
}