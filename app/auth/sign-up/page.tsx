"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const router = useRouter();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push("/onboarding");
      router.refresh();
    } else {
      setMessage("Account created. Check your email to confirm your account.");
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 block text-center text-2xl font-bold text-white">JohnnyEdge</Link>
        <div className="rounded-3xl bg-white p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-slate-950">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">Start building your JohnnyEdge business workspace.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" placeholder="Your name" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" placeholder="you@example.com" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" placeholder="Minimum 8 characters" />
            </div>
            {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
            {message && <div className="rounded-xl bg-green-50 p-4 text-sm text-green-700">{message}</div>}
            <button disabled={loading} className="w-full rounded-xl bg-slate-950 py-3.5 font-semibold text-white disabled:opacity-50">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account? <Link href="/auth/login" className="font-semibold text-slate-950">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}