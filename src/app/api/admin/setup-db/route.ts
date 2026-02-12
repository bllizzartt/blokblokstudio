import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';

// POST /api/admin/setup-db — one-time migration to create missing tables
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const results: string[] = [];

  try {
    // Create SendingAccount table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SendingAccount" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "label" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "smtpHost" TEXT NOT NULL,
        "smtpPort" INTEGER NOT NULL DEFAULT 587,
        "smtpUser" TEXT NOT NULL,
        "smtpPass" TEXT NOT NULL,
        "dailyLimit" INTEGER NOT NULL DEFAULT 20,
        "sentToday" INTEGER NOT NULL DEFAULT 0,
        "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "warmupPhase" INTEGER NOT NULL DEFAULT 1,
        "warmupStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SendingAccount_pkey" PRIMARY KEY ("id")
      )
    `);
    results.push('SendingAccount table ready');

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "SendingAccount_email_key" ON "SendingAccount"("email")
    `);
    results.push('SendingAccount email index ready');

    // Create SendingLog table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SendingLog" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "accountId" TEXT NOT NULL,
        "date" TEXT NOT NULL,
        "sent" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SendingLog_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "SendingLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SendingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    results.push('SendingLog table ready');

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "SendingLog_accountId_date_key" ON "SendingLog"("accountId", "date")
    `);
    results.push('SendingLog index ready');

    // Create Sequence table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Sequence" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Sequence_pkey" PRIMARY KEY ("id")
      )
    `);
    results.push('Sequence table ready');

    // Create SequenceStep table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SequenceStep" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "sequenceId" TEXT NOT NULL,
        "order" INTEGER NOT NULL,
        "delayDays" INTEGER NOT NULL,
        "subject" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SequenceStep_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "SequenceStep_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "Sequence"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    results.push('SequenceStep table ready');

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "SequenceStep_sequenceId_order_key" ON "SequenceStep"("sequenceId", "order")
    `);
    results.push('SequenceStep index ready');

    // Create SequenceEnrollment table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SequenceEnrollment" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "sequenceId" TEXT NOT NULL,
        "leadId" TEXT NOT NULL,
        "currentStep" INTEGER NOT NULL DEFAULT 0,
        "nextSendAt" TIMESTAMP(3),
        "status" TEXT NOT NULL DEFAULT 'active',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SequenceEnrollment_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "SequenceEnrollment_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "Sequence"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    results.push('SequenceEnrollment table ready');

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "SequenceEnrollment_sequenceId_leadId_key" ON "SequenceEnrollment"("sequenceId", "leadId")
    `);
    results.push('SequenceEnrollment index ready');

    // Also ensure EmailCampaign has the new columns
    await prisma.$executeRawUnsafe(`ALTER TABLE "EmailCampaign" ADD COLUMN IF NOT EXISTS "totalLeads" INTEGER NOT NULL DEFAULT 0`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "EmailCampaign" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "EmailCampaign" ADD COLUMN IF NOT EXISTS "leadIds" TEXT`);
    results.push('EmailCampaign columns updated');

    // Create EmailTemplate table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmailTemplate" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "body" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("id")
      )
    `);
    results.push('EmailTemplate table ready');

    // Add new Lead columns
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'new'`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "tags" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "verifyResult" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "bounceCount" INTEGER NOT NULL DEFAULT 0`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "lastBounceAt" TIMESTAMP(3)`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "bounceType" TEXT`);
    results.push('Lead columns updated');

    // Add new EmailCampaign columns
    await prisma.$executeRawUnsafe(`ALTER TABLE "EmailCampaign" ADD COLUMN IF NOT EXISTS "bounceCount" INTEGER NOT NULL DEFAULT 0`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "EmailCampaign" ADD COLUMN IF NOT EXISTS "bounceThreshold" INTEGER NOT NULL DEFAULT 5`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "EmailCampaign" ADD COLUMN IF NOT EXISTS "variants" TEXT`);
    results.push('EmailCampaign bounce/variant columns updated');

    // Add bounced column to SendingLog
    await prisma.$executeRawUnsafe(`ALTER TABLE "SendingLog" ADD COLUMN IF NOT EXISTS "bounced" INTEGER NOT NULL DEFAULT 0`);
    results.push('SendingLog bounced column updated');

    // Create EmailEvent table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "EmailEvent" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "leadId" TEXT NOT NULL,
        "campaignId" TEXT,
        "accountId" TEXT,
        "type" TEXT NOT NULL,
        "details" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailEvent_leadId_idx" ON "EmailEvent"("leadId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailEvent_campaignId_idx" ON "EmailEvent"("campaignId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "EmailEvent_type_idx" ON "EmailEvent"("type")`);
    results.push('EmailEvent table ready');

    // Create LeadList table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LeadList" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "color" TEXT NOT NULL DEFAULT '#f97316',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LeadList_pkey" PRIMARY KEY ("id")
      )
    `);
    results.push('LeadList table ready');

    // Create LeadListMember table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "LeadListMember" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "listId" TEXT NOT NULL,
        "leadId" TEXT NOT NULL,
        "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "LeadListMember_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "LeadListMember_listId_fkey" FOREIGN KEY ("listId") REFERENCES "LeadList"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "LeadListMember_listId_leadId_key" ON "LeadListMember"("listId", "leadId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "LeadListMember_leadId_idx" ON "LeadListMember"("leadId")`);
    results.push('LeadListMember table ready');

    return NextResponse.json({ success: true, results });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errMsg, results }, { status: 500 });
  }
}
