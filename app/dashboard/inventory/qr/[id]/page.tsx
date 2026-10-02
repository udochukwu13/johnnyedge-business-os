import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";

type InventoryQrPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function InventoryQrPage({
  params,
}: InventoryQrPageProps) {
  const { id } = await params;

  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness?.business?.id) {
    notFound();
  }

  const supabase = await createClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      sku,
      stock_quantity,
      low_stock_threshold,
      cost_price,
      price
      `
    )
    .eq("id", id)
    .eq("business_id", activeBusiness.business.id)
    .single();

  if (productError || !product) {
    notFound();
  }

  const { data: movements } = await supabase
    .from("inventory_movements")
    .select(
      `
      id,
      type,
      quantity,
      note,
      created_at
      `
    )
    .eq("product_id", product.id)
    .eq("business_id", activeBusiness.business.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const currency =
    activeBusiness.business.currency || "₦";

  const stock = Number(product.stock_quantity || 0);
  const threshold = Number(product.low_stock_threshold || 0);
  const costPrice = Number(product.cost_price || 0);
  const price = Number(product.price || 0);

  const inventoryValue = stock * costPrice;

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

  const movementLabels: Record<string, string> = {
    stock_received: "Stock received",
    stock_returned: "Stock returned",
    stock_adjustment: "Stock adjustment",
    stock_damaged: "Stock damaged",
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-medium text-slate-500">
          JohnnyEdge AI Business OS
        </div>

        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          Inventory
        </h1>

        <div className="mt-6 rounded-2xl bg-slate-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                {product.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {product.sku || "No SKU"}
              </p>
            </div>

            <span
              className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
            >
              {status.label}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase text-slate-400">
              Current Stock
            </div>

            <div className="mt-2 text-2xl font-bold text-slate-950">
              {stock.toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase text-slate-400">
              Threshold
            </div>

            <div className="mt-2 text-2xl font-bold text-slate-950">
              {threshold.toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase text-slate-400">
              Cost Price
            </div>

            <div className="mt-2 text-xl font-bold text-slate-950">
              {currency}
              {costPrice.toLocaleString()}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-xs uppercase text-slate-400">
              Inventory Value
            </div>

            <div className="mt-2 text-xl font-bold text-slate-950">
              {currency}
              {inventoryValue.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 p-5">
          <div className="text-xs uppercase text-slate-400">
            Selling Price
          </div>

          <div className="mt-2 text-xl font-bold text-slate-950">
            {currency}
            {price.toLocaleString()}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-slate-950">
            Recent Stock Movements
          </h2>

          {movements && movements.length > 0 ? (
            <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {movements.map((movement) => {
                const isAddition =
                  movement.type === "stock_received" ||
                  movement.type === "stock_returned";

                return (
                  <div
                    key={movement.id}
                    className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-950">
                        {movementLabels[movement.type] ||
                          movement.type}
                      </div>

                      {movement.note && (
                        <div className="mt-1 text-sm text-slate-500">
                          {movement.note}
                        </div>
                      )}

                      <div className="mt-1 text-xs text-slate-400">
                        {new Date(
                          movement.created_at
                        ).toLocaleString()}
                      </div>
                    </div>

                    <div
                      className={`text-lg font-bold ${
                        isAddition
                          ? "text-emerald-700"
                          : "text-red-700"
                      }`}
                    >
                      {isAddition ? "+" : "-"}
                      {Number(
                        movement.quantity || 0
                      ).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
              No stock movements recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}