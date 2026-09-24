-- CreateTable
CREATE TABLE "DeviceReading" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "sensorId" TEXT,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'normal',
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeviceReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeviceReading_userId_receivedAt_idx" ON "DeviceReading"("userId", "receivedAt");

-- CreateIndex
CREATE INDEX "DeviceReading_deviceId_receivedAt_idx" ON "DeviceReading"("deviceId", "receivedAt");

-- AddForeignKey
ALTER TABLE "DeviceReading" ADD CONSTRAINT "DeviceReading_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceReading" ADD CONSTRAINT "DeviceReading_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceReading" ADD CONSTRAINT "DeviceReading_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
