-- CreateTable
CREATE TABLE "DuesMonthlySummary" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "paidCount" INTEGER NOT NULL,
    "memberCount" INTEGER NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuesMonthlySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DuesMonthlySummary_year_idx" ON "DuesMonthlySummary"("year");

-- CreateIndex
CREATE UNIQUE INDEX "DuesMonthlySummary_year_month_key" ON "DuesMonthlySummary"("year", "month");
