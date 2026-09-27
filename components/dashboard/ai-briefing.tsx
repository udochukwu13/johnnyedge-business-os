import ReactMarkdown from "react-markdown";

type AIBriefingProps = {
  currency: string;
  dashboardAIInsight: string;
  grossProfit: number;
  grossMargin: number;
  totalReceivables: number;
  inventoryValue: number;
  totalUnitsInStock: number;
};

export default function AIBriefing({
  currency,
  dashboardAIInsight,
  grossProfit,
  grossMargin,
  totalReceivables,
  inventoryValue,
  totalUnitsInStock,
}: AIBriefingProps) {
  return (
    <section className="mt-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-5">
          <div className="flex items-start justify-between gap-4">

            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white">
                AI
              </div>

              <div>
                <div className="text-sm font-medium text-slate-500">
                  AI Business Briefing
                </div>

                <div className="mt-1 text-lg font-semibold text-slate-950">
                  Management intelligence
                </div>
              </div>
            </div>


            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
              AI-generated
            </div>

          </div>
        </div>


        {dashboardAIInsight ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">

            <div className="mb-5 grid gap-4 md:grid-cols-3">

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Gross Profit
                </div>

                <div className="mt-2 text-xl font-bold text-slate-950">
                  {currency}
                  {grossProfit.toLocaleString()}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  {grossMargin.toFixed(1)}% gross margin
                </div>
              </div>


              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Receivables
                </div>

                <div className="mt-2 text-xl font-bold text-slate-950">
                  {currency}
                  {totalReceivables.toLocaleString()}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  Sales + invoice balances
                </div>
              </div>


              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Inventory at Cost
                </div>

                <div className="mt-2 text-xl font-bold text-slate-950">
                  {currency}
                  {inventoryValue.toLocaleString()}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  {totalUnitsInStock.toLocaleString()} units in stock
                </div>
              </div>

            </div>


            <div className="text-sm leading-7 text-slate-700">

              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-4 text-xl font-bold text-slate-950">
                      {children}
                    </h1>
                  ),

                  h2: ({ children }) => (
                    <h2 className="mb-3 mt-6 text-base font-semibold text-slate-950">
                      {children}
                    </h2>
                  ),

                  h3: ({ children }) => (
                    <h3 className="mb-2 mt-5 font-semibold text-slate-950">
                      {children}
                    </h3>
                  ),

                  p: ({ children }) => (
                    <p className="mb-4 last:mb-0">
                      {children}
                    </p>
                  ),

                  ul: ({ children }) => (
                    <ul className="mb-4 list-disc space-y-2 pl-5">
                      {children}
                    </ul>
                  ),

                  ol: ({ children }) => (
                    <ol className="mb-4 list-decimal space-y-2 pl-5">
                      {children}
                    </ol>
                  ),

                  li: ({ children }) => (
                    <li>{children}</li>
                  ),

                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-950">
                      {children}
                    </strong>
                  ),
                }}
              >
                {dashboardAIInsight}
              </ReactMarkdown>

            </div>

          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            AI business briefing is currently unavailable.
          </div>
        )}

      </div>
    </section>
  );
}