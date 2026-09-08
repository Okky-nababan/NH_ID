-- CreateEnum
CREATE TYPE "PasswordResetStatus" AS ENUM ('PENDING', 'DONE');

-- CreateTable
CREATE TABLE "PasswordResetRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT,
    "status" "PasswordResetStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasswordResetRequest_status_idx" ON "PasswordResetRequest"("status");

-- AddForeignKey
ALTER TABLE "PasswordResetRequest" ADD CONSTRAINT "PasswordResetRequest_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
