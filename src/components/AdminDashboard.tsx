'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

// ── Types ──
interface Lead {
  id: string;
  name: string;
  email: string;
  field: string;
  website: string | null;
  noWebsite: boolean;
  problem: string;
  emailsSent: number;
  lastEmailAt: string | null;
  unsubscribed: boolean;
  status: string;
  tags: string | null;
  emailVerified: boolean;
  verifyResult: string | null;
  verifiedAt: string | null;
  bounceCount: number;
  bounceType: string | null;
  createdAt: string;
}

interface Campaign {
  id: string;
  subject: string;
  body: string;
  sentTo: number;
  totalLeads: number;
  sentAt: string | null;
  scheduledAt: string | null;
  status: string;
  createdAt: string;
}

interface SavedTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

type Tab = 'dashboard' | 'leads' | 'compose' | 'templates' | 'history' | 'accounts' | 'sequences' | 'warmup' | 'analytics' | 'lists' | 'domains' | 'inbox' | 'pipeline' | 'settings';
type SendTarget = 'all' | 'selected' | 'individual';

interface EmailEvent {
  id: string;
  leadId: string;
  campaignId: string | null;
  accountId: string | null;
  type: string;
  details: string | null;
  createdAt: string;
}

interface LeadListData {
  id: string;
  name: string;
  description: string | null;
  color: string;
  memberCount: number;
  sequenceStats: {
    total: number;
    notStarted: number;
    inProgress: number;
    completed: number;
    replied: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface LeadEnrollment {
  id: string;
  sequenceId: string;
  sequenceName: string;
  currentStep: number;
  totalSteps: number;
  status: string;
  nextSendAt: string | null;
}

interface ListLead extends Lead {
  addedToListAt: string;
  enrollments: LeadEnrollment[];
}

interface ABVariant {
  subject: string;
  body: string;
  weight: number;
}

interface AccountStat {
  id: string;
  label: string;
  email: string;
  warmupPhase: number;
  phaseLabel: string;
  dailyLimit: number;
  sentToday: number;
  daysSinceStart: number;
  totalSent: number;
  healthScore: number;
  dailyLogs: { date: string; sent: number }[];
}

interface SequenceData {
  id: string;
  name: string;
  active: boolean;
  autoEnroll: boolean;
  steps: { id: string; order: number; delayDays: number; subject: string; body: string }[];
  enrolledCount: number;
  activeCount: number;
  completedCount: number;
}

// ── Icon components ──
function IconDashboard() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function IconLeads() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function IconCompose() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function IconVideo() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
    </svg>
  );
}

function IconChevronDown() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function IconX() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
    </svg>
  );
}

// ── Email Templates ──
const EMAIL_TEMPLATES = [
  {
    name: 'Free Audit Ready',
    subject: 'Your Free Website Audit is Ready, {{name}}!',
    body: `<h2 style="color: #f97316;">Hey {{name}}, your audit is ready!</h2>
<p>I took a deep dive into your <strong>{{field}}</strong> business and found some incredible opportunities to help you grow online.</p>
<p>Here are the top 3 things I noticed:</p>
<ol>
  <li><strong>Quick Win</strong> — A simple change that could boost your conversions within a week</li>
  <li><strong>Growth Opportunity</strong> — An untapped channel your competitors are missing</li>
  <li><strong>Technical Fix</strong> — Something holding back your site performance</li>
</ol>
<p>Want me to walk you through all the details on a quick 15-minute call? Just reply to this email and we'll get it scheduled.</p>
<p>Talk soon,<br/><strong>Chase</strong><br/>Blok Blok Studio</p>`,
  },
  {
    name: 'Follow-Up',
    subject: 'Quick question, {{name}}',
    body: `<p>Hey {{name}},</p>
<p>I sent over your free audit a few days ago — did you get a chance to check it out?</p>
<p>I know things get busy in the <strong>{{field}}</strong> world, so I just wanted to make sure it didn't slip through the cracks.</p>
<p>The insights I found for your business are genuinely exciting, and I'd love to walk you through them.</p>
<p>Would a quick 10-minute call this week work for you?</p>
<p>Best,<br/><strong>Chase</strong><br/>Blok Blok Studio</p>`,
  },
  {
    name: 'Value Offer',
    subject: '{{name}}, I made something for you',
    body: `<h2 style="color: #f97316;">I put together something special for you</h2>
<p>Hey {{name}},</p>
<p>Based on my audit of your <strong>{{field}}</strong> business, I created a custom growth roadmap showing exactly how we'd take your online presence to the next level.</p>
<p>Here's what's inside:</p>
<ul>
  <li>A redesign mockup tailored to your brand</li>
  <li>SEO strategy to outrank your competitors</li>
  <li>Conversion optimization plan to turn visitors into customers</li>
</ul>
<p>No strings attached — I just want to show you what's possible.</p>
<p>Want me to send it over? Just reply "Yes" and I'll get it to you within 24 hours.</p>
<p>Cheers,<br/><strong>Chase</strong><br/>Blok Blok Studio</p>`,
  },
  {
    name: 'Case Study',
    subject: 'How we helped a {{field}} business grow 3x',
    body: `<p>Hey {{name}},</p>
<p>I wanted to share a quick success story that I think you'll find relevant.</p>
<p>We recently worked with a business in the <strong>{{field}}</strong> space who was struggling with the same challenges you mentioned — <em>{{problem}}</em>.</p>
<p>Within 90 days, we helped them:</p>
<ul>
  <li>Increase website traffic by <strong>215%</strong></li>
  <li>Generate <strong>3x more leads</strong> per month</li>
  <li>Reduce their cost per acquisition by <strong>40%</strong></li>
</ul>
<p>The best part? It all started with a free audit — just like the one I did for you.</p>
<p>Ready to see similar results? Let's chat.</p>
<p>— <strong>Chase</strong>, Blok Blok Studio</p>`,
  },
];

