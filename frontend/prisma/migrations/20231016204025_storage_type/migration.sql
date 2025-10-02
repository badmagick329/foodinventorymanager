/*
  Warnings:

  - Added the required column `storage` to the `Food` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Food" ADD COLUMN     "storage" "StorageType" NOT NULL;
