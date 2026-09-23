import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const { data: memberships, error: membershipError } =
      await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id);

    if (membershipError) {
      return NextResponse.json(
        { error: membershipError.message },
        { status: 500 }
      );
    }

    const businessIds =
      memberships?.map((membership) => membership.business_id) ?? [];

    if (!businessIds.length) {
      return NextResponse.json({
        customers: [],
      });
    }

    const { data: customers, error } = await supabase
      .from("customers")
      .select(
        "id, name, email, phone, address, notes, balance, created_at"
      )
      .in("business_id", businessIds)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      customers: customers ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while loading customers." },
      { status: 500 }
    );
  }
}
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      businessId,
      name,
      email,
      phone,
      address,
      notes,
      balance,
    } = body;

    if (!businessId || !name?.trim()) {
      return NextResponse.json(
        { error: "Business and customer name are required." },
        { status: 400 }
      );
    }

    const { data: membership, error: membershipError } = await supabase
      .from("business_members")
      .select("id")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "You do not have access to this business." },
        { status: 403 }
      );
    }

    const { data: customer, error } = await supabase
      .from("customers")
      .insert({
        business_id: businessId,
        name: name.trim(),
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
        balance: Number(balance) || 0,
      })
      .select("id, name, email, phone, address, notes, balance, created_at")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ customer }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while creating the customer." },
      { status: 500 }
    );
  }
}

