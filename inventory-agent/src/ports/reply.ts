export interface Reply {
  send({ sourceId, answer }: { sourceId: string; answer: string }): Promise<{
    error: Error | undefined;
  }>;
}
