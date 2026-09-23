import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";
import OrdersPageClient from "@/components/orders/orders-page-client";

export default async function OrdersPage() {
  const supabase = await createClient();
  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness?.business?.id) {
    redirect("/onboarding");
  }

  const businessId = activeBusiness.business.id;

  const [
    { data: customers },
    { data: products },
    { data: orders, error: ordersError },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, email, phone")
      .eq("business_id", businessId)
      .order("name", { ascending: true }),

    supabase
      .from("products")
      .select("id, name, sku, price, stock_quantity")
      .eq("business_id", businessId)
      .order("name", { ascending: true }),

    supabase
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
      .eq("business_id", businessId)
      .order("ordered_at", { ascending: false }),
  ]);

  if (ordersError) {
    throw new Error(ordersError.message);
  }

  const normalizedOrders = (orders ?? []).map((order) => ({
    ...order,
    customer: Array.isArray(order.customer)
      ? order.customer[0] ?? null
      : order.customer,
    order_items: (order.order_items ?? []).map((item) => ({
      ...item,
      product: Array.isArray(item.product)
        ? item.product[0] ?? null
        : item.product,
    })),
  }));

  return (
    <OrdersPageClient
      customers={customers ?? []}
      products={products ?? []}
      initialOrders={normalizedOrders}
    />
  );
}
