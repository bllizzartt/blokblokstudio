import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';

// POST /api/admin/auto-tags — apply auto-tag rules to leads
// Body: { rules: [{ condition: 'reply_contains', value: 'pricing', tag: 'pricing-inquiry' }, { condition: 'opened_gte', value: 3, tag: 'high-interest' }, { condition: 'status_is', value: 'replied', tag: 'replied' }, { condition: 'field_is', value: 'real estate', tag: 'real-estate' }] }
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { rules } = await req.json();
    if (!Array.isArray(rules) || rules.length === 0) {
      return NextResponse.json({ error: 'Provide an array of rules' }, { status: 400 });
    }

    let totalTagged = 0;

    // Get all leads with their events
    const leads = await prisma.lead.findMany();
    const events = await prisma.emailEvent.findMany();

    // Group events by lead
    const eventsByLead: Record<string, typeof events> = {};
    for (const ev of events) {
      if (!eventsByLead[ev.leadId]) eventsByLead[ev.leadId] = [];
      eventsByLead[ev.leadId].push(ev);
    }

    for (const lead of leads) {
      const leadEvents = eventsByLead[lead.id] || [];
      const existingTags: string[] = lead.tags ? (() => { try { return JSON.parse(lead.tags); } catch { return []; } })() : [];
      let tagsChanged = false;

      for (const rule of rules) {
        let match = false;

        if (rule.condition === 'reply_contains') {
          // Check if any reply event contains the value
          match = leadEvents.some(ev => ev.type === 'replied' && ev.details?.toLowerCase().includes(String(rule.value).toLowerCase()));
        } else if (rule.condition === 'opened_gte') {
          match = leadEvents.filter(ev => ev.type === 'opened').length >= Number(rule.value);
        } else if (rule.condition === 'clicked_gte') {
          match = leadEvents.filter(ev => ev.type === 'clicked').length >= Number(rule.value);
        } else if (rule.condition === 'status_is') {
          match = (lead.status || 'new') === rule.value;
        } else if (rule.condition === 'field_is') {
          match = lead.field.toLowerCase() === String(rule.value).toLowerCase();
        } else if (rule.condition === 'bounced') {
          match = lead.bounceCount > 0;
        } else if (rule.condition === 'no_engagement') {
          match = leadEvents.length === 0 || leadEvents.every(ev => ev.type === 'sent');
        }

        if (match && rule.tag && !existingTags.includes(rule.tag)) {
          existingTags.push(rule.tag);
          tagsChanged = true;
        }
      }

      if (tagsChanged) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { tags: JSON.stringify(existingTags) },
        });
        totalTagged++;
      }
    }

    return NextResponse.json({ success: true, updated: totalTagged, totalTagged, totalLeads: leads.length });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errMsg.slice(0, 200) }, { status: 500 });
  }
}
