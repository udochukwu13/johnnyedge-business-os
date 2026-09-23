import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";

type OrderItemInput = {
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
    .from("orders")
    .select(`
      id,
      order_number,
      status,
      subtotal,
      discount,
      tax,
      total,
      notes,
      ordered_at,
      created_at,
      customer:customers (
        id,
        name,
        email,
        phone
      ),
      order_items (
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
    .order("ordered_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ orders: data ?? [] });
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
    status?: string;
    discount?: number;
    tax?: number;
    notes?: string | null;
    items?: OrderItemInput[];
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
      { error: "At least one order item is required" },
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
      { error: "Each order item must have a valid product_id" },
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

  const normalizedItems = [];

  try {
    for (const item of items) {
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

      normalizedItems.push({
        product_id: item.product_id,
        quantity,
        unit_price: unitPrice,
        discount,
        line_total: lineTotal,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid order item",
      },
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
      line_total: number;
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

  const subtotal = finalItems.reduce(
    (sum, item) => sum + item.line_total,
    0
  );

  const discount = Number(body.discount ?? 0);
  const tax = Number(body.tax ?? 0);

  if (!Number.isFinite(discount) || discount < 0) {
    return NextResponse.json(
      { error: "Invalid order discount" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(tax) || tax < 0) {
    return NextResponse.json(
      { error: "Invalid order tax" },
      { status: 400 }
    );
  }

  const total = Math.max(
    0,
    subtotal - discount + tax
  );

  const allowedStatuses = [
    "pending",
    "confirmed",
    "processing",
    "ready",
    "completed",
    "cancelled",
  ];

  const status =
    typeof body.status === "string" &&
    allowedStatuses.includes(body.status)
      ? body.status
      : "pending";

  const orderNumber = `ORD-${Date.now()}`;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      business_id: businessId,
      customer_id: body.customer_id || null,
      order_number: orderNumber,
      status,
      subtotal,
      discount,
      tax,
      total,
      notes: body.notes || null,
      ordered_at: new Date().toISOString(),
      created_by: user.id,
    })
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: orderError?.message || "Unable to create order" },
      { status: 500 }
    );
  }

  const orderItems = finalItems.map((item) => ({
    business_id: businessId,
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount: item.discount,
    line_total: item.line_total,
  }));

  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (orderItemsError) {
    await supabase
      .from("orders")
      .delete()
      .eq("id", order.id)
      .eq("business_id", businessId);

    return NextResponse.json(
      { error: orderItemsError.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      order,
      items: orderItems,
    },
    { status: 201 }
  );
}

export async function PATCH(request: Request) {
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
    order_id?: string;
    status?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  if (!body.order_id || typeof body.order_id !== "string") {
    return NextResponse.json(
      { error: "A valid order_id is required" },
      { status: 400 }
    );
  }

  const allowedStatuses = [
    "pending",
    "confirmed",
    "processing",
    "ready",
    "completed",
    "cancelled",
  ];

  if (
    typeof body.status !== "string" ||
    !allowedStatuses.includes(body.status)
  ) {
    return NextResponse.json(
      { error: "Invalid order status" },
      { status: 400 }
    );
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .update({
      status: body.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.order_id)
    .eq("business_id", businessId)
    .select()
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      {
        error:
          orderError?.message ||
          "Order not found or could not be updated",
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    order,
  });
}