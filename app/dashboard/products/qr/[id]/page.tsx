import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";

type ProductQrPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProductQrPage({
  params,
}: ProductQrPageProps) {
  const { id } = await params;

  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness?.business?.id) {
    notFound();
  }

  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      sku,
      description,
      price,
      stock_quantity,
      low_stock_threshold
      `
    )
    .eq("id", id)
    .eq("business_id", activeBusiness.business.id)
    .single();

  if (error || !product) {
    notFound();
  }

  const currency =
    activeBusiness.business.currency || "₦";

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-medium text-slate-500">
          JohnnyEdge AI Business OS
        </div>

        <h1 className="mt-2 text-2xl font-bold text-slate-950">
          Product
        </h1>

        <div className="mt-6 space-y-4">
          <div>
            <div className="text-xs uppercase text-slate-400">
              Product Name
            </div>

            <div className="mt-1 text-lg font-semibold text-slate-950">
              {product.name}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase text-slate-400">
              SKU
            </div>

            <div className="mt-1 text-slate-700">
              {product.sku || "No SKU"}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase text-slate-400">
              Price
            </div>

            <div className="mt-1 font-semibold text-slate-950">
              {currency}
              {Number(product.price || 0).toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-xs uppercase text-slate-400">
              Stock
            </div>

            <div className="mt-1 font-semibold text-slate-950">
              {Number(
                product.stock_quantity || 0
              ).toLocaleString()}
            </div>
          </div>

          {product.description && (
            <div>
              <div className="text-xs uppercase text-slate-400">
                Description
              </div>

              <div className="mt-1 text-slate-700">
                {product.description}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}