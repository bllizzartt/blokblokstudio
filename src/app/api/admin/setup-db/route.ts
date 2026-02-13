import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';

// GET /api/admin/setup-db — one-time migration to create missing tables (browser-friendly)
export async function GET(req: NextRequest) {
  return runSetup(req);
}

// POST /api/admin/setup-db — same, for programmatic use
export async function POST(req: NextRequest) {
  return runSetup(req);
}

async function runSetup(req: NextRequest) {
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

    // ── New columns on SendingAccount ──
    await prisma.$executeRawUnsafe(`ALTER TABLE "SendingAccount" ADD COLUMN IF NOT EXISTS "imapHost" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "SendingAccount" ADD COLUMN IF NOT EXISTS "imapPort" INTEGER NOT NULL DEFAULT 993`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "SendingAccount" ADD COLUMN IF NOT EXISTS "imapUser" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "SendingAccount" ADD COLUMN IF NOT EXISTS "imapPass" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "SendingAccount" ADD COLUMN IF NOT EXISTS "sendWindowStart" INTEGER NOT NULL DEFAULT 8`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "SendingAccount" ADD COLUMN IF NOT EXISTS "sendWindowEnd" INTEGER NOT NULL DEFAULT 18`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "SendingAccount" ADD COLUMN IF NOT EXISTS "sendWeekdays" TEXT NOT NULL DEFAULT '1,2,3,4,5'`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "SendingAccount" ADD COLUMN IF NOT EXISTS "warmupEnabled" BOOLEAN NOT NULL DEFAULT false`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "SendingAccount" ADD COLUMN IF NOT EXISTS "warmupDaily" INTEGER NOT NULL DEFAULT 5`);
    results.push('SendingAccount new columns ready');

    // ── Domain table ──
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Domain" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "spfRecord" TEXT,
        "dkimSelector" TEXT NOT NULL DEFAULT 'blok',
        "dkimPublicKey" TEXT,
        "dkimPrivateKey" TEXT,
        "dmarcRecord" TEXT,
        "verified" BOOLEAN NOT NULL DEFAULT false,
        "lastCheckAt" TIMESTAMP(3),
        "lastCheckResult" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Domain_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Domain_name_key" ON "Domain"("name")`);
    results.push('Domain table ready');

    // ── InboxMessage table ──
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "InboxMessage" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "accountId" TEXT NOT NULL,
        "leadId" TEXT,
        "fromEmail" TEXT NOT NULL,
        "toEmail" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "bodyPreview" TEXT NOT NULL,
        "messageId" TEXT NOT NULL,
        "isAutoReply" BOOLEAN NOT NULL DEFAULT false,
        "isOOO" BOOLEAN NOT NULL DEFAULT false,
        "read" BOOLEAN NOT NULL DEFAULT false,
        "receivedAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "InboxMessage_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "InboxMessage_messageId_key" ON "InboxMessage"("messageId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InboxMessage_accountId_idx" ON "InboxMessage"("accountId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InboxMessage_leadId_idx" ON "InboxMessage"("leadId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InboxMessage_receivedAt_idx" ON "InboxMessage"("receivedAt")`);
    results.push('InboxMessage table ready');

    // ── WarmupLog table ──
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WarmupLog" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "accountId" TEXT NOT NULL,
        "date" TEXT NOT NULL,
        "sent" INTEGER NOT NULL DEFAULT 0,
        "received" INTEGER NOT NULL DEFAULT 0,
        "inbox" INTEGER NOT NULL DEFAULT 0,
        "spam" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WarmupLog_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "WarmupLog_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SendingAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "WarmupLog_accountId_date_key" ON "WarmupLog"("accountId", "date")`);
    results.push('WarmupLog table ready');

    // ── AuditLog table ──
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "action" TEXT NOT NULL,
        "details" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt")`);
    results.push('AuditLog table ready');

    // ── SoftBounceQueue table ──
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SoftBounceQueue" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "leadId" TEXT NOT NULL,
        "campaignId" TEXT,
        "email" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "html" TEXT NOT NULL,
        "retries" INTEGER NOT NULL DEFAULT 0,
        "nextRetry" TIMESTAMP(3) NOT NULL,
        "error" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SoftBounceQueue_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SoftBounceQueue_nextRetry_idx" ON "SoftBounceQueue"("nextRetry")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SoftBounceQueue_leadId_idx" ON "SoftBounceQueue"("leadId")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SoftBounceQueue_retries_nextRetry_idx" ON "SoftBounceQueue"("retries", "nextRetry")`);
    results.push('SoftBounceQueue table ready');

    // ── DeliverabilitySnapshot table ──
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DeliverabilitySnapshot" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "date" TEXT NOT NULL,
        "totalSent" INTEGER NOT NULL DEFAULT 0,
        "totalBounced" INTEGER NOT NULL DEFAULT 0,
        "hardBounces" INTEGER NOT NULL DEFAULT 0,
        "softBounces" INTEGER NOT NULL DEFAULT 0,
        "complaints" INTEGER NOT NULL DEFAULT 0,
        "unsubscribes" INTEGER NOT NULL DEFAULT 0,
        "opens" INTEGER NOT NULL DEFAULT 0,
        "clicks" INTEGER NOT NULL DEFAULT 0,
        "replies" INTEGER NOT NULL DEFAULT 0,
        "bounceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "complaintRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "unsubRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "openRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DeliverabilitySnapshot_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "DeliverabilitySnapshot_date_key" ON "DeliverabilitySnapshot"("date")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DeliverabilitySnapshot_date_idx" ON "DeliverabilitySnapshot"("date")`);
    results.push('DeliverabilitySnapshot table ready');

    // ── BlacklistCheck table ──
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BlacklistCheck" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "target" TEXT NOT NULL,
        "targetType" TEXT NOT NULL,
        "clean" BOOLEAN NOT NULL DEFAULT true,
        "listedOn" TEXT,
        "totalChecked" INTEGER NOT NULL DEFAULT 0,
        "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "autoAction" TEXT,
        CONSTRAINT "BlacklistCheck_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "BlacklistCheck_target_idx" ON "BlacklistCheck"("target")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "BlacklistCheck_checkedAt_idx" ON "BlacklistCheck"("checkedAt")`);
    results.push('BlacklistCheck table ready');

    // ── DnsHealthCheck table ──
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DnsHealthCheck" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "domain" TEXT NOT NULL,
        "ip" TEXT,
        "spfStatus" TEXT NOT NULL DEFAULT 'unknown',
        "dkimStatus" TEXT NOT NULL DEFAULT 'unknown',
        "dmarcStatus" TEXT NOT NULL DEFAULT 'unknown',
        "ptrStatus" TEXT NOT NULL DEFAULT 'unknown',
        "ptrHostname" TEXT,
        "mxStatus" TEXT NOT NULL DEFAULT 'unknown',
        "mxRecords" TEXT,
        "overall" TEXT NOT NULL DEFAULT 'unknown',
        "details" TEXT,
        "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DnsHealthCheck_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DnsHealthCheck_domain_idx" ON "DnsHealthCheck"("domain")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "DnsHealthCheck_checkedAt_idx" ON "DnsHealthCheck"("checkedAt")`);
    results.push('DnsHealthCheck table ready');

    // ── ListHygieneLog table ──
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ListHygieneLog" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "date" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "leadsAffected" INTEGER NOT NULL DEFAULT 0,
        "details" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ListHygieneLog_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ListHygieneLog_date_key" ON "ListHygieneLog"("date")`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ListHygieneLog_date_idx" ON "ListHygieneLog"("date")`);
    results.push('ListHygieneLog table ready');

    // ── CustomFieldDef table ──
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CustomFieldDef" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL DEFAULT 'text',
        "options" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CustomFieldDef_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "CustomFieldDef_name_key" ON "CustomFieldDef"("name")`);
    results.push('CustomFieldDef table ready');

    // ── SavedView table ──
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SavedView" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "filters" TEXT NOT NULL DEFAULT '{}',
        "color" TEXT DEFAULT '#f97316',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SavedView_pkey" PRIMARY KEY ("id")
      )
    `);
    results.push('SavedView table ready');

    // ── New columns on Lead (pipeline, custom fields) ──
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "pipelineStage" TEXT DEFAULT 'new'`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "customFields" TEXT DEFAULT '{}'`);
    results.push('Lead pipeline/custom field columns ready');

    // ── Signature column on SendingAccount ──
    await prisma.$executeRawUnsafe(`ALTER TABLE "SendingAccount" ADD COLUMN IF NOT EXISTS "signature" TEXT DEFAULT ''`);
    results.push('SendingAccount signature column ready');

    // ── Branches column on SequenceStep ──
    await prisma.$executeRawUnsafe(`ALTER TABLE "SequenceStep" ADD COLUMN IF NOT EXISTS "branches" TEXT DEFAULT '[]'`);
    results.push('SequenceStep branches column ready');

    return NextResponse.json({ success: true, results });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errMsg, results }, { status: 500 });
  }
}
