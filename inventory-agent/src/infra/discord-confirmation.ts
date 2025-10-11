import type {
  ConfirmationPort,
  ConfirmationRequest,
} from "../ports/confirmation";
import type DiscordBot from "./discord-bot";
import { askForConfirmation } from "./discord-bot/helpers";

export class DiscordConfirmation implements ConfirmationPort {
  constructor(private discordBot: DiscordBot) {}

  async requestConfirmation(request: ConfirmationRequest): Promise<void> {
    const message = await this.discordBot.jobIdToMessage(request.sourceId);

    await askForConfirmation({
      message,
      confirmationText: request.message,
      onConfirm: request.onConfirm,
      onCancel: request.onCancel,
      timeout: 1000 * 60 * 10,
    });
  }

  async sendResult(result: { sourceId: string; text: string }): Promise<void> {
    const message = await this.discordBot.jobIdToMessage(result.sourceId);
    await message.reply({ content: result.text });
  }
}
