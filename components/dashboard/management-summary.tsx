import { Wallet, Package, TrendingUp, AlertTriangle } from "lucide-react";

type ManagementSummaryProps = {
  currency: string;
  grossProfit: number;
  grossMargin: number;
  totalReceivables: number;
  inventoryValue: number;
  totalUnitsInStock: number;
};

export default function ManagementSummary({
  currency,
  grossProfit,
  grossMargin,
  totalReceivables,
  inventoryValue,
  totalUnitsInStock,
}: ManagementSummaryProps) {
  return (
    <section className="mb-8">
      <div className="mb-5">
        <div className="text-sm font-medium text-slate-500">
          Management Summary
        </div>

        <div className="mt-1 text-lg font-semibold text-slate-950">
          Executive business position
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        {/* Profit */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <TrendingUp size={20} />
            </div>

            <span className="text-xs font-medium text-emerald-600">
              Positive
            </span>
          </div>

          <div className="mt-4 text-sm text-slate-500">
            Gross Profit
          </div>

          <div className="mt-1 text-2xl font-bold text-slate-950">
            {currency}
            {grossProfit.toLocaleString()}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            {grossMargin.toFixed(1)}% gross margin
          </div>
        </div>


        {/* Receivables */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <Wallet size={20} />
            </div>

            <span className="text-xs font-medium text-amber-600">
              Attention
            </span>
          </div>

          <div className="mt-4 text-sm text-slate-500">
            Receivables
          </div>

          <div className="mt-1 text-2xl font-bold text-slate-950">
            {currency}
            {totalReceivables.toLocaleString()}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            Outstanding customer balances
          </div>
        </div>


        {/* Inventory */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <Package size={20} />
            </div>

            <span className="text-xs font-medium text-slate-500">
              Stock
            </span>
          </div>

          <div className="mt-4 text-sm text-slate-500">
            Inventory at Cost
          </div>

          <div className="mt-1 text-2xl font-bold text-slate-950">
            {currency}
            {inventoryValue.toLocaleString()}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            {totalUnitsInStock.toLocaleString()} units available
          </div>
        </div>


        {/* Risk */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <AlertTriangle size={20} />
            </div>

            <span className="text-xs font-medium text-slate-500">
              Review
            </span>
          </div>

          <div className="mt-4 text-sm text-slate-500">
            Business Focus
          </div>

          <div className="mt-1 text-lg font-bold text-slate-950">
            Cash & Inventory
          </div>

          <div className="mt-1 text-xs text-slate-500">
            Monitor collections and stock movement
          </div>
        </div>

      </div>
    </section>
  );
}