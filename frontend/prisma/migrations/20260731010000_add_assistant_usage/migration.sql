ALTER TABLE "ChatMessage" ADD COLUMN "model" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN "inputTokens" INTEGER;
ALTER TABLE "ChatMessage" ADD COLUMN "cachedInputTokens" INTEGER;
ALTER TABLE "ChatMessage" ADD COLUMN "outputTokens" INTEGER;
ALTER TABLE "ChatMessage" ADD COLUMN "reasoningTokens" INTEGER;
ALTER TABLE "ChatMessage" ADD COLUMN "totalTokens" INTEGER;
ALTER TABLE "ChatMessage" ADD COLUMN "estimatedCostUsd" DOUBLE PRECISION;
