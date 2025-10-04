import { Worker } from "bullmq";
import type { PublishJob } from "../core/queue";
import type { Reply } from "../ports/reply";

export class AnswersService {
  public answersWorker: Worker<PublishJob> | undefined;

  private readonly publishQueueName: string;
  private readonly redisConnection: { url: string };
  private readonly reply: Reply;

  constructor({
    publishQueueName,
    redisConnection,
    reply,
  }: {
    publishQueueName: string;
    redisConnection: { url: string };
    reply: Reply;
  }) {
    this.publishQueueName = publishQueueName;
    this.redisConnection = redisConnection;
    this.reply = reply;
  }

  startWork() {
    this.answersWorker = new Worker<PublishJob>(
      this.publishQueueName,
      async (job) => {
        console.log("[answers-worker] processing job...");
        const { jobId: sourceId, answer } = job.data;
        const result = await this.reply.send({
          sourceId,
          answer,
        });

        if (result.error) {
          console.error(`[answers-worker] ${sourceId}:`, result.error);
          throw result.error;
        } else {
          console.log(`[answers-worker] posted ${sourceId}`);
          return { posted: true };
        }
      },
      { connection: this.redisConnection }
    );
    return this.answersWorker;
  }
}