// ── Main Component ──
export function AdminDashboard() {
  const [password, setPassword] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('bb_admin_pw') || '';
    return '';
  });
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Lead management
  const [searchQuery, setSearchQuery] = useState('');
  const [filterField, setFilterField] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVerify, setFilterVerify] = useState('all');
  const [filterList, setFilterList] = useState('all');
  const [listMemberIds, setListMemberIds] = useState<Set<string>>(new Set());
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  // Compose
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sendTarget, setSendTarget] = useState<SendTarget>('all');
  const [individualLeadId, setIndividualLeadId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Saved Templates
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SavedTemplate | null>(null);
  const [tplName, setTplName] = useState('');
  const [tplSubject, setTplSubject] = useState('');
  const [tplBody, setTplBody] = useState('');

  // CSV Import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Accounts & Warmup
  const [accounts, setAccounts] = useState<AccountStat[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ email: '', smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', label: '', imapHost: '', imapPort: 993, imapUser: '', imapPass: '', sendWindowStart: 8, sendWindowEnd: 18 });
  const [selectedProvider, setSelectedProvider] = useState('');
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Domains
  const [domains, setDomains] = useState<{ id: string; name: string; verified: boolean; lastCheckAt: string | null; lastCheckResult: string | null; dkimSelector: string; dkimPublicKey: string | null; createdAt: string }[]>([]);
  const [showAddDomain, setShowAddDomain] = useState(false);
  const [newDomainName, setNewDomainName] = useState('');
  const [dnsRecords, setDnsRecords] = useState<Record<string, { type: string; host: string; value: string; description: string }> | null>(null);
  const [dnsCheckResult, setDnsCheckResult] = useState<Record<string, { status: string; found: string; expected?: string }> | null>(null);

  // Inbox
  const [inboxMessages, setInboxMessages] = useState<{ id: string; fromEmail: string; toEmail: string; subject: string; bodyPreview: string; isAutoReply: boolean; isOOO: boolean; read: boolean; leadId: string | null; receivedAt: string }[]>([]);
  const [inboxUnread, setInboxUnread] = useState(0);
  const [inboxFilter, setInboxFilter] = useState('all');
  const [inboxPage, setInboxPage] = useState(1);
  const [inboxPages, setInboxPages] = useState(0);

  // Warmup data
  const [warmupData, setWarmupData] = useState<{ id: string; email: string; label: string; warmupEnabled: boolean; warmupDaily: number; warmupPhase: number; dailyLimit: number; daysSinceStart: number; sendWindowStart: number; sendWindowEnd: number; sendWeekdays: string; stats: { totalWarmupSent: number; totalInbox: number; totalSpam: number; inboxRate: number; recentInboxRate: number; totalSent: number; totalBounced: number; bounceRate: number }; warmupLogs: { date: string; sent: number; received: number; inbox: number; spam: number }[] }[]>([]);

  // Lead scoring
  const [leadScores, setLeadScores] = useState<Record<string, number>>({});

  // Connection testing
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [connectionResults, setConnectionResults] = useState<Record<string, { smtp: { success: boolean; latency: number; error?: string }; imap: { success: boolean; latency: number; error?: string } }>>({});

  // Spam score
  const [spamScore, setSpamScore] = useState<{ score: number; rating: string; issues: { trigger: string; category: string; weight: number; fix?: string }[]; recommendations?: string[]; htmlQuality?: { ratio: number; imageCount: number; linkCount: number; hasPlainText: boolean; issues: string[] } } | null>(null);
  const [checkingSpam, setCheckingSpam] = useState(false);

  // Blacklist
  const [blacklistResult, setBlacklistResult] = useState<{ domain: string; ip: string; clean: boolean; listedOn: { blacklist: string }[]; totalChecked: number } | null>(null);
  const [checkingBlacklist, setCheckingBlacklist] = useState(false);

  // VPS Server Health (IP blacklist monitor)
  const [vpsIp, setVpsIp] = useState('');
  const [vpsBlacklistResult, setVpsBlacklistResult] = useState<{ ip: string; clean: boolean; listedOn: { blacklist: string; type: string }[]; totalChecked: number; checkedAt: string } | null>(null);
  const [checkingVps, setCheckingVps] = useState(false);

  // Deliverability Health
  const [deliverabilityData, setDeliverabilityData] = useState<{
    score: number;
    rating: string;
    factors: { name: string; score: number; status: 'good' | 'warning' | 'danger'; detail: string }[];
    suppression: { hardBounces: number; complaints: number; unsubscribed: number; invalid: number; disposable: number; disengaged: number; total: number };
    trend: { date: string; sent: number; bounceRate: number; complaintRate: number; openRate: number }[];
    alerts: { level: 'danger' | 'warning' | 'info'; message: string }[];
    blacklist?: { currentlyListed: string[]; recentChecks: { target: string; type: string; clean: boolean; listedOn: string | null; checkedAt: string; action: string | null }[] };
    dnsHealth?: { domain: string; overall: string; score: number; spfStatus: string; dkimStatus: string; dmarcStatus: string; ptrStatus: string; checkedAt: string }[];
    hygieneHistory?: { date: string; leadsAffected: number; details: string | null }[];
  } | null>(null);
  const [fetchingDeliverability, setFetchingDeliverability] = useState(false);

  // DNS Health Check (deliverability monitor)
  const [dnsHealthDomain, setDnsHealthDomain] = useState('');
  const [dnsHealthResult, setDnsHealthResult] = useState<{
    domain: string; ip: string | null; overall: string; score: number; issues: string[];
    spf: { status: string; record: string | null; issues: string[] };
    dkim: { status: string; selector: string; issues: string[] };
    dmarc: { status: string; record: string | null; policy: string | null; issues: string[] };
    ptr: { status: string; hostname: string | null; issues: string[] };
    mx: { status: string; records: { exchange: string; priority: number }[]; issues: string[] };
  } | null>(null);
  const [checkingDnsHealth, setCheckingDnsHealth] = useState(false);

  // List Hygiene
  const [runningHygiene, setRunningHygiene] = useState(false);
  const [hygieneResult, setHygieneResult] = useState<{
    sunsetted: number; purgedInvalid: number; purgedBounced: number; purgedComplaints: number; totalCleaned: number;
  } | null>(null);

  // Engagement timeline
  const [timelineLeadId, setTimelineLeadId] = useState<string | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<EmailEvent[]>([]);

  // Pipeline / Kanban
  const [pipelineStages, setPipelineStages] = useState<{ id: string; label: string; color: string }[]>([]);
  const [pipelineData, setPipelineData] = useState<Record<string, Array<{ id: string; name: string; email: string; field: string; status: string; pipelineStage: string | null; tags: string | null; createdAt: string; emailsSent: number; bounceCount: number; website: string | null }>>>({});
  const [draggingLead, setDraggingLead] = useState<string | null>(null);

  // Settings sub-tab
  const [settingsTab, setSettingsTab] = useState<'auto-tags' | 'dedup' | 'signatures' | 'custom-fields' | 'saved-views' | 'branching'>('auto-tags');

  // Auto-tag rules
  const [autoTagRules, setAutoTagRules] = useState<Array<{ condition: string; value: string; tag: string }>>([
    { condition: 'reply_contains', value: 'interested', tag: 'hot-lead' },
  ]);
  const [runningAutoTags, setRunningAutoTags] = useState(false);
  const [autoTagResult, setAutoTagResult] = useState<{ updated: number } | null>(null);

  // Dedup
  const [dedupResults, setDedupResults] = useState<Array<{ email: string; domain: string; ids: string[]; names: string[] }>>([]);
  const [loadingDedup, setLoadingDedup] = useState(false);

  // Signatures
  const [signatures, setSignatures] = useState<Record<string, string>>({});
  const [editingSigId, setEditingSigId] = useState<string | null>(null);
  const [sigDraft, setSigDraft] = useState('');

  // Custom fields
  const [customFieldDefs, setCustomFieldDefs] = useState<Array<{ name: string; type: string; options?: string[] }>>([]);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('text');

  // Saved views
  const [savedViews, setSavedViews] = useState<Array<{ id: string; name: string; filters: Record<string, string>; color: string }>>([]);
  const [newViewName, setNewViewName] = useState('');

  // Sequence branching
  const [branchSteps, setBranchSteps] = useState<Array<{ id: string; stepOrder: number; subject: string; delayDays: number; branches: Array<{ condition: string; action: string; value?: number }> }>>([]);
  const [branchSequenceId, setBranchSequenceId] = useState<string | null>(null);

  // Analytics charts
  const [chartRange, setChartRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [leadsChartData, setLeadsChartData] = useState<{date: string; count: number}[]>([]);
  const [emailsChartData, setEmailsChartData] = useState<{date: string; sent: number; opened: number; clicked: number; replied: number}[]>([]);
  const [campaignAnalytics, setCampaignAnalytics] = useState<{id: string; subject: string; sentTo: number; openRate: string; clickRate: string; replyRate: string; bounceRate: string}[]>([]);

  const EMAIL_PROVIDERS: Record<string, { label: string; smtpHost: string; smtpPort: number; instructions: string[] }> = {
    'google': {
      label: 'Google Workspace / Gmail',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      instructions: [
        'Go to myaccount.google.com and sign in',
        'Click "Security" in the left sidebar',
        'Make sure "2-Step Verification" is turned ON (required)',
        'After enabling 2-Step Verification, go back to Security',
        'Search for "App passwords" or scroll down to find it',
        'Select "Mail" as the app, then "Other" and type "Blokblok"',
        'Google will give you a 16-character password — copy it',
        'Use your full email as the "Login Email" below',
        'Paste that 16-character password as the "Email Password" below',
      ],
    },
    'outlook': {
      label: 'Outlook / Office 365 / Hotmail',
      smtpHost: 'smtp-mail.outlook.com',
      smtpPort: 587,
      instructions: [
        'Go to account.microsoft.com and sign in',
        'Go to Security > Advanced security options',
        'Turn on "Two-step verification" if not already on',
        'Go back to Security and find "App passwords"',
        'Click "Create a new app password"',
        'Microsoft will show you a password — copy it',
        'Use your full email as the "Login Email" below',
        'Paste the app password as the "Email Password" below',
      ],
    },
    'yahoo': {
      label: 'Yahoo Mail',
      smtpHost: 'smtp.mail.yahoo.com',
      smtpPort: 587,
      instructions: [
        'Go to login.yahoo.com and sign in',
        'Click your profile icon > Account Info > Account Security',
        'Turn on "Two-step verification"',
        'Scroll down and click "Generate app password"',
        'Select "Other App" and type "Blokblok"',
        'Yahoo will show you a password — copy it',
        'Use your full Yahoo email as the "Login Email" below',
        'Paste that password as the "Email Password" below',
      ],
    },
    'zoho': {
      label: 'Zoho Mail',
      smtpHost: 'smtp.zoho.com',
      smtpPort: 587,
      instructions: [
        'Go to accounts.zoho.com and sign in',
        'Go to Security > App Passwords',
        'Click "Generate New Password"',
        'Name it "Blokblok" and click Generate',
        'Copy the generated password',
        'Use your full Zoho email as the "Login Email" below',
        'Paste that password as the "Email Password" below',
      ],
    },
    'custom': {
      label: 'Other / Custom Domain',
      smtpHost: '',
      smtpPort: 587,
      instructions: [
        'Check your email hosting provider\'s documentation for their mail server settings',
        'Look for "Outgoing Mail Server" or "SMTP Settings" in their help docs',
        'Common hosting providers: GoDaddy, Namecheap, Hostinger, SiteGround',
        'You\'ll need: server address, port number (usually 587), your email, and password',
        'If your host requires SSL, use port 465 instead of 587',
        'Contact your email hosting provider\'s support if you can\'t find these settings',
      ],
    },
  };

  // Sequences
  const [sequences, setSequences] = useState<SequenceData[]>([]);
  const [showCreateSeq, setShowCreateSeq] = useState(false);
  const [newSeqName, setNewSeqName] = useState('');
  const [newSeqSteps, setNewSeqSteps] = useState([{ subject: '', body: '', delayDays: 0 }]);
  const [newSeqAutoEnroll, setNewSeqAutoEnroll] = useState(false);

  // A/B Testing
  const [abEnabled, setAbEnabled] = useState(false);
  const [abVariants, setAbVariants] = useState<ABVariant[]>([
    { subject: '', body: '', weight: 50 },
    { subject: '', body: '', weight: 50 },
  ]);

  // Tags
  const [newTagInput, setNewTagInput] = useState<Record<string, string>>({});

  // Analytics / Events
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [eventsSummary, setEventsSummary] = useState<Record<string, number>>({});
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsTotalPages, setEventsTotalPages] = useState(1);
  const [eventsFilter, setEventsFilter] = useState('all');
  const [eventsLeadFilter, setEventsLeadFilter] = useState('');

  // Lead Lists
  const [leadLists, setLeadLists] = useState<LeadListData[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [listLeads, setListLeads] = useState<ListLead[]>([]);
  const [listSequences, setListSequences] = useState<{ id: string; name: string; active: boolean; stepCount: number }[]>([]);
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [newListColor, setNewListColor] = useState('#f97316');
  const [showAddToList, setShowAddToList] = useState(false);

  // Sidebar collapsed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${password}`,
  }), [password]);

  // Lead enrollment map: leadId -> enrollment info
  const [leadEnrollments, setLeadEnrollments] = useState<Record<string, LeadEnrollment[]>>({});

  const fetchLeadEnrollments = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sequences', { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, LeadEnrollment[]> = {};
        for (const seq of (data.sequences || [])) {
          for (const en of (seq.enrollments || [])) {
            if (!map[en.leadId]) map[en.leadId] = [];
            map[en.leadId].push({
              id: en.id,
              sequenceId: seq.id,
              sequenceName: seq.name,
              currentStep: en.currentStep,
              totalSteps: seq.steps?.length || 0,
              status: en.status,
              nextSendAt: en.nextSendAt,
            });
          }
        }
        setLeadEnrollments(map);
      }
    } catch { /* silently fail */ }
  }, [headers]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/leads', { headers: headers() });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      setLeads(data.leads || []);
      if (data.warning) {
        showToast('error', data.warning);
      }
    } catch {
      showToast('error', 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [headers, showToast]);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/campaign', { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns);
      }
    } catch {
      // silently fail
    }
  }, [headers]);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/accounts', { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts);
      }
    } catch { /* silently fail */ }
  }, [headers]);

  const fetchSequences = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sequences', { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setSequences(data.sequences);
      }
    } catch { /* silently fail */ }
  }, [headers]);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/templates', { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setSavedTemplates(data.templates);
      }
    } catch { /* silently fail */ }
  }, [headers]);

  const fetchEvents = useCallback(async (page = 1, type = 'all', leadId = '') => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (type !== 'all') params.set('type', type);
      if (leadId) params.set('leadId', leadId);
      const res = await fetch(`/api/admin/events?${params}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
        setEventsSummary(data.summary || {});
        setEventsTotal(data.total);
        setEventsPage(data.page);
        setEventsTotalPages(data.totalPages);
      }
    } catch { /* silently fail */ }
  }, [headers]);

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/lists', { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setLeadLists(data.lists || []);
      }
    } catch { /* silently fail */ }
  }, [headers]);

  const fetchListLeads = useCallback(async (listId: string) => {
    try {
      const res = await fetch(`/api/admin/lists/leads?listId=${listId}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setListLeads(data.leads || []);
        setListSequences(data.sequences || []);
      }
    } catch { /* silently fail */ }
  }, [headers]);

  const fetchDomains = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/domains', { headers: headers() });
      if (res.ok) { const data = await res.json(); setDomains(data.domains || []); }
    } catch { /* silently fail */ }
  }, [headers]);

  const fetchInbox = useCallback(async (page = 1, filter = 'all') => {
    try {
      const res = await fetch(`/api/admin/inbox?page=${page}&filter=${filter}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setInboxMessages(data.messages || []);
        setInboxUnread(data.unread || 0);
        setInboxPages(data.pages || 0);
      }
    } catch { /* silently fail */ }
  }, [headers]);

  const fetchWarmupData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/warmup', { headers: headers() });
      if (res.ok) { const data = await res.json(); setWarmupData(data.accounts || []); }
    } catch { /* silently fail */ }
  }, [headers]);

  const fetchLeadScores = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/lead-scores', { headers: headers() });
      if (res.ok) { const data = await res.json(); setLeadScores(data.scores || {}); }
    } catch { /* silently fail */ }
  }, [headers]);

  const testConnection = async (accountId: string) => {
    setTestingConnection(accountId);
    try {
      const res = await fetch('/api/admin/test-connection', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ accountId }),
      });
      if (res.ok) {
        const data = await res.json();
        setConnectionResults(prev => ({ ...prev, [accountId]: data }));
        showToast(data.smtp?.success ? 'success' : 'error', data.smtp?.success ? 'SMTP connected!' : `SMTP failed: ${data.smtp?.error?.slice(0, 80)}`);
      }
    } catch { showToast('error', 'Connection test failed'); }
    setTestingConnection(null);
  };

  const checkSpamScore = async (subj: string, bd: string) => {
    setCheckingSpam(true);
    try {
      const res = await fetch('/api/admin/spam-score', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ subject: subj, body: bd }),
      });
      if (res.ok) { const data = await res.json(); setSpamScore(data); }
    } catch { showToast('error', 'Spam check failed'); }
    setCheckingSpam(false);
  };

  const checkBlacklist = async (domain: string) => {
    setCheckingBlacklist(true);
    try {
      const res = await fetch('/api/admin/blacklist', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ domain }),
      });
      if (res.ok) { const data = await res.json(); setBlacklistResult(data); }
    } catch { showToast('error', 'Blacklist check failed'); }
    setCheckingBlacklist(false);
  };

  const checkVpsBlacklist = async (ip: string) => {
    if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip.trim())) {
      showToast('error', 'Enter a valid IPv4 address');
      return;
    }
    setCheckingVps(true);
    try {
      const res = await fetch('/api/admin/blacklist', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ ip: ip.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setVpsBlacklistResult(data);
        if (data.clean) {
          showToast('success', 'IP is clean — not on any blacklists');
        } else {
          showToast('error', `IP is listed on ${data.listedOn.length} blacklist(s)!`);
        }
      }
    } catch { showToast('error', 'VPS blacklist check failed'); }
    setCheckingVps(false);
  };

  const checkDnsHealthForDomain = async (domain: string) => {
    if (!domain) { showToast('error', 'Enter a domain'); return; }
    setCheckingDnsHealth(true);
    try {
      const res = await fetch('/api/admin/deliverability', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ action: 'dns-health', domain }),
      });
      if (res.ok) {
        const data = await res.json();
        setDnsHealthResult(data);
        if (data.overall === 'healthy') {
          showToast('success', `DNS health check passed for ${domain}`);
        } else if (data.overall === 'warning') {
          showToast('error', `DNS issues found for ${domain} — check recommendations`);
        } else {
          showToast('error', `Critical DNS issues for ${domain} — fix before sending!`);
        }
      }
    } catch { showToast('error', 'DNS health check failed'); }
    setCheckingDnsHealth(false);
  };

  const runListHygieneNow = async () => {
    setRunningHygiene(true);
    try {
      const res = await fetch('/api/admin/deliverability', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ action: 'run-hygiene' }),
      });
      if (res.ok) {
        const data = await res.json();
        setHygieneResult(data);
        if (data.totalCleaned > 0) {
          showToast('success', `List hygiene: ${data.totalCleaned} leads cleaned`);
        } else {
          showToast('success', 'List is already clean — no leads to purge');
        }
        fetchLeads();
        fetchDeliverability();
      }
    } catch { showToast('error', 'List hygiene failed'); }
    setRunningHygiene(false);
  };

  const fetchTimeline = async (leadId: string) => {
    setTimelineLeadId(leadId);
    try {
      const res = await fetch(`/api/admin/events?leadId=${leadId}`, { headers: headers() });
      if (res.ok) { const data = await res.json(); setTimelineEvents(data.events || []); }
    } catch { /* silently fail */ }
  };

  // Pipeline
  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pipeline', { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setPipelineStages(data.stages || []);
        setPipelineData(data.pipeline || {});
      }
    } catch { /* ignore */ }
  }, [headers]);

  const movePipelineLead = async (leadId: string, stage: string) => {
    try {
      await fetch('/api/admin/pipeline', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ leadId, stage }),
      });
      fetchPipeline();
    } catch { /* ignore */ }
  };

  // Auto-tags
  const runAutoTags = async () => {
    setRunningAutoTags(true);
    try {
      const res = await fetch('/api/admin/auto-tags', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ rules: autoTagRules }),
      });
      if (res.ok) {
        const data = await res.json();
        setAutoTagResult({ updated: data.updated || 0 });
        showToast('success', `Auto-tagged ${data.updated} leads`);
      }
    } catch { /* ignore */ }
    setRunningAutoTags(false);
  };

  // Dedup
  const fetchDedup = async () => {
    setLoadingDedup(true);
    try {
      const res = await fetch('/api/admin/dedup', { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setDedupResults(data.duplicates || []);
      }
    } catch { /* ignore */ }
    setLoadingDedup(false);
  };

  const mergeDuplicates = async (keepId: string, mergeId: string) => {
    try {
      const res = await fetch('/api/admin/dedup', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ keepId, mergeId }),
      });
      if (res.ok) {
        showToast('success', 'Leads merged');
        fetchDedup();
      }
    } catch { /* ignore */ }
  };

  // Signatures
  const fetchSignatures = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/signatures', { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        const sigs: Record<string, string> = {};
        for (const s of data.signatures || []) sigs[s.id] = s.signature || '';
        setSignatures(sigs);
      }
    } catch { /* ignore */ }
  }, [headers]);

  const saveSignature = async (accountId: string, signature: string) => {
    try {
      await fetch('/api/admin/signatures', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ accountId, signature }),
      });
      setSignatures(prev => ({ ...prev, [accountId]: signature }));
      setEditingSigId(null);
      showToast('success', 'Signature saved');
    } catch { /* ignore */ }
  };

  // Custom fields
  const fetchCustomFields = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/custom-fields', { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setCustomFieldDefs(data.fields || []);
      }
    } catch { /* ignore */ }
  }, [headers]);

  const addCustomField = async () => {
    if (!newFieldName.trim()) return;
    try {
      const res = await fetch('/api/admin/custom-fields', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ name: newFieldName.trim(), type: newFieldType }),
      });
      if (res.ok) {
        setNewFieldName('');
        fetchCustomFields();
        showToast('success', 'Custom field created');
      }
    } catch { /* ignore */ }
  };

  const deleteCustomField = async (name: string) => {
    try {
      await fetch('/api/admin/custom-fields', {
        method: 'DELETE',
        headers: headers(),
        body: JSON.stringify({ name }),
      });
      fetchCustomFields();
    } catch { /* ignore */ }
  };

  // Saved views
  const fetchSavedViews = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/saved-views', { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setSavedViews(data.views || []);
      }
    } catch { /* ignore */ }
  }, [headers]);

  const fetchAnalytics = useCallback(async (range = '30d') => {
    try {
      const [leadsRes, emailsRes, campaignsRes] = await Promise.all([
        fetch(`/api/admin/analytics?view=leads&range=${range}`, { headers: headers() }),
        fetch(`/api/admin/analytics?view=emails&range=${range}`, { headers: headers() }),
        fetch(`/api/admin/analytics?view=campaigns`, { headers: headers() }),
      ]);
      if (leadsRes.ok) { const d = await leadsRes.json(); setLeadsChartData(d.data || []); }
      if (emailsRes.ok) { const d = await emailsRes.json(); setEmailsChartData(d.data || []); }
      if (campaignsRes.ok) { const d = await campaignsRes.json(); setCampaignAnalytics(d.campaigns || []); }
    } catch { /* silently fail */ }
  }, [headers]);

  const fetchDeliverability = useCallback(async () => {
    setFetchingDeliverability(true);
    try {
      const res = await fetch('/api/admin/deliverability', { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setDeliverabilityData(data);
      }
    } catch { /* silently fail */ }
    setFetchingDeliverability(false);
  }, [headers]);

  const saveCurrentView = async () => {
    if (!newViewName.trim()) return;
    const filters = { search: searchQuery, field: filterField, status: filterStatus, verify: filterVerify, list: filterList };
    try {
      await fetch('/api/admin/saved-views', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ name: newViewName.trim(), filters }),
      });
      setNewViewName('');
      fetchSavedViews();
      showToast('success', 'View saved');
    } catch { /* ignore */ }
  };

  const applySavedView = (filters: Record<string, string>) => {
    if (filters.search) setSearchQuery(filters.search);
    if (filters.field) setFilterField(filters.field);
    if (filters.status) setFilterStatus(filters.status);
    if (filters.verify) setFilterVerify(filters.verify);
    if (filters.list) setFilterList(filters.list);
    setTab('leads');
  };

  const deleteSavedView = async (id: string) => {
    try {
      await fetch('/api/admin/saved-views', {
        method: 'DELETE',
        headers: headers(),
        body: JSON.stringify({ id }),
      });
      fetchSavedViews();
    } catch { /* ignore */ }
  };

  // Sequence branching
  const fetchBranches = async (sequenceId: string) => {
    setBranchSequenceId(sequenceId);
    try {
      const res = await fetch(`/api/admin/sequence-branches?sequenceId=${sequenceId}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setBranchSteps(data.steps || []);
      }
    } catch { /* ignore */ }
  };

  const saveBranch = async (stepId: string, branches: Array<{ condition: string; action: string; value?: number }>) => {
    try {
      await fetch('/api/admin/sequence-branches', {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify({ stepId, branches }),
      });
      showToast('success', 'Branch rules saved');
      if (branchSequenceId) fetchBranches(branchSequenceId);
    } catch { /* ignore */ }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pw = password;
    if (!pw) return;
    try {
      const res = await fetch('/api/admin/leads', {
        headers: { Authorization: `Bearer ${pw}` },
      });
      if (res.ok) {
        setAuthed(true);
        localStorage.setItem('bb_admin_pw', pw);
        try {
          const data = await res.json();
          setLeads(data.leads || []);
        } catch {
          // Data parsing failed, still allow login
        }
        fetchCampaigns();
        fetchAccounts();
        fetchSequences();
        fetchTemplates();
        fetchEvents();
        fetchLists();
        fetchLeadEnrollments();
        fetchDomains();
        fetchInbox();
        fetchWarmupData();
        fetchLeadScores();
        fetchPipeline();
        fetchSignatures();
        fetchCustomFields();
        fetchSavedViews();
        fetchDeliverability();
      } else {
        const data = await res.json().catch(() => ({}));
        localStorage.removeItem('bb_admin_pw');
        if (e) {
          // Show detailed error so user knows what went wrong
          if (res.status === 500 && data.error?.includes('column')) {
            showToast('error', 'Database needs migration — run setup-db from browser console');
          } else if (res.status === 500) {
            showToast('error', data.error || 'Server error — check ADMIN_PASSWORD in .env');
          } else {
            showToast('error', 'Wrong password');
          }
        }
      }
    } catch {
      if (e) showToast('error', 'Could not reach server');
    }
  };

  // Auto-login from saved password
  useEffect(() => {
    if (!authed && password) {
      handleLogin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (authed) {
      fetchLeads();
      fetchCampaigns();
      fetchAccounts();
      fetchSequences();
      fetchTemplates();
      fetchEvents();
      fetchLists();
      fetchLeadEnrollments();
      fetchAnalytics();
      fetchDeliverability();
    }
  }, [authed, fetchLeads, fetchCampaigns, fetchAccounts, fetchSequences, fetchTemplates, fetchEvents, fetchLists, fetchLeadEnrollments, fetchAnalytics, fetchDeliverability]);

  // ── Derived data ──
  const activeLeads = leads.filter(l => !l.unsubscribed);
  const uniqueFields = [...new Set(leads.map(l => l.field))].sort();
  const totalEmailsSent = leads.reduce((sum, l) => sum + l.emailsSent, 0);
  const recentLeads = leads.filter(l => {
    const d = new Date(l.createdAt);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    return diff < 7 * 24 * 60 * 60 * 1000; // last 7 days
  });

  const filteredLeads = leads.filter(l => {
    const matchSearch = searchQuery === '' ||
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.field.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.problem.toLowerCase().includes(searchQuery.toLowerCase());
    const matchField = filterField === 'all' || l.field === filterField;
    const matchStatus = filterStatus === 'all' || (l.status || 'new') === filterStatus;
    const matchVerify = filterVerify === 'all'
      || (filterVerify === 'verified' && l.emailVerified && l.verifyResult === 'valid')
      || (filterVerify === 'unverified' && !l.emailVerified)
      || (filterVerify === 'invalid' && l.emailVerified && l.verifyResult === 'invalid')
      || (filterVerify === 'risky' && l.emailVerified && l.verifyResult === 'risky')
      || (filterVerify === 'catch_all' && l.emailVerified && l.verifyResult === 'catch_all')
      || (filterVerify === 'disposable' && l.emailVerified && l.verifyResult === 'disposable');
    const matchList = filterList === 'all' || listMemberIds.has(l.id);
    return matchSearch && matchField && matchStatus && matchVerify && matchList;
  });

  // ── Actions ──
  const deleteLead = async (id: string) => {
    if (!confirm('Delete this lead permanently?')) return;
    await fetch(`/api/admin/leads?id=${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    setLeads(leads.filter(l => l.id !== id));
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    showToast('success', 'Lead deleted');
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
    }
  };

  const insertAtCursor = (text: string) => {
    const textarea = bodyRef.current;
    if (!textarea) {
      setBody(prev => prev + text);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = body.slice(0, start);
    const after = body.slice(end);
    setBody(before + text + after);
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  };

  const insertVideoEmbed = () => {
    if (!videoUrl.trim()) return;

    let embedHtml = '';
    const url = videoUrl.trim();

    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      const thumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;
      embedHtml = `
<div style="margin: 20px 0;">
  <a href="${url}" target="_blank" style="display: block; position: relative; max-width: 560px;">
    <img src="${thumbnail}" alt="Watch Video" style="width: 100%; border-radius: 12px; display: block;" />
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 72px; height: 72px; background: rgba(0,0,0,0.7); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
      <div style="width: 0; height: 0; border-left: 24px solid white; border-top: 14px solid transparent; border-bottom: 14px solid transparent; margin-left: 4px;"></div>
    </div>
  </a>
  <p style="margin-top: 8px; font-size: 14px; color: #666;"><a href="${url}" target="_blank" style="color: #f97316;">Click to watch video</a></p>
</div>`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (!embedHtml && vimeoMatch) {
      embedHtml = `
<div style="margin: 20px 0;">
  <a href="${url}" target="_blank" style="display: block; max-width: 560px; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; text-align: center; text-decoration: none;">
    <div style="width: 72px; height: 72px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
      <div style="width: 0; height: 0; border-left: 24px solid white; border-top: 14px solid transparent; border-bottom: 14px solid transparent; margin-left: 4px;"></div>
    </div>
    <p style="color: white; font-size: 16px; font-weight: 600; margin: 0;">Watch Video on Vimeo</p>
  </a>
</div>`;
    }

    // Loom
    const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (!embedHtml && loomMatch) {
      const thumbnail = `https://cdn.loom.com/sessions/thumbnails/${loomMatch[1]}-with-play.gif`;
      embedHtml = `
<div style="margin: 20px 0;">
  <a href="${url}" target="_blank" style="display: block; max-width: 560px;">
    <img src="${thumbnail}" alt="Watch Loom Video" style="width: 100%; border-radius: 12px; display: block;" />
  </a>
  <p style="margin-top: 8px; font-size: 14px; color: #666;"><a href="${url}" target="_blank" style="color: #f97316;">Watch on Loom</a></p>
</div>`;
    }

    // Generic video link
    if (!embedHtml) {
      embedHtml = `
<div style="margin: 20px 0; padding: 24px; background: #f8f9fa; border-radius: 12px; text-align: center;">
  <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 28px; background: #f97316; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Watch Video</a>
</div>`;
    }

    insertAtCursor(embedHtml);
    setVideoUrl('');
    setShowVideoModal(false);
  };

  const getRecipientCount = (): number => {
    if (sendTarget === 'all') return activeLeads.length;
    if (sendTarget === 'selected') return [...selectedLeadIds].filter(id => {
      const lead = leads.find(l => l.id === id);
      return lead && !lead.unsubscribed;
    }).length;
    return individualLeadId ? 1 : 0;
  };

  const getRecipientLabel = (): string => {
    const count = getRecipientCount();
    if (sendTarget === 'all') return `all ${count} active leads`;
    if (sendTarget === 'selected') return `${count} selected lead${count !== 1 ? 's' : ''}`;
    if (individualLeadId) {
      const lead = leads.find(l => l.id === individualLeadId);
      return lead ? lead.name : '1 lead';
    }
    return 'no one';
  };

  const sendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !body) return;

    const count = getRecipientCount();
    if (count === 0) {
      showToast('error', 'No recipients selected');
      return;
    }

    const action = scheduleEnabled && scheduledAt ? 'schedule' : 'send';
    const confirmMsg = action === 'schedule'
      ? `Schedule "${subject}" for ${new Date(scheduledAt).toLocaleString()} to ${getRecipientLabel()}?`
      : `Send "${subject}" to ${getRecipientLabel()}?`;
    if (!confirm(confirmMsg)) return;

    setSending(true);

    try {
      let leadIds: string[] | undefined;
      if (sendTarget === 'selected') {
        leadIds = [...selectedLeadIds];
      } else if (sendTarget === 'individual' && individualLeadId) {
        leadIds = [individualLeadId];
      }

      const payload: Record<string, unknown> = { subject, body, leadIds };
      if (scheduleEnabled && scheduledAt) {
        payload.scheduledAt = new Date(scheduledAt).toISOString();
      }
      if (abEnabled) {
        const validVariants = abVariants.filter(v => v.subject && v.body);
        if (validVariants.length >= 2) {
          payload.variants = JSON.stringify(validVariants);
        }
      }

      const res = await fetch('/api/admin/campaign', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const msg = data.status === 'scheduled'
        ? `Campaign scheduled for ${new Date(scheduledAt).toLocaleString()}`
        : data.status === 'queued'
        ? `Campaign queued — ${data.total} leads will be sent shortly`
        : `Campaign sent to ${data.sentTo}/${data.total} leads!`;
      showToast('success', msg);
      setSubject('');
      setBody('');
      setSendTarget('all');
      setIndividualLeadId(null);
      setScheduleEnabled(false);
      setScheduledAt('');
      fetchCampaigns();
      fetchLeads();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const emailIndividual = (lead: Lead) => {
    setTab('compose');
    setSendTarget('individual');
    setIndividualLeadId(lead.id);
    setSidebarOpen(false);
  };

  const emailSelected = () => {
    if (selectedLeadIds.size === 0) {
      showToast('error', 'Select at least one lead first');
      return;
    }
    setTab('compose');
    setSendTarget('selected');
    setSidebarOpen(false);
  };

  const loadTemplate = (template: typeof EMAIL_TEMPLATES[number]) => {
    setSubject(template.subject);
    setBody(template.body);
    setShowTemplates(false);
  };

  const exportCSV = () => {
    const csvRows = [
      ['Name', 'Email', 'Industry', 'Website', 'Challenge', 'Emails Sent', 'Status', 'Date'].join(','),
      ...leads.map(l =>
        [
          `"${l.name}"`,
          l.email,
          `"${l.field}"`,
          l.website || 'N/A',
          `"${l.problem.replace(/"/g, '""')}"`,
          l.emailsSent,
          l.unsubscribed ? 'Unsubscribed' : 'Active',
          new Date(l.createdAt).toLocaleDateString(),
        ].join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blokblok-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];

    // Parse header
    const headerLine = lines[0];
    const headers: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < headerLine.length; i++) {
      const ch = headerLine[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { headers.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    headers.push(current.trim());

    // Parse rows
    const rows: Record<string, string>[] = [];
    for (let r = 1; r < lines.length; r++) {
      const line = lines[r];
      const values: string[] = [];
      let val = '';
      let q = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { q = !q; }
        else if (ch === ',' && !q) { values.push(val.trim()); val = ''; }
        else { val += ch; }
      }
      values.push(val.trim());

      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ''; });
      rows.push(row);
    }
    return rows;
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        showToast('error', 'Could not parse CSV file');
        return;
      }
      setImportData(parsed);
      // Auto-map columns
      const cols = Object.keys(parsed[0]);
      const autoMap: Record<string, string> = {};
      const fieldMap: Record<string, string[]> = {
        name: ['name', 'full name', 'fullname', 'first name', 'contact'],
        email: ['email', 'email address', 'e-mail', 'mail'],
        field: ['field', 'industry', 'niche', 'sector', 'business type', 'category'],
        website: ['website', 'url', 'site', 'web', 'domain'],
        problem: ['problem', 'challenge', 'issue', 'pain point', 'notes', 'description', 'message'],
      };
      for (const [key, aliases] of Object.entries(fieldMap)) {
        const match = cols.find(c => aliases.includes(c.toLowerCase()));
        if (match) autoMap[key] = match;
      }
      setColumnMap(autoMap);
      setShowImportModal(true);
    };
    reader.readAsText(file);
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  const submitImport = async () => {
    if (!columnMap.name || !columnMap.email || !columnMap.field || !columnMap.problem) {
      showToast('error', 'Please map all required columns (Name, Email, Industry, Challenge)');
      return;
    }
    setImporting(true);
    try {
      const mapped = importData.map(row => ({
        name: row[columnMap.name] || '',
        email: row[columnMap.email] || '',
        field: row[columnMap.field] || '',
        website: columnMap.website ? row[columnMap.website] || '' : '',
        problem: row[columnMap.problem] || '',
      }));

      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ leads: mapped }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('success', `Imported ${data.imported} leads (${data.skipped} skipped)`);
      setShowImportModal(false);
      setImportData([]);
      setColumnMap({});
      fetchLeads();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const getPreviewHtml = (): string => {
    const sampleLead = leads[0] || {
      name: 'John Doe',
      email: 'john@example.com',
      field: 'E-commerce',
      website: 'https://example.com',
      problem: 'Low website conversions',
    };
    return body
      .replace(/\{\{name\}\}/g, sampleLead.name)
      .replace(/\{\{email\}\}/g, sampleLead.email)
      .replace(/\{\{field\}\}/g, sampleLead.field)
      .replace(/\{\{website\}\}/g, (sampleLead as Lead).website || 'N/A')
      .replace(/\{\{problem\}\}/g, sampleLead.problem);
  };

  // ── Login screen ──
  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-5">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Blok Blok Admin</h1>
            <p className="text-sm text-gray-500 mt-1">Enter your password to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all"
            />
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/20"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Nav items ──
  const navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
    { id: 'leads', label: 'Leads', icon: <IconLeads />, badge: leads.length },
    { id: 'lists', label: 'Lists', icon: <IconDashboard />, badge: leadLists.length },
    { id: 'compose', label: 'Compose', icon: <IconCompose /> },
    { id: 'templates', label: 'Templates', icon: <IconCompose />, badge: savedTemplates.length },
    { id: 'sequences', label: 'Sequences', icon: <IconHistory /> },
    { id: 'accounts', label: 'Accounts', icon: <IconMail />, badge: accounts.length },
    { id: 'domains', label: 'Domains', icon: <IconVideo />, badge: domains.length },
    { id: 'warmup', label: 'Warmup', icon: <IconVideo /> },
    { id: 'inbox', label: 'Inbox', icon: <IconLeads />, badge: inboxUnread || undefined },
    { id: 'pipeline', label: 'Pipeline', icon: <IconVideo /> },
    { id: 'analytics', label: 'Analytics', icon: <IconEye />, badge: eventsTotal },
    { id: 'history', label: 'History', icon: <IconHistory />, badge: campaigns.length },
    { id: 'settings', label: 'Settings', icon: <IconMail /> },
  ];

  // ── Dashboard ──
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border transition-all animate-in slide-in-from-right ${
          toast.type === 'success'
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100">
            <IconX />
          </button>
        </div>
      )}

      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 z-40 lg:hidden">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-white/5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <span className="font-semibold text-sm">Blok Blok Admin</span>
        <div className="w-9" />
      </div>

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 w-64 bg-[#0f0f0f] border-r border-white/5 flex flex-col z-50 transition-transform duration-200 lg:translate-x-0 lg:relative lg:z-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-black text-white">BB</span>
          </div>
          <div>
            <h1 className="text-sm font-bold">Blok Blok</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === item.id
                  ? 'bg-orange-500/10 text-orange-400'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  tab === item.id ? 'bg-orange-500/20 text-orange-300' : 'bg-white/5 text-gray-500'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={exportCSV}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={() => { fetchLeads(); fetchCampaigns(); }}
              className="flex items-center justify-center p-2 rounded-lg bg-white/[0.03] border border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
              title="Refresh data"
            >
              <IconRefresh />
            </button>
          </div>
          <p className="text-[10px] text-gray-600 text-center">Blok Blok Studio CRM v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">

          {/* ── DASHBOARD TAB ── */}
          {tab === 'dashboard' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Dashboard</h2>
                <p className="text-sm text-gray-500 mt-1">Overview of your lead pipeline</p>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total Leads', value: leads.length, color: 'from-blue-500 to-cyan-500', sub: `${recentLeads.length} this week` },
                  { label: 'Active Leads', value: activeLeads.length, color: 'from-green-500 to-emerald-500', sub: `${leads.length - activeLeads.length} unsubscribed` },
                  { label: 'Campaigns Sent', value: campaigns.filter(c => c.status === 'sent').length, color: 'from-orange-500 to-red-500', sub: `${campaigns.length} total` },
                  { label: 'Emails Delivered', value: totalEmailsSent, color: 'from-purple-500 to-pink-500', sub: `${activeLeads.length > 0 ? (totalEmailsSent / activeLeads.length).toFixed(1) : 0} avg per lead` },
                ].map((stat, i) => (
                  <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{stat.label}</p>
                    <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>

              {/* Leads Over Time */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Leads Over Time</h3>
                  <div className="flex gap-1">
                    {(['7d', '30d', '90d'] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => { setChartRange(r); fetchAnalytics(r); }}
                        className={`px-3 py-1 rounded-lg text-xs ${chartRange === r ? 'bg-orange-500/20 text-orange-400' : 'bg-white/[0.03] text-gray-500 hover:text-gray-300'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                {leadsChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={leadsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                      <YAxis tick={{ fill: '#666', fontSize: 10 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
                      <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} dot={false} name="Leads" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-600 text-center py-8">No data yet</p>
                )}
              </div>

              {/* Email Activity Over Time */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                <h3 className="font-semibold mb-4">Email Activity</h3>
                {emailsChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={emailsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                      <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} tickFormatter={(v: string) => v.slice(5)} />
                      <YAxis tick={{ fill: '#666', fontSize: 10 }} allowDecimals={false} />
                      <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
                      <Legend wrapperStyle={{ color: '#999', fontSize: 12 }} />
                      <Bar dataKey="sent" fill="#3b82f6" radius={[2,2,0,0]} name="Sent" />
                      <Bar dataKey="opened" fill="#22c55e" radius={[2,2,0,0]} name="Opened" />
                      <Bar dataKey="clicked" fill="#a855f7" radius={[2,2,0,0]} name="Clicked" />
                      <Bar dataKey="replied" fill="#f97316" radius={[2,2,0,0]} name="Replied" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-600 text-center py-8">No email data yet</p>
                )}
              </div>

              {/* VPS Server Health — IP Blacklist Monitor */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Server Health</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Check if your mail server IP is on any DNS blacklists</p>
                  </div>
                  {vpsBlacklistResult && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${vpsBlacklistResult.clean ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {vpsBlacklistResult.clean ? 'CLEAN' : `LISTED (${vpsBlacklistResult.listedOn.length})`}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={vpsIp}
                    onChange={e => setVpsIp(e.target.value)}
                    placeholder="Enter VPS IP (e.g. 46.225.131.150)"
                    className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500"
                    onKeyDown={e => e.key === 'Enter' && checkVpsBlacklist(vpsIp)}
                  />
                  <button
                    onClick={() => checkVpsBlacklist(vpsIp)}
                    disabled={checkingVps || !vpsIp}
                    className="px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 text-sm font-medium hover:bg-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {checkingVps ? 'Checking...' : 'Check IP'}
                  </button>
                </div>
                {vpsBlacklistResult && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>IP: {vpsBlacklistResult.ip}</span>
                      <span>{vpsBlacklistResult.totalChecked} blacklists checked &middot; {new Date(vpsBlacklistResult.checkedAt).toLocaleTimeString()}</span>
                    </div>
                    {vpsBlacklistResult.clean ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-sm text-green-400">Not listed on any blacklists — your IP is clean</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-sm text-red-400">Listed on {vpsBlacklistResult.listedOn.length} blacklist(s) — consider getting a new VPS IP</span>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {vpsBlacklistResult.listedOn.map((bl: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10 text-xs text-red-300">
                              <span className="truncate">{bl.blacklist}</span>
                              {bl.delist?.type === 'auto' ? (
                                <span className="ml-auto px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] whitespace-nowrap flex-shrink-0" title={bl.delist.note}>
                                  {bl.delist.autoDays ? `Auto-delists ~${bl.delist.autoDays}d` : 'Auto-delists'}
                                </span>
                              ) : bl.delist?.type === 'manual' && bl.delist?.url ? (
                                <a
                                  href={bl.delist.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-auto px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-[10px] hover:bg-orange-500/20 transition-colors whitespace-nowrap flex-shrink-0"
                                  title={bl.delist.note}
                                  onClick={e => e.stopPropagation()}
                                >
                                  Request Delisting &rarr;
                                </a>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Deliverability Health Score */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">Deliverability Health</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Overall email sending reputation score</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {deliverabilityData && (
                      <span className={`text-3xl font-bold ${
                        deliverabilityData.score >= 80 ? 'text-green-400' :
                        deliverabilityData.score >= 60 ? 'text-yellow-400' :
                        deliverabilityData.score >= 40 ? 'text-orange-400' : 'text-red-400'
                      }`}>
                        {deliverabilityData.score}
                      </span>
                    )}
                    <button
                      onClick={() => fetchDeliverability()}
                      disabled={fetchingDeliverability}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.03] text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
                    >
                      {fetchingDeliverability ? 'Checking...' : 'Refresh'}
                    </button>
                  </div>
                </div>

                {deliverabilityData ? (
                  <div className="space-y-4">
                    {/* Score bar */}
                    <div className="relative h-3 bg-white/[0.03] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          deliverabilityData.score >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
                          deliverabilityData.score >= 60 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' :
                          deliverabilityData.score >= 40 ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
                          'bg-gradient-to-r from-red-500 to-pink-500'
                        }`}
                        style={{ width: `${deliverabilityData.score}%` }}
                      />
                    </div>
                    <p className={`text-xs font-medium ${
                      deliverabilityData.score >= 80 ? 'text-green-400' :
                      deliverabilityData.score >= 60 ? 'text-yellow-400' :
                      deliverabilityData.score >= 40 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {deliverabilityData.rating} — {deliverabilityData.score >= 80 ? 'Your sending reputation is excellent' :
                      deliverabilityData.score >= 60 ? 'Good standing, minor improvements possible' :
                      deliverabilityData.score >= 40 ? 'Action needed to prevent blacklisting' :
                      'Critical — high risk of IP blacklisting'}
                    </p>

                    {/* Factor breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                      {deliverabilityData.factors.map(f => (
                        <div key={f.name} className="rounded-xl bg-white/[0.02] border border-white/5 p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-400">{f.name}</span>
                            <span className={`w-2 h-2 rounded-full ${f.status === 'good' ? 'bg-green-400' : f.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed">{f.detail}</p>
                        </div>
                      ))}
                    </div>

                    {/* Alerts */}
                    {deliverabilityData.alerts.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Active Alerts</h4>
                        {deliverabilityData.alerts.map((a, i) => (
                          <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
                            a.level === 'danger' ? 'bg-red-500/10 text-red-400' :
                            a.level === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-blue-500/10 text-blue-400'
                          }`}>
                            <span className="mt-0.5">{a.level === 'danger' ? '!' : a.level === 'warning' ? '!' : 'i'}</span>
                            <span>{a.message}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Suppression Stats */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Suppression List ({deliverabilityData.suppression.total} protected)</h4>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {[
                          { label: 'Hard Bounces', value: deliverabilityData.suppression.hardBounces, color: 'text-red-400' },
                          { label: 'Complaints', value: deliverabilityData.suppression.complaints, color: 'text-red-400' },
                          { label: 'Unsubscribed', value: deliverabilityData.suppression.unsubscribed, color: 'text-yellow-400' },
                          { label: 'Invalid', value: deliverabilityData.suppression.invalid, color: 'text-orange-400' },
                          { label: 'Disposable', value: deliverabilityData.suppression.disposable, color: 'text-orange-400' },
                          { label: 'Disengaged', value: deliverabilityData.suppression.disengaged, color: 'text-gray-400' },
                        ].map(s => (
                          <div key={s.label} className="text-center">
                            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] text-gray-600">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trend chart */}
                    {deliverabilityData.trend.length > 2 && (
                      <div className="mt-4 pt-4 border-t border-white/5">
                        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">30-Day Bounce Rate Trend</h4>
                        <ResponsiveContainer width="100%" height={120}>
                          <LineChart data={deliverabilityData.trend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                            <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 9 }} tickFormatter={(v: string) => v.slice(5)} />
                            <YAxis tick={{ fill: '#666', fontSize: 9 }} unit="%" />
                            <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 11 }} />
                            <Line type="monotone" dataKey="bounceRate" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Bounce %" />
                            <Line type="monotone" dataKey="openRate" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Open %" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 text-center py-8">
                    {fetchingDeliverability ? 'Calculating deliverability score...' : 'Click Refresh to check your deliverability health'}
                  </p>
                )}
              </div>

              {/* DNS Health Monitor */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">DNS Health Monitor</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Verify SPF, DKIM, DMARC, PTR & MX records for your sending domains</p>
                  </div>
                  {dnsHealthResult && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      dnsHealthResult.overall === 'healthy' ? 'bg-green-500/10 text-green-400' :
                      dnsHealthResult.overall === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {dnsHealthResult.overall === 'healthy' ? 'HEALTHY' : dnsHealthResult.overall === 'warning' ? 'WARNING' : 'CRITICAL'}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={dnsHealthDomain}
                    onChange={e => setDnsHealthDomain(e.target.value)}
                    placeholder="Enter domain (e.g. tryblokblokstudio.com)"
                    className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500"
                    onKeyDown={e => e.key === 'Enter' && checkDnsHealthForDomain(dnsHealthDomain)}
                  />
                  <button
                    onClick={() => checkDnsHealthForDomain(dnsHealthDomain)}
                    disabled={checkingDnsHealth || !dnsHealthDomain}
                    className="px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 text-sm font-medium hover:bg-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {checkingDnsHealth ? 'Checking...' : 'Check DNS'}
                  </button>
                </div>

                {/* Deliverability API DNS health results (from daily monitor) */}
                {deliverabilityData?.dnsHealth && deliverabilityData.dnsHealth.length > 0 && !dnsHealthResult && (
                  <div className="space-y-2 mb-4">
                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Last Monitor Scan</h4>
                    {deliverabilityData.dnsHealth.map(d => (
                      <div key={d.domain} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
                        d.overall === 'healthy' ? 'bg-green-500/5 border-green-500/20' :
                        d.overall === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' :
                        'bg-red-500/5 border-red-500/20'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            d.overall === 'healthy' ? 'bg-green-400' : d.overall === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                          }`} />
                          <span className="text-sm text-white">{d.domain}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {['spfStatus', 'dkimStatus', 'dmarcStatus', 'ptrStatus'].map(key => {
                            const val = d[key as keyof typeof d] as string;
                            return (
                              <span key={key} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                val === 'pass' ? 'bg-green-500/10 text-green-400' :
                                val === 'fail' ? 'bg-red-500/10 text-red-400' :
                                'bg-gray-500/10 text-gray-400'
                              }`}>
                                {key.replace('Status', '').toUpperCase()}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* On-demand DNS check result */}
                {dnsHealthResult && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{dnsHealthResult.domain} {dnsHealthResult.ip ? `(${dnsHealthResult.ip})` : ''}</span>
                      <span>Score: {dnsHealthResult.score}/100</span>
                    </div>

                    {/* DNS Record Status Grid */}
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { label: 'SPF', status: dnsHealthResult.spf.status, record: dnsHealthResult.spf.record },
                        { label: 'DKIM', status: dnsHealthResult.dkim.status, record: `selector: ${dnsHealthResult.dkim.selector}` },
                        { label: 'DMARC', status: dnsHealthResult.dmarc.status, record: dnsHealthResult.dmarc.policy ? `p=${dnsHealthResult.dmarc.policy}` : null },
                        { label: 'PTR', status: dnsHealthResult.ptr.status, record: dnsHealthResult.ptr.hostname },
                        { label: 'MX', status: dnsHealthResult.mx.status, record: dnsHealthResult.mx.records[0]?.exchange || null },
                      ].map(item => (
                        <div key={item.label} className={`text-center p-2.5 rounded-xl border ${
                          item.status === 'pass' ? 'bg-green-500/5 border-green-500/20' :
                          item.status === 'fail' ? 'bg-red-500/5 border-red-500/20' :
                          item.status === 'mismatch' ? 'bg-orange-500/5 border-orange-500/20' :
                          'bg-gray-500/5 border-gray-500/20'
                        }`}>
                          <p className={`text-xs font-bold ${
                            item.status === 'pass' ? 'text-green-400' :
                            item.status === 'fail' ? 'text-red-400' :
                            item.status === 'mismatch' ? 'text-orange-400' :
                            'text-gray-400'
                          }`}>{item.label}</p>
                          <p className={`text-[10px] mt-0.5 ${
                            item.status === 'pass' ? 'text-green-500' :
                            item.status === 'fail' ? 'text-red-500' :
                            'text-gray-500'
                          }`}>{item.status.toUpperCase()}</p>
                          {item.record && <p className="text-[9px] text-gray-600 mt-1 truncate" title={item.record}>{item.record}</p>}
                        </div>
                      ))}
                    </div>

                    {/* Issues */}
                    {dnsHealthResult.issues.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Issues Found ({dnsHealthResult.issues.length})</h4>
                        {dnsHealthResult.issues.slice(0, 8).map((issue, i) => (
                          <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-xs text-yellow-300">
                            <span className="text-yellow-500 mt-0.5">!</span>
                            <span>{issue}</span>
                          </div>
                        ))}
                        {dnsHealthResult.issues.length > 8 && (
                          <p className="text-[10px] text-gray-600 text-center">+{dnsHealthResult.issues.length - 8} more issues</p>
                        )}
                      </div>
                    )}

                    {dnsHealthResult.issues.length === 0 && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-sm text-green-400">All DNS records configured correctly</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* List Hygiene */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">List Hygiene</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Automatically clean invalid, bounced, and disengaged leads from your list</p>
                  </div>
                  <button
                    onClick={runListHygieneNow}
                    disabled={runningHygiene}
                    className="px-4 py-2 rounded-lg bg-orange-500/10 text-orange-400 text-sm font-medium hover:bg-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {runningHygiene ? 'Cleaning...' : 'Run Cleanup'}
                  </button>
                </div>

                {/* Hygiene Result */}
                {hygieneResult && (
                  <div className="space-y-3 mb-4">
                    <div className={`flex items-center gap-2 p-3 rounded-xl ${hygieneResult.totalCleaned > 0 ? 'bg-green-500/5 border border-green-500/20' : 'bg-gray-500/5 border border-gray-500/20'}`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${hygieneResult.totalCleaned > 0 ? 'bg-green-500' : 'bg-gray-500'}`} />
                      <span className={`text-sm ${hygieneResult.totalCleaned > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                        {hygieneResult.totalCleaned > 0 ? `Cleaned ${hygieneResult.totalCleaned} leads` : 'List is clean — no action needed'}
                      </span>
                    </div>
                    {hygieneResult.totalCleaned > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'Disengaged', value: hygieneResult.sunsetted, color: 'text-gray-400' },
                          { label: 'Invalid', value: hygieneResult.purgedInvalid, color: 'text-orange-400' },
                          { label: 'Bounced', value: hygieneResult.purgedBounced, color: 'text-red-400' },
                          { label: 'Complaints', value: hygieneResult.purgedComplaints, color: 'text-red-400' },
                        ].map(s => (
                          <div key={s.label} className="text-center p-2 rounded-lg bg-white/[0.02]">
                            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] text-gray-600">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Hygiene History from daily cron */}
                {deliverabilityData?.hygieneHistory && deliverabilityData.hygieneHistory.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recent Auto-Cleanups</h4>
                    {deliverabilityData.hygieneHistory.map(h => {
                      const details = h.details ? JSON.parse(h.details) : {};
                      return (
                        <div key={h.date} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
                          <span className="text-xs text-gray-400">{h.date}</span>
                          <div className="flex items-center gap-3 text-xs">
                            {details.sunsetted > 0 && <span className="text-gray-500">{details.sunsetted} sunset</span>}
                            {details.purgedInvalid > 0 && <span className="text-orange-400">{details.purgedInvalid} invalid</span>}
                            {details.purgedBounced > 0 && <span className="text-red-400">{details.purgedBounced} bounced</span>}
                            <span className="font-medium text-white">{h.leadsAffected} total</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Blacklist History from daily cron */}
                {deliverabilityData?.blacklist && deliverabilityData.blacklist.recentChecks.length > 0 && (
                  <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Recent Blacklist Scans</h4>
                    {deliverabilityData.blacklist.currentlyListed.length > 0 && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-sm text-red-400">Currently listed: {deliverabilityData.blacklist.currentlyListed.join(', ')}</span>
                      </div>
                    )}
                    {deliverabilityData.blacklist.recentChecks.slice(0, 5).map((check, i) => (
                      <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${check.clean ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${check.clean ? 'bg-green-400' : 'bg-red-400'}`} />
                          <span className="text-xs text-white">{check.target}</span>
                          <span className="text-[10px] text-gray-600">{check.type}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          {check.action && <span className="text-red-400">{check.action}</span>}
                          <span>{new Date(check.checkedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lead Pipeline */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                <h3 className="font-semibold mb-4">Lead Pipeline</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { status: 'new', label: 'New', color: 'bg-gray-500' },
                    { status: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
                    { status: 'replied', label: 'Replied', color: 'bg-purple-500' },
                    { status: 'interested', label: 'Interested', color: 'bg-green-500' },
                    { status: 'booked', label: 'Booked', color: 'bg-emerald-500' },
                    { status: 'not_interested', label: 'Not Int.', color: 'bg-yellow-500' },
                  ].map(s => {
                    const count = leads.filter(l => (l.status || 'new') === s.status).length;
                    return (
                      <button
                        key={s.status}
                        onClick={() => { setFilterStatus(s.status); setTab('leads'); }}
                        className="rounded-xl bg-white/[0.02] border border-white/5 p-3 text-center hover:border-white/10 transition-all"
                      >
                        <div className={`w-2 h-2 rounded-full ${s.color} mx-auto mb-2`} />
                        <p className="text-lg font-bold text-gray-200">{count}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Email Performance */}
              {(eventsSummary.sent || 0) > 0 && (
                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                  <h3 className="font-semibold mb-4">Email Performance</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { label: 'Bounce Rate', value: ((eventsSummary.bounced || 0) / (eventsSummary.sent || 1) * 100).toFixed(1) + '%', color: (eventsSummary.bounced || 0) / (eventsSummary.sent || 1) > 0.05 ? 'text-red-400' : 'text-green-400' },
                      { label: 'Open Rate', value: ((eventsSummary.opened || 0) / (eventsSummary.sent || 1) * 100).toFixed(1) + '%', color: 'text-blue-400' },
                      { label: 'Click Rate', value: ((eventsSummary.clicked || 0) / (eventsSummary.sent || 1) * 100).toFixed(1) + '%', color: 'text-purple-400' },
                      { label: 'Reply Rate', value: ((eventsSummary.replied || 0) / (eventsSummary.sent || 1) * 100).toFixed(1) + '%', color: 'text-orange-400' },
                    ].map(r => (
                      <div key={r.label} className="text-center p-3 rounded-xl bg-white/[0.02]">
                        <p className={`text-2xl font-bold ${r.color}`}>{r.value}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">{r.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Industries breakdown */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                <h3 className="font-semibold mb-4">Leads by Industry</h3>
                <div className="space-y-3">
                  {uniqueFields.map(field => {
                    const count = leads.filter(l => l.field === field).length;
                    const percent = (count / leads.length) * 100;
                    return (
                      <div key={field}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-300">{field}</span>
                          <span className="text-gray-500">{count} lead{count !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {uniqueFields.length === 0 && (
                    <p className="text-sm text-gray-600">No leads yet</p>
                  )}
                </div>
              </div>

              {/* Recent leads */}
              <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Recent Leads</h3>
                  <button
                    onClick={() => setTab('leads')}
                    className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {leads.slice(0, 5).map(lead => (
                    <div key={lead.id} className="flex items-center gap-4 py-2">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-orange-400">{lead.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lead.name}</p>
                        <p className="text-xs text-gray-500 truncate">{lead.email}</p>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 flex-shrink-0">{lead.field}</span>
                      <span className="text-xs text-gray-600 flex-shrink-0">{new Date(lead.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                  {leads.length === 0 && (
                    <p className="text-sm text-gray-600 text-center py-4">No leads yet. Share your funnel to start collecting!</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── LEADS TAB ── */}
          {tab === 'leads' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Leads</h2>
                  <p className="text-sm text-gray-500 mt-1">{leads.length} total, {activeLeads.length} active</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedLeadIds.size > 0 && (
                    <>
                      <span className="text-sm text-gray-400">{selectedLeadIds.size} selected</span>
                      <button
                        onClick={emailSelected}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/20"
                      >
                        <IconMail />
                        Email Selected
                      </button>
                      <button
                        onClick={async () => {
                          const ids = [...selectedLeadIds];
                          showToast('success', `Verifying ${ids.length} emails...`);
                          const res = await fetch('/api/admin/verify', {
                            method: 'POST',
                            headers: headers(),
                            body: JSON.stringify({ leadIds: ids }),
                          });
                          const data = await res.json();
                          if (res.ok) {
                            showToast('success', data.message);
                            fetchLeads();
                          } else {
                            showToast('error', data.error);
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 text-sm font-medium hover:bg-blue-500/20 transition-all"
                      >
                        Verify Emails
                      </button>
                      <select
                        onChange={async (e) => {
                          const status = e.target.value;
                          if (!status) return;
                          const ids = [...selectedLeadIds];
                          await fetch('/api/admin/leads', {
                            method: 'PATCH',
                            headers: headers(),
                            body: JSON.stringify({ ids, status }),
                          });
                          showToast('success', `${ids.length} leads marked as ${status}`);
                          fetchLeads();
                          e.target.value = '';
                        }}
                        className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-gray-400 focus:outline-none"
                      >
                        <option value="">Set Status...</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="replied">Replied</option>
                        <option value="interested">Interested</option>
                        <option value="booked">Booked</option>
                        <option value="not_interested">Not Interested</option>
                      </select>
                      {leadLists.length > 0 && (
                        <select
                          onChange={async (e) => {
                            const listId = e.target.value;
                            if (!listId) return;
                            const ids = [...selectedLeadIds];
                            const res = await fetch('/api/admin/lists', {
                              method: 'POST',
                              headers: headers(),
                              body: JSON.stringify({ action: 'addLeads', listId, leadIds: ids }),
                            });
                            const data = await res.json();
                            if (res.ok) showToast('success', `Added ${data.added} leads to list`);
                            fetchLists();
                            e.target.value = '';
                          }}
                          className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-gray-400 focus:outline-none"
                        >
                          <option value="">Add to List...</option>
                          {leadLists.map(l => (
                            <option key={l.id} value={l.id}>{l.name} ({l.memberCount})</option>
                          ))}
                        </select>
                      )}
                      <button
                        onClick={() => setSelectedLeadIds(new Set())}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                      >
                        <IconX />
                      </button>
                    </>
                  )}
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => csvInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Import CSV
                  </button>
                </div>
              </div>

              {/* Search & Filter bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                    <IconSearch />
                  </div>
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30 transition-all"
                  />
                </div>
                <div className="relative">
                  <select
                    value={filterField}
                    onChange={e => setFilterField(e.target.value)}
                    className="appearance-none bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-300 focus:outline-none focus:border-orange-500/30 transition-all cursor-pointer"
                  >
                    <option value="all">All Industries</option>
                    {uniqueFields.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <IconChevronDown />
                  </div>
                </div>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="appearance-none bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-300 focus:outline-none focus:border-orange-500/30 transition-all cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="replied">Replied</option>
                  <option value="interested">Interested</option>
                  <option value="booked">Booked</option>
                  <option value="not_interested">Not Interested</option>
                </select>
                <select
                  value={filterVerify}
                  onChange={e => setFilterVerify(e.target.value)}
                  className="appearance-none bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-300 focus:outline-none focus:border-orange-500/30 transition-all cursor-pointer"
                >
                  <option value="all">All Emails</option>
                  <option value="verified">SMTP Verified</option>
                  <option value="unverified">Not Checked</option>
                  <option value="invalid">Invalid (No Mailbox)</option>
                  <option value="risky">Risky</option>
                  <option value="catch_all">Catch-All</option>
                  <option value="disposable">Disposable</option>
                </select>
                {leadLists.length > 0 && (
                  <select
                    value={filterList}
                    onChange={async (e) => {
                      const val = e.target.value;
                      setFilterList(val);
                      if (val !== 'all') {
                        // Fetch members of this list
                        const res = await fetch(`/api/admin/lists/leads?listId=${val}`, { headers: headers() });
                        if (res.ok) {
                          const data = await res.json();
                          setListMemberIds(new Set((data.leads || []).map((l: ListLead) => l.id)));
                        }
                      } else {
                        setListMemberIds(new Set());
                      }
                    }}
                    className="appearance-none bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-300 focus:outline-none focus:border-orange-500/30 transition-all cursor-pointer"
                  >
                    <option value="all">All Lists</option>
                    {leadLists.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.memberCount})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Select all checkbox */}
              {filteredLeads.length > 0 && (
                <div className="flex items-center gap-3 px-1">
                  <button
                    onClick={toggleSelectAll}
                    className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                      selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0
                        ? 'bg-orange-500 border-orange-500'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    {selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0 && <IconCheck />}
                  </button>
                  <span className="text-xs text-gray-500">Select all ({filteredLeads.length})</span>
                </div>
              )}

              {/* Lead cards */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-gray-500">{searchQuery || filterField !== 'all' ? 'No leads match your filters' : 'No leads yet'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLeads.map(lead => (
                    <div
                      key={lead.id}
                      className={`rounded-2xl border transition-all ${
                        selectedLeadIds.has(lead.id)
                          ? 'bg-orange-500/[0.03] border-orange-500/20'
                          : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Lead row */}
                      <div className="flex items-center gap-3 p-4 sm:p-5">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleSelectLead(lead.id)}
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                            selectedLeadIds.has(lead.id)
                              ? 'bg-orange-500 border-orange-500'
                              : 'border-white/20 hover:border-white/40'
                          }`}
                        >
                          {selectedLeadIds.has(lead.id) && <IconCheck />}
                        </button>

                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-orange-400">{lead.name.charAt(0).toUpperCase()}</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-sm sm:text-base">{lead.name}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">{lead.field}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              (lead.status || 'new') === 'new' ? 'bg-gray-500/10 text-gray-400' :
                              (lead.status || 'new') === 'contacted' ? 'bg-blue-500/10 text-blue-400' :
                              (lead.status || 'new') === 'replied' ? 'bg-purple-500/10 text-purple-400' :
                              (lead.status || 'new') === 'interested' ? 'bg-green-500/10 text-green-400' :
                              (lead.status || 'new') === 'booked' ? 'bg-emerald-500/10 text-emerald-400' :
                              (lead.status || 'new') === 'not_interested' ? 'bg-yellow-500/10 text-yellow-400' :
                              'bg-red-500/10 text-red-400'
                            }`}>{(lead.status || 'new').replace('_', ' ')}</span>
                            {/* Lead Score */}
                            {leadScores[lead.id] !== undefined && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                leadScores[lead.id] >= 50 ? 'bg-green-500/10 text-green-400' :
                                leadScores[lead.id] >= 20 ? 'bg-blue-500/10 text-blue-400' :
                                leadScores[lead.id] > 0 ? 'bg-gray-500/10 text-gray-400' :
                                'bg-gray-500/10 text-gray-500'
                              }`}>
                                {leadScores[lead.id] >= 50 ? 'HOT' : leadScores[lead.id] >= 20 ? 'WARM' : ''} {leadScores[lead.id]}pts
                              </span>
                            )}
                            {lead.emailVerified && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                lead.verifyResult === 'valid' ? 'bg-green-500/10 text-green-400' :
                                lead.verifyResult === 'invalid' ? 'bg-red-500/10 text-red-400' :
                                lead.verifyResult === 'disposable' ? 'bg-red-500/10 text-red-400' :
                                lead.verifyResult === 'catch_all' ? 'bg-yellow-500/10 text-yellow-400' :
                                lead.verifyResult === 'risky' ? 'bg-amber-500/10 text-amber-400' :
                                'bg-yellow-500/10 text-yellow-400'
                              }`}>
                                {lead.verifyResult === 'valid' ? 'SMTP OK' :
                                 lead.verifyResult === 'invalid' ? 'No Mailbox' :
                                 lead.verifyResult === 'catch_all' ? 'Catch-All' :
                                 lead.verifyResult === 'risky' ? 'Risky' :
                                 lead.verifyResult === 'disposable' ? 'Disposable' :
                                 lead.verifyResult}
                              </span>
                            )}
                            {lead.bounceCount > 0 && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">{lead.bounceCount} bounce{lead.bounceCount > 1 ? 's' : ''}</span>
                            )}
                            {lead.tags && (() => { try { const t: string[] = JSON.parse(lead.tags); return t.slice(0, 3).map((tag: string) => (
                              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400">{tag}</span>
                            )); } catch { return null; } })()}
                            {/* Sequence progress mini-indicator */}
                            {leadEnrollments[lead.id]?.map(en => (
                              <span key={en.id} className="inline-flex items-center gap-1">
                                <span className="flex gap-px">
                                  {Array.from({ length: en.totalSteps }, (_, i) => (
                                    <span key={i} className={`w-1.5 h-1.5 rounded-sm ${
                                      en.status === 'completed' ? 'bg-green-500' :
                                      i < en.currentStep ? 'bg-blue-500' :
                                      i === en.currentStep ? 'bg-orange-500' :
                                      'bg-white/10'
                                    }`} />
                                  ))}
                                </span>
                                <span className={`text-[10px] ${en.status === 'completed' ? 'text-green-400' : 'text-blue-400'}`}>
                                  {en.status === 'completed' ? 'done' : `${en.currentStep}/${en.totalSteps}`}
                                </span>
                              </span>
                            ))}
                            {lead.unsubscribed && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Unsubscribed</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{lead.email}</p>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 flex-shrink-0">
                          <span>{lead.emailsSent} sent</span>
                          <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => emailIndividual(lead)}
                            className="p-2 rounded-lg hover:bg-orange-500/10 text-gray-500 hover:text-orange-400 transition-colors"
                            title="Send email"
                          >
                            <IconMail />
                          </button>
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                            title="Delete lead"
                          >
                            <IconTrash />
                          </button>
                          <button
                            onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
                            className={`p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-all ${
                              expandedLeadId === lead.id ? 'rotate-180' : ''
                            }`}
                          >
                            <IconChevronDown />
                          </button>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {expandedLeadId === lead.id && (
                        <div className="px-5 pb-5 pt-0 border-t border-white/5 mt-0">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Website</p>
                              {lead.website ? (
                                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                                  {lead.website}
                                </a>
                              ) : (
                                <p className="text-orange-400/60 italic">No website yet</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email Activity</p>
                              <p className="text-gray-300">{lead.emailsSent} emails sent</p>
                              {lead.lastEmailAt && (
                                <p className="text-xs text-gray-500 mt-0.5">Last: {new Date(lead.lastEmailAt).toLocaleString()}</p>
                              )}
                            </div>
                            {/* SMTP Verification Details */}
                            {lead.emailVerified && (
                              <div className="sm:col-span-2">
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Email Verification</p>
                                <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    lead.verifyResult === 'valid' ? 'bg-green-500/20 text-green-400' :
                                    lead.verifyResult === 'invalid' ? 'bg-red-500/20 text-red-400' :
                                    lead.verifyResult === 'disposable' ? 'bg-red-500/20 text-red-400' :
                                    lead.verifyResult === 'catch_all' ? 'bg-yellow-500/20 text-yellow-400' :
                                    lead.verifyResult === 'risky' ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {lead.verifyResult === 'valid' ? (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                                    ) : lead.verifyResult === 'invalid' || lead.verifyResult === 'disposable' ? (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                    ) : (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 9v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${
                                      lead.verifyResult === 'valid' ? 'text-green-400' :
                                      lead.verifyResult === 'invalid' ? 'text-red-400' :
                                      lead.verifyResult === 'disposable' ? 'text-red-400' :
                                      lead.verifyResult === 'risky' ? 'text-amber-400' :
                                      lead.verifyResult === 'catch_all' ? 'text-yellow-400' :
                                      'text-gray-400'
                                    }`}>
                                      {lead.verifyResult === 'valid' ? 'SMTP Verified — Mailbox Exists' :
                                       lead.verifyResult === 'invalid' ? 'Invalid — Mailbox Does Not Exist' :
                                       lead.verifyResult === 'disposable' ? 'Disposable Email Provider' :
                                       lead.verifyResult === 'catch_all' ? 'Catch-All Server — May Not Exist' :
                                       lead.verifyResult === 'risky' ? 'Risky — Could Not Fully Verify' :
                                       `Result: ${lead.verifyResult}`}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">Syntax OK</span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                        lead.verifyResult !== 'invalid' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                      }`}>MX Records {lead.verifyResult !== 'invalid' ? 'Found' : 'Missing'}</span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                        lead.verifyResult === 'valid' ? 'bg-green-500/10 text-green-400' :
                                        lead.verifyResult === 'invalid' ? 'bg-red-500/10 text-red-400' :
                                        lead.verifyResult === 'risky' ? 'bg-amber-500/10 text-amber-400' :
                                        'bg-yellow-500/10 text-yellow-400'
                                      }`}>SMTP {
                                        lead.verifyResult === 'valid' ? 'Passed' :
                                        lead.verifyResult === 'invalid' ? 'Rejected' :
                                        lead.verifyResult === 'risky' ? 'Blocked/Greylisted' :
                                        lead.verifyResult === 'catch_all' ? 'Catch-All' :
                                        'Skipped'
                                      }</span>
                                    </div>
                                    {lead.verifiedAt && (
                                      <p className="text-[11px] text-gray-600 mt-2">Verified: {new Date(lead.verifiedAt).toLocaleString()}</p>
                                    )}
                                  </div>
                                  {/* Re-verify button */}
                                  <button
                                    onClick={async () => {
                                      showToast('success', 'Re-verifying...');
                                      const res = await fetch('/api/admin/verify', {
                                        method: 'POST',
                                        headers: headers(),
                                        body: JSON.stringify({ leadIds: [lead.id] }),
                                      });
                                      const data = await res.json();
                                      if (res.ok) {
                                        showToast('success', data.message);
                                        fetchLeads();
                                      } else {
                                        showToast('error', data.error);
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors flex-shrink-0"
                                  >
                                    Re-verify
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="sm:col-span-2">
                              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Challenge</p>
                              <p className="text-gray-300">{lead.problem}</p>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Source</p>
                              <p className="text-gray-300">Funnel &middot; {new Date(lead.createdAt).toLocaleString()}</p>
                            </div>

                            {/* Tags management */}
                            <div className="sm:col-span-2">
                              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tags</p>
                              <div className="flex items-center flex-wrap gap-2">
                                {(() => {
                                  const tags: string[] = lead.tags ? (() => { try { return JSON.parse(lead.tags); } catch { return []; } })() : [];
                                  return tags.map((tag: string) => (
                                    <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs">
                                      {tag}
                                      <button
                                        onClick={async () => {
                                          await fetch('/api/admin/leads', {
                                            method: 'PATCH',
                                            headers: headers(),
                                            body: JSON.stringify({ id: lead.id, action: 'removeTag', tags: tag }),
                                          });
                                          fetchLeads();
                                        }}
                                        className="hover:text-red-400 transition-colors"
                                      >
                                        <IconX />
                                      </button>
                                    </span>
                                  ));
                                })()}
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    placeholder="Add tag..."
                                    value={newTagInput[lead.id] || ''}
                                    onChange={e => setNewTagInput(prev => ({ ...prev, [lead.id]: e.target.value }))}
                                    onKeyDown={async (e) => {
                                      if (e.key === 'Enter' && newTagInput[lead.id]?.trim()) {
                                        await fetch('/api/admin/leads', {
                                          method: 'PATCH',
                                          headers: headers(),
                                          body: JSON.stringify({ id: lead.id, action: 'addTag', tags: newTagInput[lead.id].trim() }),
                                        });
                                        setNewTagInput(prev => ({ ...prev, [lead.id]: '' }));
                                        fetchLeads();
                                      }
                                    }}
                                    className="bg-white/[0.03] border border-white/5 rounded-lg px-2.5 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30 w-28"
                                  />
                                  <button
                                    onClick={async () => {
                                      if (!newTagInput[lead.id]?.trim()) return;
                                      await fetch('/api/admin/leads', {
                                        method: 'PATCH',
                                        headers: headers(),
                                        body: JSON.stringify({ id: lead.id, action: 'addTag', tags: newTagInput[lead.id].trim() }),
                                      });
                                      setNewTagInput(prev => ({ ...prev, [lead.id]: '' }));
                                      fetchLeads();
                                    }}
                                    className="px-2 py-1 rounded-lg text-xs bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Status selector */}
                            <div className="sm:col-span-2">
                              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Status</p>
                              <select
                                value={lead.status || 'new'}
                                onChange={async (e) => {
                                  await fetch('/api/admin/leads', {
                                    method: 'PATCH',
                                    headers: headers(),
                                    body: JSON.stringify({ id: lead.id, status: e.target.value }),
                                  });
                                  fetchLeads();
                                }}
                                className="appearance-none bg-white/[0.03] border border-white/5 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-orange-500/30 cursor-pointer"
                              >
                                <option value="new">New</option>
                                <option value="contacted">Contacted</option>
                                <option value="replied">Replied</option>
                                <option value="interested">Interested</option>
                                <option value="booked">Booked</option>
                                <option value="not_interested">Not Interested</option>
                              </select>
                            </div>

                            {/* Engagement Timeline */}
                            <div className="sm:col-span-2">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Engagement Timeline</p>
                                <button
                                  onClick={() => fetchTimeline(lead.id)}
                                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-gray-400 hover:text-white"
                                >
                                  {timelineLeadId === lead.id && timelineEvents.length > 0 ? 'Refresh' : 'Load Timeline'}
                                </button>
                              </div>
                              {timelineLeadId === lead.id && timelineEvents.length > 0 && (
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                  {timelineEvents.map(ev => (
                                    <div key={ev.id} className="flex items-start gap-3 text-xs">
                                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                        ev.type === 'sent' ? 'bg-blue-500' :
                                        ev.type === 'opened' ? 'bg-green-500' :
                                        ev.type === 'clicked' ? 'bg-purple-500' :
                                        ev.type === 'replied' ? 'bg-orange-500' :
                                        ev.type === 'bounced' ? 'bg-red-500' :
                                        'bg-gray-500'
                                      }`} />
                                      <div className="flex-1">
                                        <span className="text-gray-300 font-medium capitalize">{ev.type}</span>
                                        {ev.details && <span className="text-gray-500 ml-2">{ev.details.slice(0, 80)}</span>}
                                        <p className="text-gray-600 text-[10px]">{new Date(ev.createdAt).toLocaleString()}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {timelineLeadId === lead.id && timelineEvents.length === 0 && (
                                <p className="text-xs text-gray-600">No events recorded for this lead yet.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── LISTS TAB ── */}
          {tab === 'lists' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">Lead Lists</h2>
                  <p className="text-sm text-gray-500 mt-1">Organize leads into lists, track sequence progress, and never lose track</p>
                </div>
                <button
                  onClick={() => { setNewListName(''); setNewListDesc(''); setNewListColor('#f97316'); setShowCreateList(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium"
                >
                  + New List
                </button>
              </div>

              {/* Active list view */}
              {activeListId ? (() => {
                const activeList = leadLists.find(l => l.id === activeListId);
                if (!activeList) return null;
                return (
                  <div className="space-y-4">
                    {/* List header */}
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button onClick={() => { setActiveListId(null); setListLeads([]); }} className="p-2 rounded-lg hover:bg-white/5 text-gray-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeList.color }} />
                              <h3 className="text-lg font-bold">{activeList.name}</h3>
                            </div>
                            {activeList.description && <p className="text-xs text-gray-500 mt-0.5">{activeList.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Enroll all in sequence */}
                          {listSequences.length > 0 && listLeads.length > 0 && (
                            <select
                              onChange={async (e) => {
                                const seqId = e.target.value;
                                if (!seqId) return;
                                const leadIds = listLeads.filter(l => {
                                  // Only enroll leads not already in this sequence
                                  return !l.enrollments.some(en => en.sequenceId === seqId);
                                }).map(l => l.id);
                                if (leadIds.length === 0) { showToast('error', 'All leads already enrolled in this sequence'); e.target.value = ''; return; }
                                const res = await fetch('/api/admin/sequences', {
                                  method: 'PATCH',
                                  headers: headers(),
                                  body: JSON.stringify({ id: seqId, action: 'enroll', leadIds }),
                                });
                                const data = await res.json();
                                if (res.ok) showToast('success', `Enrolled ${data.enrolled} leads`);
                                fetchListLeads(activeListId);
                                e.target.value = '';
                              }}
                              className="px-3 py-2 rounded-xl bg-orange-500/10 text-orange-400 text-sm font-medium focus:outline-none cursor-pointer"
                            >
                              <option value="">Enroll all in sequence...</option>
                              {listSequences.filter(s => s.active).map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.stepCount} steps)</option>
                              ))}
                            </select>
                          )}
                          <button
                            onClick={() => fetchListLeads(activeListId)}
                            className="p-2 rounded-lg bg-white/[0.03] border border-white/5 text-gray-400 hover:text-white"
                          >
                            <IconRefresh />
                          </button>
                        </div>
                      </div>

                      {/* Stats bar */}
                      <div className="grid grid-cols-5 gap-2 mt-4">
                        {[
                          { label: 'Total', value: activeList.sequenceStats.total, color: 'text-gray-200' },
                          { label: 'Not Started', value: activeList.sequenceStats.notStarted, color: 'text-gray-400' },
                          { label: 'In Sequence', value: activeList.sequenceStats.inProgress, color: 'text-blue-400' },
                          { label: 'Completed', value: activeList.sequenceStats.completed, color: 'text-green-400' },
                          { label: 'Replied', value: activeList.sequenceStats.replied, color: 'text-orange-400' },
                        ].map(s => (
                          <div key={s.label} className="text-center p-2 rounded-lg bg-white/[0.02]">
                            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-[10px] text-gray-500 uppercase">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Progress bar */}
                      {activeList.sequenceStats.total > 0 && (
                        <div className="mt-3">
                          <div className="h-2 rounded-full bg-white/5 overflow-hidden flex">
                            {activeList.sequenceStats.completed > 0 && (
                              <div className="h-full bg-green-500" style={{ width: `${(activeList.sequenceStats.completed / activeList.sequenceStats.total) * 100}%` }} />
                            )}
                            {activeList.sequenceStats.inProgress > 0 && (
                              <div className="h-full bg-blue-500" style={{ width: `${(activeList.sequenceStats.inProgress / activeList.sequenceStats.total) * 100}%` }} />
                            )}
                            {activeList.sequenceStats.replied > 0 && (
                              <div className="h-full bg-orange-500" style={{ width: `${(activeList.sequenceStats.replied / activeList.sequenceStats.total) * 100}%` }} />
                            )}
                          </div>
                          <div className="flex gap-4 mt-1.5 text-[10px] text-gray-500">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Completed</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> In Progress</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> Replied</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-white/10" /> Not Started</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Lead list with sequence progress */}
                    {listLeads.length === 0 ? (
                      <div className="text-center py-12 rounded-2xl bg-white/[0.02] border border-white/5">
                        <p className="text-gray-400 mb-2">No leads in this list yet</p>
                        <p className="text-xs text-gray-500">Go to the Leads tab, select leads, and use &quot;Add to List&quot; to populate this list.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {listLeads.map(lead => (
                          <div key={lead.id} className="rounded-2xl bg-white/[0.02] border border-white/5 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-bold text-orange-400">{lead.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-sm">{lead.name}</h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                      (lead.status || 'new') === 'new' ? 'bg-gray-500/10 text-gray-400' :
                                      (lead.status || 'new') === 'contacted' ? 'bg-blue-500/10 text-blue-400' :
                                      (lead.status || 'new') === 'replied' ? 'bg-purple-500/10 text-purple-400' :
                                      (lead.status || 'new') === 'interested' ? 'bg-green-500/10 text-green-400' :
                                      (lead.status || 'new') === 'booked' ? 'bg-emerald-500/10 text-emerald-400' :
                                      'bg-yellow-500/10 text-yellow-400'
                                    }`}>{(lead.status || 'new').replace('_', ' ')}</span>
                                    <span className="text-[10px] text-gray-500">{lead.emailsSent} sent</span>
                                  </div>
                                  <p className="text-xs text-gray-500 truncate">{lead.email}</p>
                                </div>
                              </div>

                              {/* Sequence progress */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {lead.enrollments.length === 0 ? (
                                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-gray-500">No sequence</span>
                                ) : lead.enrollments.map(en => (
                                  <div key={en.id} className="flex items-center gap-1.5">
                                    <div className="flex gap-0.5">
                                      {Array.from({ length: en.totalSteps }, (_, i) => (
                                        <div
                                          key={i}
                                          className={`w-3 h-3 rounded-sm ${
                                            en.status === 'completed' ? 'bg-green-500' :
                                            i < en.currentStep ? 'bg-blue-500' :
                                            i === en.currentStep ? 'bg-orange-500 animate-pulse' :
                                            'bg-white/10'
                                          }`}
                                          title={`Step ${i + 1}/${en.totalSteps}`}
                                        />
                                      ))}
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                      en.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                                      en.status === 'active' ? 'bg-blue-500/10 text-blue-400' :
                                      en.status === 'paused' ? 'bg-yellow-500/10 text-yellow-400' :
                                      'bg-gray-500/10 text-gray-400'
                                    }`}>
                                      {en.status === 'completed' ? 'Done' : en.status === 'active' ? `${en.currentStep}/${en.totalSteps}` : en.status}
                                    </span>
                                  </div>
                                ))}

                                {/* Remove from list */}
                                <button
                                  onClick={async () => {
                                    await fetch('/api/admin/lists', {
                                      method: 'POST',
                                      headers: headers(),
                                      body: JSON.stringify({ action: 'removeLeads', listId: activeListId, leadIds: [lead.id] }),
                                    });
                                    fetchListLeads(activeListId);
                                    fetchLists();
                                    showToast('success', 'Removed from list');
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                                  title="Remove from list"
                                >
                                  <IconX />
                                </button>
                              </div>
                            </div>

                            {/* Sequence timeline detail */}
                            {lead.enrollments.length > 0 && (
                              <div className="mt-3 pl-[52px]">
                                {lead.enrollments.map(en => (
                                  <div key={en.id} className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="font-medium text-gray-400">{en.sequenceName}</span>
                                    <span>&middot;</span>
                                    <span>Step {en.currentStep}/{en.totalSteps}</span>
                                    {en.nextSendAt && en.status === 'active' && (
                                      <>
                                        <span>&middot;</span>
                                        <span>Next: {new Date(en.nextSendAt).toLocaleDateString()}</span>
                                      </>
                                    )}
                                    {en.status === 'completed' && (
                                      <>
                                        <span>&middot;</span>
                                        <span className="text-green-400">Sequence complete</span>
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })() : (
                /* List cards view */
                <>
                  {leadLists.length === 0 && !showCreateList ? (
                    <div className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="w-16 h-16 rounded-full bg-orange-500/10 mx-auto mb-4 flex items-center justify-center">
                        <IconDashboard />
                      </div>
                      <p className="text-gray-300 font-medium mb-2">No lists yet</p>
                      <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
                        Lists let you organize leads into groups like &quot;January Cold Outreach&quot; or &quot;Dentists NYC&quot;.
                        You can track which leads have been through your sequences and which still need attention.
                      </p>
                      <button
                        onClick={() => setShowCreateList(true)}
                        className="mt-4 text-sm text-orange-400 hover:text-orange-300"
                      >
                        Create your first list
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {leadLists.map(list => (
                        <button
                          key={list.id}
                          onClick={() => { setActiveListId(list.id); fetchListLeads(list.id); }}
                          className="rounded-2xl bg-white/[0.02] border border-white/5 p-5 text-left hover:border-white/10 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: list.color }} />
                              <h3 className="font-semibold">{list.name}</h3>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!confirm(`Delete list "${list.name}"? (Leads are not deleted)`)) return;
                                  await fetch(`/api/admin/lists?id=${list.id}`, { method: 'DELETE', headers: headers() });
                                  fetchLists();
                                  showToast('success', 'List deleted');
                                }}
                                className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                              >
                                <IconTrash />
                              </button>
                            </div>
                          </div>
                          {list.description && <p className="text-xs text-gray-500 mb-3">{list.description}</p>}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl font-bold text-gray-200">{list.memberCount}</span>
                            <span className="text-xs text-gray-500">leads</span>
                          </div>

                          {/* Mini progress bar */}
                          {list.memberCount > 0 && (
                            <div>
                              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden flex mb-2">
                                {list.sequenceStats.completed > 0 && (
                                  <div className="h-full bg-green-500" style={{ width: `${(list.sequenceStats.completed / list.sequenceStats.total) * 100}%` }} />
                                )}
                                {list.sequenceStats.inProgress > 0 && (
                                  <div className="h-full bg-blue-500" style={{ width: `${(list.sequenceStats.inProgress / list.sequenceStats.total) * 100}%` }} />
                                )}
                                {list.sequenceStats.replied > 0 && (
                                  <div className="h-full bg-orange-500" style={{ width: `${(list.sequenceStats.replied / list.sequenceStats.total) * 100}%` }} />
                                )}
                              </div>
                              <div className="flex gap-3 text-[10px] text-gray-500">
                                <span>{list.sequenceStats.notStarted} waiting</span>
                                <span className="text-blue-400">{list.sequenceStats.inProgress} sending</span>
                                <span className="text-green-400">{list.sequenceStats.completed} done</span>
                                <span className="text-orange-400">{list.sequenceStats.replied} replied</span>
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Create list modal */}
              {showCreateList && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateList(false)}>
                  <div className="w-full max-w-md bg-[#161616] border border-white/10 rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="font-semibold text-lg mb-4">Create New List</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">List Name</label>
                        <input
                          placeholder="e.g. January Cold Outreach, Dentists NYC"
                          value={newListName}
                          onChange={e => setNewListName(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Description (optional)</label>
                        <input
                          placeholder="Quick notes about this list"
                          value={newListDesc}
                          onChange={e => setNewListDesc(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Color</label>
                        <div className="flex gap-2">
                          {['#f97316', '#ef4444', '#8b5cf6', '#3b82f6', '#22c55e', '#eab308', '#ec4899', '#06b6d4'].map(c => (
                            <button
                              key={c}
                              onClick={() => setNewListColor(c)}
                              className={`w-8 h-8 rounded-full transition-all ${newListColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#161616] scale-110' : 'hover:scale-105'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={async () => {
                          if (!newListName.trim()) { showToast('error', 'Enter a list name'); return; }
                          const res = await fetch('/api/admin/lists', {
                            method: 'POST',
                            headers: headers(),
                            body: JSON.stringify({ name: newListName.trim(), description: newListDesc.trim() || null, color: newListColor }),
                          });
                          if (res.ok) {
                            showToast('success', 'List created!');
                            setShowCreateList(false);
                            fetchLists();
                          }
                        }}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm"
                      >
                        Create List
                      </button>
                      <button onClick={() => setShowCreateList(false)} className="px-6 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-gray-400 text-sm">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── COMPOSE TAB ── */}
          {tab === 'compose' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Compose Campaign</h2>
                <p className="text-sm text-gray-500 mt-1">Create and send targeted email campaigns</p>
              </div>

              <form onSubmit={sendCampaign} className="space-y-5">
                {/* Send target selector */}
                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-3">Send To</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => { setSendTarget('all'); setIndividualLeadId(null); }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        sendTarget === 'all'
                          ? 'border-orange-500/30 bg-orange-500/[0.05]'
                          : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      <svg className={`w-6 h-6 ${sendTarget === 'all' ? 'text-orange-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                      <span className={`text-sm font-medium ${sendTarget === 'all' ? 'text-orange-400' : 'text-gray-400'}`}>All Active</span>
                      <span className="text-xs text-gray-500">{activeLeads.length} leads</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSendTarget('selected'); setIndividualLeadId(null); }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        sendTarget === 'selected'
                          ? 'border-orange-500/30 bg-orange-500/[0.05]'
                          : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      <svg className={`w-6 h-6 ${sendTarget === 'selected' ? 'text-orange-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className={`text-sm font-medium ${sendTarget === 'selected' ? 'text-orange-400' : 'text-gray-400'}`}>Selected</span>
                      <span className="text-xs text-gray-500">{selectedLeadIds.size} selected</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSendTarget('individual')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                        sendTarget === 'individual'
                          ? 'border-orange-500/30 bg-orange-500/[0.05]'
                          : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      <svg className={`w-6 h-6 ${sendTarget === 'individual' ? 'text-orange-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <span className={`text-sm font-medium ${sendTarget === 'individual' ? 'text-orange-400' : 'text-gray-400'}`}>Individual</span>
                      <span className="text-xs text-gray-500">1 lead</span>
                    </button>
                  </div>

                  {/* Individual lead picker */}
                  {sendTarget === 'individual' && (
                    <div className="mt-4">
                      <select
                        value={individualLeadId || ''}
                        onChange={e => setIndividualLeadId(e.target.value || null)}
                        className="w-full appearance-none bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-orange-500/30 transition-all cursor-pointer"
                      >
                        <option value="">Choose a lead...</option>
                        {activeLeads.map(l => (
                          <option key={l.id} value={l.id}>{l.name} — {l.email}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {sendTarget === 'selected' && selectedLeadIds.size === 0 && (
                    <p className="mt-3 text-xs text-yellow-400/80">
                      No leads selected. Go to the Leads tab to select recipients.
                    </p>
                  )}
                </div>

                {/* Templates */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-gray-400 hover:text-white hover:bg-white/[0.06] transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    Email Templates
                    <IconChevronDown />
                  </button>

                  {showTemplates && (
                    <div className="absolute top-full left-0 mt-2 w-full sm:w-96 bg-[#161616] border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden max-h-80 overflow-y-auto">
                      {savedTemplates.length > 0 && (
                        <>
                          <div className="p-3 border-b border-white/5">
                            <p className="text-xs text-orange-400 font-medium">Your Templates</p>
                          </div>
                          {savedTemplates.map(t => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => loadTemplate(t)}
                              className="w-full text-left px-4 py-3 hover:bg-white/[0.03] transition-colors border-b border-white/5"
                            >
                              <p className="text-sm font-medium text-gray-200">{t.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">{t.subject}</p>
                            </button>
                          ))}
                        </>
                      )}
                      <div className="p-3 border-b border-white/5">
                        <p className="text-xs text-gray-500 font-medium">Built-in Templates</p>
                      </div>
                      {EMAIL_TEMPLATES.map((t, i) => (
                        <button
                          key={`builtin-${i}`}
                          type="button"
                          onClick={() => loadTemplate(t)}
                          className="w-full text-left px-4 py-3 hover:bg-white/[0.03] transition-colors border-b border-white/5 last:border-b-0"
                        >
                          <p className="text-sm font-medium text-gray-200">{t.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{t.subject}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Subject Line</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Your free audit is ready, {{name}}!"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30 focus:ring-1 focus:ring-orange-500/10 transition-all"
                  />
                </div>

                {/* Body editor */}
                <div>
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Email Body (HTML)</label>

                  {/* Toolbar */}
                  <div className="flex items-center flex-wrap gap-1 p-2 bg-white/[0.02] border border-white/5 border-b-0 rounded-t-xl">
                    {/* Formatting buttons */}
                    <button type="button" onClick={() => insertAtCursor('<strong></strong>')} className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors" title="Bold">B</button>
                    <button type="button" onClick={() => insertAtCursor('<em></em>')} className="px-2.5 py-1.5 rounded-lg text-xs italic text-gray-400 hover:text-white hover:bg-white/5 transition-colors" title="Italic">I</button>
                    <button type="button" onClick={() => insertAtCursor('<u></u>')} className="px-2.5 py-1.5 rounded-lg text-xs underline text-gray-400 hover:text-white hover:bg-white/5 transition-colors" title="Underline">U</button>
                    <div className="w-px h-5 bg-white/10 mx-1" />
                    <button type="button" onClick={() => insertAtCursor('<h2 style="color: #f97316;"></h2>')} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors" title="Heading">H2</button>
                    <button type="button" onClick={() => insertAtCursor('<p></p>')} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors" title="Paragraph">P</button>
                    <button type="button" onClick={() => insertAtCursor('<a href="" style="color: #f97316;"></a>')} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors" title="Link">Link</button>
                    <button type="button" onClick={() => insertAtCursor('<br/>')} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors" title="Line break">BR</button>
                    <div className="w-px h-5 bg-white/10 mx-1" />
                    <button type="button" onClick={() => insertAtCursor('<ul>\n  <li></li>\n  <li></li>\n</ul>')} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors" title="Bullet list">List</button>
                    <button type="button" onClick={() => insertAtCursor('<hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />')} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors" title="Divider">HR</button>
                    <div className="w-px h-5 bg-white/10 mx-1" />

                    {/* Video embed */}
                    <button
                      type="button"
                      onClick={() => setShowVideoModal(true)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                      title="Embed video"
                    >
                      <IconVideo />
                      Video
                    </button>

                    <div className="w-px h-5 bg-white/10 mx-1" />

                    {/* Spintax helper */}
                    <div className="relative group">
                      <button
                        type="button"
                        onClick={() => insertAtCursor('{Hello|Hi|Hey}')}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
                        title="Insert spintax — randomizes text per email to avoid spam filters"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.745 3A23.933 23.933 0 003 12c0 3.183.62 6.22 1.745 9M19.5 3c.967 2.78 1.5 5.817 1.5 9s-.533 6.22-1.5 9M8.25 8.885l1.444-.89a.75.75 0 011.105.402l2.402 7.206a.75.75 0 001.105.401l1.444-.889" /></svg>
                        Spintax
                      </button>
                      <div className="hidden group-hover:block absolute top-full left-0 mt-1 w-72 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-30 p-4">
                        <p className="text-xs font-medium text-purple-400 mb-2">Spintax Syntax</p>
                        <p className="text-[11px] text-gray-400 mb-3">
                          Use {'{option1|option2|option3}'} to randomize text per recipient. Helps avoid spam filters by making each email unique.
                        </p>
                        <div className="space-y-1.5">
                          {[
                            { label: 'Greeting', value: '{Hello|Hi|Hey|Howdy}' },
                            { label: 'CTA', value: '{Let me know|Drop me a reply|Just hit reply}' },
                            { label: 'Opener', value: '{I noticed|I saw|I came across}' },
                            { label: 'Closing', value: '{Best|Cheers|Talk soon|All the best}' },
                          ].map(s => (
                            <button
                              key={s.label}
                              type="button"
                              onClick={() => insertAtCursor(s.value)}
                              className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] hover:bg-purple-500/10 text-gray-300 hover:text-purple-300 transition-colors"
                            >
                              <span className="text-purple-400 font-medium">{s.label}:</span>{' '}
                              <span className="font-mono text-gray-500">{s.value}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1" />

                    {/* Spam Score Check */}
                    <button
                      type="button"
                      onClick={() => checkSpamScore(subject, body)}
                      disabled={checkingSpam || (!subject && !body)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors"
                    >
                      {checkingSpam ? 'Checking...' : 'Spam Check'}
                    </button>

                    {/* Preview toggle */}
                    <button
                      type="button"
                      onClick={() => setShowPreview(!showPreview)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                        showPreview ? 'bg-orange-500/10 text-orange-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <IconEye />
                      Preview
                    </button>
                  </div>

                  {/* Spam Score Result */}
                  {spamScore && (
                    <div className={`mx-3 mt-2 p-3 rounded-xl border ${
                      spamScore.rating === 'clean' ? 'bg-green-500/5 border-green-500/20' :
                      spamScore.rating === 'low_risk' ? 'bg-blue-500/5 border-blue-500/20' :
                      spamScore.rating === 'medium_risk' ? 'bg-yellow-500/5 border-yellow-500/20' :
                      'bg-red-500/5 border-red-500/20'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${
                            spamScore.rating === 'clean' ? 'text-green-400' :
                            spamScore.rating === 'low_risk' ? 'text-blue-400' :
                            spamScore.rating === 'medium_risk' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>{spamScore.score}/100</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            spamScore.rating === 'clean' ? 'bg-green-500/10 text-green-400' :
                            spamScore.rating === 'low_risk' ? 'bg-blue-500/10 text-blue-400' :
                            spamScore.rating === 'medium_risk' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-red-500/10 text-red-400'
                          }`}>{spamScore.rating.replace('_', ' ')}</span>
                        </div>
                        <button onClick={() => setSpamScore(null)} className="text-gray-500 hover:text-white text-xs">dismiss</button>
                      </div>
                      {spamScore.issues.length > 0 && (
                        <div className="space-y-1">
                          {spamScore.issues.map((issue, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500">{issue.category}:</span>
                              <span className="text-gray-300">&quot;{issue.trigger}&quot;</span>
                              <span className="text-gray-600">({issue.weight}pts)</span>
                            </div>
                          ))}
                        </div>
                      )}
                            {spamScore.recommendations && spamScore.recommendations.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-white/5">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Recommendations</p>
                                {spamScore.recommendations.map((rec: string, i: number) => (
                                  <p key={i} className="text-xs text-blue-400 mb-1">• {rec}</p>
                                ))}
                              </div>
                            )}
                            {spamScore.htmlQuality && (
                              <div className="mt-2 flex gap-2 flex-wrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] ${spamScore.htmlQuality.ratio >= 30 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                  Text ratio: {spamScore.htmlQuality.ratio}%
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] ${spamScore.htmlQuality.imageCount <= 3 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                  Images: {spamScore.htmlQuality.imageCount}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] ${spamScore.htmlQuality.linkCount <= 5 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                  Links: {spamScore.htmlQuality.linkCount}
                                </span>
                              </div>
                            )}
                      {spamScore.issues.length === 0 && (
                        <p className="text-xs text-green-400">No spam triggers found. Your email looks clean!</p>
                      )}
                    </div>
                  )}

                  {/* Merge tags */}
                  <div className="flex items-center flex-wrap gap-1 px-3 py-2 bg-white/[0.015] border-x border-white/5">
                    <span className="text-[10px] text-gray-600 uppercase tracking-wider mr-1">Merge:</span>
                    {['{{name}}', '{{email}}', '{{field}}', '{{website}}', '{{problem}}'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertAtCursor(tag)}
                        className="px-2 py-0.5 rounded text-[11px] bg-orange-500/10 text-orange-400/80 hover:text-orange-300 hover:bg-orange-500/20 transition-colors font-mono"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  {/* Editor / Preview */}
                  {showPreview ? (
                    <div className="border border-white/5 border-t-0 rounded-b-xl overflow-hidden">
                      <div className="bg-white text-black p-6 min-h-[300px]">
                        <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
                      </div>
                    </div>
                  ) : (
                    <textarea
                      ref={bodyRef}
                      required
                      rows={16}
                      placeholder={`<h2 style="color: #f97316;">Hey {{name}}!</h2>\n<p>Your personalized website audit is ready...</p>`}
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/5 border-t-0 rounded-b-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30 font-mono text-sm resize-y min-h-[300px] transition-all"
                    />
                  )}
                </div>

                {/* A/B Testing */}
                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-300">A/B Testing</label>
                      <p className="text-xs text-gray-500 mt-0.5">Test different subject lines and bodies — the system picks a variant per recipient based on weight</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAbEnabled(!abEnabled)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        abEnabled ? 'bg-purple-500' : 'bg-white/10'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        abEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  {abEnabled && (
                    <div className="mt-4 space-y-4">
                      <p className="text-[11px] text-gray-500">
                        The main subject/body above becomes Variant A. Add more variants below. Weights control how often each variant is selected (higher = more frequent).
                      </p>
                      {abVariants.map((v, i) => (
                        <div key={i} className="rounded-xl bg-white/[0.03] border border-white/5 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-purple-400">Variant {String.fromCharCode(65 + i)}</span>
                            <div className="flex items-center gap-3">
                              <label className="text-xs text-gray-500">Weight:</label>
                              <input
                                type="range"
                                min="1"
                                max="100"
                                value={v.weight}
                                onChange={e => {
                                  const updated = [...abVariants];
                                  updated[i].weight = parseInt(e.target.value);
                                  setAbVariants(updated);
                                }}
                                className="w-20 accent-purple-500"
                              />
                              <span className="text-xs text-gray-400 w-8">{v.weight}%</span>
                              {abVariants.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => setAbVariants(vs => vs.filter((_, j) => j !== i))}
                                  className="p-1 text-gray-500 hover:text-red-400"
                                >
                                  <IconX />
                                </button>
                              )}
                            </div>
                          </div>
                          <input
                            placeholder={`Subject line for variant ${String.fromCharCode(65 + i)}`}
                            value={v.subject}
                            onChange={e => {
                              const updated = [...abVariants];
                              updated[i].subject = e.target.value;
                              setAbVariants(updated);
                            }}
                            className="w-full bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/30"
                          />
                          <textarea
                            placeholder={`Email body for variant ${String.fromCharCode(65 + i)} (HTML)`}
                            rows={4}
                            value={v.body}
                            onChange={e => {
                              const updated = [...abVariants];
                              updated[i].body = e.target.value;
                              setAbVariants(updated);
                            }}
                            className="w-full bg-white/[0.02] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/30 font-mono resize-y"
                          />
                        </div>
                      ))}
                      {abVariants.length < 5 && (
                        <button
                          type="button"
                          onClick={() => setAbVariants(vs => [...vs, { subject: '', body: '', weight: 50 }])}
                          className="w-full py-2.5 rounded-xl border border-dashed border-purple-500/20 text-sm text-purple-400/60 hover:text-purple-400 hover:border-purple-500/40 transition-colors"
                        >
                          + Add Variant (up to 5)
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Schedule option */}
                <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-300">Schedule for later</label>
                      <p className="text-xs text-gray-500 mt-0.5">Set a date and time to auto-send this campaign</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setScheduleEnabled(!scheduleEnabled)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        scheduleEnabled ? 'bg-orange-500' : 'bg-white/10'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        scheduleEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                  {scheduleEnabled && (
                    <div className="mt-4">
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={e => setScheduledAt(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        className="w-full sm:w-auto bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-orange-500/30 transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Send / Schedule button */}
                <div className="flex items-center gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={sending || getRecipientCount() === 0 || (scheduleEnabled && !scheduledAt)}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-orange-600 hover:to-red-600 transition-all shadow-lg shadow-orange-500/20"
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {scheduleEnabled ? 'Scheduling...' : 'Sending...'}
                      </>
                    ) : (
                      <>
                        {scheduleEnabled ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <IconMail />
                        )}
                        {scheduleEnabled ? 'Schedule Campaign' : `Send to ${getRecipientLabel()}`}
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500">
                    {getRecipientCount()} recipient{getRecipientCount() !== 1 ? 's' : ''}
                    {scheduleEnabled && scheduledAt && ` — ${new Date(scheduledAt).toLocaleString()}`}
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* ── TEMPLATES TAB ── */}
          {tab === 'templates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Email Templates</h2>
                  <p className="text-sm text-gray-500 mt-1">Create reusable templates for campaigns and sequences</p>
                </div>
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setTplName('');
                    setTplSubject('');
                    setTplBody('');
                    setShowCreateTemplate(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium"
                >
                  + New Template
                </button>
              </div>

              {savedTemplates.length === 0 && !showCreateTemplate ? (
                <div className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 mx-auto mb-4 flex items-center justify-center">
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-orange-400"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                  </div>
                  <p className="text-gray-300 font-medium mb-2">No templates yet</p>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">Create reusable email templates that you can quickly load into campaigns or assign to sequence steps.</p>
                  <button
                    onClick={() => { setEditingTemplate(null); setTplName(''); setTplSubject(''); setTplBody(''); setShowCreateTemplate(true); }}
                    className="mt-4 text-sm text-orange-400 hover:text-orange-300"
                  >
                    Create your first template
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedTemplates.map(tpl => (
                    <div key={tpl.id} className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{tpl.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">Subject: {tpl.subject}</p>
                          <div className="mt-2 text-xs text-gray-600 line-clamp-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: tpl.body.slice(0, 200) }} />
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => {
                              setEditingTemplate(tpl);
                              setTplName(tpl.name);
                              setTplSubject(tpl.subject);
                              setTplBody(tpl.body);
                              setShowCreateTemplate(true);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.03] border border-white/5 text-gray-400 hover:text-white"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setSubject(tpl.subject);
                              setBody(tpl.body);
                              setTab('compose');
                              showToast('success', `Loaded "${tpl.name}" into composer`);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                          >
                            Use in Compose
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm(`Delete template "${tpl.name}"?`)) return;
                              await fetch(`/api/admin/templates?id=${tpl.id}`, { method: 'DELETE', headers: headers() });
                              fetchTemplates();
                              showToast('success', 'Template deleted');
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Built-in templates */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Built-in Templates</h3>
                <div className="space-y-2">
                  {EMAIL_TEMPLATES.map((t, i) => (
                    <div key={i} className="rounded-xl bg-white/[0.02] border border-white/5 p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-300">{t.name}</p>
                        <p className="text-xs text-gray-600 truncate">{t.subject}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingTemplate(null);
                            setTplName(t.name + ' (copy)');
                            setTplSubject(t.subject);
                            setTplBody(t.body);
                            setShowCreateTemplate(true);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.03] border border-white/5 text-gray-400 hover:text-white"
                        >
                          Save as My Template
                        </button>
                        <button
                          onClick={() => {
                            setSubject(t.subject);
                            setBody(t.body);
                            setTab('compose');
                            showToast('success', `Loaded "${t.name}" into composer`);
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                        >
                          Use
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create / Edit template modal */}
              {showCreateTemplate && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateTemplate(false)}>
                  <div className="w-full max-w-2xl bg-[#161616] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-white/5">
                      <h3 className="font-semibold">{editingTemplate ? 'Edit Template' : 'Create Template'}</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Template Name</label>
                        <input
                          placeholder="e.g. Welcome Email, Follow-Up #1"
                          value={tplName}
                          onChange={e => setTplName(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Subject Line</label>
                        <input
                          placeholder="e.g. Your free audit is ready, {{name}}!"
                          value={tplSubject}
                          onChange={e => setTplSubject(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
                        />
                        <p className="text-[10px] text-gray-600 mt-1">Supports merge tags: {'{{name}}'}, {'{{field}}'}, {'{{problem}}'}, {'{{website}}'}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Email Body (HTML)</label>
                        <textarea
                          placeholder="Write your email HTML here..."
                          rows={12}
                          value={tplBody}
                          onChange={e => setTplBody(e.target.value)}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30 font-mono resize-y"
                        />
                      </div>
                      {tplBody && (
                        <div>
                          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Preview</label>
                          <div className="rounded-xl bg-white p-4 text-black text-sm" dangerouslySetInnerHTML={{ __html: tplBody }} />
                        </div>
                      )}
                    </div>
                    <div className="p-6 border-t border-white/5 flex gap-2">
                      <button
                        onClick={async () => {
                          if (!tplName || !tplSubject || !tplBody) {
                            showToast('error', 'Fill in all fields');
                            return;
                          }
                          const payload: Record<string, string> = { name: tplName, subject: tplSubject, body: tplBody };
                          if (editingTemplate) payload.id = editingTemplate.id;
                          const res = await fetch('/api/admin/templates', {
                            method: 'POST',
                            headers: headers(),
                            body: JSON.stringify(payload),
                          });
                          if (res.ok) {
                            showToast('success', editingTemplate ? 'Template updated!' : 'Template created!');
                            setShowCreateTemplate(false);
                            setEditingTemplate(null);
                            setTplName('');
                            setTplSubject('');
                            setTplBody('');
                            fetchTemplates();
                          } else {
                            const data = await res.json();
                            showToast('error', data.error);
                          }
                        }}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold"
                      >
                        {editingTemplate ? 'Save Changes' : 'Create Template'}
                      </button>
                      <button onClick={() => setShowCreateTemplate(false)} className="px-6 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-gray-400">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {tab === 'history' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Campaign History</h2>
                <p className="text-sm text-gray-500 mt-1">{campaigns.length} campaigns sent</p>
              </div>

              {campaigns.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/[0.03] mb-4">
                    <IconHistory />
                  </div>
                  <p className="text-gray-500">No campaigns sent yet</p>
                  <button
                    onClick={() => setTab('compose')}
                    className="mt-4 text-sm text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    Send your first campaign
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {campaigns.map(c => (
                    <div
                      key={c.id}
                      className="rounded-2xl bg-white/[0.02] border border-white/5 p-5 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold truncate">{c.subject}</h3>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full flex-shrink-0 ${
                              c.status === 'sent'
                                ? 'bg-green-500/10 text-green-400'
                                : c.status === 'sending'
                                ? 'bg-yellow-500/10 text-yellow-400'
                                : c.status === 'scheduled'
                                ? 'bg-blue-500/10 text-blue-400'
                                : c.status === 'queued'
                                ? 'bg-purple-500/10 text-purple-400'
                                : c.status === 'failed'
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-gray-500/10 text-gray-400'
                            }`}>
                              {c.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                            {c.status === 'sent' && <span>Sent to {c.sentTo}/{c.totalLeads || c.sentTo} leads</span>}
                            {c.status === 'scheduled' && c.scheduledAt && <span>Scheduled for {new Date(c.scheduledAt).toLocaleString()}</span>}
                            {c.status === 'queued' && <span>Queued — {c.totalLeads || '?'} leads waiting</span>}
                            {c.sentAt && <span>{new Date(c.sentAt).toLocaleString()}</span>}
                            {!c.sentAt && c.createdAt && <span>Created {new Date(c.createdAt).toLocaleString()}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ACCOUNTS TAB ── */}
          {tab === 'accounts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Sending Accounts</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {accounts.length === 0 ? 'Connect your email accounts to start sending' : `${accounts.length} email account${accounts.length !== 1 ? 's' : ''} connected`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSetupGuide(g => !g)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-gray-400 text-sm hover:border-white/10 hover:text-gray-300 transition-colors"
                  >
                    ? Setup Guide
                  </button>
                  <button
                    onClick={() => { setSelectedProvider(''); setShowAddAccount(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium"
                  >
                    + Add Account
                  </button>
                </div>
              </div>

              {/* Setup guide panel */}
              {showSetupGuide && (
                <div className="rounded-2xl bg-white/[0.02] border border-orange-500/20 p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-orange-400">How This Works (Quick Guide)</h3>
                    <button onClick={() => setShowSetupGuide(false)} className="text-gray-500 hover:text-gray-300">&times;</button>
                  </div>

                  <div className="space-y-4 text-sm text-gray-300">
                    <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                      <h4 className="font-medium text-white mb-2">What is this page for?</h4>
                      <p className="text-gray-400 leading-relaxed">
                        This is where you connect your email accounts so the system can send campaigns from them.
                        Think of it like adding your email accounts to a mail app — you give us the login details, and we
                        handle sending your campaigns automatically.
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                      <h4 className="font-medium text-white mb-2">Why multiple accounts?</h4>
                      <p className="text-gray-400 leading-relaxed">
                        Sending too many emails from one account can trigger spam filters. By spreading sends across
                        multiple accounts, each account sends fewer emails per day, which keeps your emails landing in
                        inboxes instead of spam folders. The system automatically rotates between your accounts.
                      </p>
                    </div>

                    <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                      <h4 className="font-medium text-white mb-2">What is warmup?</h4>
                      <p className="text-gray-400 leading-relaxed">
                        New email accounts have no reputation yet. If you suddenly blast 100 emails, email providers like
                        Gmail will flag you as spam. Warmup means starting slow (5 emails/day) and gradually increasing
                        over weeks. The system handles this automatically — just add your accounts and it takes care of the rest.
                      </p>
                      <div className="mt-3 grid grid-cols-5 gap-2">
                        {Object.entries(EMAIL_PROVIDERS).length > 0 && [
                          { phase: 1, limit: 5, days: 'Day 1-7' },
                          { phase: 2, limit: 15, days: 'Day 8-14' },
                          { phase: 3, limit: 30, days: 'Day 15-28' },
                          { phase: 4, limit: 50, days: 'Day 29-42' },
                          { phase: 5, limit: 100, days: 'Day 43+' },
                        ].map(p => (
                          <div key={p.phase} className="text-center p-2 rounded-lg bg-white/[0.03]">
                            <div className="text-orange-400 font-semibold">{p.limit}/day</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{p.days}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                      <h4 className="font-medium text-white mb-2">What do I need to add an account?</h4>
                      <p className="text-gray-400 leading-relaxed mb-3">
                        You need 3 things from each email account you want to connect:
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-start gap-3">
                          <span className="flex-none w-6 h-6 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center text-xs font-bold">1</span>
                          <div>
                            <span className="text-white font-medium">Your email address</span>
                            <p className="text-gray-500 text-xs mt-0.5">The full email like chase@blokblok.com</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="flex-none w-6 h-6 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center text-xs font-bold">2</span>
                          <div>
                            <span className="text-white font-medium">Your email provider</span>
                            <p className="text-gray-500 text-xs mt-0.5">Google Workspace, Gmail, Outlook, etc. — we&apos;ll auto-fill the server settings</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="flex-none w-6 h-6 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center text-xs font-bold">3</span>
                          <div>
                            <span className="text-white font-medium">An app password</span>
                            <p className="text-gray-500 text-xs mt-0.5">NOT your regular login password. This is a special password your email provider generates for apps. The setup wizard will show you exactly how to get one.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { setShowSetupGuide(false); setSelectedProvider(''); setShowAddAccount(true); }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm"
                  >
                    Got it — Add My First Account
                  </button>
                </div>
              )}

              {accounts.length === 0 && !showSetupGuide ? (
                <div className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 mx-auto mb-4 flex items-center justify-center">
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-orange-400"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <p className="text-gray-300 font-medium mb-2">No email accounts connected yet</p>
                  <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                    Connect your email accounts here so the system can send campaigns from them.
                    The system will automatically spread sends across your accounts and warm them up gradually.
                  </p>
                  <div className="flex flex-col items-center gap-2 mt-6">
                    <button
                      onClick={() => { setSelectedProvider(''); setShowAddAccount(true); }}
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium"
                    >
                      + Add Your First Account
                    </button>
                    <button
                      onClick={() => setShowSetupGuide(true)}
                      className="text-xs text-gray-500 hover:text-orange-400 transition-colors"
                    >
                      Not sure how? Read the setup guide first
                    </button>
                  </div>
                </div>
              ) : accounts.length > 0 && (
                <div className="space-y-3">
                  {accounts.map(acc => (
                    <div key={acc.id} className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold">{acc.label}</h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                              Phase {acc.warmupPhase}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              acc.healthScore >= 70 ? 'bg-green-500/10 text-green-400' :
                              acc.healthScore >= 40 ? 'bg-yellow-500/10 text-yellow-400' :
                              'bg-red-500/10 text-red-400'
                            }`}>
                              {acc.healthScore}% health
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{acc.email} &middot; Day {acc.daysSinceStart} &middot; {acc.totalSent} total sent</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => testConnection(acc.id)}
                            disabled={testingConnection === acc.id}
                            className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-gray-400 hover:text-white hover:border-white/10 disabled:opacity-40"
                          >
                            {testingConnection === acc.id ? 'Testing...' : 'Test Connection'}
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('Delete this sending account?')) return;
                              await fetch(`/api/admin/accounts?id=${acc.id}`, { method: 'DELETE', headers: headers() });
                              fetchAccounts();
                            }}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </div>

                      {/* Connection test results */}
                      {connectionResults[acc.id] && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className={`rounded-lg p-3 border ${connectionResults[acc.id].smtp.success ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-2 h-2 rounded-full ${connectionResults[acc.id].smtp.success ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-xs font-medium">SMTP</span>
                            </div>
                            <p className="text-[10px] text-gray-400">
                              {connectionResults[acc.id].smtp.success ? `Connected (${connectionResults[acc.id].smtp.latency}ms)` : connectionResults[acc.id].smtp.error?.slice(0, 60)}
                            </p>
                          </div>
                          <div className={`rounded-lg p-3 border ${connectionResults[acc.id].imap.success ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-2 h-2 rounded-full ${connectionResults[acc.id].imap.success ? 'bg-green-500' : 'bg-yellow-500'}`} />
                              <span className="text-xs font-medium">IMAP</span>
                            </div>
                            <p className="text-[10px] text-gray-400">
                              {connectionResults[acc.id].imap.success ? `Connected (${connectionResults[acc.id].imap.latency}ms)` : connectionResults[acc.id].imap.error?.slice(0, 60) || 'Not configured'}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Today: {acc.sentToday}/{acc.dailyLimit}</span>
                            <span className="text-gray-500">{acc.phaseLabel}</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                              style={{ width: `${Math.min((acc.sentToday / acc.dailyLimit) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add account modal — guided setup */}
              {showAddAccount && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowAddAccount(false)}>
                  <div className="w-full max-w-lg bg-[#161616] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <h3 className="font-semibold text-lg mb-1">Add Email Account</h3>
                    <p className="text-xs text-gray-500 mb-5">Connect an email account so we can send campaigns from it</p>

                    <div className="space-y-5">
                      {/* Step 1: Nickname */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Nickname</label>
                        <p className="text-[11px] text-gray-500 mb-2">A friendly name so you can tell your accounts apart (e.g. &quot;Chase - Main&quot; or &quot;Marketing Account&quot;)</p>
                        <input
                          placeholder="e.g. Chase - Blokblok"
                          value={newAccount.label}
                          onChange={e => setNewAccount(p => ({ ...p, label: e.target.value }))}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
                        />
                      </div>

                      {/* Step 2: Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                        <p className="text-[11px] text-gray-500 mb-2">The email address you want to send campaigns from</p>
                        <input
                          placeholder="e.g. chase@blokblok.com"
                          type="email"
                          value={newAccount.email}
                          onChange={e => setNewAccount(p => ({ ...p, email: e.target.value }))}
                          className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
                        />
                      </div>

                      {/* Step 3: Provider */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Provider</label>
                        <p className="text-[11px] text-gray-500 mb-2">Where is this email hosted? This auto-fills the server settings for you.</p>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(EMAIL_PROVIDERS).map(([key, provider]) => (
                            <button
                              key={key}
                              onClick={() => {
                                setSelectedProvider(key);
                                if (provider.smtpHost) {
                                  setNewAccount(p => ({ ...p, smtpHost: provider.smtpHost, smtpPort: provider.smtpPort }));
                                }
                              }}
                              className={`p-3 rounded-xl border text-left text-sm transition-all ${
                                selectedProvider === key
                                  ? 'border-orange-500/50 bg-orange-500/10 text-orange-300'
                                  : 'border-white/5 bg-white/[0.02] text-gray-400 hover:border-white/10'
                              }`}
                            >
                              {provider.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Provider-specific instructions */}
                      {selectedProvider && (
                        <div className="rounded-xl bg-orange-500/5 border border-orange-500/15 p-4">
                          <h4 className="text-sm font-medium text-orange-400 mb-3">
                            How to get your app password {selectedProvider !== 'custom' ? `(${EMAIL_PROVIDERS[selectedProvider].label})` : ''}
                          </h4>
                          <ol className="space-y-2">
                            {EMAIL_PROVIDERS[selectedProvider].instructions.map((step, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-xs text-gray-400">
                                <span className="flex-none w-5 h-5 rounded-full bg-orange-500/15 text-orange-400 flex items-center justify-center text-[10px] font-bold mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Step 4: Server settings (auto-filled or manual) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Server Settings</label>
                        {selectedProvider && selectedProvider !== 'custom' ? (
                          <p className="text-[11px] text-green-400 mb-2">Auto-filled based on your email provider. You probably don&apos;t need to change these.</p>
                        ) : (
                          <p className="text-[11px] text-gray-500 mb-2">
                            Your email provider&apos;s outgoing mail server. Look for &quot;Outgoing Server&quot; or &quot;SMTP&quot; in your email provider&apos;s settings/help page.
                          </p>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-2">
                            <input
                              placeholder="Mail server address"
                              value={newAccount.smtpHost}
                              onChange={e => setNewAccount(p => ({ ...p, smtpHost: e.target.value }))}
                              className={`w-full bg-white/[0.03] border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30 ${
                                selectedProvider && selectedProvider !== 'custom' ? 'border-green-500/20' : 'border-white/5'
                              }`}
                            />
                            <p className="text-[10px] text-gray-600 mt-1">Server address</p>
                          </div>
                          <div>
                            <input
                              placeholder="587"
                              type="number"
                              value={newAccount.smtpPort}
                              onChange={e => setNewAccount(p => ({ ...p, smtpPort: parseInt(e.target.value) || 587 }))}
                              className={`w-full bg-white/[0.03] border rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30 ${
                                selectedProvider && selectedProvider !== 'custom' ? 'border-green-500/20' : 'border-white/5'
                              }`}
                            />
                            <p className="text-[10px] text-gray-600 mt-1">Port (usually 587)</p>
                          </div>
                        </div>
                      </div>

                      {/* Step 5: Login credentials */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Login Details</label>
                        <p className="text-[11px] text-gray-500 mb-2">
                          The username is usually your full email address. The password is the <strong className="text-orange-400">app password</strong> you generated above — NOT your regular email login password.
                        </p>
                        <div className="space-y-2">
                          <div>
                            <input
                              placeholder="Login email (usually same as your email above)"
                              value={newAccount.smtpUser}
                              onChange={e => setNewAccount(p => ({ ...p, smtpUser: e.target.value }))}
                              className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
                            />
                            <p className="text-[10px] text-gray-600 mt-1">Usually your full email address (e.g. chase@blokblok.com)</p>
                          </div>
                          <div>
                            <input
                              placeholder="App password (the one you just generated)"
                              type="password"
                              value={newAccount.smtpPass}
                              onChange={e => setNewAccount(p => ({ ...p, smtpPass: e.target.value }))}
                              className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
                            />
                            <p className="text-[10px] text-gray-600 mt-1">The 16-character app password — NOT your regular login password</p>
                          </div>
                        </div>
                      </div>

                      {/* Step 6: IMAP Settings for Reply Tracking */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Reply Tracking (IMAP) — Optional</label>
                        <p className="text-[11px] text-gray-500 mb-2">
                          Enable reply tracking to automatically detect when leads respond. The system checks your inbox and updates lead status to &quot;replied&quot;.
                        </p>
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                              <input
                                placeholder={selectedProvider && selectedProvider !== 'custom' ? EMAIL_PROVIDERS[selectedProvider]?.smtpHost?.replace('smtp', 'imap') || 'IMAP server' : 'imap.your-provider.com'}
                                value={newAccount.imapHost}
                                onChange={e => setNewAccount(p => ({ ...p, imapHost: e.target.value }))}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
                              />
                              <p className="text-[10px] text-gray-600 mt-1">IMAP server (e.g. imap.gmail.com)</p>
                            </div>
                            <div>
                              <input
                                placeholder="993"
                                type="number"
                                value={newAccount.imapPort}
                                onChange={e => setNewAccount(p => ({ ...p, imapPort: parseInt(e.target.value) || 993 }))}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
                              />
                              <p className="text-[10px] text-gray-600 mt-1">Port (usually 993)</p>
                            </div>
                          </div>
                          <input
                            placeholder="IMAP login (usually same email)"
                            value={newAccount.imapUser}
                            onChange={e => setNewAccount(p => ({ ...p, imapUser: e.target.value }))}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
                          />
                          <input
                            placeholder="IMAP password (same app password)"
                            type="password"
                            value={newAccount.imapPass}
                            onChange={e => setNewAccount(p => ({ ...p, imapPass: e.target.value }))}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
                          />
                          <p className="text-[10px] text-gray-500">All passwords are encrypted with AES-256-GCM before storage</p>
                        </div>
                      </div>

                      {/* Step 7: Send Window */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Send Window (UTC)</label>
                        <p className="text-[11px] text-gray-500 mb-2">
                          Only send emails during these hours. Emails outside this window are held until the next window opens.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <select
                              value={newAccount.sendWindowStart}
                              onChange={e => setNewAccount(p => ({ ...p, sendWindowStart: parseInt(e.target.value) }))}
                              className="w-full appearance-none bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-orange-500/30 cursor-pointer"
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i}>{i.toString().padStart(2, '0')}:00 UTC</option>
                              ))}
                            </select>
                            <p className="text-[10px] text-gray-600 mt-1">Start time</p>
                          </div>
                          <div>
                            <select
                              value={newAccount.sendWindowEnd}
                              onChange={e => setNewAccount(p => ({ ...p, sendWindowEnd: parseInt(e.target.value) }))}
                              className="w-full appearance-none bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-orange-500/30 cursor-pointer"
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i}>{i.toString().padStart(2, '0')}:00 UTC</option>
                              ))}
                            </select>
                            <p className="text-[10px] text-gray-600 mt-1">End time</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-6">
                      <button
                        onClick={async () => {
                          if (!newAccount.email || !newAccount.smtpHost || !newAccount.smtpUser || !newAccount.smtpPass) {
                            showToast('error', 'Please fill in all fields'); return;
                          }
                          const payload = { ...newAccount, label: newAccount.label || newAccount.email };
                          const res = await fetch('/api/admin/accounts', { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
                          const data = await res.json();
                          if (!res.ok) { showToast('error', data.error); return; }
                          showToast('success', 'Account connected — passwords encrypted at rest');
                          setShowAddAccount(false);
                          setSelectedProvider('');
                          setNewAccount({ email: '', smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', label: '', imapHost: '', imapPort: 993, imapUser: '', imapPass: '', sendWindowStart: 8, sendWindowEnd: 18 });
                          fetchAccounts();
                        }}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm"
                      >
                        Connect Account
                      </button>
                      <button
                        onClick={() => { setShowAddAccount(false); setSelectedProvider(''); }}
                        className="px-6 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-gray-400 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SEQUENCES TAB ── */}
          {tab === 'sequences' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Email Sequences</h2>
                  <p className="text-sm text-gray-500 mt-1">Multi-step drip campaigns</p>
                </div>
                <button
                  onClick={() => setShowCreateSeq(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium"
                >
                  + New Sequence
                </button>
              </div>

              {sequences.length === 0 && !showCreateSeq ? (
                <div className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/5">
                  <p className="text-gray-500 mb-2">No sequences yet</p>
                  <p className="text-xs text-gray-600">Create a multi-step email sequence to nurture leads automatically</p>
                  <button onClick={() => setShowCreateSeq(true)} className="mt-4 text-sm text-orange-400">Create your first sequence</button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sequences.map(seq => (
                    <div key={seq.id} className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">{seq.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${seq.active ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
                              {seq.active ? 'Active' : 'Paused'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {seq.steps.length} steps &middot; {seq.enrolledCount} enrolled &middot; {seq.activeCount} active &middot; {seq.completedCount} completed
                            {seq.autoEnroll && <span className="text-green-400 ml-1">&middot; Auto-enrolling new leads</span>}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={async () => {
                              await fetch('/api/admin/sequences', {
                                method: 'PATCH',
                                headers: headers(),
                                body: JSON.stringify({ id: seq.id, active: !seq.active }),
                              });
                              fetchSequences();
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.03] border border-white/5 text-gray-400 hover:text-white"
                          >
                            {seq.active ? 'Pause' : 'Resume'}
                          </button>
                          <button
                            onClick={async () => {
                              await fetch('/api/admin/sequences', {
                                method: 'PATCH',
                                headers: headers(),
                                body: JSON.stringify({ id: seq.id, autoEnroll: !seq.autoEnroll }),
                              });
                              fetchSequences();
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs ${
                              seq.autoEnroll
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-white/[0.03] border border-white/5 text-gray-400 hover:text-white'
                            }`}
                          >
                            {seq.autoEnroll ? '\u2605 Auto-Enroll ON' : 'Auto-Enroll'}
                          </button>
                          <button
                            onClick={async () => {
                              if (selectedLeadIds.size === 0) {
                                showToast('error', 'Select leads in the Leads tab first');
                                return;
                              }
                              const res = await fetch('/api/admin/sequences', {
                                method: 'PATCH',
                                headers: headers(),
                                body: JSON.stringify({ id: seq.id, action: 'enroll', leadIds: [...selectedLeadIds] }),
                              });
                              const data = await res.json();
                              if (res.ok) showToast('success', `Enrolled ${data.enrolled} leads`);
                              fetchSequences();
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                          >
                            Enroll Selected ({selectedLeadIds.size})
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('Delete this sequence?')) return;
                              await fetch(`/api/admin/sequences?id=${seq.id}`, { method: 'DELETE', headers: headers() });
                              fetchSequences();
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                          >
                            <IconTrash />
                          </button>
                        </div>
                      </div>
                      {/* Steps timeline */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {seq.steps.map((step, i) => (
                          <div key={step.id} className="flex items-center gap-2 flex-shrink-0">
                            <div className="rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3 min-w-[180px]">
                              <p className="text-xs text-orange-400 font-medium mb-1">
                                Step {step.order} {step.delayDays > 0 ? `(+${step.delayDays}d)` : '(immediate)'}
                              </p>
                              <p className="text-sm truncate">{step.subject}</p>
                            </div>
                            {i < seq.steps.length - 1 && (
                              <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Create sequence modal */}
              {showCreateSeq && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => { setShowCreateSeq(false); setNewSeqAutoEnroll(false); }}>
                  <div className="w-full max-w-2xl bg-[#161616] border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-white/5">
                      <h3 className="font-semibold">Create Email Sequence</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <input
                        placeholder="Sequence name (e.g. New Lead Nurture)"
                        value={newSeqName}
                        onChange={e => setNewSeqName(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
                      />
                      <label className="flex items-center gap-3 py-2">
                        <input
                          type="checkbox"
                          checked={newSeqAutoEnroll}
                          onChange={e => setNewSeqAutoEnroll(e.target.checked)}
                          className="w-4 h-4 rounded border-white/10 bg-white/[0.03] text-orange-500 focus:ring-orange-500/30"
                        />
                        <div>
                          <span className="text-sm text-gray-300">Auto-enroll new leads</span>
                          <p className="text-xs text-gray-600">New funnel submissions will automatically join this sequence</p>
                        </div>
                      </label>
                      {newSeqSteps.map((step, i) => (
                        <div key={i} className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-orange-400">Step {i + 1}</span>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-500">Delay:</label>
                              <input
                                type="number"
                                min="0"
                                value={step.delayDays}
                                onChange={e => {
                                  const s = [...newSeqSteps];
                                  s[i].delayDays = parseInt(e.target.value) || 0;
                                  setNewSeqSteps(s);
                                }}
                                className="w-16 bg-white/[0.03] border border-white/5 rounded-lg px-2 py-1 text-sm text-white text-center"
                              />
                              <span className="text-xs text-gray-500">days</span>
                              {newSeqSteps.length > 1 && (
                                <button onClick={() => setNewSeqSteps(s => s.filter((_, j) => j !== i))} className="p-1 text-gray-500 hover:text-red-400"><IconX /></button>
                              )}
                            </div>
                          </div>
                          {savedTemplates.length > 0 && (
                            <select
                              onChange={e => {
                                const tpl = savedTemplates.find(t => t.id === e.target.value);
                                if (tpl) {
                                  const s = [...newSeqSteps];
                                  s[i].subject = tpl.subject;
                                  s[i].body = tpl.body;
                                  setNewSeqSteps(s);
                                }
                              }}
                              value=""
                              className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-400 focus:outline-none focus:border-orange-500/30"
                            >
                              <option value="">Load from template...</option>
                              {savedTemplates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                              ))}
                            </select>
                          )}
                          <input
                            placeholder="Subject line"
                            value={step.subject}
                            onChange={e => { const s = [...newSeqSteps]; s[i].subject = e.target.value; setNewSeqSteps(s); }}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
                          />
                          <textarea
                            placeholder="Email body (HTML, supports {{name}}, {{field}}, etc.)"
                            rows={4}
                            value={step.body}
                            onChange={e => { const s = [...newSeqSteps]; s[i].body = e.target.value; setNewSeqSteps(s); }}
                            className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30 font-mono resize-y"
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => setNewSeqSteps(s => [...s, { subject: '', body: '', delayDays: 2 }])}
                        className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20"
                      >
                        + Add Step
                      </button>
                    </div>
                    <div className="p-6 border-t border-white/5 flex gap-2">
                      <button
                        onClick={async () => {
                          if (!newSeqName || newSeqSteps.some(s => !s.subject || !s.body)) {
                            showToast('error', 'Fill in all step subjects and bodies');
                            return;
                          }
                          const res = await fetch('/api/admin/sequences', {
                            method: 'POST',
                            headers: headers(),
                            body: JSON.stringify({ name: newSeqName, steps: newSeqSteps, autoEnroll: newSeqAutoEnroll }),
                          });
                          if (res.ok) {
                            showToast('success', 'Sequence created!');
                            setShowCreateSeq(false);
                            setNewSeqName('');
                            setNewSeqSteps([{ subject: '', body: '', delayDays: 0 }]);
                            setNewSeqAutoEnroll(false);
                            fetchSequences();
                          } else {
                            const data = await res.json();
                            showToast('error', data.error);
                          }
                        }}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold"
                      >
                        Create Sequence
                      </button>
                      <button onClick={() => { setShowCreateSeq(false); setNewSeqAutoEnroll(false); }} className="px-6 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-gray-400">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ANALYTICS TAB ── */}
          {tab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Email Analytics</h2>
                  <p className="text-sm text-gray-500 mt-1">Track every email event across your campaigns</p>
                </div>
                <button
                  onClick={() => fetchEvents(1, eventsFilter, eventsLeadFilter)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-gray-400 hover:text-white"
                >
                  <IconRefresh />
                  Refresh
                </button>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { type: 'sent', label: 'Sent', color: 'from-blue-500 to-cyan-500' },
                  { type: 'bounced', label: 'Bounced', color: 'from-red-500 to-orange-500' },
                  { type: 'opened', label: 'Opened', color: 'from-green-500 to-emerald-500' },
                  { type: 'clicked', label: 'Clicked', color: 'from-purple-500 to-pink-500' },
                  { type: 'replied', label: 'Replied', color: 'from-orange-500 to-yellow-500' },
                  { type: 'unsubscribed', label: 'Unsubscribed', color: 'from-gray-500 to-gray-400' },
                ].map(s => (
                  <div key={s.type} className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className={`text-2xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                      {eventsSummary[s.type] || 0}
                    </p>
                  </div>
                ))}
              </div>

              {/* Rates */}
              {(eventsSummary.sent || 0) > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Bounce Rate', value: ((eventsSummary.bounced || 0) / (eventsSummary.sent || 1) * 100).toFixed(1) + '%', bad: ((eventsSummary.bounced || 0) / (eventsSummary.sent || 1)) > 0.05 },
                    { label: 'Open Rate', value: ((eventsSummary.opened || 0) / (eventsSummary.sent || 1) * 100).toFixed(1) + '%', bad: false },
                    { label: 'Click Rate', value: ((eventsSummary.clicked || 0) / (eventsSummary.sent || 1) * 100).toFixed(1) + '%', bad: false },
                    { label: 'Reply Rate', value: ((eventsSummary.replied || 0) / (eventsSummary.sent || 1) * 100).toFixed(1) + '%', bad: false },
                  ].map(r => (
                    <div key={r.label} className="rounded-xl bg-white/[0.02] border border-white/5 p-4 text-center">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{r.label}</p>
                      <p className={`text-lg font-bold ${r.bad ? 'text-red-400' : 'text-gray-200'}`}>{r.value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={eventsFilter}
                  onChange={e => { setEventsFilter(e.target.value); fetchEvents(1, e.target.value, eventsLeadFilter); }}
                  className="appearance-none bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-orange-500/30 cursor-pointer"
                >
                  <option value="all">All Events</option>
                  <option value="sent">Sent</option>
                  <option value="bounced">Bounced</option>
                  <option value="opened">Opened</option>
                  <option value="clicked">Clicked</option>
                  <option value="replied">Replied</option>
                  <option value="unsubscribed">Unsubscribed</option>
                </select>
                <div className="flex-1 relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                    <IconSearch />
                  </div>
                  <input
                    type="text"
                    placeholder="Filter by lead email..."
                    value={eventsLeadFilter}
                    onChange={e => setEventsLeadFilter(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const lead = leads.find(l => l.email.toLowerCase().includes(eventsLeadFilter.toLowerCase()));
                        fetchEvents(1, eventsFilter, lead?.id || '');
                      }
                    }}
                    className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
                  />
                </div>
              </div>

              {/* Events table */}
              {events.length === 0 ? (
                <div className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="w-16 h-16 rounded-full bg-orange-500/10 mx-auto mb-4 flex items-center justify-center">
                    <IconEye />
                  </div>
                  <p className="text-gray-300 font-medium mb-2">No events recorded yet</p>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Email events will appear here as campaigns are sent. Track sends, bounces, opens, clicks, and replies.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/[0.03] border-b border-white/5">
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">Type</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">Lead</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">Details</th>
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {events.map(ev => {
                          const lead = leads.find(l => l.id === ev.leadId);
                          return (
                            <tr key={ev.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                              <td className="px-4 py-3">
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                  ev.type === 'sent' ? 'bg-blue-500/10 text-blue-400' :
                                  ev.type === 'bounced' ? 'bg-red-500/10 text-red-400' :
                                  ev.type === 'opened' ? 'bg-green-500/10 text-green-400' :
                                  ev.type === 'clicked' ? 'bg-purple-500/10 text-purple-400' :
                                  ev.type === 'replied' ? 'bg-orange-500/10 text-orange-400' :
                                  ev.type === 'unsubscribed' ? 'bg-gray-500/10 text-gray-400' :
                                  'bg-white/5 text-gray-400'
                                }`}>
                                  {ev.type}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {lead ? (
                                  <div>
                                    <p className="text-sm text-gray-200">{lead.name}</p>
                                    <p className="text-xs text-gray-500">{lead.email}</p>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-500 font-mono">{ev.leadId.slice(0, 12)}...</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs text-gray-400">{ev.details || '—'}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs text-gray-500">{new Date(ev.createdAt).toLocaleString()}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {eventsTotalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
                      <p className="text-xs text-gray-500">
                        Showing {(eventsPage - 1) * 50 + 1}-{Math.min(eventsPage * 50, eventsTotal)} of {eventsTotal} events
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { const p = eventsPage - 1; if (p >= 1) { setEventsPage(p); fetchEvents(p, eventsFilter, eventsLeadFilter); } }}
                          disabled={eventsPage <= 1}
                          className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.03] border border-white/5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <span className="text-xs text-gray-500">Page {eventsPage} of {eventsTotalPages}</span>
                        <button
                          onClick={() => { const p = eventsPage + 1; if (p <= eventsTotalPages) { setEventsPage(p); fetchEvents(p, eventsFilter, eventsLeadFilter); } }}
                          disabled={eventsPage >= eventsTotalPages}
                          className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.03] border border-white/5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Campaign Performance Comparison */}
              {campaignAnalytics.length > 0 && (
                <div className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                  <div className="p-4 border-b border-white/5">
                    <h3 className="font-semibold">Campaign Performance</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/[0.03] border-b border-white/5">
                          <th className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">Campaign</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium uppercase tracking-wider">Sent</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium uppercase tracking-wider">Open %</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium uppercase tracking-wider">Click %</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium uppercase tracking-wider">Reply %</th>
                          <th className="px-4 py-3 text-right text-xs text-gray-500 font-medium uppercase tracking-wider">Bounce %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaignAnalytics.map(c => (
                          <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="px-4 py-3 text-gray-200 truncate max-w-[200px]">{c.subject}</td>
                            <td className="px-4 py-3 text-right text-gray-400">{c.sentTo}</td>
                            <td className="px-4 py-3 text-right text-blue-400">{c.openRate}%</td>
                            <td className="px-4 py-3 text-right text-purple-400">{c.clickRate}%</td>
                            <td className="px-4 py-3 text-right text-orange-400">{c.replyRate}%</td>
                            <td className="px-4 py-3 text-right text-red-400">{c.bounceRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── WARMUP TAB ── */}
          {tab === 'warmup' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold">Warmup Dashboard</h2>
                <p className="text-sm text-gray-500 mt-1">Monitor your email sending accounts and domain health</p>
              </div>

              {accounts.length === 0 ? (
                <div className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/5">
                  <p className="text-gray-500 mb-2">No accounts to monitor</p>
                  <button onClick={() => setTab('accounts')} className="text-sm text-orange-400">Add sending accounts first</button>
                </div>
              ) : (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Total Accounts</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{accounts.length}</p>
                    </div>
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Sent Today</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">{accounts.reduce((s, a) => s + a.sentToday, 0)}</p>
                      <p className="text-xs text-gray-600 mt-1">of {accounts.reduce((s, a) => s + a.dailyLimit, 0)} daily limit</p>
                    </div>
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Avg Health</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                        {accounts.length > 0 ? Math.round(accounts.reduce((s, a) => s + a.healthScore, 0) / accounts.length) : 0}%
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
                      <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">All-Time Sent</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">{accounts.reduce((s, a) => s + a.totalSent, 0)}</p>
                    </div>
                  </div>

                  {/* Per-account warmup detail */}
                  {accounts.map(acc => (
                    <div key={acc.id} className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{acc.label}</h3>
                          <p className="text-xs text-gray-500">{acc.email} &middot; Day {acc.daysSinceStart}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400">{acc.phaseLabel}</span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            acc.healthScore >= 70 ? 'bg-green-500/10 text-green-400' :
                            acc.healthScore >= 40 ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-red-500/10 text-red-400'
                          }`}>
                            {acc.healthScore}% health
                          </span>
                        </div>
                      </div>

                      {/* Daily limit bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Today: {acc.sentToday} / {acc.dailyLimit} emails</span>
                          <span className="text-gray-500">{Math.round((acc.sentToday / acc.dailyLimit) * 100)}% used</span>
                        </div>
                        <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              acc.sentToday / acc.dailyLimit > 0.9 ? 'bg-red-500' :
                              acc.sentToday / acc.dailyLimit > 0.7 ? 'bg-yellow-500' :
                              'bg-gradient-to-r from-green-500 to-emerald-500'
                            }`}
                            style={{ width: `${Math.min((acc.sentToday / acc.dailyLimit) * 100, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* 14-day volume chart */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Send volume (last 14 days)</p>
                        <div className="flex items-end gap-1 h-16">
                          {Array.from({ length: 14 }, (_, i) => {
                            const d = new Date();
                            d.setDate(d.getDate() - (13 - i));
                            const dateStr = d.toISOString().slice(0, 10);
                            const log = acc.dailyLogs.find(l => l.date === dateStr);
                            const sent = log?.sent || 0;
                            const maxSent = Math.max(...acc.dailyLogs.map(l => l.sent), 1);
                            const height = sent > 0 ? Math.max((sent / maxSent) * 100, 8) : 4;
                            return (
                              <div key={dateStr} className="flex-1 flex flex-col items-center gap-1" title={`${dateStr}: ${sent} sent`}>
                                <div
                                  className={`w-full rounded-sm transition-all ${sent > 0 ? 'bg-gradient-to-t from-orange-500 to-orange-400' : 'bg-white/5'}`}
                                  style={{ height: `${height}%` }}
                                />
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                          <span>14d ago</span>
                          <span>Today</span>
                        </div>
                      </div>

                      {/* Warmup phases — progression from Phase 1 (5/day) → Phase 5 (100/day) */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-gray-500">Warmup Progress</span>
                          <span className="text-[10px] text-orange-400 font-medium">Phase {acc.warmupPhase} — {acc.dailyLimit}/day</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(phase => (
                            <div
                              key={phase}
                              className={`flex-1 h-2 rounded-full relative ${
                                phase <= acc.warmupPhase ? 'bg-orange-500' : 'bg-white/5'
                              }`}
                            >
                              {phase === acc.warmupPhase && (
                                <div className="absolute -top-0.5 right-0 w-3 h-3 rounded-full bg-orange-400 border-2 border-[#0a0a0a]" />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                          <span>5/day</span>
                          <span>15</span>
                          <span>30</span>
                          <span>50</span>
                          <span>100/day</span>
                        </div>
                      </div>

                      {/* Warmup controls */}
                      {warmupData.find(w => w.id === acc.id) && (() => {
                        const wd = warmupData.find(w => w.id === acc.id)!;
                        return (
                          <div className="mt-4 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-sm font-medium">Email Warmup</p>
                                <p className="text-[11px] text-gray-500">Sends warmup emails between your accounts to build reputation</p>
                              </div>
                              <button
                                onClick={async () => {
                                  await fetch('/api/admin/warmup', {
                                    method: 'PATCH',
                                    headers: headers(),
                                    body: JSON.stringify({ id: acc.id, warmupEnabled: !wd.warmupEnabled }),
                                  });
                                  fetchWarmupData();
                                  fetchAccounts();
                                }}
                                className={`relative w-11 h-6 rounded-full transition-colors ${wd.warmupEnabled ? 'bg-green-500' : 'bg-white/10'}`}
                              >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${wd.warmupEnabled ? 'translate-x-5' : ''}`} />
                              </button>
                            </div>
                            {wd.warmupEnabled && (
                              <div className="grid grid-cols-3 gap-3 text-xs">
                                <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                                  <p className="text-gray-500 mb-1">Daily Warmup</p>
                                  <p className="text-lg font-bold text-orange-400">{wd.warmupDaily}</p>
                                </div>
                                <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                                  <p className="text-gray-500 mb-1">Inbox Rate</p>
                                  <p className={`text-lg font-bold ${wd.stats.inboxRate >= 80 ? 'text-green-400' : wd.stats.inboxRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{wd.stats.inboxRate}%</p>
                                </div>
                                <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                                  <p className="text-gray-500 mb-1">Total Warmup</p>
                                  <p className="text-lg font-bold text-blue-400">{wd.stats.totalWarmupSent}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── DOMAINS TAB ── */}
          {tab === 'domains' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Domain Manager</h2>
                  <p className="text-sm text-gray-500 mt-1">Configure DNS records for your sending domains — SPF, DKIM, DMARC</p>
                </div>
                <button
                  onClick={() => { setNewDomainName(''); setShowAddDomain(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium"
                >
                  + Add Domain
                </button>
              </div>

              {domains.length === 0 ? (
                <div className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/5">
                  <p className="text-gray-500 mb-2">No domains added yet</p>
                  <p className="text-xs text-gray-600">Add your sending domains to generate DNS records and verify setup</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {domains.map(domain => {
                    const checkResult = domain.lastCheckResult ? JSON.parse(domain.lastCheckResult) : null;
                    return (
                      <div key={domain.id} className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-lg">{domain.name}</h3>
                            <span className={`text-xs px-2.5 py-1 rounded-full ${domain.verified ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                              {domain.verified ? 'Verified' : 'Not Verified'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => {
                                showToast('success', 'Checking DNS records...');
                                const res = await fetch('/api/admin/domains', {
                                  method: 'POST',
                                  headers: headers(),
                                  body: JSON.stringify({ action: 'check', domainId: domain.id }),
                                });
                                const data = await res.json();
                                if (res.ok) {
                                  setDnsCheckResult(data.results);
                                  showToast(data.allPass ? 'success' : 'error', data.allPass ? 'All DNS records verified!' : 'Some records missing — check below');
                                  fetchDomains();
                                }
                              }}
                              className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 text-sm hover:bg-blue-500/20"
                            >
                              Check DNS
                            </button>
                            <button
                              onClick={() => checkBlacklist(domain.name)}
                              disabled={checkingBlacklist}
                              className="px-4 py-2 rounded-xl bg-purple-500/10 text-purple-400 text-sm hover:bg-purple-500/20 disabled:opacity-40"
                            >
                              {checkingBlacklist ? 'Checking...' : 'Blacklist Check'}
                            </button>
                            {!domain.dkimPublicKey && (
                              <button
                                onClick={async () => {
                                  const res = await fetch('/api/admin/domains', {
                                    method: 'POST',
                                    headers: headers(),
                                    body: JSON.stringify({ action: 'generateDKIM', domainId: domain.id }),
                                  });
                                  if (res.ok) {
                                    showToast('success', 'DKIM keys generated — add the TXT record to your DNS');
                                    fetchDomains();
                                  }
                                }}
                                className="px-4 py-2 rounded-xl bg-orange-500/10 text-orange-400 text-sm hover:bg-orange-500/20"
                              >
                                Generate DKIM
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                const res = await fetch('/api/admin/domains', {
                                  method: 'POST',
                                  headers: headers(),
                                  body: JSON.stringify({ action: 'getRecords', domainId: domain.id }),
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  setDnsRecords(data.records);
                                }
                              }}
                              className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-gray-400 text-sm hover:border-white/10"
                            >
                              Show Records
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(`Delete domain ${domain.name}?`)) return;
                                await fetch(`/api/admin/domains?id=${domain.id}`, { method: 'DELETE', headers: headers() });
                                fetchDomains();
                              }}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </div>

                        {/* DNS check results */}
                        {checkResult && (
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {['spf', 'dkim', 'dmarc', 'mx'].map(key => {
                              const r = checkResult[key];
                              if (!r) return null;
                              return (
                                <div key={key} className={`rounded-xl p-3 border ${r.status === 'pass' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`w-2 h-2 rounded-full ${r.status === 'pass' ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className="text-xs font-medium uppercase">{key}</span>
                                  </div>
                                  <p className="text-[10px] text-gray-500 truncate">{r.found}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Blacklist results */}
                        {blacklistResult && blacklistResult.domain === domain.name && (
                          <div className={`mt-3 p-4 rounded-xl border ${blacklistResult.clean ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`w-3 h-3 rounded-full ${blacklistResult.clean ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-sm font-medium">{blacklistResult.clean ? 'Clean — Not on any blacklists' : `Listed on ${blacklistResult.listedOn.length} blacklist(s)`}</span>
                              <span className="text-[10px] text-gray-500 ml-auto">IP: {blacklistResult.ip} &middot; {blacklistResult.totalChecked} lists checked</span>
                            </div>
                            {blacklistResult.listedOn.length > 0 && (
                              <div className="space-y-1.5 mt-2">
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {blacklistResult.listedOn.map((bl: any, i: number) => (
                                  <div key={i} className="flex items-center gap-2 text-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                    <span className="text-red-400">{bl.blacklist}</span>
                                    {bl.delist?.type === 'auto' ? (
                                      <span className="ml-auto px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] whitespace-nowrap" title={bl.delist.note}>
                                        {bl.delist.autoDays ? `Auto-delists ~${bl.delist.autoDays}d` : 'Auto-delists'}
                                      </span>
                                    ) : bl.delist?.type === 'manual' && bl.delist?.url ? (
                                      <a
                                        href={bl.delist.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-auto px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 text-[10px] hover:bg-orange-500/20 transition-colors whitespace-nowrap"
                                        title={bl.delist.note}
                                      >
                                        Request Delisting &rarr;
                                      </a>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {domain.lastCheckAt && (
                          <p className="text-[10px] text-gray-600 mt-3">Last checked: {new Date(domain.lastCheckAt).toLocaleString()}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* DNS Records modal */}
              {dnsRecords && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setDnsRecords(null)}>
                  <div className="w-full max-w-2xl bg-[#161616] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    <h3 className="font-semibold text-lg mb-4">DNS Records to Configure</h3>
                    <p className="text-xs text-gray-500 mb-4">Add these records in your domain registrar&apos;s DNS settings (GoDaddy, Namecheap, Cloudflare, etc.)</p>
                    <div className="space-y-4">
                      {Object.entries(dnsRecords).map(([key, record]) => (
                        <div key={key} className="rounded-xl bg-white/[0.02] border border-white/5 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-orange-400 uppercase">{key}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{record.type}</span>
                          </div>
                          <div className="space-y-1.5 text-xs">
                            <div><span className="text-gray-500">Host:</span> <code className="text-blue-400 bg-blue-500/5 px-1.5 py-0.5 rounded">{record.host}</code></div>
                            <div>
                              <span className="text-gray-500">Value:</span>
                              <code className="block mt-1 text-green-400 bg-green-500/5 px-2 py-1.5 rounded break-all text-[11px]">{record.value}</code>
                            </div>
                            <p className="text-gray-600 text-[10px] mt-1">{record.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setDnsRecords(null)} className="w-full mt-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-gray-400 text-sm">Close</button>
                  </div>
                </div>
              )}

              {/* Add domain modal */}
              {showAddDomain && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowAddDomain(false)}>
                  <div className="w-full max-w-md bg-[#161616] border border-white/10 rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h3 className="font-semibold text-lg mb-4">Add Sending Domain</h3>
                    <input
                      placeholder="e.g. outreach.yourdomain.com"
                      value={newDomainName}
                      onChange={e => setNewDomainName(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30 mb-4"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (!newDomainName.trim()) { showToast('error', 'Enter a domain name'); return; }
                          const res = await fetch('/api/admin/domains', {
                            method: 'POST',
                            headers: headers(),
                            body: JSON.stringify({ name: newDomainName.trim() }),
                          });
                          const data = await res.json();
                          if (res.ok) {
                            if (data.dnsWarnings && data.dnsWarnings.length > 0) {
                              showToast('error', `Domain added but ${data.dnsWarnings.length} DNS record(s) missing — configure them now!`);
                            } else {
                              showToast('success', 'Domain added — DNS looks good!');
                            }
                            setShowAddDomain(false);
                            setDnsRecords(data.records);
                            fetchDomains();
                          } else {
                            showToast('error', data.error);
                          }
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm"
                      >
                        Add Domain
                      </button>
                      <button onClick={() => setShowAddDomain(false)} className="px-6 py-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-gray-400 text-sm">Cancel</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── INBOX TAB ── */}
          {tab === 'inbox' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Unified Inbox</h2>
                  <p className="text-sm text-gray-500 mt-1">{inboxUnread > 0 ? `${inboxUnread} unread` : 'All caught up'} — replies auto-detected and lead status updated</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      showToast('success', 'Checking inboxes for new replies...');
                      const res = await fetch('/api/cron/check-replies', { headers: headers() });
                      const data = await res.json();
                      if (res.ok) {
                        showToast('success', data.message);
                        fetchInbox(1, inboxFilter);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 text-sm hover:bg-blue-500/20"
                  >
                    Check Now
                  </button>
                  {inboxUnread > 0 && (
                    <button
                      onClick={async () => {
                        await fetch('/api/admin/inbox', {
                          method: 'PATCH',
                          headers: headers(),
                          body: JSON.stringify({ action: 'markAllRead' }),
                        });
                        fetchInbox(1, inboxFilter);
                      }}
                      className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-gray-400 text-sm hover:border-white/10"
                    >
                      Mark All Read
                    </button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'unread', label: 'Unread' },
                  { value: 'replies', label: 'Real Replies' },
                  { value: 'auto', label: 'Auto-Replies' },
                ].map(f => (
                  <button
                    key={f.value}
                    onClick={() => { setInboxFilter(f.value); setInboxPage(1); fetchInbox(1, f.value); }}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${
                      inboxFilter === f.value
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        : 'bg-white/[0.02] text-gray-400 border border-white/5 hover:border-white/10'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {inboxMessages.length === 0 ? (
                <div className="text-center py-16 rounded-2xl bg-white/[0.02] border border-white/5">
                  <p className="text-gray-500 mb-2">No messages yet</p>
                  <p className="text-xs text-gray-600">Configure IMAP on your accounts and click &quot;Check Now&quot; to fetch replies</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {inboxMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`rounded-xl border p-4 transition-all ${
                        msg.read ? 'bg-white/[0.01] border-white/5' : 'bg-white/[0.03] border-orange-500/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {!msg.read && <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />}
                            <span className="font-medium text-sm truncate">{msg.fromEmail}</span>
                            {msg.isAutoReply && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">Auto-Reply</span>}
                            {msg.isOOO && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">OOO</span>}
                            {msg.leadId && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Lead Match</span>}
                          </div>
                          <p className="text-sm text-gray-300 mb-1">{msg.subject}</p>
                          <p className="text-xs text-gray-500 line-clamp-2">{msg.bodyPreview}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-[10px] text-gray-500">{new Date(msg.receivedAt).toLocaleString()}</span>
                          <button
                            onClick={async () => {
                              await fetch('/api/admin/inbox', {
                                method: 'PATCH',
                                headers: headers(),
                                body: JSON.stringify({
                                  action: msg.read ? 'markUnread' : 'markRead',
                                  [msg.read ? 'messageId' : 'messageIds']: msg.read ? msg.id : [msg.id],
                                }),
                              });
                              fetchInbox(inboxPage, inboxFilter);
                            }}
                            className="text-[10px] text-gray-500 hover:text-orange-400"
                          >
                            {msg.read ? 'Mark Unread' : 'Mark Read'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination */}
                  {inboxPages > 1 && (
                    <div className="flex justify-center gap-2 pt-4">
                      {Array.from({ length: inboxPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => { setInboxPage(i + 1); fetchInbox(i + 1, inboxFilter); }}
                          className={`w-8 h-8 rounded-lg text-xs ${
                            inboxPage === i + 1 ? 'bg-orange-500 text-white' : 'bg-white/[0.03] text-gray-400 hover:bg-white/5'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── PIPELINE TAB (Kanban Board) ── */}
          {tab === 'pipeline' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Sales Pipeline</h2>
                  <p className="text-sm text-gray-500 mt-1">Drag leads across stages to track your sales process</p>
                </div>
                <button onClick={fetchPipeline} className="px-4 py-2 rounded-xl bg-orange-500/10 text-orange-400 text-sm hover:bg-orange-500/20">
                  Refresh
                </button>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '70vh' }}>
                {pipelineStages.map(stage => (
                  <div
                    key={stage.id}
                    className="flex-shrink-0 w-72 bg-[#111] rounded-2xl border border-white/5 flex flex-col"
                    onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('border-orange-500/30'); }}
                    onDragLeave={e => { e.currentTarget.classList.remove('border-orange-500/30'); }}
                    onDrop={e => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-orange-500/30');
                      if (draggingLead) movePipelineLead(draggingLead, stage.id);
                      setDraggingLead(null);
                    }}
                  >
                    <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                        <span className="font-semibold text-sm">{stage.label}</span>
                      </div>
                      <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                        {(pipelineData[stage.id] || []).length}
                      </span>
                    </div>
                    <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[65vh]">
                      {(pipelineData[stage.id] || []).map(lead => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={() => setDraggingLead(lead.id)}
                          onDragEnd={() => setDraggingLead(null)}
                          className={`p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-grab active:cursor-grabbing hover:border-white/10 transition-all ${
                            draggingLead === lead.id ? 'opacity-50 scale-95' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm truncate">{lead.name}</span>
                            {leadScores[lead.id] >= 50 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">HOT</span>}
                            {leadScores[lead.id] >= 20 && leadScores[lead.id] < 50 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">WARM</span>}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{lead.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{lead.field}</span>
                            {lead.emailsSent > 0 && (
                              <span className="text-[10px] text-gray-600">{lead.emailsSent} sent</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {(pipelineData[stage.id] || []).length === 0 && (
                        <div className="text-center py-8 text-gray-600 text-xs">
                          Drop leads here
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {pipelineStages.length === 0 && (
                  <div className="w-full text-center py-20 text-gray-500">
                    <p className="text-lg mb-2">No pipeline data yet</p>
                    <p className="text-sm">Add leads and they&apos;ll appear here automatically</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {tab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Settings & Tools</h2>

              {/* Settings sub-tabs */}
              <div className="flex gap-2 flex-wrap">
                {([
                  { id: 'auto-tags' as const, label: 'Auto-Tag Rules' },
                  { id: 'dedup' as const, label: 'Deduplication' },
                  { id: 'signatures' as const, label: 'Signatures' },
                  { id: 'custom-fields' as const, label: 'Custom Fields' },
                  { id: 'saved-views' as const, label: 'Saved Views' },
                  { id: 'branching' as const, label: 'Seq. Branching' },
                ]).map(st => (
                  <button
                    key={st.id}
                    onClick={() => setSettingsTab(st.id)}
                    className={`px-4 py-2 rounded-xl text-sm transition-all ${
                      settingsTab === st.id
                        ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                        : 'bg-white/[0.02] text-gray-400 border border-white/5 hover:border-white/10'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Auto-Tag Rules */}
              {settingsTab === 'auto-tags' && (
                <div className="space-y-4">
                  <div className="bg-[#111] rounded-2xl border border-white/5 p-6">
                    <h3 className="font-semibold mb-1">Auto-Tag Rules Engine</h3>
                    <p className="text-sm text-gray-500 mb-4">Define rules to automatically tag leads based on their behavior and attributes.</p>

                    <div className="space-y-3">
                      {autoTagRules.map((rule, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white/[0.02] rounded-xl p-3 border border-white/5">
                          <select
                            value={rule.condition}
                            onChange={e => {
                              const updated = [...autoTagRules];
                              updated[i] = { ...updated[i], condition: e.target.value };
                              setAutoTagRules(updated);
                            }}
                            className="bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2 text-sm text-white"
                          >
                            <option value="reply_contains">Reply contains</option>
                            <option value="opened_gte">Opens &ge;</option>
                            <option value="clicked_gte">Clicks &ge;</option>
                            <option value="status_is">Status is</option>
                            <option value="field_is">Industry is</option>
                            <option value="bounced">Has bounced</option>
                            <option value="no_engagement">No engagement</option>
                          </select>
                          <input
                            value={rule.value}
                            onChange={e => {
                              const updated = [...autoTagRules];
                              updated[i] = { ...updated[i], value: e.target.value };
                              setAutoTagRules(updated);
                            }}
                            placeholder="Value..."
                            className="flex-1 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600"
                          />
                          <span className="text-xs text-gray-500">Tag:</span>
                          <input
                            value={rule.tag}
                            onChange={e => {
                              const updated = [...autoTagRules];
                              updated[i] = { ...updated[i], tag: e.target.value };
                              setAutoTagRules(updated);
                            }}
                            placeholder="tag-name"
                            className="w-36 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600"
                          />
                          <button
                            onClick={() => setAutoTagRules(autoTagRules.filter((_, j) => j !== i))}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                          >
                            <IconX />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={() => setAutoTagRules([...autoTagRules, { condition: 'reply_contains', value: '', tag: '' }])}
                        className="px-4 py-2 rounded-xl bg-white/[0.03] border border-white/5 text-sm text-gray-400 hover:border-white/10"
                      >
                        + Add Rule
                      </button>
                      <button
                        onClick={runAutoTags}
                        disabled={runningAutoTags || autoTagRules.length === 0}
                        className="px-6 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm disabled:opacity-40"
                      >
                        {runningAutoTags ? 'Running...' : 'Run Rules'}
                      </button>
                      {autoTagResult && (
                        <span className="text-sm text-green-400">{autoTagResult.updated} leads tagged</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Deduplication */}
              {settingsTab === 'dedup' && (
                <div className="space-y-4">
                  <div className="bg-[#111] rounded-2xl border border-white/5 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">Lead Deduplication</h3>
                        <p className="text-sm text-gray-500">Find and merge duplicate leads to keep your database clean.</p>
                      </div>
                      <button
                        onClick={fetchDedup}
                        disabled={loadingDedup}
                        className="px-4 py-2 rounded-xl bg-orange-500/10 text-orange-400 text-sm hover:bg-orange-500/20 disabled:opacity-40"
                      >
                        {loadingDedup ? 'Scanning...' : 'Scan for Duplicates'}
                      </button>
                    </div>

                    {dedupResults.length > 0 ? (
                      <div className="space-y-3">
                        {dedupResults.map((dup, i) => (
                          <div key={i} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="text-sm font-medium">{dup.domain || dup.email}</span>
                                <span className="ml-2 text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">{dup.ids.length} duplicates</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {dup.ids.map((id, j) => (
                                <div key={id} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-400">{dup.names[j] || 'Unknown'}</span>
                                  {j > 0 && (
                                    <button
                                      onClick={() => mergeDuplicates(dup.ids[0], id)}
                                      className="text-xs px-3 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                    >
                                      Merge into first
                                    </button>
                                  )}
                                  {j === 0 && (
                                    <span className="text-xs px-3 py-1 rounded-lg bg-green-500/10 text-green-400">Primary</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-600 text-sm">
                        {loadingDedup ? 'Scanning...' : 'Click "Scan for Duplicates" to find duplicate leads'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Signatures */}
              {settingsTab === 'signatures' && (
                <div className="space-y-4">
                  <div className="bg-[#111] rounded-2xl border border-white/5 p-6">
                    <h3 className="font-semibold mb-1">Email Signatures</h3>
                    <p className="text-sm text-gray-500 mb-4">Set a unique HTML signature for each sending account.</p>

                    {accounts.length > 0 ? (
                      <div className="space-y-4">
                        {accounts.map(acct => (
                          <div key={acct.id} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <span className="font-medium text-sm">{acct.label || acct.email}</span>
                                <span className="ml-2 text-xs text-gray-500">{acct.email}</span>
                              </div>
                              <button
                                onClick={() => {
                                  if (editingSigId === acct.id) {
                                    setEditingSigId(null);
                                  } else {
                                    setEditingSigId(acct.id);
                                    setSigDraft(signatures[acct.id] || '');
                                  }
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-gray-400 hover:text-white"
                              >
                                {editingSigId === acct.id ? 'Cancel' : 'Edit'}
                              </button>
                            </div>
                            {editingSigId === acct.id ? (
                              <div className="space-y-3">
                                <textarea
                                  value={sigDraft}
                                  onChange={e => setSigDraft(e.target.value)}
                                  rows={6}
                                  placeholder="<p><strong>Chase</strong><br/>Blok Blok Studio<br/>chase@blokblok.studio</p>"
                                  className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30 font-mono"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => saveSignature(acct.id, sigDraft)}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm"
                                  >
                                    Save Signature
                                  </button>
                                  <span className="text-xs text-gray-500">Supports HTML</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">
                                {signatures[acct.id] ? (
                                  <div className="bg-white/[0.02] rounded-lg p-3 text-gray-300" dangerouslySetInnerHTML={{ __html: signatures[acct.id] }} />
                                ) : (
                                  <span className="text-gray-600 italic">No signature set</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-600 text-sm">
                        Add sending accounts first to configure signatures
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Fields */}
              {settingsTab === 'custom-fields' && (
                <div className="space-y-4">
                  <div className="bg-[#111] rounded-2xl border border-white/5 p-6">
                    <h3 className="font-semibold mb-1">Custom Fields</h3>
                    <p className="text-sm text-gray-500 mb-4">Add custom fields to leads for tracking additional information.</p>

                    {customFieldDefs.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {customFieldDefs.map(field => (
                          <div key={field.name} className="flex items-center justify-between bg-white/[0.02] rounded-xl px-4 py-3 border border-white/5">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-sm">{field.name}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">{field.type}</span>
                              {field.options && (
                                <span className="text-xs text-gray-500">{field.options.join(', ')}</span>
                              )}
                            </div>
                            <button
                              onClick={() => deleteCustomField(field.name)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                            >
                              <IconX />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <input
                        value={newFieldName}
                        onChange={e => setNewFieldName(e.target.value)}
                        placeholder="Field name..."
                        className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
                      />
                      <select
                        value={newFieldType}
                        onChange={e => setNewFieldType(e.target.value)}
                        className="bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2.5 text-sm text-white"
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="url">URL</option>
                        <option value="email">Email</option>
                        <option value="boolean">Yes/No</option>
                        <option value="select">Select</option>
                      </select>
                      <button
                        onClick={addCustomField}
                        disabled={!newFieldName.trim()}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm disabled:opacity-40"
                      >
                        Add Field
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Saved Views */}
              {settingsTab === 'saved-views' && (
                <div className="space-y-4">
                  <div className="bg-[#111] rounded-2xl border border-white/5 p-6">
                    <h3 className="font-semibold mb-1">Saved Views & Smart Filters</h3>
                    <p className="text-sm text-gray-500 mb-4">Save your current lead filters as a named view. Apply them instantly.</p>

                    <div className="flex items-center gap-3 mb-6">
                      <input
                        value={newViewName}
                        onChange={e => setNewViewName(e.target.value)}
                        placeholder="View name (e.g. Hot Leads, Unverified)"
                        className="flex-1 bg-white/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30"
                      />
                      <button
                        onClick={saveCurrentView}
                        disabled={!newViewName.trim()}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold text-sm disabled:opacity-40"
                      >
                        Save Current Filters
                      </button>
                    </div>

                    {savedViews.length > 0 ? (
                      <div className="space-y-2">
                        {savedViews.map(view => (
                          <div key={view.id} className="flex items-center justify-between bg-white/[0.02] rounded-xl px-4 py-3 border border-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: view.color }} />
                              <span className="font-medium text-sm">{view.name}</span>
                              <div className="flex gap-1">
                                {Object.entries(view.filters).filter(([, v]) => v && v !== 'all').map(([k, v]) => (
                                  <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                                    {k}: {v}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => applySavedView(view.filters)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                              >
                                Apply
                              </button>
                              <button
                                onClick={() => deleteSavedView(view.id)}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                              >
                                <IconX />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-600 text-sm">
                        Set filters on the Leads tab, then save them here for quick access
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sequence Branching */}
              {settingsTab === 'branching' && (
                <div className="space-y-4">
                  <div className="bg-[#111] rounded-2xl border border-white/5 p-6">
                    <h3 className="font-semibold mb-1">Conditional Sequence Branching</h3>
                    <p className="text-sm text-gray-500 mb-4">Add if/then rules to sequence steps. E.g., &ldquo;If lead opened email, skip to step 3&rdquo;.</p>

                    {/* Sequence selector */}
                    <div className="mb-4">
                      <label className="text-xs text-gray-500 mb-1 block">Select a sequence:</label>
                      <div className="flex gap-2 flex-wrap">
                        {sequences.map(seq => (
                          <button
                            key={seq.id}
                            onClick={() => fetchBranches(seq.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                              branchSequenceId === seq.id
                                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                : 'bg-white/[0.02] text-gray-400 border border-white/5 hover:border-white/10'
                            }`}
                          >
                            {seq.name}
                          </button>
                        ))}
                        {sequences.length === 0 && (
                          <span className="text-sm text-gray-600">No sequences created yet</span>
                        )}
                      </div>
                    </div>

                    {/* Branch rules per step */}
                    {branchSteps.length > 0 && (
                      <div className="space-y-4">
                        {branchSteps.map((step, si) => (
                          <div key={step.id} className="bg-white/[0.02] rounded-xl p-4 border border-white/5">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-medium text-sm">Step {step.stepOrder + 1}: {step.subject}</span>
                              <span className="text-xs text-gray-500">Delay: {step.delayDays}d</span>
                            </div>

                            {step.branches.map((branch, bi) => (
                              <div key={bi} className="flex items-center gap-2 mb-2 text-sm">
                                <span className="text-gray-500 text-xs">IF</span>
                                <select
                                  value={branch.condition}
                                  onChange={e => {
                                    const updated = [...branchSteps];
                                    updated[si].branches[bi] = { ...branch, condition: e.target.value };
                                    setBranchSteps(updated);
                                  }}
                                  className="bg-white/[0.03] border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white"
                                >
                                  <option value="opened">Opened</option>
                                  <option value="not_opened">Not opened</option>
                                  <option value="clicked">Clicked</option>
                                  <option value="not_clicked">Not clicked</option>
                                  <option value="replied">Replied</option>
                                  <option value="bounced">Bounced</option>
                                </select>
                                <span className="text-gray-500 text-xs">THEN</span>
                                <select
                                  value={branch.action}
                                  onChange={e => {
                                    const updated = [...branchSteps];
                                    updated[si].branches[bi] = { ...branch, action: e.target.value };
                                    setBranchSteps(updated);
                                  }}
                                  className="bg-white/[0.03] border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white"
                                >
                                  <option value="goto_step">Go to step</option>
                                  <option value="skip">Skip next</option>
                                  <option value="stop">Stop sequence</option>
                                  <option value="wait_extra">Wait extra days</option>
                                </select>
                                {(branch.action === 'goto_step' || branch.action === 'wait_extra') && (
                                  <input
                                    type="number"
                                    min={branch.action === 'goto_step' ? 1 : 1}
                                    value={branch.value || ''}
                                    onChange={e => {
                                      const updated = [...branchSteps];
                                      updated[si].branches[bi] = { ...branch, value: parseInt(e.target.value) || 0 };
                                      setBranchSteps(updated);
                                    }}
                                    className="w-16 bg-white/[0.03] border border-white/5 rounded-lg px-2 py-1.5 text-xs text-white"
                                    placeholder={branch.action === 'goto_step' ? 'Step #' : 'Days'}
                                  />
                                )}
                                <button
                                  onClick={() => {
                                    const updated = [...branchSteps];
                                    updated[si].branches = updated[si].branches.filter((_, j) => j !== bi);
                                    setBranchSteps(updated);
                                  }}
                                  className="p-1 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                                >
                                  <IconX />
                                </button>
                              </div>
                            ))}

                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => {
                                  const updated = [...branchSteps];
                                  updated[si].branches.push({ condition: 'opened', action: 'goto_step', value: 1 });
                                  setBranchSteps(updated);
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-gray-400 hover:border-white/10"
                              >
                                + Add Branch
                              </button>
                              <button
                                onClick={() => saveBranch(step.id, step.branches)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {branchSequenceId && branchSteps.length === 0 && (
                      <div className="text-center py-6 text-gray-600 text-sm">
                        This sequence has no steps yet
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Video embed modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowVideoModal(false)}>
          <div className="w-full max-w-md bg-[#161616] border border-white/10 rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Embed Video</h3>
              <button onClick={() => setShowVideoModal(false)} className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                <IconX />
              </button>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Paste a YouTube, Vimeo, or Loom URL. The video will appear as a clickable thumbnail with a play button in the email.
            </p>
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/30 transition-all mb-4"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); insertVideoEmbed(); } }}
            />
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <span className="px-2 py-0.5 rounded bg-white/5">YouTube</span>
              <span className="px-2 py-0.5 rounded bg-white/5">Vimeo</span>
              <span className="px-2 py-0.5 rounded bg-white/5">Loom</span>
              <span className="px-2 py-0.5 rounded bg-white/5">Any URL</span>
            </div>
            <button
              onClick={insertVideoEmbed}
              disabled={!videoUrl.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-orange-600 hover:to-red-600 transition-all"
            >
              Insert Video
            </button>
          </div>
        </div>
      )}

      {/* CSV Import modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowImportModal(false)}>
          <div className="w-full max-w-lg bg-[#161616] border border-white/10 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div>
                <h3 className="font-semibold">Import Leads from CSV</h3>
                <p className="text-xs text-gray-500 mt-0.5">{importData.length} rows found</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                <IconX />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-400">
                Map your CSV columns to lead fields. Required: Name, Email, Industry, Challenge.
              </p>

              {/* Column mapping */}
              {[
                { key: 'name', label: 'Name', required: true },
                { key: 'email', label: 'Email', required: true },
                { key: 'field', label: 'Industry', required: true },
                { key: 'website', label: 'Website', required: false },
                { key: 'problem', label: 'Challenge', required: true },
              ].map(({ key, label, required }) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="w-24 text-sm text-gray-400 flex-shrink-0">
                    {label} {required && <span className="text-red-400">*</span>}
                  </label>
                  <select
                    value={columnMap[key] || ''}
                    onChange={e => setColumnMap(prev => ({ ...prev, [key]: e.target.value }))}
                    className="flex-1 appearance-none bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-orange-500/30"
                  >
                    <option value="">— Select column —</option>
                    {importData.length > 0 && Object.keys(importData[0]).map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              ))}

              {/* Preview */}
              {importData.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">Preview (first 3 rows):</p>
                  <div className="overflow-x-auto rounded-lg border border-white/5">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-white/[0.03]">
                          {Object.keys(importData[0]).map(col => (
                            <th key={col} className="px-3 py-2 text-left text-gray-400 font-medium">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importData.slice(0, 3).map((row, i) => (
                          <tr key={i} className="border-t border-white/5">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="px-3 py-2 text-gray-300 max-w-[150px] truncate">{val}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-white/5 flex items-center gap-3">
              <button
                onClick={submitImport}
                disabled={importing}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-orange-600 hover:to-red-600 transition-all"
              >
                {importing ? 'Importing...' : `Import ${importData.length} Leads`}
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                className="px-6 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-gray-400 hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
