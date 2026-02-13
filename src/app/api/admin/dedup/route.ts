import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';

// GET /api/admin/dedup — find potential duplicates
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const leads = await prisma.lead.findMany({ orderBy: { email: 'asc' } });

    // Find exact email duplicates (shouldn't happen due to unique constraint, but check)
    const emailMap = new Map<string, typeof leads>();
    for (const lead of leads) {
      const email = lead.email.toLowerCase();
      if (!emailMap.has(email)) emailMap.set(email, []);
      emailMap.get(email)!.push(lead);
    }

    // Find same-domain leads (potential company duplicates)
    const domainMap = new Map<string, typeof leads>();
    for (const lead of leads) {
      const domain = lead.email.split('@')[1]?.toLowerCase();
      if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com'].includes(domain)) {
        if (!domainMap.has(domain)) domainMap.set(domain, []);
        domainMap.get(domain)!.push(lead);
      }
    }

    // Find similar names (Levenshtein-like simple check)
    const similarNames: { lead1: { id: string; name: string; email: string }; lead2: { id: string; name: string; email: string } }[] = [];
    for (let i = 0; i < leads.length; i++) {
      for (let j = i + 1; j < leads.length; j++) {
        const name1 = leads[i].name.toLowerCase().trim();
        const name2 = leads[j].name.toLowerCase().trim();
        if (name1 === name2 && leads[i].email !== leads[j].email) {
          similarNames.push({
            lead1: { id: leads[i].id, name: leads[i].name, email: leads[i].email },
            lead2: { id: leads[j].id, name: leads[j].name, email: leads[j].email },
          });
        }
      }
    }

    // Build company groups (domains with 2+ leads)
    const companyGroups: { domain: string; leads: { id: string; name: string; email: string }[] }[] = [];
    for (const [domain, domainLeads] of domainMap) {
      if (domainLeads.length >= 2) {
        companyGroups.push({
          domain,
          leads: domainLeads.map(l => ({ id: l.id, name: l.name, email: l.email })),
        });
      }
    }

    return NextResponse.json({
      companyGroups,
      similarNames,
      totalLeads: leads.length,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errMsg.slice(0, 200) }, { status: 500 });
  }
}

// POST /api/admin/dedup — merge two leads
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { keepId, removeId } = await req.json();
    if (!keepId || !removeId) return NextResponse.json({ error: 'Provide keepId and removeId' }, { status: 400 });

    // Transfer all events from removeId to keepId
    await prisma.emailEvent.updateMany({
      where: { leadId: removeId },
      data: { leadId: keepId },
    });

    // Transfer sequence enrollments
    try {
      await prisma.sequenceEnrollment.updateMany({
        where: { leadId: removeId },
        data: { leadId: keepId },
      });
    } catch { /* unique constraint — enrollment already exists for keepId */ }

    // Transfer list memberships
    try {
      await prisma.leadListMember.updateMany({
        where: { leadId: removeId },
        data: { leadId: keepId },
      });
    } catch { /* unique constraint */ }

    // Merge tags
    const [keepLead, removeLead] = await Promise.all([
      prisma.lead.findUnique({ where: { id: keepId } }),
      prisma.lead.findUnique({ where: { id: removeId } }),
    ]);

    if (keepLead && removeLead) {
      const keepTags: string[] = keepLead.tags ? (() => { try { return JSON.parse(keepLead.tags); } catch { return []; } })() : [];
      const removeTags: string[] = removeLead.tags ? (() => { try { return JSON.parse(removeLead.tags); } catch { return []; } })() : [];
      const mergedTags = [...new Set([...keepTags, ...removeTags])];

      // Keep the higher email count
      await prisma.lead.update({
        where: { id: keepId },
        data: {
          tags: JSON.stringify(mergedTags),
          emailsSent: Math.max(keepLead.emailsSent, removeLead.emailsSent),
        },
      });
    }

    // Delete the duplicate
    await prisma.lead.delete({ where: { id: removeId } });

    return NextResponse.json({ success: true });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errMsg.slice(0, 200) }, { status: 500 });
  }
}
