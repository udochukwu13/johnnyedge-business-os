import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";

const ENTRY_TYPES = ["income", "expense"] as const;

const PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "card",
  "mobile_money",
  "other",
] as const;

type EntryType = (typeof ENTRY_TYPES)[number];
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

function isEntryType(value: unknown): value is EntryType {
  return typeof value === "string" && ENTRY_TYPES.includes(value as EntryType);
}

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return (
    typeof value === "string" &&
    PAYMENT_METHODS.includes(value as PaymentMethod)
  );
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness) {
    return NextResponse.json(
      { error: "Business not found" },
      { status: 404 }
    );
  }

  const { data, error } = await supabase
    .from("cashflow_entries")
    .select(
      `
      id,
      business_id,
      type,
      category,
      description,
      amount,
      payment_method,
      entry_date,
      reference,
      notes,
      created_by,
      created_at,
      updated_at
    `
    )
    .eq("business_id", activeBusiness.business.id)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ entries: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness) {
    return NextResponse.json(
      { error: "Business not found" },
      { status: 404 }
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const type = body.type;
  const category =
    typeof body.category === "string" ? body.category.trim() : "";
  const description =
    typeof body.description === "string"
      ? body.description.trim()
      : "";
  const paymentMethod =
    typeof body.payment_method === "string"
      ? body.payment_method
      : "";
  const entryDate =
    typeof body.entry_date === "string"
      ? body.entry_date
      : "";
  const reference =
    typeof body.reference === "string"
      ? body.reference.trim()
      : "";
  const notes =
    typeof body.notes === "string"
      ? body.notes.trim()
      : "";

  const amount = Number(body.amount);

  if (!isEntryType(type)) {
    return NextResponse.json(
      { error: "Type must be income or expense" },
      { status: 400 }
    );
  }

  if (!category) {
    return NextResponse.json(
      { error: "Category is required" },
      { status: 400 }
    );
  }

  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json(
      { error: "Amount must be a valid non-negative number" },
      { status: 400 }
    );
  }

  if (paymentMethod && !isPaymentMethod(paymentMethod)) {
    return NextResponse.json(
      { error: "Invalid payment method" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("cashflow_entries")
    .insert({
      business_id: activeBusiness.business.id,
      type,
      category,
      description: description || null,
      amount,
      payment_method: paymentMethod || null,
      entry_date: entryDate || undefined,
      reference: reference || null,
      notes: notes || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { entry: data },
    { status: 201 }
  );
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness) {
    return NextResponse.json(
      { error: "Business not found" },
      { status: 404 }
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const entryId =
    typeof body.id === "string"
      ? body.id
      : typeof body.entry_id === "string"
        ? body.entry_id
        : "";

  if (!entryId) {
    return NextResponse.json(
      { error: "Entry ID is required" },
      { status: 400 }
    );
  }

  const { data: existing, error: existingError } = await supabase
    .from("cashflow_entries")
    .select("id")
    .eq("id", entryId)
    .eq("business_id", activeBusiness.business.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      { error: existingError.message },
      { status: 500 }
    );
  }

  if (!existing) {
    return NextResponse.json(
      { error: "Cashflow entry not found" },
      { status: 404 }
    );
  }

  const updates: Record<string, unknown> = {};

  if (body.type !== undefined) {
    if (!isEntryType(body.type)) {
      return NextResponse.json(
        { error: "Type must be income or expense" },
        { status: 400 }
      );
    }

    updates.type = body.type;
  }

  if (body.category !== undefined) {
    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : "";

    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    updates.category = category;
  }

  if (body.description !== undefined) {
    updates.description =
      typeof body.description === "string"
        ? body.description.trim() || null
        : null;
  }

  if (body.amount !== undefined) {
    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      return NextResponse.json(
        { error: "Amount must be a valid non-negative number" },
        { status: 400 }
      );
    }

    updates.amount = amount;
  }

  if (body.payment_method !== undefined) {
    const paymentMethod =
      typeof body.payment_method === "string"
        ? body.payment_method
        : "";

    if (paymentMethod && !isPaymentMethod(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 }
      );
    }

    updates.payment_method = paymentMethod || null;
  }

  if (body.entry_date !== undefined) {
    updates.entry_date =
      typeof body.entry_date === "string"
        ? body.entry_date
        : null;
  }

  if (body.reference !== undefined) {
    updates.reference =
      typeof body.reference === "string"
        ? body.reference.trim() || null
        : null;
  }

  if (body.notes !== undefined) {
    updates.notes =
      typeof body.notes === "string"
        ? body.notes.trim() || null
        : null;
  }

  const { data, error } = await supabase
    .from("cashflow_entries")
    .update(updates)
    .eq("id", entryId)
    .eq("business_id", activeBusiness.business.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ entry: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness) {
    return NextResponse.json(
      { error: "Business not found" },
      { status: 404 }
    );
  }

  if (
    activeBusiness.role !== "owner" &&
    activeBusiness.role !== "admin"
  ) {
    return NextResponse.json(
      { error: "Only business admins can delete cashflow entries" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);

  const entryId =
    searchParams.get("id") ||
    searchParams.get("entry_id");

  if (!entryId) {
    return NextResponse.json(
      { error: "Entry ID is required" },
      { status: 400 }
    );
  }

  const { data: existing, error: existingError } = await supabase
    .from("cashflow_entries")
    .select("id")
    .eq("id", entryId)
    .eq("business_id", activeBusiness.business.id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json(
      { error: existingError.message },
      { status: 500 }
    );
  }

  if (!existing) {
    return NextResponse.json(
      { error: "Cashflow entry not found" },
      { status: 404 }
    );
  }

  const { error } = await supabase
    .from("cashflow_entries")
    .delete()
    .eq("id", entryId)
    .eq("business_id", activeBusiness.business.id);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}