'use client';

import { useState, useEffect, useCallback } from 'react';

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
  sentTo: number;
  sentAt: string | null;
  status: string;
  createdAt: string;
}

export function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<'leads' | 'campaign' | 'history'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Campaign form
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

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
      setError('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [headers]);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/admin/leads', {
      headers: { Authorization: `Bearer ${password}` },
    });
    if (res.ok) {
      setAuthed(true);
      const data = await res.json();
      setLeads(data.leads);
      fetchCampaigns();
    } else {
      setError('Wrong password');
    }
  };

  useEffect(() => {
    if (authed) {
      fetchLeads();
      fetchCampaigns();
    }
  }, [authed, fetchLeads, fetchCampaigns]);

  const deleteLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    await fetch(`/api/admin/leads?id=${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    setLeads(leads.filter((l) => l.id !== id));
  };

  const sendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !body) return;
    if (!confirm(`Send "${subject}" to ${leads.filter(l => !l.unsubscribed).length} leads?`)) return;

    setSending(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/campaign', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ subject, body }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(`Campaign sent to ${data.sentTo}/${data.total} leads!`);
      setSubject('');
      setBody('');
      fetchCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const exportCSV = () => {
    const csvRows = [
      ['Name', 'Email', 'Industry', 'Website', 'Challenge', 'Date'].join(','),
      ...leads.map((l) =>
        [
          `"${l.name}"`,
          l.email,
          `"${l.field}"`,
          l.website || 'N/A',
          `"${l.problem.replace(/"/g, '""')}"`,
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

  // ── Login screen ──
  if (!authed) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-5">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-bold text-white text-center mb-8">Admin Login</h1>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  // ── Dashboard ──
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto p-5 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Blok Blok Admin</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{leads.length} leads</span>
            <button
              onClick={exportCSV}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-white/5 p-1 rounded-xl w-fit">
          {(['leads', 'campaign', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t === 'leads' ? `Leads (${leads.length})` : t === 'campaign' ? 'Send Campaign' : 'Campaign History'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Leads tab */}
        {tab === 'leads' && (
          <div className="space-y-3">
            {loading ? (
              <p className="text-gray-500 text-center py-12">Loading...</p>
            ) : leads.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No leads yet. Share your funnel link to start collecting!</p>
            ) : (
              leads.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-2xl p-5 sm:p-6 bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-lg">{lead.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">
                          {lead.field}
                        </span>
                        {lead.unsubscribed && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                            Unsubscribed
                          </span>
                        )}
                      </div>
                      <a href={`mailto:${lead.email}`} className="text-sm text-gray-400 hover:text-orange-400 transition-colors">
                        {lead.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => deleteLead(lead.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Website: </span>
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                          {lead.website}
                        </a>
                      ) : (
                        <span className="text-orange-400/60 italic">No website yet</span>
                      )}
                    </div>
                    <div>
                      <span className="text-gray-500">Emails sent: </span>
                      <span>{lead.emailsSent}</span>
                    </div>
                  </div>
                  <div className="mt-3 text-sm">
                    <span className="text-gray-500">Challenge: </span>
                    <span className="text-gray-300">{lead.problem}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Campaign tab */}
        {tab === 'campaign' && (
          <form onSubmit={sendCampaign} className="max-w-2xl space-y-5">
            <p className="text-sm text-gray-400 mb-2">
              Send an email to all {leads.filter(l => !l.unsubscribed).length} active leads.
              Use <code className="bg-white/5 px-1.5 py-0.5 rounded text-orange-400">{'{{name}}'}</code> to personalize with their name.
            </p>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Subject Line</label>
              <input
                type="text"
                required
                placeholder="e.g. Your free audit is ready!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email Body (HTML supported)</label>
              <textarea
                required
                rows={12}
                placeholder={`<h2>Hey {{name}}!</h2>\n<p>Your personalized website audit is ready...</p>`}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/40 font-mono text-sm resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : `Send to ${leads.filter(l => !l.unsubscribed).length} Leads`}
            </button>
          </form>
        )}

        {/* Campaign history tab */}
        {tab === 'history' && (
          <div className="space-y-3">
            {campaigns.length === 0 ? (
              <p className="text-gray-500 text-center py-12">No campaigns sent yet.</p>
            ) : (
              campaigns.map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl p-5 bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-medium">{c.subject}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Sent to {c.sentTo} leads
                      {c.sentAt && ` on ${new Date(c.sentAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    c.status === 'sent'
                      ? 'bg-green-500/10 text-green-400'
                      : c.status === 'sending'
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'bg-gray-500/10 text-gray-400'
                  }`}>
                    {c.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
