type ProductSummaryProps = {
  currency: string;
  totalProducts: number;
  inventoryCost: number;
  totalUnitsInStock: number;
  potentialSalesValue: number;
  lowStockProducts: number;
};

export default function ProductSummary({
  currency,
  totalProducts,
  inventoryCost,
  totalUnitsInStock,
  potentialSalesValue,
  lowStockProducts,
}: ProductSummaryProps) {
  return (
    <section className="mt-8">
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">
            Total Products
          </div>

          <div className="mt-2 break-words text-xl font-bold text-slate-950">
            {totalProducts.toLocaleString()}
          </div>
        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">
            Inventory Cost
          </div>

          <div className="mt-2 text-2xl font-bold text-slate-950">
            {currency}
            {inventoryCost.toLocaleString()}
          </div>
        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">
            Units In Stock
          </div>

          <div className="mt-2 text-2xl font-bold text-slate-950">
            {totalUnitsInStock.toLocaleString()}
          </div>
        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">
            Potential Sales Value
          </div>

          <div className="mt-2 text-2xl font-bold text-slate-950">
            {currency}
            {potentialSalesValue.toLocaleString()}
          </div>
        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-500">
            Low Stock Products
          </div>

          <div className="mt-2 text-2xl font-bold text-slate-950">
            {lowStockProducts.toLocaleString()}
          </div>
        </div>

      </div>
    </section>
  );
}