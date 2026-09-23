"use client";

import { useState } from "react";
import AddProductForm from "@/components/products/add-product-form";

type AddProductButtonProps = {
  businessId: string;
  currency: string;
};

export default function AddProductButton({
  businessId,
  currency,
}: AddProductButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
      >
        Add product
      </button>

      {open && (
        <AddProductForm
          businessId={businessId}
          currency={currency}
          onClose={() => setOpen(false)}
          onCreated={() => setOpen(false)}
        />
      )}
    </>
  );
}
