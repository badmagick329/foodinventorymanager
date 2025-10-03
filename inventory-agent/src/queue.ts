import { Queue } from "bullmq";
import type { JobsOptions } from "bullmq";

const connection = { url: process.env.REDIS_URL! };

export const QUERIES = "inventory_queries";
export const PUBLISH = "inventory_publish";

export type QueryJob = {
  jobId: string;
  instruction: string;
};

export type PublishJob = {
  jobId: string;
  answer: string;
  webhookUrl?: string;
};

export const defaultJobOpts: JobsOptions = {
  attempts: 3,
  backoff: { type: "exponential", delay: 500 },
  removeOnComplete: 1000,
  removeOnFail: 1000,
};

export const queriesQueue = new Queue<QueryJob>(QUERIES, { connection });
export const publishQueue = new Queue<PublishJob>(PUBLISH, { connection });
