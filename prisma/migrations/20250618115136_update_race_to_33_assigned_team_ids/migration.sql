/*
  Warnings:

  - The `assignedTeamIds` column on the `RaceTo33Assignment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "RaceTo33Assignment" DROP COLUMN "assignedTeamIds",
ADD COLUMN     "assignedTeamIds" INTEGER[];
