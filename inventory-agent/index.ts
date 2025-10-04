import { bullmqQueue } from "./src/infra/bullmq-queue";
import { PUBLISH, QUERIES } from "./src/infra/bullmq-queue";
import { OllamaAgent } from "./src/infra/ollama-agent";
import { config } from "./src/infra/config";
import { AnswersWorker } from "./src/app/answers-worker";
import { QueriesWorker } from "./src/app/queries-worker";
import DiscordBot from "./src/infra/discord-bot";
import { DiscordMessageReploy } from "./src/infra/discord-message-reply";

async function main() {
  const discordBot = new DiscordBot(bullmqQueue);
  await discordBot.start(config.discordToken);

  const messageReply = new DiscordMessageReploy(discordBot);
  const answersWorker = new AnswersWorker({
    publishQueueName: PUBLISH,
    redisConnection: config.redisConnection,
    reply: messageReply,
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
