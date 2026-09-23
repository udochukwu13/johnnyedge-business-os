import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";

type SaleItemInput = {
  product_id: string;
  quantity: number;
  unit_price?: number;
  discount?: number;
};

export async function GET() {
  const supabase = await createClient();
  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness?.business?.id) {
    return NextResponse.json(
      { error: "Business not found" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("sales")
    .select(`
      id,
      sale_number,
      status,
      subtotal,
      discount,
      tax,
      total,
      amount_paid,
      balance_due,
      notes,
      sold_at,
      created_at,
      customer:customers (
        id,
        name,
        email,
        phone
      ),
      sale_items (
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
    .order("sold_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ sales: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness?.business?.id) {
    return NextResponse.json(
      { error: "Business not found" },
      { status: 400 }
    );
  }

  const businessId = activeBusiness.business.id;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: {
    customer_id?: string | null;
    discount?: number;
    tax?: number;
    amount_paid?: number;
    notes?: string | null;
    items?: SaleItemInput[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  const items = Array.isArray(body.items) ? body.items : [];

  if (items.length === 0) {
    return NextResponse.json(
      { error: "At least one sale item is required" },
      { status: 400 }
    );
  }

  const productIds = items.map((item) => item.product_id);

  if (
    productIds.some(
      (productId) =>
        typeof productId !== "string" || productId.trim() === ""
    )
  ) {
    return NextResponse.json(
      { error: "Each sale item must have a valid product_id" },
      { status: 400 }
    );
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, sku, price, stock_quantity")
    .eq("business_id", businessId)
    .in("id", productIds);

  if (productsError) {
    return NextResponse.json(
      { error: productsError.message },
      { status: 500 }
    );
  }

  if (!products || products.length !== new Set(productIds).size) {
    return NextResponse.json(
      { error: "One or more products could not be found" },
      { status: 400 }
    );
  }

  if (body.customer_id) {
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id")
      .eq("id", body.customer_id)
      .eq("business_id", businessId)
      .maybeSingle();

    if (customerError) {
      return NextResponse.json(
        { error: customerError.message },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 400 }
      );
    }
  }

  const normalizedItems = items.map((item) => {
    const product = products.find(
      (candidate) => candidate.id === item.product_id
    );

    const quantity = Number(item.quantity);
    const unitPrice =
      item.unit_price === undefined
        ? Number(product?.price ?? 0)
        : Number(item.unit_price);
    const discount = Number(item.discount ?? 0);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(
        `Invalid quantity for product ${item.product_id}`
      );
    }

    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error(
        `Invalid unit price for product ${item.product_id}`
      );
    }

    if (!Number.isFinite(discount) || discount < 0) {
      throw new Error(
        `Invalid discount for product ${item.product_id}`
      );
    }

    const lineTotal = Math.max(
      0,
      quantity * unitPrice - discount
    );

    return {
      product_id: item.product_id,
      quantity,
      unit_price: unitPrice,
      discount,
      line_total: lineTotal,
      product,
    };
  });

  try {
    const mergedItems = new Map<
      string,
      {
        product_id: string;
        quantity: number;
        unit_price: number;
        discount: number;
        line_total: number;
        product: (typeof normalizedItems)[number]["product"];
      }
    >();

    for (const item of normalizedItems) {
      const existing = mergedItems.get(item.product_id);

      if (existing) {
        existing.quantity += item.quantity;
        existing.discount += item.discount;
        existing.line_total =
          existing.quantity * existing.unit_price -
          existing.discount;
      } else {
        mergedItems.set(item.product_id, { ...item });
      }
    }

    const finalItems = Array.from(mergedItems.values());

    for (const item of finalItems) {
      const stockQuantity = Number(item.product?.stock_quantity ?? 0);

      if (item.quantity > stockQuantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${item.product?.name ?? "product"}. Available: ${stockQuantity}`,
          },
          { status: 400 }
        );
      }
    }

    const subtotal = finalItems.reduce(
      (sum, item) => sum + item.line_total,
      0
    );

    const discount = Number(body.discount ?? 0);
    const tax = Number(body.tax ?? 0);
    const amountPaid = Number(body.amount_paid ?? 0);

    if (!Number.isFinite(discount) || discount < 0) {
      return NextResponse.json(
        { error: "Invalid sale discount" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(tax) || tax < 0) {
      return NextResponse.json(
        { error: "Invalid tax amount" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amountPaid) || amountPaid < 0) {
      return NextResponse.json(
        { error: "Invalid amount paid" },
        { status: 400 }
      );
    }

    const total = Math.max(
      0,
      subtotal - discount + tax
    );

    if (amountPaid > total) {
      return NextResponse.json(
        { error: "Amount paid cannot exceed the sale total" },
        { status: 400 }
      );
    }

    const balanceDue = total - amountPaid;

    const saleNumber = `SALE-${Date.now()}`;

    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert({
        business_id: businessId,
        customer_id: body.customer_id || null,
        sale_number: saleNumber,
        status: "completed",
        subtotal,
        discount,
        tax,
        total,
        amount_paid: amountPaid,
        balance_due: balanceDue,
        notes: body.notes || null,
        sold_at: new Date().toISOString(),
        created_by: user.id,
      })
      .select()
      .single();

    if (saleError || !sale) {
      return NextResponse.json(
        { error: saleError?.message || "Unable to create sale" },
        { status: 500 }
      );
    }

    const saleItems = finalItems.map((item) => ({
      business_id: businessId,
      sale_id: sale.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
      line_total: item.line_total,
    }));

    const { error: saleItemsError } = await supabase
      .from("sale_items")
      .insert(saleItems);

    if (saleItemsError) {
      await supabase
        .from("sales")
        .delete()
        .eq("id", sale.id)
        .eq("business_id", businessId);

      return NextResponse.json(
        { error: saleItemsError.message },
        { status: 500 }
      );
    }

    for (const item of finalItems) {
      const currentStock = Number(item.product?.stock_quantity ?? 0);
      const newStock = currentStock - item.quantity;

      const { error: productUpdateError } = await supabase
        .from("products")
        .update({
          stock_quantity: newStock,
        })
        .eq("id", item.product_id)
        .eq("business_id", businessId);

      if (productUpdateError) {
        return NextResponse.json(
          {
            error:
              `Sale created but inventory update failed for ${item.product?.name ?? "product"}: ` +
              productUpdateError.message,
          },
          { status: 500 }
        );
      }

      const { error: movementError } = await supabase
        .from("inventory_movements")
        .insert({
          business_id: businessId,
          product_id: item.product_id,
          type: "sale",
          quantity: item.quantity,
          note: `Sale ${sale.sale_number}`,
          created_by: user.id,
        });

      if (movementError) {
        return NextResponse.json(
          {
            error:
              `Sale created but inventory movement recording failed: ${movementError.message}`,
          },
          { status: 500 }
        );
      }
    }

    if (body.customer_id && amountPaid < total) {
      const { data: customer, error: customerBalanceError } =
        await supabase
          .from("customers")
          .select("balance")
          .eq("id", body.customer_id)
          .eq("business_id", businessId)
          .single();

      if (customerBalanceError) {
        return NextResponse.json(
          {
            error:
              `Sale created but customer balance could not be read: ${customerBalanceError.message}`,
          },
          { status: 500 }
        );
      }

      const currentBalance = Number(customer?.balance ?? 0);

      const { error: customerUpdateError } = await supabase
        .from("customers")
        .update({
          balance: currentBalance + balanceDue,
        })
        .eq("id", body.customer_id)
        .eq("business_id", businessId);

      if (customerUpdateError) {
        return NextResponse.json(
          {
            error:
              `Sale created but customer balance could not be updated: ${customerUpdateError.message}`,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        sale,
        items: saleItems,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process sale",
      },
      { status: 400 }
    );
  }
}
