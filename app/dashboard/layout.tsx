import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";
import Sidebar from "@/components/dashboard/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const activeBusiness = await getActiveBusiness();
  if (!activeBusiness) redirect("/onboarding");

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar businessName={activeBusiness.business?.name || "Your Business"} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">Business workspace</div>
              <div className="font-semibold text-slate-950">{activeBusiness.business?.name}</div>
            </div>
            <div className="hidden text-right sm:block">
              <div className="text-xs text-slate-500">Signed in as</div>
              <div className="text-sm font-medium text-slate-950">{user.email}</div>
            </div>
          </div>
        </header>
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}