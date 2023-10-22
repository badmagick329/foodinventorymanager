/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `ShoppingItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ShoppingItem_name_key" ON "ShoppingItem"("name");
