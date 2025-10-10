import {
  bullmqQueue,
  publishQueue,
  queriesQueue,
} from "./src/infra/bullmq-queue";
import { PUBLISH, QUERIES } from "./src/infra/bullmq-queue";
import { OllamaAgent } from "./src/infra/ollama-agent";
import { config } from "./src/infra/config";
import { AnswersService } from "./src/app/answers-service";
import { QueriesService } from "./src/app/queries-service";
import DiscordBot from "./src/infra/discord-bot";
import { DiscordMessageReploy } from "./src/infra/discord-message-reply";
import { DiscordConfirmation } from "./src/infra/discord-confirmation";

async function main() {
  const discordBot = new DiscordBot(bullmqQueue);
  await discordBot.start(config.discordToken);

  const messageReply = new DiscordMessageReploy(discordBot);
  const confirmationPort = new DiscordConfirmation(discordBot);

  const answersService = new AnswersService({
    publishQueueName: PUBLISH,
    redisConnection: config.redisConnection,
    reply: messageReply,
  });
  const queriesService = new QueriesService({
    queuePort: bullmqQueue,
    agentPort: OllamaAgent,
    confirmationPort,
    queriesQueueName: QUERIES,
    redisConnection: config.redisConnection,
  });

  const answersWorkerInstance = answersService.startWork();
  const queriesWorkerInstance = queriesService.startWork();

  answersWorkerInstance.on("failed", async (job) => {
    if (!job) return;
    console.error(`[answers-worker] job ${job.id} failed:`, job.failedReason);
    await messageReply.send({
      sourceId: job.data.jobId,
      answer: `❌ Failed to post answer: ${job.failedReason}`,
    });
  });
  queriesWorkerInstance.on("failed", async (job) => {
    if (!job) return;
    console.error(`[queries-worker] job ${job.id} failed:`, job.failedReason);
    await messageReply.send({
      sourceId: job.data.jobId,
      answer: `❌ Failed to process instruction: ${job.failedReason}`,
    });
  });
  console.log("[main] workers started");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
