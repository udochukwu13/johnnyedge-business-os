import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";
import { Package } from "lucide-react";
import AddProductButton from "@/components/products/add-product-button";
import ProductSearch from "@/components/products/product-search";
import ProductSummary from "@/components/products/product-summary";

export default async function ProductsPage() {
  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness?.business?.id) {
    return null;
  }

  const supabase = await createClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, name, sku, description, price, cost_price, stock_quantity, low_stock_threshold"
    )
    .eq("business_id", activeBusiness.business.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-900">
            Unable to load products
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  const currency = activeBusiness.business.currency || "₦";

  const formattedProducts = (products || []).map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description,
    price: Number(product.price || 0),
    cost_price: Number(product.cost_price || 0),
    stock_quantity: Number(product.stock_quantity || 0),
    low_stock_threshold: Number(product.low_stock_threshold || 0),
  }));
const totalProducts = formattedProducts.length;

const inventoryCost = formattedProducts.reduce(
  (sum, product) =>
    sum + product.stock_quantity * product.cost_price,
  0
);

const totalUnitsInStock = formattedProducts.reduce(
  (sum, product) =>
    sum + product.stock_quantity,
  0
);

const potentialSalesValue = formattedProducts.reduce(
  (sum, product) =>
    sum + product.stock_quantity * product.price,
  0
);

const lowStockProducts = formattedProducts.filter(
  (product) =>
    product.stock_quantity <= product.low_stock_threshold
).length;
  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Package className="h-4 w-4" />
            Products + Inventory
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Products
          </h1>

          <p className="mt-2 text-slate-500">
            Manage your products, pricing, costs, and stock levels.
          </p>
        </div>

        <AddProductButton
          businessId={activeBusiness.business.id}
          currency={currency}
        />
      </div>
<ProductSummary
  currency={currency}
  totalProducts={totalProducts}
  inventoryCost={inventoryCost}
  totalUnitsInStock={totalUnitsInStock}
  potentialSalesValue={potentialSalesValue}
  lowStockProducts={lowStockProducts}
/>
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="text-sm font-medium text-slate-500">
            Product catalog
          </div>
        </div>

        <ProductSearch
          products={formattedProducts}
          businessId={activeBusiness.business.id}
          currency={currency}
        />
      </div>
    </div>
  );
}