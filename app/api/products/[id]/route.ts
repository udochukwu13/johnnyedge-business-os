import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext
) {
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

    const { id } = await context.params;
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

    if (!businessId || !id || !name?.trim()) {
      return NextResponse.json(
        { error: "Business, product, and product name are required." },
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
      .update({
        name: name.trim(),
        sku: sku?.trim() || null,
        description: description?.trim() || null,
        price: Number(price) || 0,
        cost_price: Number(costPrice) || 0,
        stock_quantity: Number(stockQuantity) || 0,
        low_stock_threshold: Number(lowStockThreshold) || 0,
      })
      .eq("id", id)
      .eq("business_id", businessId)
      .select(
        "id, name, sku, description, price, cost_price, stock_quantity, low_stock_threshold, created_at, updated_at"
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ product });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while updating the product." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
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

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required." },
        { status: 400 }
      );
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, business_id")
      .eq("id", id)
      .maybeSingle();

    if (productError) {
      return NextResponse.json(
        { error: productError.message },
        { status: 400 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { error: "Product not found." },
        { status: 404 }
      );
    }

    const { data: membership, error: membershipError } = await supabase
      .from("business_members")
      .select("role")
      .eq("business_id", product.business_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      membershipError ||
      !membership ||
      membership.role !== "owner"
    ) {
      return NextResponse.json(
        { error: "Only a business admin can delete this product." },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("business_id", product.business_id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while deleting the product." },
      { status: 500 }
    );
  }
}
