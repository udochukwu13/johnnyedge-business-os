"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  balance: number | null;
};

type CustomerSearchProps = {
  customers: Customer[];
  currency: string;
};

export default function CustomerSearch({
  customers,
  currency,
}: CustomerSearchProps) {
  const [query, setQuery] = useState("");

  const filteredCustomers = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(search))
    );
  }, [customers, query]);

  return (
    <>
      <div className="border-b border-slate-200 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search customers..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
          />
        </div>
      </div>

      {filteredCustomers.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {filteredCustomers.map((customer) => (
            <Link
              key={customer.id}
              href={`/dashboard/customers/${customer.id}`}
              className="flex flex-col gap-3 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="font-semibold text-slate-950">
                  {customer.name}
                </h2>

                <div className="mt-1 text-sm text-slate-500">
                  {customer.email ||
                    customer.phone ||
                    "No contact details"}
                </div>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Balance
                </div>

                <div className="mt-1 font-semibold text-slate-950">
                  {currency}
                  {Number(customer.balance || 0).toLocaleString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <Users className="mx-auto h-8 w-8 text-slate-300" />

          <h2 className="mt-3 text-base font-semibold text-slate-950">
            No matching customers
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Try a different name, email, or phone number.
          </p>
        </div>
      )}
    </>
  );
}
