import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness) {
    return NextResponse.json(
      { error: "No active business found" },
      { status: 404 }
    );
  }

  const { data: conversations, error } = await supabase
    .from("ai_conversations")
    .select("id, title, created_at, updated_at")
    .eq("business_id", activeBusiness.business.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    business: {
      id: activeBusiness.business.id,
      name: activeBusiness.business.name,
      currency: activeBusiness.business.currency,
    },
    conversations: conversations ?? [],
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const activeBusiness = await getActiveBusiness();

  if (!activeBusiness) {
    return NextResponse.json(
      { error: "No active business found" },
      { status: 404 }
    );
  }

  let body: { title?: string } = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const title =
    typeof body.title === "string" && body.title.trim()
      ? body.title.trim().slice(0, 120)
      : "New Conversation";

  const { data: conversation, error } = await supabase
    .from("ai_conversations")
    .insert({
      business_id: activeBusiness.business.id,
      user_id: user.id,
      title,
    })
    .select("id, title, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { conversation },
    { status: 201 }
  );
}
