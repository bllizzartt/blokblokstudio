-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "website" TEXT,
    "noWebsite" BOOLEAN NOT NULL DEFAULT false,
    "problem" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'funnel',
    "emailsSent" INTEGER NOT NULL DEFAULT 0,
    "lastEmailAt" DATETIME,
    "unsubscribed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentTo" INTEGER NOT NULL DEFAULT 0,
    "sentAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");
