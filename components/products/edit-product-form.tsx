"use client";

import { useState } from "react";
import { X, Package } from "lucide-react";
import { useRouter } from "next/navigation";

type EditProductFormProps = {
  businessId: string;
  currency: string;
  product: {
    id: string;
    name: string;
    sku: string | null;
    description: string | null;
    price: number;
    cost_price: number;
    stock_quantity: number;
    low_stock_threshold: number;
  };
  onClose: () => void;
  onUpdated: () => void;
};

export default function EditProductForm({
  businessId,
  currency,
  product,
  onClose,
  onUpdated,
}: EditProductFormProps) {
  const router = useRouter();

  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku || "");
  const [description, setDescription] = useState(product.description || "");
  const [price, setPrice] = useState(String(product.price ?? ""));
  const [costPrice, setCostPrice] = useState(String(product.cost_price ?? ""));
  const [stockQuantity, setStockQuantity] = useState(
    String(product.stock_quantity ?? "")
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    String(product.low_stock_threshold ?? "")
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          name: name.trim(),
          sku: sku.trim() || null,
          description: description.trim() || null,
          price: Number(price) || 0,
          costPrice: Number(costPrice) || 0,
          stockQuantity: Number(stockQuantity) || 0,
          lowStockThreshold: Number(lowStockThreshold) || 0,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to update product.");
      }

      onUpdated();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update product."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClassName =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Package className="h-4 w-4" />
              Product catalog
            </div>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Edit product
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Product name *
            </label>

            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={inputClassName}
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              SKU
            </label>

            <input
              value={sku}
              onChange={(event) => setSku(event.target.value)}
              className={inputClassName}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className={inputClassName}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Selling price ({currency})
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Cost price ({currency})
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={costPrice}
                onChange={(event) => setCostPrice(event.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Stock quantity
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={stockQuantity}
                onChange={(event) => setStockQuantity(event.target.value)}
                className={inputClassName}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Low-stock threshold
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={lowStockThreshold}
                onChange={(event) =>
                  setLowStockThreshold(event.target.value)
                }
                className={inputClassName}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

