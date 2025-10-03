import { Worker } from "bullmq";
import {
  PUBLISH,
  QUERIES,
  defaultJobOpts,
  publishQueue,
  type PublishJob,
  type QueryJob,
} from "./queue";
import { answerInstruction } from "./agent";

const connection = { url: process.env.REDIS_URL! };

const queryWorker = new Worker<QueryJob>(
  QUERIES,
  async (job) => {
    console.log("[query-worker] processing job...");
    const { jobId, instruction } = job.data;
    console.log(`[query-worker] ${jobId}: ${instruction}`);
    const result = await answerInstruction(instruction);
    console.log(`[query-worker] ${jobId}: answered, enqueueing publish job...`);

    await publishQueue.add(
      "publish",
      { jobId, answer: result.answer },
      { jobId, ...defaultJobOpts }
    );

    console.log(`[query-worker] ${jobId}: publish job enqueued`);
    return { ok: true };
  },
  { connection }
);

const DEFAULT_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || "";

const publisher = new Worker<PublishJob>(
  PUBLISH,
  async (job) => {
    console.log("[publisher] processing job...");
    const { jobId, answer, webhookUrl } = job.data;
    console.log(`[publisher] ${jobId}: posting the following to webhook...`);
    console.log(answer);

    const url = webhookUrl || DEFAULT_WEBHOOK;
    if (!url) {
      console.log(`[publisher] (dry-run) ${jobId}: ${answer}`);
      return { posted: false, reason: "No webhook configured" };
    }

    // Discord-compatible payload (simple). For demo, ignore embeds, etc.
    const payload = { content: answer };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Webhook ${res.status}: ${await res.text()}`);
    }
    console.log(`[publisher] posted ${jobId}`);
    return { posted: true };
  },
  { connection }
);

queryWorker.on("ready", () => console.log("[query-worker] up"));
queryWorker.on("completed", (job) =>
  console.log(
    `[query-worker] ${job.id} Finished with:\n${JSON.stringify(
      job.returnvalue
    )}`
  )
);
queryWorker.on("failed", (job, err) =>
  console.error("[query-worker] job failed", job?.id, err?.message)
);
publisher.on("ready", () => console.log("[publisher] up"));
publisher.on("completed", (job) =>
  console.log(
    `[publisher] ${job.id} Finished with:\n${JSON.stringify(job.returnvalue)}`
  )
);
publisher.on("failed", (job, err) =>
  console.error("[publisher] job failed", job?.id, err?.message)
);
