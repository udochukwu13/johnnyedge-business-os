import { openai } from "@/lib/ai/openai";

export async function generateBusinessAIResponse(prompt: string) {
  const response = await openai.responses.create({
    model: "gpt-5.6-luna",
    input: prompt,
  });

  return response.output_text.trim();
}
