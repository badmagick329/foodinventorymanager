import { Client, GatewayIntentBits, Partials, Message } from "discord.js";
import type { QueuePort } from "../../ports/queue";
import { askForConfirmation } from "./helpers";

export class DiscordBot {
  private client: Client;
  private started: boolean = false;
  private queuePort: QueuePort;

  constructor(queuePort: QueuePort) {
    this.queuePort = queuePort;
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Channel],
    });

    this.onMessageCreate = this.onMessageCreate.bind(this);

    this.client.on("messageCreate", this.onMessageCreate);
  }

  async start(token: string) {
    if (this.started) return;
    console.log("[discord-bot] starting...");
    token = token;
    if (!token)
      throw new Error("Discord token not provided (process.env.DISCORD_TOKEN)");

    await this.client.login(token);
    console.log("[discord-bot] started");
    this.started = true;
  }

  async stop() {
    if (!this.started) return;
    await this.client.destroy();
    this.started = false;
  }

  async replyToMessage({
    messageId,
    content,
    channelId,
  }: {
    messageId: string;
    content: string;
    channelId: string;
  }) {
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel?.isTextBased()) {
        throw new Error(`Channel ${channelId} is not a text channel`);
      }

      const message = await channel.messages.fetch(messageId);
      await message.reply(content);
      console.log(`[discord-bot] Replied to message ${messageId}`);
    } catch (err) {
      console.error(
        `[discord-bot] Failed to reply to message ${messageId}:`,
        err
      );
      throw err;
    }
  }

  private async onMessageCreate(message: Message) {
    if (message.author?.bot) return;

    const clientUser = this.client.user;
    if (!clientUser) return;
    if (!message.mentions.has(clientUser)) return;

    try {
      const messageWithoutMention = message.content
        .replace(/<@!?(\d+)>/, "")
        .trim();

      console.log(`[discord-bot] ${messageWithoutMention}`);

      // if (messageWithoutMention.toLowerCase().includes("confirm")) {
      //   await confirmationDemo(message);
      //   return;
      // }

      console.log("[discord-bot] enqueuing message");
      const id = await this.queuePort.enqueueQuery({
        jobId: this.messageToJobId(message),
        instruction: messageWithoutMention,
      });

      const idx = Math.floor(Math.random() * AMUSING_REPLIES.length);
      const template: string =
        AMUSING_REPLIES[idx] ??
        `🤔 I will get back to you on that. Your reference is: [{id}]`;

      const reply = template.replace(/\[?\{id\}\]?/gi, id);

      await message.reply(reply);
    } catch (err) {
      console.error(`[discord-bot] ${err}`);
    }
  }

  messageToJobId(message: Message) {
    return `${message.channel.id}-${message.id}`;
  }

  async jobIdToMessage(jobId: string) {
    if (!jobId.includes("-")) {
      throw new Error(
        `Cannot extract channelId and messageId from jobId: ${jobId}`
      );
    }
    const [channelId, messageId] = jobId.split("-");
    if (!channelId || !messageId) {
      throw new Error(`Invalid jobId format: ${jobId}`);
    }

    const channel = await this.client.channels.fetch(channelId);
    if (!channel?.isTextBased()) {
      throw new Error(`Channel ${channelId} is not a text channel`);
    }
    const message = await channel.messages.fetch(messageId);

    return message;
  }
}

const AMUSING_REPLIES: string[] = [
  "🤔 I will get back to you on that. Your reference is: [{id}]",
  "🕵️‍♂️ Investigating... Case file: [{id}]",
  "📬 Message received. Tracking ID: [{id}] — now dispatching carrier pigeon.",
  "🔎 Putting on my detective hat. Reference: [{id}]",
  "🍪 Bribing the servers with cookies. Ticket: [{id}]",
  "⚙️ Spinning up the hamsters. Job ref: [{id}]",
  "🧠 Consulted my brain — it's on it. Ref: [{id}]",
  "📡 Beaming your question into the void. Echo tag: [{id}]",
  "🎩 Abracadabra! Your conjuration job is [{id}]",
  "⏳ Added to the queue of destiny. Destiny ref: [{id}]",
  "📦 Packaged and labeled: [{id}] — ETA: mystical",
  "🧾 Your request has been notarized. Doc#: [{id}]",
  "🎟️ One token to the queue machine: [{id}]",
  "🦄 Summoning unicorns. Tracking sparkles: [{id}]",
  "🛠️ I gave it a nudge. Work order: [{id}]",
  "📚 Filed under 'Probably Important' — ID [{id}]",
  "🚀 Launch sequence started. Mission code: [{id}]",
  "🪄 I whispered your request to the backend. Whisper ref: [{id}]",
  "🥷 Stealthily enqueued. Stealth ref: [{id}]",
  "🌱 Planting your question in the brain garden. Sprout #: [{id}]",
  "🎯 Bullseye queued. Score card: [{id}]",
];

export default DiscordBot;

async function confirmationDemo(message: Message) {
  const mockItems = ["item 1", "item 2", "item 3"];

  const confirmationText = `**Delete Confirmation**\n\nFound ${
    mockItems.length
  } items:\n${mockItems
    .map((item) => `- ${item}`)
    .join("\n")}\n\n**Are you sure you want to delete all of these?**`;

  await askForConfirmation({
    message,
    confirmationText,
    onConfirm: async () => {
      console.log("[discord-bot] User confirmed deletion");
      await message.reply(`✅ Successfully deleted ${mockItems.length} items.`);
    },
    onCancel: async () => {
      console.log("[discord-bot] User cancelled deletion");
    },
    timeout: 30000,
  });

  return;
}
