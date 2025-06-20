-- CreateTable
CREATE TABLE "UserWeeklyFixtureSet" (
    "id" TEXT NOT NULL,
    "userGameEntryId" TEXT NOT NULL,
    "gameInstanceId" TEXT NOT NULL,
    "roundIdentifier" TEXT NOT NULL,
    "fixtureIds" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserWeeklyFixtureSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserWeeklyFixtureSet_userGameEntryId_gameInstanceId_roundId_key" ON "UserWeeklyFixtureSet"("userGameEntryId", "gameInstanceId", "roundIdentifier");

-- AddForeignKey
ALTER TABLE "UserWeeklyFixtureSet" ADD CONSTRAINT "UserWeeklyFixtureSet_userGameEntryId_fkey" FOREIGN KEY ("userGameEntryId") REFERENCES "UserGameEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
