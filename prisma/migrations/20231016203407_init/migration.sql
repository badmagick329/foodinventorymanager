-- CreateEnum
CREATE TYPE "MeasurementUnit" AS ENUM ('g', 'kg', 'l', 'ml', 'unit');

-- CreateEnum
CREATE TYPE "StorageType" AS ENUM ('fridge', 'freezer', 'pantry', 'spices');

-- CreateTable
CREATE TABLE "Food" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "unit" "MeasurementUnit" NOT NULL,
    "expiry" TIMESTAMP(3),

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);
