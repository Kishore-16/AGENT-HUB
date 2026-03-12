-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "apiUrl" TEXT NOT NULL,
    "tags" TEXT[],
    "inputFormat" TEXT NOT NULL,
    "outputFormat" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "Agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentRuns" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentRuns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ratings" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE INDEX "Agents_category_idx" ON "Agents"("category");

-- CreateIndex
CREATE INDEX "Agents_createdAt_idx" ON "Agents"("createdAt");

-- CreateIndex
CREATE INDEX "AgentRuns_agentId_idx" ON "AgentRuns"("agentId");

-- CreateIndex
CREATE INDEX "AgentRuns_createdAt_idx" ON "AgentRuns"("createdAt");

-- CreateIndex
CREATE INDEX "Ratings_agentId_idx" ON "Ratings"("agentId");

-- CreateIndex
CREATE INDEX "Ratings_userId_idx" ON "Ratings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Ratings_agentId_userId_key" ON "Ratings"("agentId", "userId");

-- AddForeignKey
ALTER TABLE "Agents" ADD CONSTRAINT "Agents_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentRuns" ADD CONSTRAINT "AgentRuns_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ratings" ADD CONSTRAINT "Ratings_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ratings" ADD CONSTRAINT "Ratings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
