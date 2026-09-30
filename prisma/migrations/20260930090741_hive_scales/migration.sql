-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "baselineKg" DOUBLE PRECISION,
ADD COLUMN     "minStoresKg" DOUBLE PRECISION,
ADD COLUMN     "tareKg" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Sensor" ADD COLUMN     "hiveTag" TEXT;
