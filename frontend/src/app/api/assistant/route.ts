import { NextResponse } from "next/server";
import { apiRoute, readJson } from "@/server/http";
import {
  completeAssistantTurn,
  getConversationView,
  startAssistantTurn,
} from "@/server/assistant/chat";
import { AssistantUnavailableError } from "@/server/assistant/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = apiRoute(async (request) =>
  NextResponse.json(
    await getConversationView(
      request.nextUrl.searchParams.get("conversationId")
    )
  )
);

export const POST = apiRoute(async (request) => {
  const turn = await startAssistantTurn(await readJson(request));
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      send("conversation", { conversationId: turn.conversationId });
      try {
        const result = await completeAssistantTurn(turn, (delta) =>
          send("delta", { delta })
        );
        send("complete", result);
      } catch (error) {
        console.error("Assistant stream failed", error);
        send("error", {
          error:
            error instanceof AssistantUnavailableError
              ? error.message
              : "The assistant response could not be completed. Please try again.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    },
  });
});
