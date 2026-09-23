"use client";

import { useState } from "react";
import EditCustomerForm from "@/components/customers/edit-customer-form";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  balance: number | null;
};

type EditCustomerButtonProps = {
  customer: Customer;
  currency: string;
};

export default function EditCustomerButton({
  customer,
  currency,
}: EditCustomerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        Edit customer
      </button>

      {open && (
        <EditCustomerForm
          customer={customer}
          currency={currency}
          onClose={() => setOpen(false)}
          onUpdated={() => setOpen(false)}
        />
      )}
    </>
  );
}
