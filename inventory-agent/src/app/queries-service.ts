import { Worker } from "bullmq";
import type { QueuePort, QueryJob } from "../core/queue";
import type { AgentPort } from "../core/agent";
import type { ConfirmationPort } from "../core/confirmation";

export class QueriesService {
  public queriesWorker: Worker<QueryJob> | undefined;

  private readonly queuePort: QueuePort;
  private readonly agentPort: AgentPort;
  private readonly confirmationPort: ConfirmationPort;
  private readonly queriesQueueName: string;
  private readonly redisConnection: { url: string };

  constructor({
    queuePort,
    agentPort,
    confirmationPort,
    queriesQueueName,
    redisConnection,
  }: {
    queuePort: QueuePort;
    agentPort: AgentPort;
    confirmationPort: ConfirmationPort;
    queriesQueueName: string;
    redisConnection: { url: string };
  }) {
    this.queuePort = queuePort;
    this.agentPort = agentPort;
    this.confirmationPort = confirmationPort;
    this.queriesQueueName = queriesQueueName;
    this.redisConnection = redisConnection;
  }

  startWork() {
    this.queriesWorker = new Worker<QueryJob>(
      this.queriesQueueName,
      async (job) => {
        console.log("[queries-worker] processing job...");
        const { jobId, instruction } = job.data;
        console.log(`[queries-worker] ${jobId}: ${instruction}`);
        const result = await this.agentPort.answerInstruction(instruction, {
          confirmationPort: this.confirmationPort,
          sourceId: jobId,
        });
        console.log(
          `[queries-worker] ${jobId}: answered, enqueueing publish job...`
        );
        if (result.answer !== "") {
          await this.queuePort.enqueuePublish({ jobId, answer: result.answer });
          console.log(`[queries-worker] ${jobId}: publish job enqueued`);
        }

        return { ok: true };
      },
      { connection: this.redisConnection }
    );
    return this.queriesWorker;
  }
}
