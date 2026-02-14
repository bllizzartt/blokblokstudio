import { prisma } from '@/lib/prisma';

/**
 * Auto-list assignment: find-or-create a list by name, then add the lead to it.
 * Used by newsletter and audit APIs to automatically sort leads into the right list.
 * Non-blocking — never throws, just logs errors.
 */
export async function assignToList(leadId: string, listName: string, listColor: string) {
  try {
    // Find or create the list
    let list = await prisma.leadList.findFirst({ where: { name: listName } });
    if (!list) {
      list = await prisma.leadList.create({
        data: { name: listName, description: `Auto-created list for ${listName.toLowerCase()} leads`, color: listColor },
      });
    }

    // Add lead to list (skip if already a member)
    await prisma.leadListMember.create({
      data: { listId: list.id, leadId },
    });
  } catch (err) {
    // Duplicate membership or other non-critical error — don't crash the parent API
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('Unique constraint')) {
      console.error(`[auto-list] Failed to assign lead ${leadId} to "${listName}":`, msg);
    }
  }
}

/** Predefined list configurations */
export const NEWSLETTER_LIST = { name: 'Weekly Insights', color: '#3b82f6' };
export const AUDIT_LIST = { name: 'Audit Leads', color: '#f97316' };
export const CONTACT_LIST = { name: 'Contact Inquiries', color: '#8b5cf6' };
