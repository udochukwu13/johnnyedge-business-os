import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";
import PrintStatementButton from "@/components/customers/print-statement-button";
import DownloadStatementPdfButton from "@/components/customers/download-statement-pdf-button";

export default async function CustomerStatementPage({
  searchParams,
}: {
  searchParams: Promise<{
    customer_id?: string;
  }>;
}) {
  const params = await searchParams;

  const customerId = params.customer_id;
  if (!customerId) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        Customer ID is required.
      </div>
    );
  }


  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness?.business?.id) {
    return null;
  }


  const supabase = await createClient();


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


  if (error || !customer) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        Unable to load customer statement.
      </div>
    );
  }


  const { data: sales } = await supabase
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


  const { data: payments } = await supabase
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


  const totalSales = (sales || []).reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0
  );


const totalPaid = (sales || []).reduce(
  (sum, sale) => sum + Number(sale.amount_paid || 0),
  0
);


const balance = (sales || []).reduce(
  (sum, sale) => sum + Number(sale.balance_due || 0),
  0
);
const statementNumber = `STMT-${Date.now()}`;
const accountStatus =
  balance > 0 ? "Outstanding Balance" : "Paid";
  return (
    <div
  id="customer-statement"
  className="space-y-8"
>

      <div className="space-y-3">

  <div className="text-sm font-semibold uppercase tracking-wide text-slate-500">
    JohnnyEdge AI Business OS
  </div>

  <h1 className="text-3xl font-bold text-slate-950">
    Customer Account Statement
  </h1>

  <div className="rounded-xl border border-slate-200 bg-white p-4">

    <div className="font-semibold text-slate-950">
      {customer.name}
    </div>

    <div className="mt-1 text-sm text-slate-500">
      {customer.email || "No email"}
    </div>

    <div className="mt-1 text-sm text-slate-500">
      Statement Date:{" "}
      {new Date().toLocaleDateString()}
      <div className="mt-1 text-sm text-slate-500">
  Statement No: {statementNumber}
  <div className="mt-3">
  <div className="text-sm text-slate-500">
    Account Status
  </div>

  <div
    className={`mt-1 font-semibold ${
      balance > 0
        ? "text-red-600"
        : "text-emerald-600"
    }`}
  >
    {accountStatus}
  </div>
</div>
</div>
    </div>

  </div>

  <div className="flex flex-wrap gap-3">
  <PrintStatementButton />

  <DownloadStatementPdfButton />
</div>

</div>

        
      <div className="grid gap-4 md:grid-cols-3">

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">
            Total Purchases
          </div>

          <div className="mt-2 text-2xl font-bold">
            ₦{totalSales.toLocaleString()}
          </div>
        </div>


        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">
            Total Paid
          </div>

          <div className="mt-2 text-2xl font-bold text-emerald-600">
            ₦{totalPaid.toLocaleString()}
          </div>
        </div>


        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">
            Outstanding Balance
          </div>

          <div className="mt-2 text-2xl font-bold text-red-600">
            ₦{balance.toLocaleString()}
          </div>
        </div>

      </div>



      <div className="rounded-2xl border bg-white shadow-sm">

        <div className="border-b p-5">
          <h2 className="font-semibold">
            Sales History
          </h2>
        </div>


        {(sales || []).map((sale) => (
          <div
            key={sale.id}
            className="flex justify-between border-b p-5"
          >

            <div>
              <div className="font-semibold">
                {sale.sale_number}
              </div>

              <div className="text-sm text-slate-500">
                {new Date(
                  sale.sold_at
                ).toLocaleDateString()}
              </div>
            </div>


            <div className="text-right">

              <div>
                Sale:
                ₦{Number(sale.total).toLocaleString()}
              </div>

              <div>
                Balance:
                ₦{Number(sale.balance_due).toLocaleString()}
              </div>

            </div>

          </div>
        ))}

      </div>



      <div className="rounded-2xl border bg-white shadow-sm">

        <div className="border-b p-5">
          <h2 className="font-semibold">
            Payment History
          </h2>
        </div>


        {(payments || []).map((payment) => (
          <div
            key={payment.id}
            className="flex justify-between border-b p-5"
          >

            <div>

              <div className="font-semibold">
                {payment.payment_method}
              </div>

              <div className="text-sm text-slate-500">
                {payment.reference}
              </div>

            </div>


            <div className="font-semibold text-emerald-600">
              ₦{Number(payment.amount).toLocaleString()}
            </div>

          </div>
        ))}

      </div>


    </div>
  );
}