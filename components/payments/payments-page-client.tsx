"use client";

import ReceivePaymentButton from "@/components/payments/receive-payment-button";

type Customer = {
  id: string;
  name: string;
};

type Sale = {
  id: string;
  sale_number: string;
  total: number;
  amount_paid: number;
  balance_due: number;
  sold_at: string;
  customer: Customer | null;
};

type Payment = {
  id: string;
  amount: number;
  payment_method: string;
  reference: string | null;
  notes: string | null;
  created_at: string;
  customer: Customer | null;
};

type PaymentsPageClientProps = {
  sales: Sale[];
  payments: Payment[];
  currency: string;
};

export default function PaymentsPageClient({
  sales,
  payments,
  currency,
}: PaymentsPageClientProps) {
  const totalOutstanding = sales.reduce(
  (sum, sale) => sum + Number(sale.balance_due || 0),
  0
);

const totalCollected = payments.reduce(
  (sum, payment) => sum + Number(payment.amount || 0),
  0
);

const totalPayments = payments.length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="text-sm font-medium text-slate-500">
          Payments
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Payments & Receivables
        </h1>

        <p className="mt-2 text-slate-500">
          Track outstanding customer balances and payment collections.
        </p>
      </div>

{/* Summary Cards */}
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="text-sm font-medium text-slate-500">
      Total Outstanding
    </div>

    <div className="mt-2 text-2xl font-bold text-slate-950">
      {currency}
      {totalOutstanding.toLocaleString()}
    </div>
  </div>


  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="text-sm font-medium text-slate-500">
      Unpaid Sales
    </div>

    <div className="mt-2 text-2xl font-bold text-slate-950">
      {sales.length}
    </div>
  </div>


  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="text-sm font-medium text-slate-500">
      Total Collected
    </div>

    <div className="mt-2 text-2xl font-bold text-emerald-600">
      {currency}
      {totalCollected.toLocaleString()}
    </div>
  </div>


  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="text-sm font-medium text-slate-500">
      Payment Transactions
    </div>

    <div className="mt-2 text-2xl font-bold text-slate-950">
      {totalPayments}
    </div>
  </div>

</div>
          
      
      {/* Outstanding Sales */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-950">
            Outstanding Sales
          </h2>
        </div>


        {sales.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            No outstanding sales.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-950">
                    {sale.sale_number}
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    {sale.customer?.name || "Walk-in customer"}
                  </div>
                </div>


                <div>
                  <div className="text-xs uppercase text-slate-400">
                    Balance Due
                  </div>

                  <div className="mt-1 font-semibold text-red-600">
                    {currency}
                    {Number(sale.balance_due).toLocaleString()}
                  </div>


                  <div className="mt-3">
                    <ReceivePaymentButton
                      saleId={sale.id}
                      customerId={sale.customer?.id || null}
                      saleNumber={sale.sale_number}
                      balanceDue={sale.balance_due}
                      currency={currency}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>



      {/* Payment History */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-950">
            Payment History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Recent customer payments received.
          </p>
        </div>


        {payments.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-slate-500">
            No payments recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-950">
                    {payment.customer?.name || "Walk-in customer"}
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    {new Date(payment.created_at).toLocaleString()}
                  </div>

                  {payment.reference && (
                    <div className="mt-1 text-xs text-slate-400">
                      Reference: {payment.reference}
                    </div>
                  )}
                </div>


                <div>
                  <div className="font-semibold text-emerald-600">
                    {currency}
                    {Number(payment.amount).toLocaleString()}
                  </div>

                  <div className="text-sm text-slate-500">
                    {payment.payment_method}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}