import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "Business ID is required." },
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

    const { data: movements, error: movementsError } = await supabase
      .from("inventory_movements")
      .select(
        `
        id,
        product_id,
        type,
        quantity,
        note,
        created_by,
        created_at,
        product:products (
          id,
          name,
          sku
        )
        `
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (movementsError) {
      return NextResponse.json(
        { error: movementsError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      movements: movements || [],
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "Something went wrong while loading inventory movements.",
      },
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
      productId,
      type,
      quantity,
      note,
    } = body;

    if (!businessId || !productId || !type) {
      return NextResponse.json(
        {
          error:
            "Business, product, and movement type are required.",
        },
        { status: 400 }
      );
    }

    const numericQuantity = Number(quantity);

    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      return NextResponse.json(
        { error: "Quantity must be greater than 0." },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "stock_received",
      "stock_adjustment",
      "stock_damaged",
      "stock_returned",
    ];

    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid inventory movement type." },
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

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, business_id, stock_quantity")
      .eq("id", productId)
      .eq("business_id", businessId)
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

    let newStockQuantity = Number(product.stock_quantity || 0);

    if (
      type === "stock_received" ||
      type === "stock_returned"
    ) {
      newStockQuantity += numericQuantity;
    } else {
      newStockQuantity -= numericQuantity;
    }

    if (newStockQuantity < 0) {
      return NextResponse.json(
        {
          error:
            "This movement would make the product stock quantity negative.",
        },
        { status: 400 }
      );
    }

    const { data: movement, error: movementError } = await supabase
      .from("inventory_movements")
      .insert({
        business_id: businessId,
        product_id: productId,
        type,
        quantity: numericQuantity,
        note: note?.trim() || null,
        created_by: user.id,
      })
      .select(
        "id, business_id, product_id, type, quantity, note, created_by, created_at"
      )
      .single();

    if (movementError) {
      return NextResponse.json(
        { error: movementError.message },
        { status: 400 }
      );
    }

    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update({
        stock_quantity: newStockQuantity,
      })
      .eq("id", productId)
      .eq("business_id", businessId)
      .select(
        "id, name, stock_quantity, low_stock_threshold"
      )
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        movement,
        product: updatedProduct,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Something went wrong while recording the inventory movement.",
      },
      { status: 500 }
    );
  }
}