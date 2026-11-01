import { convertToModelMessages, createUIMessageStreamResponse, isStepCount, streamText, toUIMessageStream } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import {
  AI_FIELDS,
  outreachContextSchema,
  outreachPlanSchema,
  outreachTools as tools,
  type AiContact,
  type OutreachUIMessage,
} from "@/lib/outreach";
import { buildInstructions, type Sender } from "@/lib/outreach-prompt";
import { isRateLimited } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 120;

/** OpenRouter tries these in order: a free model, any free model, then paid as a last resort. */
const MODELS = ["nvidia/nemotron-3-ultra-550b-a55b:free", "openrouter/free", "anthropic/claude-sonnet-5.5"];

const bodySchema = z.object({
  messages: z.array(z.custom<OutreachUIMessage>()).min(1).max(40),
  context: outreachContextSchema,
  currentPlan: outreachPlanSchema.optional(),
});

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

/** Streams an outreach conversation grounded in the signed-in user's own contacts. */
export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth) return jsonError("Please sign in again.", 401);
  const userId = auth.claims.sub;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  const { messages, context, currentPlan } = parsed.data;

  if (isRateLimited(userId)) return jsonError("You have reached the generation limit. Please wait a few minutes.", 429);

  const [{ data: contacts, error }, { data: sender }] = await Promise.all([
    supabase
      .from("contacts")
      .select(`id, ${AI_FIELDS.map((f) => f.key).join(", ")}`)
      .in("id", context.contactIds)
      .overrideTypes<AiContact[]>(),
    supabase.from("profiles").select("display_name, signature").eq("id", userId).single<Sender>(),
  ]);
  if (error) return jsonError("Could not load the selected contacts.", 500);
  if (contacts.length !== new Set(context.contactIds).size) return jsonError("One or more contacts were not found.", 403);

  const result = streamText({
    model: openrouter(MODELS[0]),
    providerOptions: { openrouter: { models: MODELS } },
    instructions: buildInstructions(context, contacts, sender ?? { display_name: "", signature: "" }, currentPlan),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: isStepCount(2),  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      tools,
      onError: (err) => {
        console.error("outreach generation failed", err);
        return "The AI service could not complete this request. Please try again.";
      },
    }),
  });
}
