"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import EditProductButton from "@/components/products/edit-product-button";
import DeleteProductButton from "@/components/products/delete-product-button";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price: number;
  cost_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
};

type ProductSearchProps = {
  products: Product[];
  businessId: string;
  currency: string;
};

export default function ProductSearch({
  products,
  businessId,
  currency,
}: ProductSearchProps) {
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(term) ||
        (product.sku || "").toLowerCase().includes(term) ||
        (product.description || "").toLowerCase().includes(term)
      );
    });
  }, [products, search]);

  function getStockStatus(product: Product) {
    if (product.stock_quantity <= 0) {
      return {
        label: "Out of stock",
        className:
          "border-red-200 bg-red-50 text-red-700",
      };
    }

    if (
      product.low_stock_threshold > 0 &&
      product.stock_quantity <= product.low_stock_threshold
    ) {
      return {
        label: "Low stock",
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
      };
    }

    return {
      label: "In stock",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return (
    <>
      <div className="border-b border-slate-200 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products by name, SKU, or description..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100"
          />
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {filteredProducts.map((product) => {
            const stockStatus = getStockStatus(product);

            return (
              <div
                key={product.id}
                className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h2 className="font-semibold text-slate-950">
                    {product.name}
                  </h2>

                  <div className="mt-1 text-sm text-slate-500">
                    {product.sku || "No SKU"}
                  </div>

                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${stockStatus.className}`}
                    >
                      {stockStatus.label}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="grid grid-cols-2 gap-6 text-sm sm:grid-cols-3">
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Price
                      </div>

                      <div className="mt-1 font-semibold text-slate-950">
                        {currency}
                        {Number(product.price || 0).toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Cost
                      </div>

                      <div className="mt-1 font-semibold text-slate-950">
                        {currency}
                        {Number(product.cost_price || 0).toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Stock
                      </div>

                      <div className="mt-1 font-semibold text-slate-950">
                        {Number(product.stock_quantity || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <EditProductButton
                      businessId={businessId}
                      currency={currency}
                      product={product}
                    />

                    <DeleteProductButton
                      productId={product.id}
                      productName={product.name}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-6 py-16 text-center">
          <Search className="mx-auto h-10 w-10 text-slate-300" />

          <h2 className="mt-4 text-lg font-semibold text-slate-950">
            No matching products
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Try a different product name, SKU, or description.
          </p>
        </div>
      )}
    </>
  );
}