"use client";

import { useState } from "react";
import AddCustomerActivityForm from "@/components/customers/add-customer-activity-form";

type AddCustomerActivityButtonProps = {
  customerId: string;
};

export default function AddCustomerActivityButton({
  customerId,
}: AddCustomerActivityButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
      >
        Add activity
      </button>

      {open && (
        <AddCustomerActivityForm
          customerId={customerId}
          onClose={() => setOpen(false)}
          onCreated={() => setOpen(false)}
        />
      )}
    </>
  );
}
