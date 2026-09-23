import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
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

  const { conversationId } = await context.params;

  const { data: conversation, error: conversationError } = await supabase
    .from("ai_conversations")
    .select("id, title, created_at, updated_at")
    .eq("id", conversationId)
    .eq("business_id", activeBusiness.business.id)
    .single();

  if (conversationError || !conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  const { data: messages, error: messagesError } = await supabase
    .from("ai_messages")
    .select("id, role, content, user_id, created_at")
    .eq("conversation_id", conversationId)
    .eq("business_id", activeBusiness.business.id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    return NextResponse.json(
      { error: messagesError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    conversation,
    messages: messages ?? [],
  });
}

export async function POST(
  request: Request,
  context: RouteContext
) {
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

  const { conversationId } = await context.params;

  const { data: conversation, error: conversationError } = await supabase
    .from("ai_conversations")
    .select("id, title")
    .eq("id", conversationId)
    .eq("business_id", activeBusiness.business.id)
    .single();

  if (conversationError || !conversation) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  let body: { content?: string } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const content =
    typeof body.content === "string"
      ? body.content.trim()
      : "";

  if (!content) {
    return NextResponse.json(
      { error: "Message content is required" },
      { status: 400 }
    );
  }

  if (content.length > 10000) {
    return NextResponse.json(
      { error: "Message is too long" },
      { status: 400 }
    );
  }

  const { data: message, error: messageError } = await supabase
    .from("ai_messages")
    .insert({
      business_id: activeBusiness.business.id,
      conversation_id: conversation.id,
      user_id: user.id,
      role: "user",
      content,
    })
    .select("id, role, content, user_id, created_at")
    .single();

  if (messageError) {
    return NextResponse.json(
      { error: messageError.message },
      { status: 500 }
    );
  }

  const { error: updateError } = await supabase
    .from("ai_conversations")
    .update({
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversation.id)
    .eq("business_id", activeBusiness.business.id);

  if (updateError) {
    return NextResponse.json(
      {
        message,
        warning: "Message saved, but conversation timestamp could not be updated.",
      },
      { status: 201 }
    );
  }

  return NextResponse.json(
    { message },
    { status: 201 }
  );
}
