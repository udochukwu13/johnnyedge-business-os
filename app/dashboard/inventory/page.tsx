import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";
import { Package } from "lucide-react";
import InventoryMovementForm from "@/components/inventory/inventory-movement-form";
import InventoryMovementHistory from "@/components/inventory/inventory-movement-history";

export default async function InventoryPage() {
  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness?.business?.id) {
    return null;
  }

  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, name, sku, stock_quantity, low_stock_threshold, cost_price"
    )
    .eq("business_id", activeBusiness.business.id)
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-900">
            Unable to load inventory
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  const currency = activeBusiness.business.currency || "₦";

  const totalProducts = products?.length || 0;

  const totalUnits = (products || []).reduce(
    (total, product) =>
      total + Number(product.stock_quantity || 0),
    0
  );

  const lowStockProducts = (products || []).filter(
    (product) =>
      Number(product.stock_quantity || 0) > 0 &&
      Number(product.low_stock_threshold || 0) > 0 &&
      Number(product.stock_quantity || 0) <=
        Number(product.low_stock_threshold || 0)
  );

  const outOfStockProducts = (products || []).filter(
    (product) =>
      Number(product.stock_quantity || 0) <= 0
  );

  const inventoryValue = (products || []).reduce(
    (total, product) =>
      total +
      Number(product.stock_quantity || 0) *
        Number(product.cost_price || 0),
    0
  );

  const movementProducts = (products || []).map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    stock_quantity: Number(product.stock_quantity || 0),
    low_stock_threshold: Number(
      product.low_stock_threshold || 0
    ),
  }));

  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <Package className="h-4 w-4" />
          Products + Inventory
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          Inventory
        </h1>

        <p className="mt-2 text-slate-500">
          Monitor stock levels and inventory value across your product catalog.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Products
          </div>

          <div className="mt-2 text-2xl font-bold text-slate-950">
            {totalProducts.toLocaleString()}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-medium text-slate-500">
            Total units
          </div>

          <div className="mt-2 text-2xl font-bold text-slate-950">
            {totalUnits.toLocaleString()}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="text-sm font-medium text-amber-700">
            Low stock
          </div>

          <div className="mt-2 text-2xl font-bold text-amber-900">
            {lowStockProducts.length.toLocaleString()}
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="text-sm font-medium text-red-700">
            Out of stock
          </div>

          <div className="mt-2 text-2xl font-bold text-red-900">
            {outOfStockProducts.length.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-medium text-slate-500">
          Inventory value at cost
        </div>

        <div className="mt-2 text-2xl font-bold text-slate-950">
          {currency}
          {inventoryValue.toLocaleString()}
        </div>
      </div>

      <div className="mt-8">
        <InventoryMovementForm
          businessId={activeBusiness.business.id}
          products={movementProducts}
        />
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-semibold text-slate-950">
            Stock overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current stock levels for your products.
          </p>
        </div>

        {products && products.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {products.map((product) => {
              const stock = Number(product.stock_quantity || 0);
              const threshold = Number(
                product.low_stock_threshold || 0
              );

              const status =
                stock <= 0
                  ? {
                      label: "Out of stock",
                      className:
                        "border-red-200 bg-red-50 text-red-700",
                    }
                  : threshold > 0 && stock <= threshold
                    ? {
                        label: "Low stock",
                        className:
                          "border-amber-200 bg-amber-50 text-amber-700",
                      }
                    : {
                        label: "In stock",
                        className:
                          "border-emerald-200 bg-emerald-50 text-emerald-700",
                      };

              return (
                <div
                  key={product.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-slate-950">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {product.sku || "No SKU"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Stock
                      </div>

                      <div className="mt-1 font-semibold text-slate-950">
                        {stock.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Threshold
                      </div>

                      <div className="mt-1 font-semibold text-slate-950">
                        {threshold.toLocaleString()}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <Package className="mx-auto h-10 w-10 text-slate-300" />

            <h2 className="mt-4 text-lg font-semibold text-slate-950">
              No products yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Add products to your catalog to start managing inventory.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <InventoryMovementHistory
          businessId={activeBusiness.business.id}
        />
      </div>
    </div>
  );
}