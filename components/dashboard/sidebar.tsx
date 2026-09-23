import Link from "next/link";
import {
  BarChart3, Bot, CreditCard, FileText, LayoutDashboard, Megaphone,
  MessageSquare, Package, Receipt, Settings, ShoppingCart, Sparkles, Users, Wallet, Warehouse
} from "lucide-react";
import LogoutButton from "@/components/auth/logout-button";

const navigation = [
  ["Overview", "/dashboard", LayoutDashboard],
  ["AI Assistant", "/dashboard/ai", Bot],
  ["Customers", "/dashboard/customers", Users],
  ["Products", "/dashboard/products", Package],
  ["Inventory", "/dashboard/inventory", Warehouse],
  ["Sales", "/dashboard/sales", ShoppingCart],
  ["Orders", "/dashboard/orders", FileText],
  ["Invoices", "/dashboard/invoices", Receipt],
  ["Expenses", "/dashboard/expenses", Wallet],
  ["Payments", "/dashboard/payments", CreditCard],
  ["WhatsApp", "/dashboard/whatsapp", MessageSquare],
  ["Marketing", "/dashboard/marketing", Megaphone],
  ["Reports", "/dashboard/reports", BarChart3],
  ["Settings", "/dashboard/settings", Settings]
] as const;

export default function Sidebar({ businessName }: { businessName: string }) {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-slate-200 p-6">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">JE</div>
          <div>
            <div className="font-bold text-slate-950">JohnnyEdge</div>
            <div className="text-xs text-slate-500">AI Business OS</div>
          </div>
        </Link>
      </div>
      <div className="border-b border-slate-200 p-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Business</div>
          <div className="mt-1 truncate text-sm font-semibold text-slate-950">{businessName}</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map(([title, href, Icon]) => (
          <Link key={title} href={href}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950">
            <Icon size={18} /> {title}
          </Link>
        ))}
        <div className="mt-5 rounded-2xl bg-slate-950 p-4 text-white">
          <Sparkles size={20} />
          <div className="mt-3 text-sm font-bold">AI-powered business</div>
          <p className="mt-1 text-xs leading-5 text-slate-400">Your intelligent business assistant is coming next.</p>
        </div>
      </nav>
      <div className="border-t border-slate-200 p-4"><LogoutButton /></div>
    </aside>
  );
}