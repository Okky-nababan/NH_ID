-- AlterEnum
ALTER TYPE "Permission" ADD VALUE 'MANAGE_CHOIR';

-- CreateTable
CREATE TABLE "ChoirSong" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChoirSong_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoirSongPage" (
    "id" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChoirSongPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChoirSong_order_idx" ON "ChoirSong"("order");

-- CreateIndex
CREATE INDEX "ChoirSongPage_songId_idx" ON "ChoirSongPage"("songId");

-- CreateIndex
CREATE UNIQUE INDEX "ChoirSongPage_songId_pageNumber_key" ON "ChoirSongPage"("songId", "pageNumber");

-- AddForeignKey
ALTER TABLE "ChoirSong" ADD CONSTRAINT "ChoirSong_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoirSongPage" ADD CONSTRAINT "ChoirSongPage_songId_fkey" FOREIGN KEY ("songId") REFERENCES "ChoirSong"("id") ON DELETE CASCADE ON UPDATE CASCADE;
