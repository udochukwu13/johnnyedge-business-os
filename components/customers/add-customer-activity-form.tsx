"use client";

import { useState } from "react";
import { X, MessageSquarePlus } from "lucide-react";
import { useRouter } from "next/navigation";

type AddCustomerActivityFormProps = {
  customerId: string;
  onClose: () => void;
  onCreated: () => void;
};

export default function AddCustomerActivityForm({
  customerId,
  onClose,
  onCreated,
}: AddCustomerActivityFormProps) {
  const router = useRouter();

  const [type, setType] = useState("Note");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!description.trim()) {
      setError("Activity description is required.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/customers/${customerId}/activities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type,
            subject: subject.trim() || null,
            description: description.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to create customer activity."
        );
      }

      onCreated();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create customer activity."
      );
    } finally {
      setSaving(false);
    }
  }

  const inputClassName =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <MessageSquarePlus className="h-4 w-4" />
              Customer CRM
            </div>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Add activity
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div>
            <label className="text-sm font-medium text-slate-700">
              Activity type
            </label>

            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className={inputClassName}
            >
              <option value="Note">Note</option>
              <option value="Call">Call</option>
              <option value="Email">Email</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Meeting">Meeting</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Subject
            </label>

            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. Follow-up on recent order"
              className={inputClassName}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Description *
            </label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the customer interaction..."
              rows={5}
              className={inputClassName}
              autoFocus
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save activity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
