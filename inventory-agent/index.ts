import { bullmqQueue } from "./src/infra/bullmq-queue";
import { PUBLISH, QUERIES } from "./src/infra/bullmq-queue";
import { OllamaAgent } from "./src/infra/ollama-agent";
import { config } from "./src/infra/config";
import { AnswersWorker } from "./src/app/answers-worker";
import { DiscordWebhookReploy } from "./src/infra/discord-webhook-reply";
import { QueriesWorker } from "./src/app/queries-worker";

async function main() {
  const webhookReply = new DiscordWebhookReploy(config.discordWebhook);

  const answersWorker = new AnswersWorker({
    publishQueueName: PUBLISH,
    redisConnection: config.redisConnection,
    reply: webhookReply,
  });
  const queriesWorker = new QueriesWorker({
    queuePort: bullmqQueue,
    agentPort: OllamaAgent,
    queriesQueueName: QUERIES,
    redisConnection: config.redisConnection,
  });

  const p1 = answersWorker.startWork();
  const p2 = queriesWorker.startWork();
  console.log("[main] workers started");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
