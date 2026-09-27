"use client";

import { useState } from "react";
import NewSaleForm from "@/components/sales/new-sale-form";

type Customer = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  cost_price: number;
  stock_quantity: number;
};

type Sale = {
  id: string;
  sale_number: string;
  status: string;
  total: number;
  amount_paid: number;
  balance_due: number;
  sold_at: string;
  customer: {
    id: string;
    name: string;
  } | null;
};

type SalesPageClientProps = {
  customers: Customer[];
  products: Product[];
  sales: Sale[];
  currency: string;
};

export default function SalesPageClient({
  customers,
  products,
  sales,
  currency,
}: SalesPageClientProps) {
  const [showNewSale, setShowNewSale] = useState(false);

  if (showNewSale) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setShowNewSale(false)}
          className="text-sm font-semibold text-slate-600 hover:text-slate-950"
        >
          ? Back to sales
        </button>

        <NewSaleForm
          customers={customers}
          products={products}
          currency={currency}
          onCancel={() => setShowNewSale(false)}
        />
      </div>
    );
  }

  const totalSales = sales.length;

  const totalRevenue = sales.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0
  );

  const totalPaid = sales.reduce(
    (sum, sale) => sum + Number(sale.amount_paid || 0),
    0
  );

  const totalOutstanding = sales.reduce(
    (sum, sale) => sum + Number(sale.balance_due || 0),
    0
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">
            Sales
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Sales management
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Track completed sales, payments, customer balances, and revenue
            for your business.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewSale(true)}
          className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          New sale
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Total sales
          </div>

          <div className="mt-2 text-2xl font-bold text-slate-950">
            {totalSales}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Revenue
          </div>

          <div className="mt-2 text-2xl font-bold text-slate-950">
            {currency}{" "}
            {totalRevenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Outstanding
          </div>

          <div className="mt-2 text-2xl font-bold text-slate-950">
            {currency}{" "}
            {totalOutstanding.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            Paid: {currency}{" "}
            {totalPaid.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-950">
            Recent sales
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Your latest transactions appear here.
          </p>
        </div>

        {sales.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="text-sm font-medium text-slate-700">
              No sales recorded yet
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Create your first sale to start tracking revenue and inventory.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 font-semibold text-slate-600">
                    Sale
                  </th>

                  <th className="px-6 py-3 font-semibold text-slate-600">
                    Customer
                  </th>

                  <th className="px-6 py-3 font-semibold text-slate-600">
                    Date
                  </th>

                  <th className="px-6 py-3 font-semibold text-slate-600">
                    Total
                  </th>

                  <th className="px-6 py-3 font-semibold text-slate-600">
                    Paid
                  </th>

                  <th className="px-6 py-3 font-semibold text-slate-600">
                    Balance
                  </th>

                  <th className="px-6 py-3 font-semibold text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-950">
                      {sale.sale_number}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {sale.customer?.name || "Walk-in customer"}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {new Date(sale.sold_at).toLocaleString()}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-950">
                      {currency}{" "}
                      {Number(sale.total || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {currency}{" "}
                      {Number(sale.amount_paid || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {currency}{" "}
                      {Number(sale.balance_due || 0).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-700">
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
