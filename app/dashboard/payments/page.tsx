import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";
import PaymentsPageClient from "@/components/payments/payments-page-client";

export default async function PaymentsPage() {
  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness?.business?.id) {
    return null;
  }

  const supabase = await createClient();

  const businessId = activeBusiness.business.id;

  const { data: sales, error } = await supabase
    .from("sales")
    .select(
      `
      id,
      sale_number,
      total,
      amount_paid,
      balance_due,
      sold_at,
      customer:customers (
        id,
        name
      )
      `
    )
    .eq("business_id", businessId)
    .gt("balance_due", 0)
    .order("sold_at", { ascending: false });

    const { data: payments, error: paymentsError } = await supabase
  .from("payments")
  .select(
    `
    id,
    amount,
    payment_method,
    reference,
    notes,
    created_at,
    customer:customers (
      id,
      name
    )
    `
  )
  .eq("business_id", businessId)
  .order("created_at", { ascending: false });


  if (error || paymentsError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        Unable to load payments data:
        {error?.message || paymentsError?.message}
      </div>
    );
  }


  return (
  <PaymentsPageClient
    sales={(sales || []).map((sale) => ({
      id: sale.id,
      sale_number: sale.sale_number,
      total: Number(sale.total || 0),
      amount_paid: Number(sale.amount_paid || 0),
      balance_due: Number(sale.balance_due || 0),
      sold_at: sale.sold_at,
      customer: Array.isArray(sale.customer)
        ? sale.customer[0]
        : sale.customer,
    }))}
    payments={(payments || []).map((payment) => ({
  id: payment.id,
  amount: Number(payment.amount || 0),
  payment_method: payment.payment_method,
  reference: payment.reference,
  notes: payment.notes,
  created_at: payment.created_at,
  customer: Array.isArray(payment.customer)
    ? payment.customer[0]
    : payment.customer,
}))}
    currency={activeBusiness.business.currency || "₦"}
  />
);
}