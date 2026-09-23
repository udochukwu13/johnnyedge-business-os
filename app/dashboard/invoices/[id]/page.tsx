import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id } = await params;

  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness) {
    notFound();
  }

  const supabase = await createClient();

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select(`
      id,
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
      created_at,
      customer:customers (
        id,
        name,
        email,
        phone,
        address
      ),
      items:invoice_items (
        id,
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
    .maybeSingle();

  if (error || !invoice) {
    notFound();
  }

  const customer = Array.isArray(invoice.customer)
    ? invoice.customer[0]
    : invoice.customer;

  const items = Array.isArray(invoice.items)
    ? invoice.items
    : [];

  const formatCurrency = (value: number | string | null) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: activeBusiness.business.currency || "NGN",
      minimumFractionDigits: 2,
    }).format(Number(value || 0));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/invoices"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            ← Back to invoices
          </Link>

          <div className="mt-3">
            <div className="text-sm font-medium text-slate-500">
              Finance → Invoice
            </div>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
              {invoice.invoice_number}
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Invoice details and payment information.
            </p>
          </div>
        </div>

        <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold capitalize text-slate-700">
          {String(invoice.status).replace("_", " ")}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                {activeBusiness.business.name}
              </h2>

              {activeBusiness.business.email && (
                <p className="mt-1 text-sm text-slate-500">
                  {activeBusiness.business.email}
                </p>
              )}

              {activeBusiness.business.phone && (
                <p className="text-sm text-slate-500">
                  {activeBusiness.business.phone}
                </p>
              )}
            </div>

            <div className="text-right text-sm">
              <div className="text-slate-500">Issue date</div>
              <div className="font-medium text-slate-900">
                {invoice.issue_date}
              </div>

              {invoice.due_date && (
                <>
                  <div className="mt-2 text-slate-500">Due date</div>
                  <div className="font-medium text-slate-900">
                    {invoice.due_date}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="border-b border-slate-200 py-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Bill to
            </div>

            <div className="mt-2 text-base font-semibold text-slate-950">
              {customer?.name || "Walk-in customer"}
            </div>

            {customer?.email && (
              <div className="text-sm text-slate-600">
                {customer.email}
              </div>
            )}

            {customer?.phone && (
              <div className="text-sm text-slate-600">
                {customer.phone}
              </div>
            )}

            {customer?.address && (
              <div className="mt-1 max-w-xl text-sm text-slate-600">
                {customer.address}
              </div>
            )}
          </div>

          <div className="overflow-x-auto py-5">
            <table className="w-full min-w-[650px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-3 pr-4">Product</th>
                  <th className="pb-3 pr-4 text-right">Qty</th>
                  <th className="pb-3 pr-4 text-right">Unit price</th>
                  <th className="pb-3 pr-4 text-right">Discount</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => {
                  const product = Array.isArray(item.product)
                    ? item.product[0]
                    : item.product;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100"
                    >
                      <td className="py-4 pr-4">
                        <div className="font-medium text-slate-900">
                          {product?.name || "Product"}
                        </div>

                        {product?.sku && (
                          <div className="text-xs text-slate-500">
                            SKU: {product.sku}
                          </div>
                        )}
                      </td>

                      <td className="py-4 pr-4 text-right text-slate-700">
                        {Number(item.quantity)}
                      </td>

                      <td className="py-4 pr-4 text-right text-slate-700">
                        {formatCurrency(item.unit_price)}
                      </td>

                      <td className="py-4 pr-4 text-right text-slate-700">
                        {formatCurrency(item.discount)}
                      </td>

                      <td className="py-4 text-right font-medium text-slate-900">
                        {formatCurrency(item.line_total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {invoice.notes && (
            <div className="border-t border-slate-200 pt-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Notes
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                {invoice.notes}
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-950">
              Invoice summary
            </h2>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(invoice.subtotal)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Discount</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(invoice.discount)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Tax</span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(invoice.tax)}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <div className="flex justify-between gap-4">
                  <span className="font-semibold text-slate-950">
                    Total
                  </span>
                  <span className="font-bold text-slate-950">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Amount paid</span>
                <span className="font-medium text-emerald-700">
                  {formatCurrency(invoice.amount_paid)}
                </span>
              </div>

              <div className="rounded-xl bg-amber-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Balance due
                </div>

                <div className="mt-1 text-2xl font-bold text-amber-900">
                  {formatCurrency(invoice.balance_due)}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-950">
              Actions
            </h2>

            <div className="mt-4 space-y-3">
              <Link
                href="/dashboard/invoices"
                className="block w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to invoices
              </Link>

              <Link
                href="/dashboard/invoices/new"
                className="block w-full rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
              >
                Create another invoice
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}