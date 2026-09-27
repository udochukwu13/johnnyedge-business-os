"use client";

export default function PrintStatementButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
    >
      Print Statement
    </button>
  );
}