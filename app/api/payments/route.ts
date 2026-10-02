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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    const hasSale = Boolean(sale_id);
    const hasInvoice = Boolean(invoice_id);

    if (hasSale === hasInvoice) {
      return NextResponse.json(
        { error: "Provide exactly one sale or invoice" },
        { status: 400 }
      );
    }

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { error: "Valid payment amount is required" },
        { status: 400 }
      );
    }

    let targetCustomerId =
      typeof customer_id === "string" && customer_id
        ? customer_id
        : null;

    if (invoice_id) {
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select(
          "id, customer_id, total, amount_paid, balance_due"
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

      const currentBalance = Math.max(
        0,
        Number(invoice.balance_due || 0)
      );

      if (currentBalance <= 0) {
        return NextResponse.json(
          { error: "Invoice has no outstanding balance" },
          { status: 400 }
        );
      }

      if (paymentAmount > currentBalance) {
        return NextResponse.json(
          {
            error: "Payment amount cannot exceed outstanding balance",
          },
          { status: 400 }
        );
      }

      targetCustomerId =
        targetCustomerId || invoice.customer_id || null;

      const newAmountPaid =
        Number(invoice.amount_paid || 0) + paymentAmount;

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
      const { data: sale, error: saleError } =
        await supabase
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

      const currentBalance = Math.max(
        0,
        Number(sale.balance_due || 0)
      );

      if (currentBalance <= 0) {
        return NextResponse.json(
          { error: "Sale has no outstanding balance" },
          { status: 400 }
        );
      }

      if (paymentAmount > currentBalance) {
        return NextResponse.json(
          {
            error: "Payment amount cannot exceed outstanding balance",
          },
          { status: 400 }
        );
      }

      targetCustomerId =
        targetCustomerId || sale.customer_id || null;

      const newAmountPaid =
        Number(sale.amount_paid || 0) + paymentAmount;

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

    if (targetCustomerId) {
      const { data: customer, error: customerError } =
        await supabase
          .from("customers")
          .select("id, balance")
          .eq("id", targetCustomerId)
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
        Number(customer.balance || 0) - paymentAmount
      );

      const { error: updateCustomerError } =
        await supabase
          .from("customers")
          .update({
            balance: newCustomerBalance,
          })
          .eq("id", targetCustomerId)
          .eq(
            "business_id",
            activeBusiness.business.id
          );

      if (updateCustomerError) {
        return NextResponse.json(
          { error: updateCustomerError.message },
          { status: 400 }
        );
      }
    }

    const { data: payment, error: paymentError } =
      await supabase
        .from("payments")
        .insert({
          business_id: activeBusiness.business.id,
          customer_id: targetCustomerId,
          sale_id: sale_id || null,
          invoice_id: invoice_id || null,
          amount: paymentAmount,
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

    const { error: cashflowError } =
      await supabase
        .from("cashflow_entries")
        .insert({
          business_id: activeBusiness.business.id,
          type: "income",
          category: "Sales Collection",
          description: "Payment received from customer",
          amount: paymentAmount,
          payment_method: payment_method || "cash",
          entry_date: new Date()
            .toISOString()
            .split("T")[0],
          reference: reference || null,
          notes: notes || null,
          created_by: user.id,
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
