/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `BoardSnapshot` table. All the data in the column will be lost.
  - Added the required column `createdById` to the `BoardSnapshot` table without a default value. This is not possible if the table is not empty.
  - Made the column `snapshot` on table `BoardSnapshot` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "BoardSnapshot" DROP COLUMN "updatedAt",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT NOT NULL,
ALTER COLUMN "snapshot" SET NOT NULL;

-- CreateIndex
CREATE INDEX "BoardSnapshot_createdById_idx" ON "BoardSnapshot"("createdById");

-- AddForeignKey
ALTER TABLE "BoardSnapshot" ADD CONSTRAINT "BoardSnapshot_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
