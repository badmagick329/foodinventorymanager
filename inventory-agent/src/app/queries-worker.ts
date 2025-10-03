import { Worker } from "bullmq";
import type { QueuePort, QueryJob } from "../core/queue";
import type { AgentPort } from "../core/agent";

export class QueriesWorker {
  public queriesWorker: Worker<QueryJob> | undefined;

  private readonly queuePort: QueuePort;
  private readonly agentPort: AgentPort;
  private readonly queriesQueueName: string;
  private readonly redisConnection: { url: string };

  constructor({
    queuePort,
    agentPort,
    queriesQueueName,
    redisConnection,
  }: {
    queuePort: QueuePort;
    agentPort: AgentPort;
    queriesQueueName: string;
    redisConnection: { url: string };
  }) {
    this.queuePort = queuePort;
    this.agentPort = agentPort;
    this.queriesQueueName = queriesQueueName;
    this.redisConnection = redisConnection;
  }

  startWork() {
    return new Worker<QueryJob>(
      this.queriesQueueName,
      async (job) => {
        console.log("[queries-worker] processing job...");
        const { jobId, instruction } = job.data;
        console.log(`[queries-worker] ${jobId}: ${instruction}`);
        const result = await this.agentPort.answerInstruction(instruction);
        console.log(
          `[queries-worker] ${jobId}: answered, enqueueing publish job...`
        );

        await this.queuePort.enqueuePublish({ jobId, answer: result.answer });

        console.log(`[queries-worker] ${jobId}: publish job enqueued`);
        return { ok: true };
      },
      { connection: this.redisConnection }
    );
  }
}
