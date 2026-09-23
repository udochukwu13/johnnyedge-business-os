import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";
import SalesPageClient from "@/components/sales/sales-page-client";

export default async function SalesPage() {
  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness?.business?.id) {
    return null;
  }

  const supabase = await createClient();
  const businessId = activeBusiness.business.id;

  const [
    { data: customers, error: customersError },
    { data: products, error: productsError },
    { data: sales, error: salesError },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name")
      .eq("business_id", businessId)
      .order("name", { ascending: true }),

    supabase
      .from("products")
      .select("id, name, sku, price, stock_quantity")
      .eq("business_id", businessId)
      .order("name", { ascending: true }),

    supabase
      .from("sales")
      .select(`
        id,
        sale_number,
        status,
        total,
        amount_paid,
        balance_due,
        sold_at,
        customer:customers (
          id,
          name
        )
      `)
      .eq("business_id", businessId)
      .order("sold_at", { ascending: false }),
  ]);

  const error = customersError || productsError || salesError;

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-900">
            Unable to load sales data
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  const currency = activeBusiness.business.currency || "?";

  const formattedCustomers = (customers || []).map((customer) => ({
    id: customer.id,
    name: customer.name,
  }));

  const formattedProducts = (products || []).map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    price: Number(product.price || 0),
    stock_quantity: Number(product.stock_quantity || 0),
  }));

  const formattedSales = (sales || []).map((sale) => {
    const customer = Array.isArray(sale.customer)
      ? sale.customer[0]
      : sale.customer;

    return {
      id: sale.id,
      sale_number: sale.sale_number,
      status: sale.status,
      total: Number(sale.total || 0),
      amount_paid: Number(sale.amount_paid || 0),
      balance_due: Number(sale.balance_due || 0),
      sold_at: sale.sold_at,
      customer: customer
        ? {
            id: customer.id,
            name: customer.name,
          }
        : null,
    };
  });

  return (
    <SalesPageClient
      customers={formattedCustomers}
      products={formattedProducts}
      sales={formattedSales}
      currency={currency}
    />
  );
}
