-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "syncedFromSheet" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TreasurySummary" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "saldoResmi" INTEGER NOT NULL,
    "asOfLabel" TEXT NOT NULL,
    "cumAmount" INTEGER NOT NULL,
    "bendaharaAmount" INTEGER NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasurySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_syncedFromSheet_idx" ON "Transaction"("syncedFromSheet");
