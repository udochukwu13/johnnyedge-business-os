"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  price: number;
  stock_quantity: number;
};

type InvoiceLine = {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
};

function formatCurrency(value: number) {
  return `₦${value.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function generateInvoiceNumber() {
  const timestamp = Date.now();
  return `INV-${timestamp}`;
}

export default function NewInvoicePage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [invoiceNumber, setInvoiceNumber] = useState(
    generateInvoiceNumber()
  );
  const [customerId, setCustomerId] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState("");
  const [tax, setTax] = useState(0);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<InvoiceLine[]>([
    {
      product_id: "",
      quantity: 1,
      unit_price: 0,
      discount: 0,
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [customersResponse, productsResponse] = await Promise.all([
          fetch("/api/customers", { cache: "no-store" }),
          fetch("/api/products", { cache: "no-store" }),
        ]);

        const customersData = await customersResponse.json();
        const productsData = await productsResponse.json();

        if (!customersResponse.ok) {
          throw new Error(
            customersData.error || "Failed to load customers"
          );
        }

        if (!productsResponse.ok) {
          throw new Error(
            productsData.error || "Failed to load products"
          );
        }

        setCustomers(customersData.customers ?? []);
        setProducts(productsData.products ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load invoice data"
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const lineTotal = Math.max(
        item.quantity * item.unit_price - item.discount,
        0
      );

      return sum + lineTotal;
    }, 0);
  }, [items]);

  const total = useMemo(() => {
    return Math.max(
      subtotal - invoiceDiscount + tax,
      0
    );
  }, [subtotal, invoiceDiscount, tax]);

  const balanceDue = useMemo(() => {
    return Math.max(total - amountPaid, 0);
  }, [total, amountPaid]);

  function updateItem(
    index: number,
    updates: Partial<InvoiceLine>
  ) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, ...updates }
          : item
      )
    );
  }

  function handleProductChange(
    index: number,
    productId: string
  ) {
    const product = products.find(
      (item) => item.id === productId
    );

    updateItem(index, {
      product_id: productId,
      unit_price: product ? Number(product.price) : 0,
    });
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        product_id: "",
        quantity: 1,
        unit_price: 0,
        discount: 0,
      },
    ]);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;

    setItems((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (!invoiceNumber.trim()) {
        throw new Error("Invoice number is required");
      }

      const validItems = items.filter(
        (item) => item.product_id
      );

      if (!validItems.length) {
        throw new Error(
          "Add at least one product to the invoice"
        );
      }

      for (const item of validItems) {
        if (item.quantity <= 0) {
          throw new Error(
            "Invoice quantity must be greater than zero"
          );
        }

        if (item.unit_price < 0) {
          throw new Error(
            "Invoice unit price cannot be negative"
          );
        }

        if (item.discount < 0) {
          throw new Error(
            "Invoice item discount cannot be negative"
          );
        }
      }

      if (invoiceDiscount < 0 || tax < 0) {
        throw new Error(
          "Discount and tax cannot be negative"
        );
      }

      if (amountPaid < 0) {
        throw new Error(
          "Amount paid cannot be negative"
        );
      }

      if (amountPaid > total) {
        throw new Error(
          "Amount paid cannot exceed the invoice total"
        );
      }

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice_number: invoiceNumber.trim(),
          customer_id: customerId || null,
          status: "draft",
          issue_date: issueDate,
          due_date: dueDate || null,
          discount: invoiceDiscount,
          tax,
          amount_paid: amountPaid,
          notes: notes.trim() || null,
          items: validItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create invoice"
        );
      }

      router.push("/dashboard/invoices");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create invoice"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">
            Finance
          </div>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            New Invoice
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Create a customer invoice and record the initial payment.
          </p>
        </div>

        <Link
          href="/dashboard/invoices"
          className="inline-flex w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          ← Back to Invoices
        </Link>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Loading customers and products...
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-bold text-slate-950">
                Invoice Information
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Invoice Number
                  </label>

                  <input
                    value={invoiceNumber}
                    onChange={(event) =>
                      setInvoiceNumber(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Customer
                  </label>

                  <select
                    value={customerId}
                    onChange={(event) =>
                      setCustomerId(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="">
                      Walk-in Customer
                    </option>

                    {customers.map((customer) => (
                      <option
                        key={customer.id}
                        value={customer.id}
                      >
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Issue Date
                  </label>

                  <input
                    type="date"
                    value={issueDate}
                    onChange={(event) =>
                      setIssueDate(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Due Date
                  </label>

                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) =>
                      setDueDate(event.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">
                Invoice Summary
              </h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Subtotal
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Discount
                  </span>
                  <span className="font-semibold text-slate-900">
                    -{formatCurrency(invoiceDiscount)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Tax
                  </span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(tax)}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-700">
                      Total
                    </span>
                    <span className="text-xl font-bold text-slate-950">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Amount Paid
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {formatCurrency(amountPaid)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Balance Due
                  </span>
                  <span className="font-semibold text-amber-700">
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Invoice Items
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Select products and enter quantities and discounts.
                </p>
              </div>

              <button
                type="button"
                onClick={addItem}
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                + Add Item
              </button>
            </div>

            <div className="overflow-x-auto p-6">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Product
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Quantity
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Unit Price
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Discount
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Line Total
                    </th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => {
                    const selectedProduct = products.find(
                      (product) =>
                        product.id === item.product_id
                    );

                    const lineTotal = Math.max(
                      item.quantity * item.unit_price -
                        item.discount,
                      0
                    );

                    return (
                      <tr key={index}>
                        <td className="px-3 py-4">
                          <select
                            value={item.product_id}
                            onChange={(event) =>
                              handleProductChange(
                                index,
                                event.target.value
                              )
                            }
                            className="min-w-64 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                            required
                          >
                            <option value="">
                              Select product
                            </option>

                            {products.map((product) => (
                              <option
                                key={product.id}
                                value={product.id}
                              >
                                {product.name}
                                {product.sku
                                  ? ` — ${product.sku}`
                                  : ""}
                              </option>
                            ))}
                          </select>

                          {selectedProduct ? (
                            <div className="mt-1 text-xs text-slate-500">
                              Stock:{" "}
                              {Number(
                                selectedProduct.stock_quantity
                              ).toLocaleString("en-NG")}
                            </div>
                          ) : null}
                        </td>

                        <td className="px-3 py-4">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(index, {
                                quantity: Number(
                                  event.target.value
                                ),
                              })
                            }
                            className="w-28 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                            required
                          />
                        </td>

                        <td className="px-3 py-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(event) =>
                              updateItem(index, {
                                unit_price: Number(
                                  event.target.value
                                ),
                              })
                            }
                            className="w-36 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                            required
                          />
                        </td>

                        <td className="px-3 py-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discount}
                            onChange={(event) =>
                              updateItem(index, {
                                discount: Number(
                                  event.target.value
                                ),
                              })
                            }
                            className="w-32 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
                          />
                        </td>

                        <td className="px-3 py-4 text-right font-semibold text-slate-950">
                          {formatCurrency(lineTotal)}
                        </td>

                        <td className="px-3 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              removeItem(index)
                            }
                            disabled={items.length === 1}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">
                Adjustments
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Invoice Discount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={invoiceDiscount}
                    onChange={(event) =>
                      setInvoiceDiscount(
                        Number(event.target.value)
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Tax
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tax}
                    onChange={(event) =>
                      setTax(Number(event.target.value))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Amount Paid
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountPaid}
                    onChange={(event) =>
                      setAmountPaid(
                        Number(event.target.value)
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">
                Notes
              </h2>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                rows={5}
                placeholder="Optional invoice notes..."
                className="mt-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard/invoices"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving || loading}
              className="rounded-xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Creating Invoice..." : "Create Invoice"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}