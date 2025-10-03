import type { Reply } from "../ports/reply";

export class DiscordWebhookReploy implements Reply {
  constructor(private readonly webhookUrl: string) {}

  async send({
    sourceId,
    answer,
  }: {
    sourceId: string;
    answer: string;
  }): Promise<{
    error: Error | undefined;
  }> {
    const payload = { content: answer };
    console.log(
      `[discord-webhook-reply] ${sourceId}: posting the following to webhook...`
    );
    console.log(answer);

    const res = await fetch(this.webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { error: Error(`Webhook ${res.status}: ${await res.text()}`) };
    }
    return { error: undefined };
  }
}
