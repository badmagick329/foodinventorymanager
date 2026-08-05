CREATE TYPE "FoodRemovalReason" AS ENUM ('consumed', 'discarded', 'accidental_entry');
CREATE TYPE "FoodRemovalSource" AS ENUM ('manual', 'assistant');

CREATE TABLE "FoodRemoval" (
    "id" TEXT NOT NULL,
    "foodId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "unit" "MeasurementUnit" NOT NULL,
    "expiry" TEXT,
    "storage" "StorageType" NOT NULL,
    "reason" "FoodRemovalReason" NOT NULL,
    "source" "FoodRemovalSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodRemoval_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FoodRemoval_name_createdAt_idx" ON "FoodRemoval"("name", "createdAt");
CREATE INDEX "FoodRemoval_reason_createdAt_idx" ON "FoodRemoval"("reason", "createdAt");
