import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveBusiness } from "@/lib/business";
import { getAIBusinessContext } from "@/lib/ai-business-context";
import { buildAIBusinessPrompt } from "@/lib/ai-prompt";
import { generateBusinessAIResponse } from "@/lib/ai/business-ai";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
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

export async function POST(request: Request, context: RouteContext) {
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

  const { data: previousMessages, error: historyError } = await supabase
    .from("ai_messages")
    .select("role, content")
    .eq("conversation_id", conversation.id)
    .eq("business_id", activeBusiness.business.id)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: true })
    .limit(50);

  if (historyError) {
    return NextResponse.json(
      { error: historyError.message },
      { status: 500 }
    );
  }

  const conversationHistory = (previousMessages ?? []).map((message) => ({
    role: message.role as "user" | "assistant",
    content: message.content,
  }));

  const generatedTitle = conversation.title === "New Conversation"
    ? content.replace(/\s+/g, " ").trim().slice(0, 60)
    : conversation.title;

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

  if (conversation.title === "New Conversation") {
    const { error: titleUpdateError } = await supabase
      .from("ai_conversations")
      .update({
        title: generatedTitle,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id)
      .eq("business_id", activeBusiness.business.id);

    if (titleUpdateError) {
      console.error("Conversation title update error:", titleUpdateError);
    }
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
        warning:
          "Message saved, but conversation timestamp could not be updated.",
      },
      { status: 201 }
    );
  }

  try {
    const businessContext = await getAIBusinessContext();

    if (!businessContext) {
      return NextResponse.json(
        {
          message,
          error: "No active business context found.",
        },
        { status: 500 }
      );
    }

    const prompt = buildAIBusinessPrompt(
      businessContext,
      content,
      conversationHistory
    );

    const assistantContent =
      await generateBusinessAIResponse(prompt);

    if (!assistantContent) {
      return NextResponse.json(
        {
          message,
          error: "The AI provider returned an empty response.",
        },
        { status: 502 }
      );
    }

    const { data: assistantMessage, error: assistantMessageError } =
      await supabase
        .from("ai_messages")
        .insert({
          business_id: activeBusiness.business.id,
          conversation_id: conversation.id,
          user_id: null,
          role: "assistant",
          content: assistantContent,
        })
        .select("id, role, content, user_id, created_at")
        .single();

    if (assistantMessageError) {
      return NextResponse.json(
        {
          message,
          error: assistantMessageError.message,
        },
        { status: 500 }
      );
    }

    const { error: finalUpdateError } = await supabase
      .from("ai_conversations")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id)
      .eq("business_id", activeBusiness.business.id);

    if (finalUpdateError) {
      return NextResponse.json(
        {
          message,
          assistantMessage,
          warning:
            "AI response was saved, but conversation timestamp could not be updated.",
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        message,
        assistantMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("AI provider error:", error);

    return NextResponse.json(
      {
        message,
        error:
          "Your message was saved, but the AI assistant could not generate a response.",
      },
      { status: 502 }
    );
  }
}



