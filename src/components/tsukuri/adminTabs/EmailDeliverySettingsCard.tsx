import React, { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Send,
  Eye,
  Key,
  ShieldCheck,
  ExternalLink,
  Server,
  HelpCircle,
} from 'lucide-react';

interface DispatchedEmailItem {
  id: string;
  orderNumber: string;
  recipient: string;
  customerName: string;
  subject: string;
  sentAt: string;
  status: 'delivered' | 'sent' | 'failed';
  provider?: string;
  messageId?: string;
  error?: string;
}

export const EmailDeliverySettingsCard: React.FC = () => {
  const [host, setHost] = useState('smtp.gmail.com');
  const [port, setPort] = useState(465);
  const [secure, setSecure] = useState(true);
  const [user, setUser] = useState('commersgyan@gmail.com');
  const [pass, setPass] = useState('');
  const [fromName, setFromName] = useState('TsuKURI_3D Official Support');
  const [fromEmail, setFromEmail] = useState('commersgyan@gmail.com');
  const [isConfigured, setIsConfigured] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [testEmailRecipient, setTestEmailRecipient] = useState('commersgyan@gmail.com');
  const [testEmailStatus, setTestEmailStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  const [outbox, setOutbox] = useState<DispatchedEmailItem[]>([]);
  const [isLoadingOutbox, setIsLoadingOutbox] = useState(false);
  const [showAppPasswordGuide, setShowAppPasswordGuide] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load existing config on mount
  useEffect(() => {
    fetchConfig();
    fetchOutbox();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/smtp-config');
      if (res.ok) {
        const data = await res.json();
        setHost(data.host || 'smtp.gmail.com');
        setPort(data.port || 465);
        setSecure(data.secure !== undefined ? data.secure : true);
        setUser(data.user || 'commersgyan@gmail.com');
        setFromName(data.fromName || 'TsuKURI_3D Official Support');
        setFromEmail(data.fromEmail || data.user || 'commersgyan@gmail.com');
        setIsConfigured(!!data.isConfigured);
        if (data.pass) {
          setPass(data.pass);
        }
      }
    } catch (err) {
      console.warn('Failed to load SMTP config:', err);
    }
  };

  const fetchOutbox = async () => {
    setIsLoadingOutbox(true);
    try {
      const res = await fetch('/api/emails/dispatched');
      if (res.ok) {
        const data = await res.json();
        setOutbox(data.emails || []);
      }
    } catch (err) {
      console.warn('Failed to load outbox:', err);
    } finally {
      setIsLoadingOutbox(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSaveStatus(null);
    setVerifyStatus(null);

    try {
      const res = await fetch('/api/smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port,
          secure,
          user,
          pass,
          fromName,
          fromEmail,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIsConfigured(!!data.config?.isConfigured);
        setSaveStatus('✓ Email server configuration saved successfully!');
        setTimeout(() => setSaveStatus(null), 4000);
      } else {
        setSaveStatus('Failed to save configuration');
      }
    } catch (err: any) {
      setSaveStatus(`Save error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerifyStatus(null);
    try {
      // First save if pass was changed
      await fetch('/api/smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, secure, user, pass, fromName, fromEmail }),
      });

      const res = await fetch('/api/smtp-config/verify', { method: 'POST' });
      const data = await res.json();
      setVerifyStatus({
        success: data.success,
        message: data.message || (data.success ? 'Verified connection!' : 'Verification failed'),
      });
      if (data.success) {
        setIsConfigured(true);
      }
    } catch (err: any) {
      setVerifyStatus({
        success: false,
        message: `Connection error: ${err.message}`,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient) return;
    setIsSendingTest(true);
    setTestEmailStatus(null);

    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmailRecipient }),
      });
      const data = await res.json();
      setTestEmailStatus({
        success: data.success,
        message: data.message || (data.success ? 'Delivered!' : 'Failed'),
      });
      fetchOutbox();
    } catch (err: any) {
      setTestEmailStatus({
        success: false,
        message: `Test email error: ${err.message}`,
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleResendInvoice = async (item: DispatchedEmailItem) => {
    try {
      await fetch('/api/send-invoice-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: item.orderNumber,
          customerName: item.customerName,
          customerEmail: item.recipient,
        }),
      });
      fetchOutbox();
    } catch (err) {
      console.warn('Resend failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="p-6 bg-white rounded-3xl border border-[#1e4b3e]/15 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#1e4b3e] text-[#f3b755] flex items-center justify-center font-bold text-xl shadow-xs">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bubbly text-xl text-[#1a2e26] flex items-center gap-2">
                <span>OFFICIAL EMAIL & INVOICE AUTOMATION CENTER</span>
                {isConfigured ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>AUTHENTICATED</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wide flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-700" />
                    <span>ACTION REQUIRED</span>
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Automate real tax invoices and dispatch receipts sent directly to customer email addresses upon order placement.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAppPasswordGuide(!showAppPasswordGuide)}
              className="px-3 py-1.5 rounded-xl border border-[#1e4b3e]/20 text-[#1e4b3e] hover:bg-[#e8ece1]/40 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-[#1e4b3e]" />
              <span>Gmail Setup Guide</span>
            </button>
            <button
              type="button"
              onClick={fetchOutbox}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Refresh outbox"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingOutbox ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* STEP-BY-STEP GMAIL APP PASSWORD GUIDE */}
        {showAppPasswordGuide && (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-between font-bold text-sm text-amber-900">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>How to Get Your 16-Character Gmail App Password (30 Seconds)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAppPasswordGuide(false)}
                className="text-amber-800 hover:text-black font-bold"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-700">
              Google requires a dedicated 16-character App Password (not your ordinary personal password) so applications can securely send tax invoice emails from your Gmail account (<strong>{user}</strong>):
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-800 font-medium pl-1">
              <li>Open your Google Account at <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="text-emerald-800 underline font-bold inline-flex items-center gap-0.5">Google Security <ExternalLink className="w-2.5 h-2.5" /></a>.</li>
              <li>Under <em>&quot;How you sign in to Google&quot;</em>, verify that <strong>2-Step Verification</strong> is ON.</li>
              <li>In the top search bar of Google Account, type <strong>&quot;App passwords&quot;</strong> and click it.</li>
              <li>In <em>App name</em>, enter <strong>TsuKURI 3D Studio</strong> and click <strong>Create</strong>.</li>
              <li>Google will display a 16-letter password (e.g. <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-mono font-bold text-amber-900">abcd efgh ijkl mnop</code>).</li>
              <li>Paste it into the <strong>Google App Password</strong> field below and click <strong>&quot;Save & Verify Connection&quot;</strong>.</li>
            </ol>
          </div>
        )}

        {/* SMTP CONFIGURATION FORM */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-[#1a2e26]">
            {/* Sender / Support Email */}
            <div className="space-y-1">
              <label className="text-slate-600 uppercase text-[10px] tracking-wider block">
                Sender Google / Support Email Address *
              </label>
              <input
                type="email"
                required
                value={user}
                onChange={(e) => {
                  setUser(e.target.value);
                  setFromEmail(e.target.value);
                }}
                placeholder="commersgyan@gmail.com"
                className="w-full bg-[#e8ece1]/40 border border-slate-200 rounded-xl p-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
              />
            </div>

            {/* Sender Display Name */}
            <div className="space-y-1">
              <label className="text-slate-600 uppercase text-[10px] tracking-wider block">
                Sender Display Name (In Customer Inbox) *
              </label>
              <input
                type="text"
                required
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="TsuKURI_3D Official Support"
                className="w-full bg-[#e8ece1]/40 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
              />
            </div>

            {/* Google App Password */}
            <div className="space-y-1 sm:col-span-2">
              <div className="flex justify-between items-center">
                <label className="text-slate-600 uppercase text-[10px] tracking-wider flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-[#1e4b3e]" />
                  <span>Google 16-Character App Password / SMTP Password *</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[10px] text-[#1e4b3e] hover:underline font-bold"
                >
                  {showPassword ? 'Hide' : 'Show'} Password
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Enter 16-character Google App Password (e.g. abcd efgh ijkl mnop)"
                className="w-full bg-[#e8ece1]/40 border border-slate-200 rounded-xl p-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
              />
              <span className="text-[10px] text-slate-500 font-normal block">
                Spaces are stripped automatically. Never share your regular Gmail password.
              </span>
            </div>

            {/* Advanced Host & Port Settings */}
            <div className="space-y-1">
              <label className="text-slate-600 uppercase text-[10px] tracking-wider flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span>SMTP Host</span>
              </label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full bg-[#e8ece1]/40 border border-slate-200 rounded-xl p-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-600 uppercase text-[10px] tracking-wider block">
                SMTP Port & Protocol
              </label>
              <div className="flex gap-2">
                <select
                  value={port}
                  onChange={(e) => {
                    const p = Number(e.target.value);
                    setPort(p);
                    setSecure(p === 465);
                  }}
                  className="flex-1 bg-[#e8ece1]/40 border border-slate-200 rounded-xl p-2.5 font-mono focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
                >
                  <option value={465}>Port 465 (SSL / TLS - Recommended)</option>
                  <option value={587}>Port 587 (STARTTLS)</option>
                  <option value={25}>Port 25 (Standard)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS & STATUS */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="py-2.5 px-6 rounded-full bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bubbly text-xs tracking-wider shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'SAVING...' : 'SAVE SETTINGS'}
            </button>

            <button
              type="button"
              disabled={isVerifying}
              onClick={handleVerify}
              className="py-2.5 px-5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bubbly text-xs tracking-wider shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'VERIFYING...' : 'VERIFY CONNECTION'}</span>
            </button>

            {saveStatus && (
              <span className="text-xs font-bold text-emerald-700 animate-in fade-in">
                {saveStatus}
              </span>
            )}
          </div>

          {verifyStatus && (
            <div
              className={`p-3 rounded-2xl border text-xs font-bold leading-relaxed ${
                verifyStatus.success
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                {verifyStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{verifyStatus.success ? 'SMTP Connection Successful' : 'SMTP Connection Error'}</span>
              </div>
              <p className="text-[11px] font-normal pl-5">{verifyStatus.message}</p>
            </div>
          )}
        </form>
      </div>

      {/* LIVE TEST EMAIL SEND BOX */}
      <div className="p-5 bg-white rounded-3xl border border-[#1e4b3e]/15 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-[#1e4b3e]" />
          <h4 className="font-bubbly text-sm text-[#1a2e26]">
            TEST LIVE INVOICE EMAIL DELIVERY
          </h4>
        </div>
        <p className="text-xs text-slate-500">
          Send a real Kyoto-themed tax invoice test dispatch right now to confirm inbox reception.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={testEmailRecipient}
            onChange={(e) => setTestEmailRecipient(e.target.value)}
            placeholder="Enter your email to receive test invoice..."
            className="flex-1 bg-[#e8ece1]/40 border border-slate-200 rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1e4b3e]"
          />
          <button
            type="button"
            disabled={isSendingTest || !testEmailRecipient}
            onClick={handleSendTestEmail}
            className="py-2.5 px-6 rounded-xl bg-[#1e4b3e] hover:bg-[#15342b] text-[#f3b755] font-bubbly text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-pulse' : ''}`} />
            <span>{isSendingTest ? 'DELIVERING...' : 'SEND LIVE TEST EMAIL'}</span>
          </button>
        </div>

        {testEmailStatus && (
          <div
            className={`p-3 rounded-2xl border text-xs font-bold ${
              testEmailStatus.success
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            {testEmailStatus.message}
          </div>
        )}
      </div>

      {/* LIVE DISPATCHED INVOICES OUTBOX */}
      <div className="p-6 bg-white rounded-3xl border border-[#1e4b3e]/15 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#1e4b3e]" />
            <h4 className="font-bubbly text-base text-[#1a2e26]">
              DISPATCHED INVOICES LOG & OUTBOX ({outbox.length})
            </h4>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            Real-time automated order invoice tracking
          </span>
        </div>

        {outbox.length === 0 ? (
          <div className="text-center py-10 bg-[#e8ece1]/30 rounded-2xl text-xs text-slate-500 font-medium">
            No invoices dispatched yet in this session. When a customer places an order or pays via PayU, the tax invoice will appear here automatically.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#e8ece1]/60 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3 rounded-l-xl">Order #</th>
                  <th className="p-3">Customer Recipient</th>
                  <th className="p-3">Sent Timestamp</th>
                  <th className="p-3">Delivery Status</th>
                  <th className="p-3">Mailer Provider</th>
                  <th className="p-3 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outbox.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#1e4b3e]">
                      #{item.orderNumber}
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-[#1a2e26] block">{item.customerName}</span>
                      <span className="text-[11px] text-slate-600 font-mono">{item.recipient}</span>
                    </td>
                    <td className="p-3 text-slate-600 font-mono text-[11px]">
                      {new Date(item.sentAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                          item.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'sent'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.status === 'delivered' ? (
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        ) : null}
                        <span>{item.status}</span>
                      </span>
                      {item.error && (
                        <span className="text-[9px] text-slate-500 block mt-0.5 truncate max-w-xs" title={item.error}>
                          {item.error}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600 text-[11px]">
                      {item.provider || 'Gmail SMTP'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/api/invoices/${item.orderNumber}/html`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-[#e8ece1] hover:bg-[#d8dcd1] text-[#1e4b3e] transition-colors inline-flex items-center gap-1 font-bold text-[10px]"
                          title="View generated tax invoice"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => handleResendInvoice(item)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                          title="Resend tax invoice to customer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Resend</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
