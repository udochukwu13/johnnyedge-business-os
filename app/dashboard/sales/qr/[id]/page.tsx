import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";

type SalesQrPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SalesQrPage({
  params,
}: SalesQrPageProps) {
  const { id } = await params;

  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness?.business?.id) {
    notFound();
  }

  const supabase = await createClient();

  const { data: sale, error } = await supabase
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
    .eq("id", id)
    .eq("business_id", activeBusiness.business.id)
    .single();

  if (error || !sale) {
    notFound();
  }

  const currency =
    activeBusiness.business.currency || "₦";

  const customer = Array.isArray(sale.customer)
    ? sale.customer[0]
    : sale.customer;

  const items = (sale.sale_items || []).map((item) => {
    const product = Array.isArray(item.product)
      ? item.product[0]
      : item.product;

    return {
      id: item.id,
      quantity: Number(item.quantity || 0),
      unit_price: Number(item.unit_price || 0),
      discount: Number(item.discount || 0),
      line_total: Number(item.line_total || 0),
      product,
    };
  });

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="text-sm font-medium text-slate-500">
          JohnnyEdge AI Business OS
        </div>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              Sale
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {sale.sale_number}
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-700">
            {sale.status}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase text-slate-400">
              Customer
            </div>

            <div className="mt-2 font-semibold text-slate-950">
              {customer?.name || "Walk-in customer"}
            </div>

            {customer?.phone && (
              <div className="mt-1 text-sm text-slate-500">
                {customer.phone}
              </div>
            )}

            {customer?.email && (
              <div className="mt-1 text-sm text-slate-500">
                {customer.email}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase text-slate-400">
              Sale Date
            </div>

            <div className="mt-2 font-semibold text-slate-950">
              {new Date(sale.sold_at).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-950">
            Items
          </h2>

          {items.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-950">
                        {item.product?.name || "Unknown product"}
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        {item.product?.sku || "No SKU"}
                      </div>

                      <div className="mt-1 text-sm text-slate-500">
                        Quantity:{" "}
                        {item.quantity.toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-slate-500">
                        {currency}
                        {item.unit_price.toLocaleString()}
                        {" × "}
                        {item.quantity.toLocaleString()}
                      </div>

                      <div className="mt-1 font-semibold text-slate-950">
                        {currency}
                        {item.line_total.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
              No sale items found.
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase text-slate-400">
              Subtotal
            </div>

            <div className="mt-2 font-bold text-slate-950">
              {currency}
              {Number(sale.subtotal || 0).toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase text-slate-400">
              Discount
            </div>

            <div className="mt-2 font-bold text-slate-950">
              {currency}
              {Number(sale.discount || 0).toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase text-slate-400">
              Tax
            </div>

            <div className="mt-2 font-bold text-slate-950">
              {currency}
              {Number(sale.tax || 0).toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase text-slate-400">
              Total
            </div>

            <div className="mt-2 font-bold text-slate-950">
              {currency}
              {Number(sale.total || 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-xs uppercase text-emerald-700">
              Amount Paid
            </div>

            <div className="mt-2 text-xl font-bold text-emerald-800">
              {currency}
              {Number(sale.amount_paid || 0).toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="text-xs uppercase text-red-700">
              Balance Due
            </div>

            <div className="mt-2 text-xl font-bold text-red-800">
              {currency}
              {Number(sale.balance_due || 0).toLocaleString()}
            </div>
          </div>
        </div>

        {sale.notes && (
          <div className="mt-6 rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase text-slate-400">
              Notes
            </div>

            <div className="mt-2 text-sm text-slate-700">
              {sale.notes}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}