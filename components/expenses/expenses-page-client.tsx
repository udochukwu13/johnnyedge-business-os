"use client";

import { FormEvent, useMemo, useState } from "react";

type Expense = {
  id: string;
  business_id: string;
  category: string;
  description: string | null;
  amount: number | string;
  payment_method: string | null;
  expense_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type ExpensesPageClientProps = {
  initialExpenses: Expense[];
};

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "other", label: "Other" },
];

function formatCurrency(value: number | string) {
  return `₦${Number(value ?? 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: string) {
  if (!value) return "—";

  return new Date(`${value}T00:00:00`).toLocaleDateString(
    "en-NG",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function paymentMethodLabel(value: string | null) {
  if (!value) return "—";

  return (
    PAYMENT_METHODS.find(
      (method) => method.value === value
    )?.label || value
  );
}

export default function ExpensesPageClient({
  initialExpenses,
}: ExpensesPageClientProps) {
  const [expenses, setExpenses] =
    useState<Expense[]>(initialExpenses);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] =
    useState<Expense | null>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState("cash");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        expenses
          .map((expense) => expense.category.trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return expenses.filter((expense) => {
      const matchesSearch =
        !query ||
        expense.category.toLowerCase().includes(query) ||
        expense.description
          ?.toLowerCase()
          .includes(query) ||
        expense.notes?.toLowerCase().includes(query) ||
        expense.payment_method
          ?.toLowerCase()
          .includes(query);

      const matchesCategory =
        categoryFilter === "all" ||
        expense.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [expenses, search, categoryFilter]);

  const metrics = useMemo(() => {
    const total = expenses.reduce(
      (sum, expense) =>
        sum + Number(expense.amount ?? 0),
      0
    );

    const thisMonthKey =
      new Date().toISOString().slice(0, 7);

    const thisMonth = expenses
      .filter((expense) =>
        expense.expense_date.startsWith(
          thisMonthKey
        )
      )
      .reduce(
        (sum, expense) =>
          sum + Number(expense.amount ?? 0),
        0
      );

    const average =
      expenses.length > 0
        ? total / expenses.length
        : 0;

    const categoriesCount = new Set(
      expenses.map((expense) => expense.category)
    ).size;

    return {
      total,
      thisMonth,
      average,
      categoriesCount,
    };
  }, [expenses]);

  function resetForm() {
    setCategory("");
    setDescription("");
    setAmount("");
    setPaymentMethod("cash");
    setExpenseDate(
      new Date().toISOString().slice(0, 10)
    );
    setNotes("");
    setEditingExpense(null);
  }

  function openCreateForm() {
    resetForm();
    setError("");
    setShowForm(true);
  }

  function openEditForm(expense: Expense) {
    setEditingExpense(expense);
    setCategory(expense.category);
    setDescription(expense.description ?? "");
    setAmount(String(expense.amount ?? ""));
    setPaymentMethod(
      expense.payment_method ?? "cash"
    );
    setExpenseDate(expense.expense_date);
    setNotes(expense.notes ?? "");
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    resetForm();
  }

  async function refreshExpenses() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/expenses",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to load expenses."
        );
      }

      setExpenses(data.expenses ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load expenses."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (!category.trim()) {
        throw new Error(
          "Expense category is required."
        );
      }

      const numericAmount = Number(amount);

      if (
        !Number.isFinite(numericAmount) ||
        numericAmount < 0
      ) {
        throw new Error(
          "Enter a valid non-negative expense amount."
        );
      }

      const payload = {
        category: category.trim(),
        description:
          description.trim() || null,
        amount: numericAmount,
        payment_method:
          paymentMethod || null,
        expense_date: expenseDate,
        notes: notes.trim() || null,
      };

      const response = await fetch(
        "/api/expenses",
        {
          method: editingExpense
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            editingExpense
              ? {
                  expense_id:
                    editingExpense.id,
                  ...payload,
                }
              : payload
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to save expense."
        );
      }

      if (editingExpense) {
        setExpenses((current) =>
          current.map((expense) =>
            expense.id === editingExpense.id
              ? {
                  ...expense,
                  ...data.expense,
                }
              : expense
          )
        );
      } else {
        setExpenses((current) => [
          data.expense,
          ...current,
        ]);
      }

      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save expense."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteExpense(expense: Expense) {
    const confirmed = window.confirm(
      `Delete this ${expense.category} expense of ${formatCurrency(
        expense.amount
      )}?`
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(
        "/api/expenses",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            expense_id: expense.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to delete expense."
        );
      }

      setExpenses((current) =>
        current.filter(
          (item) => item.id !== expense.id
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete expense."
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Finance
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Expenses
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Track business spending, payment methods,
            expense categories and monthly outflow.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={refreshExpenses}
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
            + Add Expense
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Total Expenses
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-950">
            {formatCurrency(metrics.total)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            This Month
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-950">
            {formatCurrency(metrics.thisMonth)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Average Expense
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-950">
            {formatCurrency(metrics.average)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Categories
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-950">
            {metrics.categoriesCount}
          </div>
        </div>
      </div>

      {showForm ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                {editingExpense
                  ? "Edit Expense"
                  : "Add Expense"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Record a business expense.
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Close
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-6 grid gap-4 md:grid-cols-2"
          >
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">
                Category
              </span>

              <input
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                placeholder="e.g. Rent, Transport, Utilities"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                required
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">
                Amount
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                required
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">
                Description
              </span>

              <input
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="What was this expense for?"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">
                Payment Method
              </span>

              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              >
                {PAYMENT_METHODS.map(
                  (method) => (
                    <option
                      key={method.value}
                      value={method.value}
                    >
                      {method.label}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700">
                Expense Date
              </span>

              <input
                type="date"
                value={expenseDate}
                onChange={(event) =>
                  setExpenseDate(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                required
              />
            </label>

            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Notes
              </span>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                rows={3}
                placeholder="Optional notes..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </label>

            <div className="flex justify-end gap-2 md:col-span-2">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingExpense
                  ? "Save Changes"
                  : "Add Expense"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row">
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search category, description, payment method..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="all">
              All categories
            </option>

            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-sm font-semibold text-slate-700">
              No expenses found
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Add your first business expense or
              change your search/filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Category
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Description
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Payment
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Amount
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map(
                  (expense) => (
                    <tr
                      key={expense.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(
                          expense.expense_date
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-950">
                          {expense.category}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="max-w-xs text-sm text-slate-600">
                          {expense.description ||
                            "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {paymentMethodLabel(
                          expense.payment_method
                        )}
                      </td>

                      <td className="px-5 py-4 text-right text-sm font-bold text-slate-950">
                        {formatCurrency(
                          expense.amount
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                expense
                              )
                            }
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteExpense(
                                expense
                              )
                            }
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}