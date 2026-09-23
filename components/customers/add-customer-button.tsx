"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AddCustomerForm from "@/components/customers/add-customer-form";

type AddCustomerButtonProps = {
  businessId: string;
  currency: string;
};

export default function AddCustomerButton({
  businessId,
  currency,
}: AddCustomerButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleCreated() {
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
      >
        Add customer
      </button>

      {open && (
        <AddCustomerForm
          businessId={businessId}
          currency={currency}
          onClose={() => setOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
