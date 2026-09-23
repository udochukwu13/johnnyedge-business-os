import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAIBusinessContext } from "@/lib/ai-business-context";
import { buildAIBusinessPrompt } from "@/lib/ai-prompt";

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

  let body: { message?: string } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const message =
    typeof body.message === "string" ? body.message.trim() : "";

  if (!message) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  try {
    const context = await getAIBusinessContext();

    if (!context) {
      return NextResponse.json(
        { error: "No active business found" },
        { status: 404 }
      );
    }

    const prompt = buildAIBusinessPrompt(context, message);

    return NextResponse.json({
      prompt,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to build AI prompt." },
      { status: 500 }
    );
  }
}
