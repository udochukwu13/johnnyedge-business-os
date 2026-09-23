import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Phone,
  User,
  Wallet,
  FileText,
  PhoneCall,
  MessageCircle,
  CalendarDays,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";
import EditCustomerButton from "@/components/customers/edit-customer-button";
import DeleteCustomerButton from "@/components/customers/delete-customer-button";
import AddCustomerActivityButton from "@/components/customers/add-customer-activity-button";

type CustomerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailsPage({
  params,
}: CustomerPageProps) {
  const { id } = await params;
  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness?.business?.id) {
    notFound();
  }

  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select("id, name, email, phone, address, notes, balance, created_at")
    .eq("id", id)
    .eq("business_id", activeBusiness.business.id)
    .maybeSingle();

  if (error || !customer) {
    notFound();
  }
function getActivityIcon(type: string) {
  switch (type) {
    case "Call":
      return PhoneCall;
    case "Email":
      return Mail;
    case "WhatsApp":
      return MessageCircle;
    case "Meeting":
      return CalendarDays;
    default:
      return FileText;
  }
}
  const currency = activeBusiness.business.currency || "?";

const { data: activities } = await supabase
  .from("customer_activities")
  .select("id, type, subject, description, created_at")
  .eq("customer_id", customer.id)
  .eq("business_id", activeBusiness.business.id)
  .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to customers
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <User className="h-7 w-7 text-slate-500" />
              </div>

              <div>
                <div className="text-sm font-medium text-slate-500">
                  Customer profile
                </div>

                <h1 className="mt-1 text-2xl font-bold text-slate-950">
                  {customer.name}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <AddCustomerActivityButton customerId={customer.id} />

              <EditCustomerButton
                customer={{
                  id: customer.id,
                  name: customer.name,
                  email: customer.email,
                  phone: customer.phone,
                  address: customer.address,
                  notes: customer.notes,
                  balance: customer.balance,
                }}
                currency={currency}
              />

              <DeleteCustomerButton customerId={customer.id} />
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-950">
              Contact information
            </h2>

            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                <span>{customer.email || "No email provided"}</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                <span>{customer.phone || "No phone provided"}</span>
              </div>

              <div className="flex items-start gap-3 text-sm text-slate-600">
                <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                <span>{customer.address || "No address provided"}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-950">
              Account balance
            </h2>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <Wallet className="h-5 w-5 text-slate-500" />
              </div>

              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Current balance
                </div>

                <div className="mt-1 text-2xl font-bold text-slate-950">
                  {currency}
                  {Number(customer.balance || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-5 md:col-span-2">
            <h2 className="font-semibold text-slate-950">Notes</h2>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {customer.notes || "No notes have been added for this customer."}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5 md:col-span-2">
  <h2 className="font-semibold text-slate-950">
    Activity history
  </h2>

  {activities && activities.length > 0 ? (
  <div className="mt-5 space-y-4">
    {activities.map((activity) => {
      const Icon = getActivityIcon(activity.type);

      return (
        <div
          key={activity.id}
          className="rounded-xl border border-slate-100 bg-slate-50 p-4"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <Icon className="h-4 w-4 text-slate-500" />
                {activity.type}
              </div>

              {activity.subject && (
                <div className="mt-1 text-sm font-medium text-slate-700">
                  {activity.subject}
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400">
              {new Date(activity.created_at).toLocaleString()}
            </div>
          </div>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {activity.description}
          </p>
        </div>
      );
    })}
  </div>
) : (
  <p className="mt-3 text-sm text-slate-500">
    No customer activities have been recorded yet.
  </p>
)}
</div>
        </div>
      </div>
    </div>
  );
}
