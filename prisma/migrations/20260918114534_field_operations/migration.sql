-- CreateTable
CREATE TABLE "FieldOperation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "plantingCode" TEXT NOT NULL,
    "crop" TEXT,
    "location" TEXT,
    "type" TEXT NOT NULL,
    "product" TEXT,
    "activeIngredient" TEXT,
    "registrationNo" TEXT,
    "target" TEXT,
    "dose" TEXT,
    "totalQuantity" DOUBLE PRECISION,
    "quantityUnit" TEXT,
    "waterVolumeL" DOUBLE PRECISION,
    "phiDays" INTEGER,
    "reiHours" INTEGER,
    "operator" TEXT,
    "equipment" TEXT,
    "windKph" DOUBLE PRECISION,
    "conditions" TEXT,
    "areaHa" DOUBLE PRECISION,
    "cost" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FieldOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FieldOperation_userId_plantingCode_idx" ON "FieldOperation"("userId", "plantingCode");

-- CreateIndex
CREATE INDEX "FieldOperation_userId_date_idx" ON "FieldOperation"("userId", "date");

-- AddForeignKey
ALTER TABLE "FieldOperation" ADD CONSTRAINT "FieldOperation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
