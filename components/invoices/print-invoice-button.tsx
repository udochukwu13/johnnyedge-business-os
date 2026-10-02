"use client";

export default function PrintInvoiceButton() {
  function printInvoice() {
    window.print();
  }

  return (
    <button
      type="button"
      onClick={printInvoice}
      className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
    >
      Print Invoice
    </button>
  );
}