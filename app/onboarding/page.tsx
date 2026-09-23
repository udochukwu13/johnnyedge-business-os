"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [currency, setCurrency] = useState("NGN");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const { data, error } = await supabase.rpc("create_business", {
      business_name: businessName,
      business_industry: industry || null,
      business_country: country,
      business_currency: currency,
      business_phone: phone || null
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setError("Business creation failed. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-10 text-center">
          <div className="text-2xl font-bold text-white">JohnnyEdge</div>
          <p className="mt-3 text-slate-400">Let&apos;s set up your business workspace.</p>
        </div>

        <div className="rounded-3xl bg-white p-8 shadow-2xl md:p-10">
          <h1 className="text-3xl font-bold text-slate-950">Tell us about your business</h1>
          <p className="mt-2 text-slate-500">You can change these details later.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-semibold">Business name</label>
              <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                placeholder="JohnnyEdge Limited" className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3">
                <option value="">Select industry</option>
                <option>Retail</option><option>Wholesale</option><option>Technology</option>
                <option>Professional Services</option><option>Food & Restaurant</option>
                <option>Logistics</option><option>Manufacturing</option><option>Fashion</option>
                <option>Beauty</option><option>Construction</option><option>Other</option>
              </select>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold">Country</label>
                <select value={country} onChange={(e) => setCountry(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3">
                  <option>Nigeria</option><option>Ghana</option><option>Kenya</option>
                  <option>South Africa</option><option>United Kingdom</option><option>United States</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold">Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3">
                  <option value="NGN">Nigerian Naira (NGN)</option>
                  <option value="GHS">Ghanaian Cedi (GHS)</option>
                  <option value="KES">Kenyan Shilling (KES)</option>
                  <option value="ZAR">South African Rand (ZAR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                  <option value="USD">US Dollar (USD)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Business phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
            </div>

            {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

            <button disabled={loading} className="w-full rounded-xl bg-slate-950 py-4 font-semibold text-white disabled:opacity-50">
              {loading ? "Creating workspace..." : "Create my business workspace"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}