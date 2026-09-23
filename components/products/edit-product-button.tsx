"use client";

import { useState } from "react";
import EditProductForm from "@/components/products/edit-product-form";

type EditProductButtonProps = {
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
};

export default function EditProductButton({
  businessId,
  currency,
  product,
}: EditProductButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        Edit
      </button>

      {open && (
        <EditProductForm
          businessId={businessId}
          currency={currency}
          product={product}
          onClose={() => setOpen(false)}
          onUpdated={() => setOpen(false)}
        />
      )}
    </>
  );
}
