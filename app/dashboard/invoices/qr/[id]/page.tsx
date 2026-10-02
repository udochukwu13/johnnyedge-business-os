import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";

type InvoiceQrPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function InvoiceQrPage({
  params,
}: InvoiceQrPageProps) {
  const { id } = await params;

  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness?.business?.id) {
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
      ),
      payments (
        id,
        amount,
        payment_method,
        reference,
        notes,
        created_at
      )
    `)
    .eq("id", id)
    .eq("business_id", activeBusiness.business.id)
    .single();

  if (error || !invoice) {
    notFound();
  }

  const currency =
    activeBusiness.business.currency || "₦";

  const customer = Array.isArray(invoice.customer)
    ? invoice.customer[0]
    : invoice.customer;

  const items = (invoice.invoice_items || []).map((item) => {
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

  const payments = (invoice.payments || []).map((payment) => ({
    id: payment.id,
    amount: Number(payment.amount || 0),
    payment_method: payment.payment_method || "cash",
    reference: payment.reference,
    notes: payment.notes,
    created_at: payment.created_at,
  }));

  const statusClasses: Record<string, string> = {
    draft: "border-slate-200 bg-slate-50 text-slate-700",
    sent: "border-blue-200 bg-blue-50 text-blue-700",
    partially_paid:
      "border-amber-200 bg-amber-50 text-amber-700",
    paid:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    overdue:
      "border-red-200 bg-red-50 text-red-700",
    cancelled:
      "border-slate-200 bg-slate-100 text-slate-600",
  };

  const statusClass =
    statusClasses[invoice.status] ||
    "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="text-sm font-medium text-slate-500">
          JohnnyEdge AI Business OS
        </div>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              Invoice
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {invoice.invoice_number}
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusClass}`}
          >
            {invoice.status.replace("_", " ")}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase text-slate-400">
              Bill To
            </div>

            <div className="mt-2 font-semibold text-slate-950">
              {customer?.name || "Walk-in Customer"}
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
              Invoice Date
            </div>

            <div className="mt-2 font-semibold text-slate-950">
              {new Date(
                `${invoice.issue_date}T00:00:00`
              ).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>

            {invoice.due_date && (
              <>
                <div className="mt-4 text-xs uppercase text-slate-400">
                  Due Date
                </div>

                <div className="mt-2 font-semibold text-slate-950">
                  {new Date(
                    `${invoice.due_date}T00:00:00`
                  ).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-950">
            Invoice Items
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

                      {item.discount > 0 && (
                        <div className="mt-1 text-xs text-slate-400">
                          Discount: {currency}
                          {item.discount.toLocaleString()}
                        </div>
                      )}

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
              No invoice items found.
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
              {Number(invoice.subtotal || 0).toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase text-slate-400">
              Discount
            </div>

            <div className="mt-2 font-bold text-slate-950">
              {currency}
              {Number(invoice.discount || 0).toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase text-slate-400">
              Tax
            </div>

            <div className="mt-2 font-bold text-slate-950">
              {currency}
              {Number(invoice.tax || 0).toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase text-slate-400">
              Total
            </div>

            <div className="mt-2 font-bold text-slate-950">
              {currency}
              {Number(invoice.total || 0).toLocaleString()}
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
              {Number(invoice.amount_paid || 0).toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="text-xs uppercase text-amber-700">
              Balance Due
            </div>

            <div className="mt-2 text-xl font-bold text-amber-800">
              {currency}
              {Number(invoice.balance_due || 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-950">
            Payment History
          </h2>

          {payments.length > 0 ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <div className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-semibold capitalize text-slate-950">
                        {payment.payment_method.replace("_", " ")}
                      </div>

                      {payment.reference && (
                        <div className="mt-1 text-sm text-slate-500">
                          Reference: {payment.reference}
                        </div>
                      )}

                      {payment.notes && (
                        <div className="mt-1 text-sm text-slate-500">
                          {payment.notes}
                        </div>
                      )}

                      <div className="mt-1 text-xs text-slate-400">
                        {new Date(
                          payment.created_at
                        ).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-lg font-bold text-emerald-700">
                      {currency}
                      {payment.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
              No payments recorded yet.
            </div>
          )}
        </div>

        {invoice.notes && (
          <div className="mt-8 rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase text-slate-400">
              Notes
            </div>

            <div className="mt-2 text-sm text-slate-700">
              {invoice.notes}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}