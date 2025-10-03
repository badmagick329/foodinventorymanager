type QueryJob = {
  jobId: string;
  instruction: string;
};
type PublishJob = {
  jobId: string;
  answer: string;
};

export interface QueuePort {
  enqueueQuery(job: QueryJob): Promise<string>;
  enqueuePublish(job: PublishJob): Promise<string>;
  close?(): Promise<void>;
}

export type { PublishJob, QueryJob };
