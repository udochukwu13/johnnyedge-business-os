import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { data: memberships, error: membershipError } = await supabase
      .from("business_members")
      .select("business_id")
      .eq("user_id", user.id);

    if (membershipError) {
      return NextResponse.json(
        { error: membershipError.message },
        { status: 400 }
      );
    }

    const businessIds = (memberships ?? []).map(
      (membership) => membership.business_id
    );

    if (!businessIds.length) {
      return NextResponse.json({ products: [] });
    }

    const { data: products, error } = await supabase
      .from("products")
      .select(
        "id, name, sku, description, price, cost_price, stock_quantity, low_stock_threshold, created_at"
      )
      .in("business_id", businessIds)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ products: products ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while loading products." },
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
      sku,
      description,
      price,
      costPrice,
      stockQuantity,
      lowStockThreshold,
    } = body;

    if (!businessId || !name?.trim()) {
      return NextResponse.json(
        { error: "Business and product name are required." },
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

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        business_id: businessId,
        name: name.trim(),
        sku: sku?.trim() || null,
        description: description?.trim() || null,
        price: Number(price) || 0,
        cost_price: Number(costPrice) || 0,
        stock_quantity: Number(stockQuantity) || 0,
        low_stock_threshold: Number(lowStockThreshold) || 0,
      })
      .select(
        "id, name, sku, description, price, cost_price, stock_quantity, low_stock_threshold, created_at"
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while creating the product." },
      { status: 500 }
    );
  }
}