import { Queue } from "bullmq";
import type { JobsOptions } from "bullmq";
import type { PublishJob, QueryJob, QueuePort } from "../core/queue";

const connection = { url: process.env.REDIS_URL! };

export const QUERIES = "inventory_queries";
export const PUBLISH = "inventory_publish";

export const defaultJobOpts: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 500 },
  removeOnComplete: 1000,
  removeOnFail: 1000,
};

const queriesQueue = new Queue<QueryJob>(QUERIES, { connection });
const publishQueue = new Queue<PublishJob>(PUBLISH, { connection });

export const bullmqQueue: QueuePort = {
  async enqueueQuery(job: QueryJob) {
    const r = await queriesQueue.add("instruction", job, {
      jobId: (job as any).jobId,
      ...defaultJobOpts,
    });
    return String(r.id);
  },
  async enqueuePublish(job: PublishJob) {
    const r = await publishQueue.add("publish", job, {
      jobId: (job as any).jobId,
      ...defaultJobOpts,
    });
    return String(r.id);
  },
  async close() {
    await queriesQueue.close();
    await publishQueue.close();
  },
};

export { queriesQueue, publishQueue };
