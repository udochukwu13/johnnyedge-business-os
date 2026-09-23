import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";

type InvoiceItemInput = {
  product_id: string;
  quantity: number;
  unit_price?: number;
  discount?: number;
};

const INVOICE_STATUSES = [
  "draft",
  "sent",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
] as const;

function calculateLineTotal(
  quantity: number,
  unitPrice: number,
  discount: number
) {
  return Math.max(quantity * unitPrice - discount, 0);
}

function calculateInvoiceTotals(
  items: Array<{
    quantity: number;
    unit_price: number;
    discount: number;
  }>,
  invoiceDiscount: number,
  tax: number
) {
  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      calculateLineTotal(
        item.quantity,
        item.unit_price,
        item.discount
      ),
    0
  );

  const total = Math.max(subtotal - invoiceDiscount + tax, 0);

  return {
    subtotal,
    discount: invoiceDiscount,
    tax,
    total,
  };
}

async function getBusinessContext() {
  const supabase = await createClient();
  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness?.business?.id) {
    return {
      supabase,
      business: null,
      user: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    supabase,
    business: activeBusiness.business,
    user,
  };
}

export async function GET() {
  try {
    const { supabase, business, user } = await getBusinessContext();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!business) {
      return NextResponse.json(
        { error: "No active business found" },
        { status: 400 }
      );
    }

    const { data: invoices, error } = await supabase
      .from("invoices")
      .select(`
        id,
        business_id,
        customer_id,
        sale_id,
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
        created_by,
        created_at,
        updated_at,
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
      .eq("business_id", business.id)
      .order("issue_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET /api/invoices error:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      invoices: invoices ?? [],
    });
  } catch (error) {
    console.error("GET /api/invoices unexpected error:", error);

    return NextResponse.json(
      { error: "Failed to load invoices" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, business, user } = await getBusinessContext();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!business) {
      return NextResponse.json(
        { error: "No active business found" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const customerId =
      typeof body.customer_id === "string" && body.customer_id.trim()
        ? body.customer_id.trim()
        : null;

    const saleId =
      typeof body.sale_id === "string" && body.sale_id.trim()
        ? body.sale_id.trim()
        : null;

    const invoiceNumber =
      typeof body.invoice_number === "string"
        ? body.invoice_number.trim()
        : "";

    const status =
      typeof body.status === "string" && body.status.trim()
        ? body.status.trim()
        : "draft";

    const issueDate =
      typeof body.issue_date === "string" && body.issue_date.trim()
        ? body.issue_date.trim()
        : new Date().toISOString().slice(0, 10);

    const dueDate =
      typeof body.due_date === "string" && body.due_date.trim()
        ? body.due_date.trim()
        : null;

    const notes =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim()
        : null;

    const invoiceDiscount = Number(body.discount ?? 0);
    const tax = Number(body.tax ?? 0);
    const amountPaid = Number(body.amount_paid ?? 0);

    if (!invoiceNumber) {
      return NextResponse.json(
        { error: "Invoice number is required" },
        { status: 400 }
      );
    }

    if (!INVOICE_STATUSES.includes(status as (typeof INVOICE_STATUSES)[number])) {
      return NextResponse.json(
        { error: "Invalid invoice status" },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(invoiceDiscount) ||
      invoiceDiscount < 0 ||
      !Number.isFinite(tax) ||
      tax < 0 ||
      !Number.isFinite(amountPaid) ||
      amountPaid < 0
    ) {
      return NextResponse.json(
        { error: "Invalid invoice financial values" },
        { status: 400 }
      );
    }

    if (customerId) {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("id", customerId)
        .eq("business_id", business.id)
        .maybeSingle();

      if (customerError) {
        return NextResponse.json(
          { error: customerError.message },
          { status: 500 }
        );
      }

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found for this business" },
          { status: 400 }
        );
      }
    }

    if (saleId) {
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .select("id")
        .eq("id", saleId)
        .eq("business_id", business.id)
        .maybeSingle();

      if (saleError) {
        return NextResponse.json(
          { error: saleError.message },
          { status: 500 }
        );
      }

      if (!sale) {
        return NextResponse.json(
          { error: "Sale not found for this business" },
          { status: 400 }
        );
      }
    }

    const rawItems = Array.isArray(body.items)
      ? (body.items as InvoiceItemInput[])
      : [];

    if (!rawItems.length) {
      return NextResponse.json(
        { error: "At least one invoice item is required" },
        { status: 400 }
      );
    }

    const mergedItems = new Map<
      string,
      {
        product_id: string;
        quantity: number;
        unit_price: number;
        discount: number;
      }
    >();

    for (const item of rawItems) {
      if (!item || typeof item.product_id !== "string") {
        return NextResponse.json(
          { error: "Each invoice item must have a product" },
          { status: 400 }
        );
      }

      const quantity = Number(item.quantity);
      const unitPriceProvided = item.unit_price !== undefined;
      const discount = Number(item.discount ?? 0);

      if (!Number.isFinite(quantity) || quantity <= 0) {
        return NextResponse.json(
          { error: "Invoice item quantity must be greater than zero" },
          { status: 400 }
        );
      }

      if (
        unitPriceProvided &&
        (!Number.isFinite(Number(item.unit_price)) ||
          Number(item.unit_price) < 0)
      ) {
        return NextResponse.json(
          { error: "Invoice item unit price is invalid" },
          { status: 400 }
        );
      }

      if (!Number.isFinite(discount) || discount < 0) {
        return NextResponse.json(
          { error: "Invoice item discount is invalid" },
          { status: 400 }
        );
      }

      const existing = mergedItems.get(item.product_id);

      if (existing) {
        existing.quantity += quantity;
        existing.discount += discount;

        if (unitPriceProvided) {
          existing.unit_price = Number(item.unit_price);
        }
      } else {
        mergedItems.set(item.product_id, {
          product_id: item.product_id,
          quantity,
          unit_price: unitPriceProvided
            ? Number(item.unit_price)
            : 0,
          discount,
        });
      }
    }

    const productIds = Array.from(mergedItems.keys());

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price")
      .eq("business_id", business.id)
      .in("id", productIds);

    if (productsError) {
      return NextResponse.json(
        { error: productsError.message },
        { status: 500 }
      );
    }

    if (!products || products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products were not found for this business" },
        { status: 400 }
      );
    }

    const productMap = new Map(
      products.map((product) => [product.id, product])
    );

    const normalizedItems = productIds.map((productId) => {
      const item = mergedItems.get(productId)!;
      const product = productMap.get(productId)!;

      const unitPrice =
        item.unit_price > 0
          ? item.unit_price
          : Number(product.price ?? 0);

      const lineTotal = calculateLineTotal(
        item.quantity,
        unitPrice,
        item.discount
      );

      return {
        product_id: productId,
        quantity: item.quantity,
        unit_price: unitPrice,
        discount: item.discount,
        line_total: lineTotal,
      };
    });

    const totals = calculateInvoiceTotals(
      normalizedItems,
      invoiceDiscount,
      tax
    );

    if (amountPaid > totals.total) {
      return NextResponse.json(
        { error: "Amount paid cannot exceed invoice total" },
        { status: 400 }
      );
    }

    const balanceDue = Math.max(totals.total - amountPaid, 0);

    const { data: existingInvoice, error: existingInvoiceError } =
      await supabase
        .from("invoices")
        .select("id")
        .eq("business_id", business.id)
        .eq("invoice_number", invoiceNumber)
        .maybeSingle();

    if (existingInvoiceError) {
      return NextResponse.json(
        { error: existingInvoiceError.message },
        { status: 500 }
      );
    }

    if (existingInvoice) {
      return NextResponse.json(
        { error: "Invoice number already exists for this business" },
        { status: 409 }
      );
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        business_id: business.id,
        customer_id: customerId,
        sale_id: saleId,
        invoice_number: invoiceNumber,
        status,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        amount_paid: amountPaid,
        balance_due: balanceDue,
        issue_date: issueDate,
        due_date: dueDate,
        notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("POST /api/invoices invoice error:", invoiceError);

      return NextResponse.json(
        { error: invoiceError.message },
        { status: 500 }
      );
    }

    const invoiceItems = normalizedItems.map((item) => ({
      business_id: business.id,
      invoice_id: invoice.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
      line_total: item.line_total,
    }));

    const { data: insertedItems, error: itemsError } = await supabase
      .from("invoice_items")
      .insert(invoiceItems)
      .select();

    if (itemsError) {
      console.error("POST /api/invoices items error:", itemsError);

      await supabase
        .from("invoices")
        .delete()
        .eq("id", invoice.id)
        .eq("business_id", business.id);

      return NextResponse.json(
        { error: itemsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        invoice,
        items: insertedItems ?? [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/invoices unexpected error:", error);

    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, business, user } = await getBusinessContext();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!business) {
      return NextResponse.json(
        { error: "No active business found" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const invoiceId =
      typeof body.invoice_id === "string"
        ? body.invoice_id.trim()
        : "";

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (
        typeof body.status !== "string" ||
        !INVOICE_STATUSES.includes(
          body.status as (typeof INVOICE_STATUSES)[number]
        )
      ) {
        return NextResponse.json(
          { error: "Invalid invoice status" },
          { status: 400 }
        );
      }

      updates.status = body.status;
    }

    if (body.amount_paid !== undefined) {
      const amountPaid = Number(body.amount_paid);

      if (!Number.isFinite(amountPaid) || amountPaid < 0) {
        return NextResponse.json(
          { error: "Invalid amount paid" },
          { status: 400 }
        );
      }

      updates.amount_paid = amountPaid;
    }

    if (body.notes !== undefined) {
      updates.notes =
        typeof body.notes === "string" ? body.notes.trim() : null;
    }

    if (body.due_date !== undefined) {
      updates.due_date =
        typeof body.due_date === "string" && body.due_date.trim()
          ? body.due_date.trim()
          : null;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json(
        { error: "No updates supplied" },
        { status: 400 }
      );
    }

    const { data: currentInvoice, error: currentInvoiceError } =
      await supabase
        .from("invoices")
        .select("id, total, amount_paid, balance_due, customer_id")
        .eq("id", invoiceId)
        .eq("business_id", business.id)
        .maybeSingle();

    if (currentInvoiceError) {
      return NextResponse.json(
        { error: currentInvoiceError.message },
        { status: 500 }
      );
    }

    if (!currentInvoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (updates.amount_paid !== undefined) {
      const amountPaid = Number(updates.amount_paid);

      if (amountPaid > Number(currentInvoice.total)) {
        return NextResponse.json(
          { error: "Amount paid cannot exceed invoice total" },
          { status: 400 }
        );
      }

      updates.balance_due = Math.max(
        Number(currentInvoice.total) - amountPaid,
        0
      );
    }

    const { data: invoice, error: updateError } = await supabase
      .from("invoices")
      .update(updates)
      .eq("id", invoiceId)
      .eq("business_id", business.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      invoice,
    });
  } catch (error) {
    console.error("PATCH /api/invoices unexpected error:", error);

    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, business, user } = await getBusinessContext();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!business) {
      return NextResponse.json(
        { error: "No active business found" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const invoiceId =
      typeof body.invoice_id === "string"
        ? body.invoice_id.trim()
        : "";

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 }
      );
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id")
      .eq("id", invoiceId)
      .eq("business_id", business.id)
      .maybeSingle();

    if (invoiceError) {
      return NextResponse.json(
        { error: invoiceError.message },
        { status: 500 }
      );
    }

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId)
      .eq("business_id", business.id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      invoice_id: invoiceId,
    });
  } catch (error) {
    console.error("DELETE /api/invoices unexpected error:", error);

    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}