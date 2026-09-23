import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";
import { Users } from "lucide-react";
import AddCustomerButton from "@/components/customers/add-customer-button";
import CustomerSearch from "@/components/customers/customer-search";

export default async function CustomersPage() {
  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness?.business?.id) {
    return null;
  }

  const supabase = await createClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, name, email, phone, balance, created_at")
    .eq("business_id", activeBusiness.business.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-900">
            Unable to load customers
          </h1>
          <p className="mt-2 text-sm text-red-700">{error.message}</p>
        </div>
      </div>
    );
  }

  const currency = activeBusiness.business.currency || "?";

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Users className="h-4 w-4" />
            Customers + CRM
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Customers
          </h1>

          <p className="mt-2 text-slate-500">
            Manage your customer relationships, contact details, and balances.
          </p>
        </div>

        <AddCustomerButton
          businessId={activeBusiness.business.id}
          currency={currency}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
        {customers && customers.length > 0 ? (
          <CustomerSearch
            customers={customers.map((customer) => ({
              id: customer.id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              balance: customer.balance,
            }))}
            currency={currency}
          />
        ) : (
          <>
            <div className="border-b border-slate-200 p-4">
              <div className="text-sm font-medium text-slate-500">
                Customer database
              </div>
            </div>

            <div className="px-6 py-16 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />

              <h2 className="mt-4 text-lg font-semibold text-slate-950">
                No customers yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Add your first customer to start building your customer
                database.
              </p>

              <div className="mt-6 flex justify-center">
                <AddCustomerButton
                  businessId={activeBusiness.business.id}
                  currency={currency}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
