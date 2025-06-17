-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserGameEntryStatus" AS ENUM ('ACTIVE', 'ELIMINATED', 'COMPLETED', 'BUST', 'PENDING_PAYMENT');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameInstance" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'PENDING',
    "prizePool" INTEGER NOT NULL DEFAULT 0,
    "entryFee" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GameInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGameEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameInstanceId" TEXT NOT NULL,
    "status" "UserGameEntryStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "currentScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGameEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LastManStandingPick" (
    "id" TEXT NOT NULL,
    "userGameEntryId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "pickedTeamId" TEXT NOT NULL,
    "isCorrect" BOOLEAN,
    "isEliminated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LastManStandingPick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TablePredictorPrediction" (
    "id" TEXT NOT NULL,
    "userGameEntryId" TEXT NOT NULL,
    "predictedOrder" TEXT[],
    "predictedTotalGoals" INTEGER NOT NULL,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TablePredictorPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyScorePrediction" (
    "id" TEXT NOT NULL,
    "userGameEntryId" TEXT NOT NULL,
    "fixtureId" TEXT NOT NULL,
    "predictedHomeScore" INTEGER NOT NULL,
    "predictedAwayScore" INTEGER NOT NULL,
    "pointsAwarded" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyScorePrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceTo33Assignment" (
    "id" TEXT NOT NULL,
    "userGameEntryId" TEXT NOT NULL,
    "assignedTeamIds" TEXT[],
    "cumulativeGoals" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RaceTo33Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL,
    "sportMonksId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" INTEGER NOT NULL,

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "sportMonksId" INTEGER NOT NULL,
    "leagueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "sportMonksId" INTEGER NOT NULL,
    "seasonId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "sportMonksId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "logoPath" TEXT,
    "leagueId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fixture" (
    "id" TEXT NOT NULL,
    "sportMonksId" INTEGER NOT NULL,
    "roundId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "status" TEXT NOT NULL,
    "matchDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fixture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_name_key" ON "Game"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "UserGameEntry_userId_gameInstanceId_key" ON "UserGameEntry"("userId", "gameInstanceId");

-- CreateIndex
CREATE UNIQUE INDEX "LastManStandingPick_userGameEntryId_roundId_key" ON "LastManStandingPick"("userGameEntryId", "roundId");

-- CreateIndex
CREATE UNIQUE INDEX "TablePredictorPrediction_userGameEntryId_key" ON "TablePredictorPrediction"("userGameEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyScorePrediction_userGameEntryId_fixtureId_key" ON "WeeklyScorePrediction"("userGameEntryId", "fixtureId");

-- CreateIndex
CREATE UNIQUE INDEX "RaceTo33Assignment_userGameEntryId_key" ON "RaceTo33Assignment"("userGameEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "League_sportMonksId_key" ON "League"("sportMonksId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_sportMonksId_key" ON "Season"("sportMonksId");

-- CreateIndex
CREATE UNIQUE INDEX "Round_sportMonksId_key" ON "Round"("sportMonksId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_sportMonksId_key" ON "Team"("sportMonksId");

-- CreateIndex
CREATE UNIQUE INDEX "Fixture_sportMonksId_key" ON "Fixture"("sportMonksId");

-- AddForeignKey
ALTER TABLE "GameInstance" ADD CONSTRAINT "GameInstance_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGameEntry" ADD CONSTRAINT "UserGameEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGameEntry" ADD CONSTRAINT "UserGameEntry_gameInstanceId_fkey" FOREIGN KEY ("gameInstanceId") REFERENCES "GameInstance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LastManStandingPick" ADD CONSTRAINT "LastManStandingPick_userGameEntryId_fkey" FOREIGN KEY ("userGameEntryId") REFERENCES "UserGameEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LastManStandingPick" ADD CONSTRAINT "LastManStandingPick_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TablePredictorPrediction" ADD CONSTRAINT "TablePredictorPrediction_userGameEntryId_fkey" FOREIGN KEY ("userGameEntryId") REFERENCES "UserGameEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyScorePrediction" ADD CONSTRAINT "WeeklyScorePrediction_userGameEntryId_fkey" FOREIGN KEY ("userGameEntryId") REFERENCES "UserGameEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyScorePrediction" ADD CONSTRAINT "WeeklyScorePrediction_fixtureId_fkey" FOREIGN KEY ("fixtureId") REFERENCES "Fixture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaceTo33Assignment" ADD CONSTRAINT "RaceTo33Assignment_userGameEntryId_fkey" FOREIGN KEY ("userGameEntryId") REFERENCES "UserGameEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fixture" ADD CONSTRAINT "Fixture_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
