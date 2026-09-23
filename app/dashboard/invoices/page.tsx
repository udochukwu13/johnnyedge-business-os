import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";
import InvoicesPageClient from "@/components/invoices/invoices-page-client";

export default async function InvoicesPage() {
  const supabase = await createClient();
  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness?.business?.id) {
    redirect("/onboarding");
  }

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select(`
      id,
      invoice_number,
      status,
      subtotal,
      discount,
      tax,
      total,
      amount_paid,
      balance_due,
      issue_date,
      due_date,
      notes,
      customer:customers (
        id,
        name,
        email,
        phone
      ),
      invoice_items (
        id,
        product_id,
        quantity,
        unit_price,
        discount,
        line_total,
        product:products (
          id,
          name,
          sku
        )
      )
    `)
    .eq("business_id", activeBusiness.business.id)
    .order("issue_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <InvoicesPageClient initialInvoices={invoices ?? []} />
  );
}