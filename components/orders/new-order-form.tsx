"use client";

import { FormEvent, useMemo, useState } from "react";

type Customer = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock_quantity: number;
};

type OrderItem = {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
};

type NewOrderFormProps = {
  customers: Customer[];
  products: Product[];
  onSuccess: () => void;
  onCancel: () => void;
};

export default function NewOrderForm({
  customers,
  products,
  onSuccess,
  onCancel,
}: NewOrderFormProps) {
  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState("pending");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [lineDiscount, setLineDiscount] = useState("0");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [orderDiscount, setOrderDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedProduct = products.find(
    (product) => product.id === selectedProductId
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          Math.max(
            0,
            item.quantity * item.unit_price - item.discount
          ),
        0
      ),
    [items]
  );

  const total = Math.max(
    0,
    subtotal - Number(orderDiscount || 0) + Number(tax || 0)
  );

  function addItem() {
    setError("");

    if (!selectedProduct) {
      setError("Please select a product.");
      return;
    }

    const itemQuantity = Number(quantity);
    const itemDiscount = Number(lineDiscount);

    if (!Number.isFinite(itemQuantity) || itemQuantity <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    if (
      !Number.isFinite(itemDiscount) ||
      itemDiscount < 0
    ) {
      setError("Line discount cannot be negative.");
      return;
    }

    const existing = items.find(
      (item) => item.product_id === selectedProduct.id
    );

    if (existing) {
      setItems((current) =>
        current.map((item) =>
          item.product_id === selectedProduct.id
            ? {
                ...item,
                quantity: item.quantity + itemQuantity,
                discount: item.discount + itemDiscount,
              }
            : item
        )
      );
    } else {
      setItems((current) => [
        ...current,
        {
          product_id: selectedProduct.id,
          quantity: itemQuantity,
          unit_price: Number(selectedProduct.price),
          discount: itemDiscount,
        },
      ]);
    }

    setSelectedProductId("");
    setQuantity("1");
    setLineDiscount("0");
  }

  function removeItem(productId: string) {
    setItems((current) =>
      current.filter((item) => item.product_id !== productId)
    );
  }

  function updateQuantity(
    productId: string,
    value: string
  ) {
    const nextQuantity = Number(value);

    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: nextQuantity }
          : item
      )
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Please add at least one product.");
      return;
    }

    const discountValue = Number(orderDiscount || 0);
    const taxValue = Number(tax || 0);

    if (!Number.isFinite(discountValue) || discountValue < 0) {
      setError("Order discount cannot be negative.");
      return;
    }

    if (!Number.isFinite(taxValue) || taxValue < 0) {
      setError("Tax cannot be negative.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_id: customerId || null,
          status,
          discount: discountValue,
          tax: taxValue,
          notes: notes.trim() || null,
          items,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to create order."
        );
      }

      onSuccess();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create order."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-slate-950">
          Create Order
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Create a customer order without deducting inventory.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Customer
          </span>
          <select
            value={customerId}
            onChange={(event) =>
              setCustomerId(event.target.value)
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
          >
            <option value="">Walk-in / No customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Status
          </span>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Add Products
        </h3>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select
            value={selectedProductId}
            onChange={(event) =>
              setSelectedProductId(event.target.value)
            }
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 md:col-span-2"
          >
            <option value="">Select product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
                {product.sku ? ` — ${product.sku}` : ""}
                {` — Stock ${product.stock_quantity}`}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(event) =>
              setQuantity(event.target.value)
            }
            placeholder="Quantity"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            value={lineDiscount}
            onChange={(event) =>
              setLineDiscount(event.target.value)
            }
            placeholder="Line discount"
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
          />
        </div>

        <button
          type="button"
          onClick={addItem}
          className="mt-3 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add Product
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Line Total</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No products added yet.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const product = products.find(
                  (candidate) =>
                    candidate.id === item.product_id
                );

                const lineTotal = Math.max(
                  0,
                  item.quantity * item.unit_price -
                    item.discount
                );

                return (
                  <tr key={item.product_id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {product?.name || "Product"}
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(event) =>
                          updateQuantity(
                            item.product_id,
                            event.target.value
                          )
                        }
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1.5"
                      />
                    </td>

                    <td className="px-4 py-3">
                      NGN{" "}
                      {item.unit_price.toLocaleString()}
                    </td>

                    <td className="px-4 py-3">
                      NGN{" "}
                      {item.discount.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 font-medium">
                      NGN{" "}
                      {lineTotal.toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          removeItem(item.product_id)
                        }
                        className="text-sm font-medium text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Order Discount
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={orderDiscount}
            onChange={(event) =>
              setOrderDiscount(event.target.value)
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Tax
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={tax}
            onChange={(event) =>
              setTax(event.target.value)
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Notes
          </span>
          <input
            type="text"
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            placeholder="Optional order notes"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          />
        </label>
      </div>

      <div className="rounded-2xl bg-slate-950 p-5 text-white">
        <div className="flex items-center justify-between text-sm text-slate-300">
          <span>Subtotal</span>
          <span>NGN {subtotal.toLocaleString()}</span>
        </div>

        <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
          <span>Discount</span>
          <span>
            NGN {Number(orderDiscount || 0).toLocaleString()}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
          <span>Tax</span>
          <span>
            NGN {Number(tax || 0).toLocaleString()}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-700 pt-4">
          <span className="font-semibold">Order Total</span>
          <span className="text-xl font-bold">
            NGN {total.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating Order..." : "Create Order"}
        </button>
      </div>
    </form>
  );
}
