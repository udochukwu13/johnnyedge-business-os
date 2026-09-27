type InventoryIntelligenceProps = {
  currency: string;
  inventoryValue: number;
  totalUnitsInStock: number;
  totalProducts: number;
  inventorySalesValue: number;
  inventoryPotentialProfit: number;
  lowStockProducts: number;
};

export default function InventoryIntelligence({
  currency,
  inventoryValue,
  totalUnitsInStock,
  totalProducts,
  inventorySalesValue,
  inventoryPotentialProfit,
  lowStockProducts,
}: InventoryIntelligenceProps) {
  return (
    <section className="mt-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-5">
          <div className="text-sm font-medium text-slate-500">
            Inventory Intelligence
          </div>

          <div className="mt-1 text-lg font-semibold text-slate-950">
            Current stock position
          </div>
        </div>


        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">
              Inventory Value at Cost
            </div>

            <div className="mt-2 text-2xl font-semibold text-slate-950">
              {currency}
              {inventoryValue.toLocaleString()}
            </div>
          </div>


          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">
              Units in Stock
            </div>

            <div className="mt-2 text-2xl font-semibold text-slate-950">
              {totalUnitsInStock.toLocaleString()}
            </div>
          </div>


          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">
              Products
            </div>

            <div className="mt-2 text-2xl font-semibold text-slate-950">
              {totalProducts.toLocaleString()}
            </div>
          </div>


          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">
              Potential Sales Value
            </div>

            <div className="mt-2 text-2xl font-semibold text-slate-950">
              {currency}
              {inventorySalesValue.toLocaleString()}
            </div>
          </div>


          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">
              Potential Gross Profit
            </div>

            <div className="mt-2 text-2xl font-semibold text-emerald-600">
              {currency}
              {inventoryPotentialProfit.toLocaleString()}
            </div>
          </div>


          <div className="rounded-xl bg-slate-50 p-4">
            <div className="text-sm text-slate-500">
              Low Stock Products
            </div>

            <div className="mt-2 text-2xl font-semibold text-slate-950">
              {lowStockProducts.toLocaleString()}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}