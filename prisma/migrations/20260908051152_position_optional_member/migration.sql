-- DropForeignKey
ALTER TABLE "Position" DROP CONSTRAINT "Position_userId_fkey";

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "memberName" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
