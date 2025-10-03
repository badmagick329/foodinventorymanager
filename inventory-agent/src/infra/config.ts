const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL not set");
}
const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
if (!discordWebhook) {
  throw new Error("DISCORD_WEBHOOK_URL not set");
}

export const config = {
  redisConnection: { url: redisUrl },
  discordWebhook,
};
