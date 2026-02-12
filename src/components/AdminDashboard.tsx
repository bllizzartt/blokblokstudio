'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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

type Tab = 'dashboard' | 'leads' | 'compose' | 'history' | 'accounts' | 'sequences' | 'warmup';
type SendTarget = 'all' | 'selected' | 'individual';

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

  // CSV Import
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Accounts & Warmup
  const [accounts, setAccounts] = useState<AccountStat[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ email: '', smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', label: '' });
  const [selectedProvider, setSelectedProvider] = useState('');
  const [showSetupGuide, setShowSetupGuide] = useState(false);

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

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/leads', { headers: headers() });
      if (!res.ok) throw new Error('Unauthorized');
      const data = await res.json();
      setLeads(data.leads);
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

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const pw = password;
    if (!pw) return;
    const res = await fetch('/api/admin/leads', {
      headers: { Authorization: `Bearer ${pw}` },
    });
    if (res.ok) {
      setAuthed(true);
      localStorage.setItem('bb_admin_pw', pw);
      const data = await res.json();
      setLeads(data.leads);
      fetchCampaigns();
      fetchAccounts();
      fetchSequences();
    } else {
      localStorage.removeItem('bb_admin_pw');
      if (e) showToast('error', 'Wrong password');
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
    }
  }, [authed, fetchLeads, fetchCampaigns, fetchAccounts, fetchSequences]);

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
    return matchSearch && matchField;
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
    { id: 'compose', label: 'Compose', icon: <IconCompose /> },
    { id: 'sequences', label: 'Sequences', icon: <IconHistory /> },
    { id: 'accounts', label: 'Accounts', icon: <IconMail />, badge: accounts.length },
    { id: 'warmup', label: 'Warmup', icon: <IconVideo /> },
    { id: 'history', label: 'History', icon: <IconHistory />, badge: campaigns.length },
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
                            <div className="sm:col-span-2">
                              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Challenge</p>
                              <p className="text-gray-300">{lead.problem}</p>
                            </div>
                            <div className="sm:col-span-2">
                              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Source</p>
                              <p className="text-gray-300">Funnel &middot; {new Date(lead.createdAt).toLocaleString()}</p>
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
                    <div className="absolute top-full left-0 mt-2 w-full sm:w-96 bg-[#161616] border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden">
                      <div className="p-3 border-b border-white/5">
                        <p className="text-xs text-gray-500 font-medium">Choose a template to get started</p>
                      </div>
                      {EMAIL_TEMPLATES.map((t, i) => (
                        <button
                          key={i}
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

                    <div className="flex-1" />

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
                          showToast('success', 'Account connected successfully!');
                          setShowAddAccount(false);
                          setSelectedProvider('');
                          setNewAccount({ email: '', smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', label: '' });
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
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateSeq(false)}>
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
                            body: JSON.stringify({ name: newSeqName, steps: newSeqSteps }),
                          });
                          if (res.ok) {
                            showToast('success', 'Sequence created!');
                            setShowCreateSeq(false);
                            setNewSeqName('');
                            setNewSeqSteps([{ subject: '', body: '', delayDays: 0 }]);
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
                      <button onClick={() => setShowCreateSeq(false)} className="px-6 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-gray-400">Cancel</button>
                    </div>
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

                      {/* Warmup phases */}
                      <div className="mt-4 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(phase => (
                          <div
                            key={phase}
                            className={`flex-1 h-1.5 rounded-full ${
                              phase <= acc.warmupPhase ? 'bg-orange-500' : 'bg-white/5'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                        <span>5/day</span>
                        <span>15/day</span>
                        <span>30/day</span>
                        <span>50/day</span>
                        <span>100/day</span>
                      </div>
                    </div>
                  ))}
                </>
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
