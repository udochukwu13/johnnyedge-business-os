"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  sku: string | null;
};

type InventoryMovement = {
  id: string;
  product_id: string;
  type: string;
  quantity: number;
  note: string | null;
  created_at: string;
  product: Product | Product[] | null;
};

type InventoryMovementHistoryProps = {
  businessId: string;
};

const movementLabels: Record<string, string> = {
  stock_received: "Stock received",
  stock_returned: "Stock returned",
  stock_adjustment: "Stock adjustment",
  stock_damaged: "Stock damaged",
};

function getProduct(movement: InventoryMovement) {
  if (Array.isArray(movement.product)) {
    return movement.product[0] || null;
  }

  return movement.product;
}

export default function InventoryMovementHistory({
  businessId,
}: InventoryMovementHistoryProps) {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMovements() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/inventory?businessId=${encodeURIComponent(businessId)}`
        );

        const data = await response.json();

        if (!response.ok) {
          setError(
            data.error || "Unable to load inventory movement history."
          );
          return;
        }

        setMovements(data.movements || []);
      } catch {
        setError(
          "Something went wrong while loading inventory movement history."
        );
      } finally {
        setLoading(false);
      }
    }

    loadMovements();
  }, [businessId]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="font-semibold text-slate-950">
          Movement history
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          A record of stock received, returned, adjusted, damaged, or removed.
        </p>
      </div>

      {loading ? (
        <div className="px-6 py-12 text-center text-sm text-slate-500">
          Loading movement history...
        </div>
      ) : error ? (
        <div className="p-5">
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      ) : movements.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {movements.map((movement) => {
            const product = getProduct(movement);

            const label =
              movementLabels[movement.type] || movement.type;

            const isAddition =
              movement.type === "stock_received" ||
              movement.type === "stock_returned";

            const quantityPrefix = isAddition ? "+" : "-";

            const formattedDate = new Date(
              movement.created_at
            ).toLocaleString();

            return (
              <div
                key={movement.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="font-semibold text-slate-950">
                    {product?.name || "Unknown product"}
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    {product?.sku || "No SKU"}
                  </div>

                  <div className="mt-2 text-sm text-slate-600">
                    {label}
                  </div>

                  {movement.note && (
                    <div className="mt-1 text-sm text-slate-500">
                      {movement.note}
                    </div>
                  )}

                  <div className="mt-2 text-xs text-slate-400">
                    {formattedDate}
                  </div>
                </div>

                <div
                  className={`text-lg font-bold ${
                    isAddition
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {quantityPrefix}
                  {Number(movement.quantity || 0).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <h3 className="text-lg font-semibold text-slate-950">
            No inventory movements yet
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Inventory movements will appear here when stock is received,
            returned, adjusted, or damaged.
          </p>
        </div>
      )}
    </div>
  );
}