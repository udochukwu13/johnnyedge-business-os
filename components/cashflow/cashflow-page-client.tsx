"use client";

import { FormEvent, useMemo, useState } from "react";

type CashflowEntry = {
  id: string;
  business_id: string;
  type: "income" | "expense";
  category: string;
  description: string | null;
  amount: number | string;
  payment_method: string | null;
  entry_date: string;
  reference: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type CashflowPageClientProps = {
  initialEntries: CashflowEntry[];
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "other", label: "Other" },
];

const INCOME_CATEGORIES = [
  "Sales",
  "Customer Payment",
  "Loan",
  "Capital Injection",
  "Other Income",
];

const EXPENSE_CATEGORIES = [
  "Operating Expense",
  "Supplier Payment",
  "Rent",
  "Utilities",
  "Payroll",
  "Transport",
  "Marketing",
  "Other Expense",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function paymentMethodLabel(value: string | null) {
  if (!value) return "—";

  return (
    PAYMENT_METHODS.find((method) => method.value === value)?.label ??
    value
  );
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function CashflowPageClient({
  initialEntries,
}: CashflowPageClientProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] =
    useState<CashflowEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [type, setType] = useState<"income" | "expense">("income");
  const [category, setCategory] = useState("Sales");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [entryDate, setEntryDate] = useState(todayDate());
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const categories = useMemo(() => {
    return type === "income"
      ? INCOME_CATEGORIES
      : EXPENSE_CATEGORIES;
  }, [type]);

  const allCategories = useMemo(() => {
    return Array.from(
      new Set(entries.map((entry) => entry.category))
    ).sort();
  }, [entries]);

  const metrics = useMemo(() => {
    const income = entries
      .filter((entry) => entry.type === "income")
      .reduce((sum, entry) => sum + Number(entry.amount), 0);

    const expenses = entries
      .filter((entry) => entry.type === "expense")
      .reduce((sum, entry) => sum + Number(entry.amount), 0);

    const netCashflow = income - expenses;

    const currentMonth = new Date().toISOString().slice(0, 7);

    const thisMonthIncome = entries
      .filter(
        (entry) =>
          entry.type === "income" &&
          entry.entry_date.startsWith(currentMonth)
      )
      .reduce((sum, entry) => sum + Number(entry.amount), 0);

    const thisMonthExpenses = entries
      .filter(
        (entry) =>
          entry.type === "expense" &&
          entry.entry_date.startsWith(currentMonth)
      )
      .reduce((sum, entry) => sum + Number(entry.amount), 0);

    return {
      income,
      expenses,
      netCashflow,
      thisMonthIncome,
      thisMonthExpenses,
    };
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return entries.filter((entry) => {
      const matchesSearch =
        !query ||
        entry.category.toLowerCase().includes(query) ||
        entry.description?.toLowerCase().includes(query) ||
        entry.reference?.toLowerCase().includes(query) ||
        entry.notes?.toLowerCase().includes(query);

      const matchesType =
        typeFilter === "all" || entry.type === typeFilter;

      const matchesCategory =
        categoryFilter === "all" ||
        entry.category === categoryFilter;

      return (
        matchesSearch &&
        matchesType &&
        matchesCategory
      );
    });
  }, [entries, search, typeFilter, categoryFilter]);

  function resetForm() {
    setEditingEntry(null);
    setType("income");
    setCategory("Sales");
    setAmount("");
    setDescription("");
    setPaymentMethod("bank_transfer");
    setEntryDate(todayDate());
    setReference("");
    setNotes("");
    setError("");
  }

  function openCreateForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(entry: CashflowEntry) {
    setEditingEntry(entry);
    setType(entry.type);
    setCategory(entry.category);
    setAmount(String(entry.amount));
    setDescription(entry.description ?? "");
    setPaymentMethod(entry.payment_method ?? "bank_transfer");
    setEntryDate(entry.entry_date);
    setReference(entry.reference ?? "");
    setNotes(entry.notes ?? "");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  async function refreshEntries() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/cashflow", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load cashflow");
      }

      setEntries(data.entries ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load cashflow"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        type,
        category: category.trim(),
        amount: Number(amount),
        description: description.trim(),
        payment_method: paymentMethod,
        entry_date: entryDate,
        reference: reference.trim(),
        notes: notes.trim(),
      };

      const response = await fetch("/api/cashflow", {
        method: editingEntry ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingEntry
            ? {
                ...payload,
                id: editingEntry.id,
              }
            : payload
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to save cashflow entry"
        );
      }

      await refreshEntries();
      closeForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save cashflow entry"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(entry: CashflowEntry) {
    const confirmed = window.confirm(
      `Delete this ${entry.type} entry of ${formatCurrency(
        Number(entry.amount)
      )}?`
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/cashflow?id=${encodeURIComponent(entry.id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete cashflow entry"
        );
      }

      await refreshEntries();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete cashflow entry"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleTypeChange(value: "income" | "expense") {
    setType(value);

    if (value === "income") {
      setCategory("Sales");
    } else {
      setCategory("Operating Expense");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Finance
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Cashflow
          </h1>

          <p className="mt-2 max-w-2xl text-slate-500">
            Track money coming into and going out of your business.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={refreshEntries}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            + Add Cashflow
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Total Income
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">
            {formatCurrency(metrics.income)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Total Expenses
          </div>
          <div className="mt-2 text-2xl font-bold text-red-700">
            {formatCurrency(metrics.expenses)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Net Cashflow
          </div>
          <div
            className={`mt-2 text-2xl font-bold ${
              metrics.netCashflow >= 0
                ? "text-emerald-700"
                : "text-red-700"
            }`}
          >
            {formatCurrency(metrics.netCashflow)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            This Month
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-950">
            {formatCurrency(
              metrics.thisMonthIncome -
                metrics.thisMonthExpenses
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1.5fr_0.8fr_0.8fr]">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search cashflow..."
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
        />

        <select
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
        >
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(event) =>
            setCategoryFilter(event.target.value)
          }
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
        >
          <option value="all">All categories</option>

          {allCategories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Date
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Type
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Category
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Description
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Payment
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Amount
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-14 text-center"
                  >
                    <div className="text-sm font-semibold text-slate-700">
                      No cashflow entries found
                    </div>

                    <div className="mt-2 text-sm text-slate-500">
                      Add your first income or expense entry,
                      or change your search/filter.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      {formatDate(entry.entry_date)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          entry.type === "income"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {entry.type === "income"
                          ? "Income"
                          : "Expense"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                      {entry.category}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-sm text-slate-600">
                      <div className="truncate">
                        {entry.description || "—"}
                      </div>

                      {entry.reference && (
                        <div className="mt-1 text-xs text-slate-400">
                          Ref: {entry.reference}
                        </div>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                      {paymentMethodLabel(
                        entry.payment_method
                      )}
                    </td>

                    <td
                      className={`whitespace-nowrap px-5 py-4 text-right text-sm font-bold ${
                        entry.type === "income"
                          ? "text-emerald-700"
                          : "text-red-700"
                      }`}
                    >
                      {entry.type === "income" ? "+" : "-"}
                      {formatCurrency(Number(entry.amount))}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(entry)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(entry)
                          }
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Finance
                </div>

                <h2 className="mt-1 text-2xl font-bold text-slate-950">
                  {editingEntry
                    ? "Edit Cashflow"
                    : "Add Cashflow"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Record money coming into or going out of
                  the business.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Type
                  </label>

                  <select
                    value={type}
                    onChange={(event) =>
                      handleTypeChange(
                        event.target.value as
                          | "income"
                          | "expense"
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                  >
                    <option value="income">
                      Income
                    </option>

                    <option value="expense">
                      Expense
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Category
                  </label>

                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                  >
                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Amount
                  </label>

                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    value={amount}
                    onChange={(event) =>
                      setAmount(event.target.value)
                    }
                    placeholder="0.00"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Payment Method
                  </label>

                  <select
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option
                        key={method.value}
                        value={method.value}
                      >
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Description
                </label>

                <input
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Describe this cashflow entry"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Entry Date
                  </label>

                  <input
                    required
                    type="date"
                    value={entryDate}
                    onChange={(event) =>
                      setEntryDate(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Reference
                  </label>

                  <input
                    value={reference}
                    onChange={(event) =>
                      setReference(event.target.value)
                    }
                    placeholder="Transaction/reference number"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Notes
                </label>

                <textarea
                  rows={4}
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder="Additional notes"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Saving..."
                    : editingEntry
                      ? "Update Cashflow"
                      : "Add Cashflow"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}