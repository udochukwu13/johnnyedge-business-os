"use client";

import { useState } from "react";
import { X, PackagePlus } from "lucide-react";
import { useRouter } from "next/navigation";

type AddProductFormProps = {
  businessId: string;
  currency: string;
  onClose: () => void;
  onCreated: () => void;
};

export default function AddProductForm({
  businessId,
  currency,
  onClose,
  onCreated,
}: AddProductFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("");
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
      const response = await fetch("/api/products", {
        method: "POST",
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
        throw new Error(result.error || "Unable to create product.");
      }

      onCreated();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create product."
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
              <PackagePlus className="h-4 w-4" />
              Product catalog
            </div>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Add product
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
              placeholder="e.g. Premium Rice 25kg"
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
              placeholder="e.g. RICE-25KG"
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
              placeholder="Describe this product..."
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
                placeholder="0.00"
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
                placeholder="0.00"
                className={inputClassName}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Initial stock quantity
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={stockQuantity}
                onChange={(event) => setStockQuantity(event.target.value)}
                placeholder="0"
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
                placeholder="0"
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
              {saving ? "Saving..." : "Save product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
