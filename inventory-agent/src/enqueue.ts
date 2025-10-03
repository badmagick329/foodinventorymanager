import { defaultJobOpts, queriesQueue } from "./queue";

const jobId = crypto.randomUUID();

const instruction = process.argv.slice(2).join(" ");
if (!instruction) {
  console.error("No question found in args");
  process.exit(1);
}

const main = async () => {
  const job = await queriesQueue.add(
    "instruction",
    { jobId, instruction },
    { jobId, ...defaultJobOpts }
  );
  console.log("Enqueued", { id: job.id, instruction });
  process.exit(0);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
