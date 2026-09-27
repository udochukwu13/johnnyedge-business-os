"use client";

import { useState } from "react";

type ReceivePaymentButtonProps = {
  saleId: string;
  customerId: string | null;
  saleNumber: string;
  balanceDue: number;
  currency: string;
};

export default function ReceivePaymentButton({
  saleId,
  customerId,
  saleNumber,
  balanceDue,
  currency,
}: ReceivePaymentButtonProps) {
  const [open, setOpen] = useState(false);

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);

  async function submitPayment() {
    setLoading(true);

    const response = await fetch("/api/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sale_id: saleId,
        customer_id: customerId,
        amount,
        payment_method: paymentMethod,
        reference,
        notes,
      }),
    });

    setLoading(false);

    if (response.ok) {
      window.location.reload();
    } else {
      const data = await response.json();
      alert(data.error || "Payment failed");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
      >
        Receive Payment
      </button>

      {open && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="font-semibold text-slate-950">
            Receive payment
          </div>

          <div className="mt-1 text-sm text-slate-500">
            {saleNumber}
          </div>

          <div className="mt-3 text-sm text-slate-500">
            Outstanding:
            <span className="ml-2 font-semibold text-red-600">
              {currency}
              {balanceDue.toLocaleString()}
            </span>
          </div>

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Payment amount"
            className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-2"
          />

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2"
          >
            <option value="cash">
              Cash
            </option>

            <option value="bank_transfer">
              Bank Transfer
            </option>

            <option value="card">
              Card
            </option>
          </select>

          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Reference (optional)"
            className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2"
          />

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2"
          />

          <button
            type="button"
            onClick={submitPayment}
            disabled={loading}
            className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            {loading ? "Saving..." : "Save Payment"}
          </button>
        </div>
      )}
    </div>
  );
}