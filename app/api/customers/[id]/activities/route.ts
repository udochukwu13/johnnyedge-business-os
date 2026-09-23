import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id: customerId } = await params;
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
    const { type, subject, description } = body;

    if (!customerId || !type || !description?.trim()) {
      return NextResponse.json(
        { error: "Customer, activity type, and description are required." },
        { status: 400 }
      );
    }

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, business_id")
      .eq("id", customerId)
      .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: "Customer not found." },
        { status: 404 }
      );
    }

    const { data: membership, error: membershipError } = await supabase
      .from("business_members")
      .select("id")
      .eq("business_id", customer.business_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "You do not have access to this customer." },
        { status: 403 }
      );
    }

    const { data: activity, error } = await supabase
      .from("customer_activities")
      .insert({
        business_id: customer.business_id,
        customer_id: customerId,
        type: type.trim(),
        subject: subject?.trim() || null,
        description: description.trim(),
        created_by: user.id,
      })
      .select(
        "id, customer_id, type, subject, description, created_by, created_at"
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ activity }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while creating the activity." },
      { status: 500 }
    );
  }
}
