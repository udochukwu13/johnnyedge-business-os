import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


export async function GET(request: Request) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);

  const customerId = searchParams.get("customer_id");


  if (!customerId) {
    return NextResponse.json(
      {
        error: "Customer ID required",
      },
      {
        status: 400,
      }
    );
  }


  const { data: customer, error } = await supabase
    .from("customers")
    .select(
      `
      id,
      name,
      phone,
      email
      `
    )
    .eq("id", customerId)
    .single();


  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }


    const { data: sales, error: salesError } = await supabase
    .from("sales")
    .select(
      `
      id,
      sale_number,
      total,
      amount_paid,
      balance_due,
      sold_at
      `
    )
    .eq("customer_id", customerId)
    .order("sold_at", { ascending: false });


  if (salesError) {
    return NextResponse.json(
      {
        error: salesError.message,
      },
      {
        status: 500,
      }
    );
  }


    const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select(
      `
      id,
      amount,
      payment_method,
      reference,
      notes,
      created_at
      `
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });


  if (paymentsError) {
    return NextResponse.json(
      {
        error: paymentsError.message,
      },
      {
        status: 500,
      }
    );
  }


  return NextResponse.json({
    customer,
    sales: sales || [],
    payments: payments || [],
  });
}