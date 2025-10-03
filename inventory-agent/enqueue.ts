import { bullmqQueue } from "./src/infra/bullmq-queue";

const jobId = crypto.randomUUID();

const instruction = process.argv.slice(2).join(" ");
if (!instruction) {
  console.error("No question found in args");
  process.exit(1);
}

const main = async () => {
  const id = await bullmqQueue.enqueueQuery({ jobId, instruction });
  console.log("Enqueued", { id, instruction });
  if (bullmqQueue.close) await bullmqQueue.close();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
