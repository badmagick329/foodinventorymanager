import type { Reply } from "../ports/reply";
import type DiscordBot from "./discord-bot";

export class DiscordMessageReploy implements Reply {
  constructor(private readonly bot: DiscordBot) {}

  async send({
    sourceId,
    answer,
  }: {
    sourceId: string;
    answer: string;
  }): Promise<{
    error: Error | undefined;
  }> {
    try {
      const message = await this.bot.jobIdToMessage(sourceId);
      await message.reply(answer);
      return { error: undefined };
    } catch (error) {
      return error instanceof Error ? { error } : { error: Error(`${error}`) };
    }
  }
}
