-- AlterTable
ALTER TABLE "User" ADD COLUMN     "enterprises" TEXT[] DEFAULT ARRAY['livestock']::TEXT[];

-- CreateTable
CREATE TABLE "Planting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "variety" TEXT,
    "category" TEXT NOT NULL,
    "location" TEXT,
    "areaHa" DOUBLE PRECISION,
    "perennial" BOOLEAN NOT NULL DEFAULT false,
    "plantCount" INTEGER,
    "plantedAt" TIMESTAMP(3),
    "expectedHarvest" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Growing',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Planting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Planting_userId_status_idx" ON "Planting"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Planting_userId_code_key" ON "Planting"("userId", "code");

-- AddForeignKey
ALTER TABLE "Planting" ADD CONSTRAINT "Planting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
