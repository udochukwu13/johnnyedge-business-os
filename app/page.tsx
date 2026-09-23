import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  MessageSquare,
  Package,
  Receipt,
  ShieldCheck,
  Users,
  Zap
} from "lucide-react";

const features = [
  { icon: Bot, title: "AI Business Assistant", text: "Ask questions about sales, customers, inventory and business performance." },
  { icon: Users, title: "Customer Management", text: "Keep customers and business relationships organized." },
  { icon: Package, title: "Inventory", text: "Track products and stock from one workspace." },
  { icon: Receipt, title: "Invoices & Sales", text: "Manage sales, orders, invoices and payments in one connected system." },
  { icon: BarChart3, title: "Business Intelligence", text: "Turn business activity into useful reports and insights." },
  { icon: MessageSquare, title: "WhatsApp", text: "Connect customer conversations to your business operations." }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 font-bold text-white">JE</div>
            <div>
              <div className="font-bold text-slate-950">JohnnyEdge</div>
              <div className="text-xs text-slate-500">AI Business OS</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Log in</Link>
            <Link href="/auth/sign-up" className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Get started</Link>
          </div>
        </div>
      </nav>

      <section className="overflow-hidden bg-slate-950">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
              <Zap size={16} /> Intelligent business management
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-white md:text-7xl">
              Run your business
              <span className="block text-slate-400">smarter with AI.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              JohnnyEdge AI Business OS brings customers, products, sales, inventory,
              finance and AI assistance into one powerful workspace.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/auth/sign-up" className="flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-slate-950 hover:bg-slate-100">
                Create your business <ArrowRight size={18} />
              </Link>
              <Link href="/auth/login" className="rounded-xl border border-white/20 px-6 py-3.5 font-semibold text-white hover:bg-white/10">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">One business workspace</p>
        <h2 className="mt-3 text-3xl font-bold text-slate-950 md:text-4xl">Everything you need to operate.</h2>
        <p className="mt-4 max-w-2xl text-slate-600">Stage by stage, JohnnyEdge will become the operating system behind your business.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white"><Icon size={21} /></div>
                <h3 className="text-lg font-bold text-slate-950">{feature.title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{feature.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-3xl bg-slate-950 p-10 text-white md:p-16">
            <ShieldCheck size={32} />
            <h2 className="mt-6 max-w-2xl text-3xl font-bold md:text-4xl">Built around your business.</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">
              Business data is separated using a multi-tenant architecture with PostgreSQL Row Level Security.
            </p>
            <Link href="/auth/sign-up" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-slate-950">
              Start building your workspace <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-slate-500">
          © {new Date().getFullYear()} JohnnyEdge Limited. All rights reserved.
        </div>
      </footer>
    </main>
  );
}