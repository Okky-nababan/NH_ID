-- AlterTable
ALTER TABLE "CashPayment" ADD COLUMN "syncedFromSheet" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "CashPayment_syncedFromSheet_idx" ON "CashPayment"("syncedFromSheet");
