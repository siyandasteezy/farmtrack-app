-- CreateTable
CREATE TABLE "CropHarvest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "plantingCode" TEXT NOT NULL,
    "crop" TEXT,
    "variety" TEXT,
    "location" TEXT,
    "lotCode" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "grade" TEXT,
    "destination" TEXT,
    "pricePerUnit" DOUBLE PRECISION,
    "areaHa" DOUBLE PRECISION,
    "operator" TEXT,
    "notes" TEXT,
    "withholdingOverride" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CropHarvest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CropHarvest_userId_plantingCode_idx" ON "CropHarvest"("userId", "plantingCode");

-- CreateIndex
CREATE INDEX "CropHarvest_userId_date_idx" ON "CropHarvest"("userId", "date");

-- AddForeignKey
ALTER TABLE "CropHarvest" ADD CONSTRAINT "CropHarvest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
