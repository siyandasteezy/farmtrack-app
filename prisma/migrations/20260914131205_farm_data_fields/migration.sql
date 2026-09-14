/*
  Warnings:

  - You are about to drop the column `tokenHash` on the `Device` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Device" DROP COLUMN "tokenHash",
ADD COLUMN     "token" TEXT;

-- AlterTable
ALTER TABLE "FeedItem" ADD COLUMN     "daysLeft" INTEGER;

-- AlterTable
ALTER TABLE "Sensor" ADD COLUMN     "lastManualAt" TIMESTAMP(3);
