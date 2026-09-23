"use client";

import { useState } from "react";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
};

type InventoryMovementFormProps = {
  businessId: string;
  products: Product[];
};

const movementTypes = [
  {
    value: "stock_received",
    label: "Stock received",
    description: "Add stock received from a supplier.",
  },
  {
    value: "stock_returned",
    label: "Stock returned",
    description: "Add stock returned by a customer.",
  },
  {
    value: "stock_adjustment",
    label: "Stock adjustment",
    description: "Remove stock to correct the recorded quantity.",
  },
  {
    value: "stock_damaged",
    label: "Stock damaged",
    description: "Remove stock that was damaged or lost.",
  },
];

export default function InventoryMovementForm({
  businessId,
  products,
}: InventoryMovementFormProps) {
  const [productId, setProductId] = useState(
    products[0]?.id || ""
  );
  const [type, setType] = useState("stock_received");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedProduct = products.find(
    (product) => product.id === productId
  );

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          productId,
          type,
          quantity: Number(quantity),
          note,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to record inventory movement.");
        return;
      }

      setMessage(
        `Inventory movement recorded. ${data.product.name} now has ${Number(
          data.product.stock_quantity
        ).toLocaleString()} units in stock.`
      );

      setQuantity("");
      setNote("");
    } catch {
      setError(
        "Something went wrong while recording the inventory movement."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div>
        <h2 className="font-semibold text-slate-950">
          Record inventory movement
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Add or remove stock while keeping a movement history.
        </p>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="inventory-product"
            className="text-sm font-medium text-slate-700"
          >
            Product
          </label>

          <select
            id="inventory-product"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            required
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
                {product.sku ? ` — ${product.sku}` : ""}
              </option>
            ))}
          </select>

          {selectedProduct && (
            <p className="mt-2 text-xs text-slate-500">
              Current stock:{" "}
              <span className="font-semibold text-slate-700">
                {Number(
                  selectedProduct.stock_quantity
                ).toLocaleString()}
              </span>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="inventory-type"
            className="text-sm font-medium text-slate-700"
          >
            Movement type
          </label>

          <select
            id="inventory-type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            required
          >
            {movementTypes.map((movement) => (
              <option key={movement.value} value={movement.value}>
                {movement.label}
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-slate-500">
            {
              movementTypes.find(
                (movement) => movement.value === type
              )?.description
            }
          </p>
        </div>

        <div>
          <label
            htmlFor="inventory-quantity"
            className="text-sm font-medium text-slate-700"
          >
            Quantity
          </label>

          <input
            id="inventory-quantity"
            type="number"
            min="0.01"
            step="0.01"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            placeholder="Enter quantity"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            required
          />
        </div>

        <div>
          <label
            htmlFor="inventory-note"
            className="text-sm font-medium text-slate-700"
          >
            Note
          </label>

          <input
            id="inventory-note"
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional note"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {message}
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="submit"
          disabled={saving || !products.length}
          className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Recording..." : "Record movement"}
        </button>
      </div>
    </form>
  );
}