import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";

export async function POST(request: Request) {
  try {
    const activeBusiness = await getActiveBusiness();

    if (!activeBusiness?.business?.id) {
      return NextResponse.json(
        { error: "No active business found" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const body = await request.json();

const {
  customer_id,
  sale_id,
  invoice_id,
  amount,
  payment_method,
  reference,
  notes,
} = body;


if (!sale_id && !invoice_id) {
  return NextResponse.json(
    { error: "Sale or invoice is required" },
    { status: 400 }
  );
}
if (!amount || Number(amount) <= 0) {
  return NextResponse.json(
    { error: "Valid payment amount is required" },
    { status: 400 }
  );
}
const { data: payment, error: paymentError } = await supabase
  .from("payments")
  .insert({
  business_id: activeBusiness.business.id,
  customer_id: customer_id || null,
  sale_id: sale_id || null,
  invoice_id: invoice_id || null,
  amount: Number(amount),
    payment_method: payment_method || "cash",
    reference: reference || null,
    notes: notes || null,
  })
  .select()
  .single();

if (paymentError) {
  return NextResponse.json(
    { error: paymentError.message },
    { status: 400 }
  );
}
// Update invoice if payment belongs to invoice
if (invoice_id) {
  const { data: invoice, error: invoiceError } = await supabase
    .from("invoices")
    .select(
      "id, total, amount_paid, balance_due"
    )
    .eq("id", invoice_id)
    .eq("business_id", activeBusiness.business.id)
    .single();


  if (invoiceError || !invoice) {
    return NextResponse.json(
      { error: "Invoice not found" },
      { status: 404 }
    );
  }


  const newAmountPaid =
    Number(invoice.amount_paid || 0) + Number(amount);


  const newBalanceDue = Math.max(
    0,
    Number(invoice.total || 0) - newAmountPaid
  );


  const { error: updateInvoiceError } =
    await supabase
      .from("invoices")
      .update({
        amount_paid: newAmountPaid,
        balance_due: newBalanceDue,
        status:
          newBalanceDue === 0
            ? "paid"
            : "partial",
      })
      .eq("id", invoice_id)
      .eq(
        "business_id",
        activeBusiness.business.id
      );


  if (updateInvoiceError) {
    return NextResponse.json(
      { error: updateInvoiceError.message },
      { status: 400 }
    );
  }
}
if (sale_id) {

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .select(
      "id, total, amount_paid, balance_due, customer_id"
    )
    .eq("id", sale_id)
    .eq("business_id", activeBusiness.business.id)
    .single();


  if (saleError || !sale) {
    return NextResponse.json(
      { error: "Sale not found" },
      { status: 404 }
    );
  }


  const newAmountPaid =
    Number(sale.amount_paid || 0) + Number(amount);


  const newBalanceDue = Math.max(
    0,
    Number(sale.total || 0) - newAmountPaid
  );


  const { error: updateSaleError } =
    await supabase
      .from("sales")
      .update({
        amount_paid: newAmountPaid,
        balance_due: newBalanceDue,
        status:
          newBalanceDue === 0
            ? "paid"
            : "partial",
      })
      .eq("id", sale_id)
      .eq(
        "business_id",
        activeBusiness.business.id
      );


  if (updateSaleError) {
    return NextResponse.json(
      { error: updateSaleError.message },
      { status: 400 }
    );
  }

}
if (sale_id) {
  const newAmountPaid =
    Number(sale.amount_paid || 0) + Number(amount);

  const newBalanceDue = Math.max(
    0,
    Number(sale.total || 0) - newAmountPaid
  );

  const { error: updateSaleError } = await supabase
    .from("sales")
    .update({
      amount_paid: newAmountPaid,
      balance_due: newBalanceDue,
      status:
        newBalanceDue === 0
          ? "paid"
          : "partial",
    })
    .eq("id", sale_id)
    .eq(
      "business_id",
      activeBusiness.business.id
    );

  if (updateSaleError) {
    return NextResponse.json(
      { error: updateSaleError.message },
      { status: 400 }
    );
  }
}
const { data: customer, error: customerError } = await supabase
  .from("customers")
  .select("id, balance")
  .eq("id", customer_id)
  .eq("business_id", activeBusiness.business.id)
  .single();

if (customerError || !customer) {
  return NextResponse.json(
    { error: "Customer not found" },
    { status: 404 }
  );
}
const newCustomerBalance = Math.max(
  0,
  Number(customer.balance || 0) - Number(amount)
);

const { error: updateCustomerError } = await supabase
  .from("customers")
  .update({
    balance: newCustomerBalance,
  })
  .eq("id", customer_id)
  .eq("business_id", activeBusiness.business.id);

if (updateCustomerError) {
  return NextResponse.json(
    { error: updateCustomerError.message },
    { status: 400 }
  );
}
const { error: cashflowError } = await supabase
  .from("cashflow_entries")
  .insert({
    business_id: activeBusiness.business.id,
    type: "income",
    category: "Sales Collection",
    description: "Payment received from customer",
    amount: Number(amount),
    payment_method: payment_method || "cash",
    entry_date: new Date().toISOString().split("T")[0],
    reference: reference || null,
    notes: notes || null,
    created_by: activeBusiness.business.created_by,
  });

if (cashflowError) {
  return NextResponse.json(
    { error: cashflowError.message },
    { status: 400 }
  );
}
return NextResponse.json({
  success: true,
  message: "Payment recorded successfully",
  payment,
});
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong",
      },
      { status: 500 }
    );
  }
}