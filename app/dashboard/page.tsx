import { ArrowUpRight, Bot, Package, ShoppingCart, Sparkles, Users, Wallet } from "lucide-react";

const stats = [
  ["Total Sales", "₦0", "No sales recorded yet", ShoppingCart],
  ["Customers", "0", "Customer database is ready", Users],
  ["Products", "0", "Add your first product", Package],
  ["Expenses", "₦0", "No expenses recorded", Wallet]
] as const;

const quickActions = ["Add customer", "Add product", "Create sale", "Create invoice"];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-500">Dashboard</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Business overview</h1>
        <p className="mt-2 text-slate-600">Your JohnnyEdge business workspace is ready.</p>
      </div>

      <section className="mb-8 rounded-3xl bg-slate-950 p-8 text-white">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-300"><Sparkles size={17} /> JohnnyEdge AI</div>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">Your intelligent business assistant is being built here.</h2>
            <p className="mt-3 leading-7 text-slate-400">
              Soon you will be able to ask questions such as “How much did I sell this month?”,
              “Which customers owe me?” and “Which products are running low?”
            </p>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10"><Bot size={30} /></div>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([title, value, description, Icon]) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100"><Icon size={19} /></div>
              <ArrowUpRight size={17} className="text-slate-400" />
            </div>
            <div className="mt-5 text-sm text-slate-500">{title}</div>
            <div className="mt-1 text-2xl font-bold text-slate-950">{value}</div>
            <div className="mt-1 text-xs text-slate-500">{description}</div>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-950">Quick actions</h2>
          <p className="mt-1 text-sm text-slate-500">Common actions you will use to run your business.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => (
              <button key={action} className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">
                + {action}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-950">Getting started</h2>
          <div className="mt-5 space-y-4">
            {["Business workspace created", "Authentication secured", "Database security enabled", "Customer management coming next"].map((item, index) => (
              <div key={item} className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">{index + 1}</div>
                <span className="text-sm text-slate-600">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}