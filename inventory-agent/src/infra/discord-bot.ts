import { Client, GatewayIntentBits, Partials, Message } from "discord.js";
import type { QueuePort } from "../ports/queue";

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

  private async onMessageCreate(message: Message) {
    if (message.author?.bot) return;

    const clientUser = this.client.user;
    if (!clientUser) return;
    if (!message.mentions.has(clientUser)) return;

    try {
      console.log("[discord-bot] enqueuing message");
      const messageWithoutMention = message.content
        .replace(/<@!?(\d+)>/, "")
        .trim();

      console.log(`[discord-bot] ${messageWithoutMention}`);
      const id = await this.queuePort.enqueueQuery({
        jobId: message.id,
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
