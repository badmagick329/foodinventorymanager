CREATE TYPE "ChatActionStatus" AS ENUM ('pending', 'confirmed', 'cancelled');

ALTER TABLE "ChatMessage" ADD COLUMN "actionStatus" "ChatActionStatus" NOT NULL DEFAULT 'confirmed';
ALTER TABLE "ChatMessage" ALTER COLUMN "actionStatus" SET DEFAULT 'pending';
