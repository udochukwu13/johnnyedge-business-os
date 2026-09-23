"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
};

type InvoiceItem = {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  line_total: number;
  product: Product | Product[] | null;
};

type Invoice = {
  id: string;
  invoice_number: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  issue_date: string;
  due_date: string | null;
  notes: string | null;
  customer: Customer | Customer[] | null;
  invoice_items: InvoiceItem[];
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

const statusClasses: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-700",
  partially_paid: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  overdue: "bg-red-100 text-red-700",
  cancelled: "bg-slate-200 text-slate-600",
};

function normalizeCustomer(
  customer: Customer | Customer[] | null
): Customer | null {
  if (!customer) return null;
  return Array.isArray(customer) ? customer[0] ?? null : customer;
}

function normalizeProduct(
  product: Product | Product[] | null
): Product | null {
  if (!product) return null;
  return Array.isArray(product) ? product[0] ?? null : product;
}

function formatCurrency(value: number) {
  return `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function InvoicesPageClient({
  initialInvoices,
}: {
  initialInvoices: Invoice[];
}) {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function refreshInvoices() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/invoices", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load invoices");
      }

      setInvoices(data.invoices ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load invoices"
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateInvoiceStatus(
    invoiceId: string,
    status: string
  ) {
    try {
      setError("");

      const response = await fetch("/api/invoices", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice_id: invoiceId,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update invoice");
      }

      setInvoices((current) =>
        current.map((invoice) =>
          invoice.id === invoiceId
            ? { ...invoice, ...data.invoice }
            : invoice
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update invoice"
      );
    }
  }

  async function deleteInvoice(invoiceId: string) {
    const confirmed = window.confirm(
      "Delete this invoice? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch("/api/invoices", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice_id: invoiceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete invoice");
      }

      setInvoices((current) =>
        current.filter((invoice) => invoice.id !== invoiceId)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete invoice"
      );
    }
  }

  useEffect(() => {
    refreshInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const customer = normalizeCustomer(invoice.customer);

      const matchesSearch =
        !query ||
        invoice.invoice_number.toLowerCase().includes(query) ||
        customer?.name.toLowerCase().includes(query) ||
        customer?.email?.toLowerCase().includes(query) ||
        customer?.phone?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "all" || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const metrics = useMemo(() => {
    return invoices.reduce(
      (summary, invoice) => {
        summary.total += Number(invoice.total ?? 0);
        summary.paid += Number(invoice.amount_paid ?? 0);
        summary.outstanding += Number(invoice.balance_due ?? 0);

        if (invoice.status === "draft") summary.draft += 1;
        if (invoice.status === "sent") summary.sent += 1;
        if (invoice.status === "partially_paid") summary.partiallyPaid += 1;
        if (invoice.status === "paid") summary.paidCount += 1;
        if (invoice.status === "overdue") summary.overdue += 1;
        if (invoice.status === "cancelled") summary.cancelled += 1;

        return summary;
      },
      {
        total: 0,
        paid: 0,
        outstanding: 0,
        draft: 0,
        sent: 0,
        partiallyPaid: 0,
        paidCount: 0,
        overdue: 0,
        cancelled: 0,
      }
    );
  }, [invoices]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">
            Finance
          </div>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Invoices
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Create, track, update, and manage customer invoices from one
            business workspace.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={refreshInvoices}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <Link
            href="/dashboard/invoices/new"
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + New Invoice
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Invoice Value
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-950">
            {formatCurrency(metrics.total)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {invoices.length} invoice{invoices.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Amount Paid
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {formatCurrency(metrics.paid)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Recorded payments
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Outstanding
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700">
            {formatCurrency(metrics.outstanding)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Balance due
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Overdue
          </div>
          <div className="mt-2 text-2xl font-bold text-red-700">
            {metrics.overdue}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Invoice{metrics.overdue === 1 ? "" : "s"} overdue
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          ["draft", "Draft", metrics.draft],
          ["sent", "Sent", metrics.sent],
          ["partially_paid", "Partial", metrics.partiallyPaid],
          ["paid", "Paid", metrics.paidCount],
          ["overdue", "Overdue", metrics.overdue],
          ["cancelled", "Cancelled", metrics.cancelled],
        ].map(([value, label, count]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(String(value))}
            className={`rounded-xl border px-4 py-3 text-left transition ${
              statusFilter === value
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <div className="text-xs font-medium opacity-70">
              {label}
            </div>
            <div className="mt-1 text-lg font-bold">
              {count}
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search invoice number, customer, email or phone..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {statusFilter !== "all" ? (
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear filter
            </button>
          ) : null}
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-lg font-semibold text-slate-900">
              No invoices found
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {invoices.length === 0
                ? "Create your first invoice to start tracking customer billing."
                : "Try changing your search or status filter."}
            </p>

            {invoices.length === 0 ? (
              <Link
                href="/dashboard/invoices/new"
                className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Create Invoice
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Invoice
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Customer
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Date
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Total
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Balance
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((invoice) => {
                  const customer = normalizeCustomer(invoice.customer);

                  return (
                    <tr
                      key={invoice.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/invoices/${invoice.id}`}
                          className="font-semibold text-slate-950 hover:underline"
                        >
                          {invoice.invoice_number}
                        </Link>

                        <div className="mt-1 text-xs text-slate-500">
                          {invoice.invoice_items?.length ?? 0} item
                          {(invoice.invoice_items?.length ?? 0) === 1
                            ? ""
                            : "s"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-900">
                          {customer?.name || "Walk-in Customer"}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {customer?.phone ||
                            customer?.email ||
                            "No contact details"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(invoice.issue_date)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-950">
                          {formatCurrency(Number(invoice.total))}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          Paid: {formatCurrency(Number(invoice.amount_paid))}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`font-semibold ${
                            Number(invoice.balance_due) > 0
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {formatCurrency(Number(invoice.balance_due))}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={invoice.status}
                          onChange={(event) =>
                            updateInvoiceStatus(
                              invoice.id,
                              event.target.value
                            )
                          }
                          className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none ${
                            statusClasses[invoice.status] ||
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {Object.entries(statusLabels).map(
                            ([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/dashboard/invoices/${invoice.id}`}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                          >
                            View
                          </Link>

                          <button
                            type="button"
                            onClick={() => deleteInvoice(invoice.id)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}