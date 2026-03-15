'use client';

import { useState, useEffect } from 'react';
import { Loader2, Mail, Save, Send } from 'lucide-react';
import { getSmtpSettings, saveSmtpSettings, testSmtpConnection } from '../../lib/actions/smtp';

export function SmtpSettingsForm() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [testEmail, setTestEmail] = useState('');
    const [runningDigest, setRunningDigest] = useState(false);

    const [form, setForm] = useState({
        host: '',
        port: 587,
        user: '',
        pass: '',
        fromEmail: '',
        fromName: ''
    });

    useEffect(() => {
        getSmtpSettings().then(res => {
            if (res.success && res.settings) {
                setForm({
                    host: res.settings.host,
                    port: res.settings.port,
                    user: res.settings.user,
                    pass: res.settings.password, // map password from DB to pass locally
                    fromEmail: res.settings.fromEmail,
                    fromName: res.settings.fromEmail // reuse fromEmail for fromName temporarily
                });
            }
            setLoading(false);
        });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(''); setError('');
        setSaving(true);
        const res = await saveSmtpSettings(form);
        if (res.success) {
            setMessage('SMTP settings saved successfully.');
        } else {
            setError(res.error || 'Failed to save settings.');
        }
        setSaving(false);
    };

    const handleTest = async () => {
        if (!testEmail) {
            setError("Please provide a test email address.");
            return;
        }
        setMessage(''); setError('');
        setTesting(true);
        const res = await testSmtpConnection(testEmail);
        if (res.success) {
            setMessage('Test email sent successfully!');
        } else {
            setError(res.error || 'Test email failed.');
        }
        setTesting(false);
    };

    const handleRunDigest = async () => {
        setMessage(''); setError('');
        setRunningDigest(true);
        try {
            const res = await fetch('/api/cron/email-digest', { method: 'GET' });
            const data = await res.json();
            if (res.ok && data.success) {
                setMessage(`Digest sent! Processed: ${data.processed.developer} Devs, ${data.processed.tester} Testers, ${data.processed.manager} PMs.`);
            } else {
                setError(data.error || 'Digest run failed.');
            }
        } catch (err: any) {
            setError('Failed to reach digest endpoint.');
        }
        setRunningDigest(false);
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
                <Mail className="w-5 h-5 text-indigo-500" />
                SMTP Email Service
            </h2>

            {message && <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-xl text-sm font-medium">{message}</div>}
            {error && <div className="mb-6 p-4 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 rounded-xl text-sm font-medium">{error}</div>}

            <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">SMTP Host</label>
                        <input
                            type="text"
                            required
                            value={form.host}
                            onChange={e => setForm({...form, host: e.target.value})}
                            placeholder="e.g. smtp.gmail.com"
                            className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">SMTP Port</label>
                        <input
                            type="number"
                            required
                            value={form.port}
                            onChange={e => setForm({...form, port: parseInt(e.target.value) || 587})}
                            className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">SMTP Username</label>
                        <input
                            type="text"
                            required
                            value={form.user}
                            onChange={e => setForm({...form, user: e.target.value})}
                            className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">SMTP Password / App Password</label>
                        <input
                            type="password"
                            required
                            value={form.pass}
                            autoComplete="new-password"
                            onChange={e => setForm({...form, pass: e.target.value})}
                            className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sender Email Address</label>
                        <input
                            type="email"
                            required
                            value={form.fromEmail}
                            onChange={e => setForm({...form, fromEmail: e.target.value})}
                            placeholder="noreply@domain.com"
                            className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sender Name</label>
                        <input
                            type="text"
                            required
                            value={form.fromName}
                            onChange={e => setForm({...form, fromName: e.target.value})}
                            placeholder="QA Portal Service"
                            className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/40"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Settings
                    </button>
                </div>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Test Connection</h3>
                <div className="flex gap-4 max-w-md">
                    <input
                        type="email"
                        value={testEmail}
                        onChange={e => setTestEmail(e.target.value)}
                        placeholder="Test email recipient..."
                        className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                    />
                    <button
                        type="button"
                        onClick={handleTest}
                        disabled={testing || !testEmail}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                    >
                        {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Test
                    </button>
                </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Run Pending Bug Digest</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">Manually triggers the cron job that emails Developers, Testers, and PMs their pending tasks.</p>
                </div>
                <button
                    type="button"
                    onClick={handleRunDigest}
                    disabled={runningDigest}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 dark:text-indigo-400 text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                >
                    {runningDigest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Trigger Digest Batch
                </button>
            </div>
        </div>
    );
}
