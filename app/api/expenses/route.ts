import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";

const PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "card",
  "mobile_money",
  "other",
];

function isValidAmount(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0;
}

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

    const activeBusiness = await getActiveBusiness();

    if (!activeBusiness) {
      return NextResponse.json(
        { error: "No active business found." },
        { status: 400 }
      );
    }

    const { data: expenses, error } = await supabase
      .from("expenses")
      .select(
        `
        id,
        business_id,
        category,
        description,
        amount,
        payment_method,
        expense_date,
        notes,
        created_by,
        created_at,
        updated_at
      `
      )
      .eq("business_id", activeBusiness.business.id)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      expenses: expenses ?? [],
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while loading expenses." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const activeBusiness = await getActiveBusiness();

    if (!activeBusiness) {
      return NextResponse.json(
        { error: "No active business found." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const category =
      typeof body.category === "string"
        ? body.category.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : null;

    const notes =
      typeof body.notes === "string"
        ? body.notes.trim()
        : null;

    const paymentMethod =
      typeof body.payment_method === "string"
        ? body.payment_method.trim()
        : null;

    const expenseDate =
      typeof body.expense_date === "string" &&
      body.expense_date.trim()
        ? body.expense_date.trim()
        : new Date().toISOString().slice(0, 10);

    if (!category) {
      return NextResponse.json(
        { error: "Expense category is required." },
        { status: 400 }
      );
    }

    if (!isValidAmount(body.amount)) {
      return NextResponse.json(
        { error: "Expense amount must be a valid non-negative number." },
        { status: 400 }
      );
    }

    if (
      paymentMethod &&
      !PAYMENT_METHODS.includes(paymentMethod)
    ) {
      return NextResponse.json(
        {
          error: `Payment method must be one of: ${PAYMENT_METHODS.join(
            ", "
          )}.`,
        },
        { status: 400 }
      );
    }

    const { data: expense, error } = await supabase
      .from("expenses")
      .insert({
        business_id: activeBusiness.business.id,
        category,
        description,
        amount: Number(body.amount),
        payment_method: paymentMethod,
        expense_date: expenseDate,
        notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { expense },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while creating the expense." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
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

    const activeBusiness = await getActiveBusiness();

    if (!activeBusiness) {
      return NextResponse.json(
        { error: "No active business found." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const expenseId =
      typeof body.expense_id === "string"
        ? body.expense_id
        : "";

    if (!expenseId) {
      return NextResponse.json(
        { error: "Expense ID is required." },
        { status: 400 }
      );
    }

    const { data: existingExpense, error: existingError } =
      await supabase
        .from("expenses")
        .select("*")
        .eq("id", expenseId)
        .eq("business_id", activeBusiness.business.id)
        .single();

    if (existingError || !existingExpense) {
      return NextResponse.json(
        { error: "Expense not found." },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.category !== undefined) {
      const category =
        typeof body.category === "string"
          ? body.category.trim()
          : "";

      if (!category) {
        return NextResponse.json(
          { error: "Expense category cannot be empty." },
          { status: 400 }
        );
      }

      updates.category = category;
    }

    if (body.description !== undefined) {
      updates.description =
        typeof body.description === "string"
          ? body.description.trim()
          : null;
    }

    if (body.notes !== undefined) {
      updates.notes =
        typeof body.notes === "string"
          ? body.notes.trim()
          : null;
    }

    if (body.amount !== undefined) {
      if (!isValidAmount(body.amount)) {
        return NextResponse.json(
          {
            error:
              "Expense amount must be a valid non-negative number.",
          },
          { status: 400 }
        );
      }

      updates.amount = Number(body.amount);
    }

    if (body.payment_method !== undefined) {
      const paymentMethod =
        typeof body.payment_method === "string"
          ? body.payment_method.trim()
          : null;

      if (
        paymentMethod &&
        !PAYMENT_METHODS.includes(paymentMethod)
      ) {
        return NextResponse.json(
          {
            error: `Payment method must be one of: ${PAYMENT_METHODS.join(
              ", "
            )}.`,
          },
          { status: 400 }
        );
      }

      updates.payment_method = paymentMethod;
    }

    if (body.expense_date !== undefined) {
      const expenseDate =
        typeof body.expense_date === "string"
          ? body.expense_date.trim()
          : "";

      if (!expenseDate) {
        return NextResponse.json(
          { error: "Expense date cannot be empty." },
          { status: 400 }
        );
      }

      updates.expense_date = expenseDate;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json(
        { error: "No changes were provided." },
        { status: 400 }
      );
    }

    const { data: expense, error: updateError } =
      await supabase
        .from("expenses")
        .update(updates)
        .eq("id", expenseId)
        .eq("business_id", activeBusiness.business.id)
        .select()
        .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ expense });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while updating the expense." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const activeBusiness = await getActiveBusiness();

    if (!activeBusiness) {
      return NextResponse.json(
        { error: "No active business found." },
        { status: 400 }
      );
    }

    if (activeBusiness.role !== "owner" && activeBusiness.role !== "admin") {
      return NextResponse.json(
        {
          error:
            "Only business administrators can delete expenses.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const expenseId =
      typeof body.expense_id === "string"
        ? body.expense_id
        : "";

    if (!expenseId) {
      return NextResponse.json(
        { error: "Expense ID is required." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId)
      .eq("business_id", activeBusiness.business.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while deleting the expense." },
      { status: 500 }
    );
  }
}