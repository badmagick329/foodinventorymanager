-- CreateEnum
CREATE TYPE "MeasurementUnit" AS ENUM ('G', 'KG', 'L', 'ML', 'UNIT');

-- CreateTable
CREATE TABLE "Food" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "unit" "MeasurementUnit" NOT NULL,

    CONSTRAINT "Food_pkey" PRIMARY KEY ("id")
);
