import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { listWebhooks, createWebhook, toggleWebhook, deleteWebhook } from '../../services/webhook.service';
import { listApiKeys, createApiKey, revokeApiKey } from '../../services/apiKey.service';
import { getCalendarIntegration, disconnectCalendar } from '../../services/calendar.service';
import { listBots, uninstallBot } from '../../services/bot.service';
import type { Webhook, WebhookEvent } from '../../types/webhook.types';
import type { ApiKey } from '../../types/apiKey.types';
import type { CalendarIntegration } from '../../types/calendar.types';
import type { BotInstallation } from '../../types/bot.types';
import { getApiError } from '../../types/api.types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';

const WEBHOOK_EVENTS: WebhookEvent[] = [
  'session.completed',
  'member.joined',
  'skill.created',
  'review.created',
  'connection.completed',
];

type Tab = 'webhooks' | 'api-keys' | 'calendars' | 'bots';

export default function IntegrationsPage() {
  const [tab, setTab] = useState<Tab>('webhooks');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
      <p className="mt-1 text-sm text-gray-500">
        Connect external tools, manage API access, and set up bots.
      </p>

      <div className="mt-4 flex gap-2 border-b border-gray-200">
        {(['webhooks', 'api-keys', 'calendars', 'bots'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTab(t)}
          >
            {t === 'api-keys' ? 'API Keys' : t === 'webhooks' ? 'Webhooks' : t === 'calendars' ? 'Calendars' : 'Bots'}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'webhooks' && <WebhooksPanel />}
        {tab === 'api-keys' && <ApiKeysPanel />}
        {tab === 'calendars' && <CalendarsPanel />}
        {tab === 'bots' && <BotsPanel />}
      </div>
    </div>
  );
}

function WebhooksPanel() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setWebhooks(await listWebhooks()); } catch (err) { toast.error(getApiError(err)); } finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!url || events.length === 0) { toast.error('URL and at least one event required'); return; }
    try {
      await createWebhook({ url, events });
      toast.success('Webhook created');
      setUrl(''); setEvents([]); setShowForm(false);
      load();
    } catch (err) { toast.error(getApiError(err)); }
  }

  async function handleToggle(id: string) {
    try { await toggleWebhook(id); load(); } catch (err) { toast.error(getApiError(err)); }
  }

  async function handleDelete(id: string) {
    try { await deleteWebhook(id); toast.success('Deleted'); load(); } catch (err) { toast.error(getApiError(err)); }
  }

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">Webhooks push events to your server in real-time.</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Webhook'}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <Input label="Endpoint URL" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://your-server.com/webhook" />
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Events</label>
            <div className="flex flex-wrap gap-2">
              {WEBHOOK_EVENTS.map((ev) => (
                <label key={ev} className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={events.includes(ev)}
                    onChange={(e) => setEvents(e.target.checked ? [...events, ev] : events.filter((x) => x !== ev))}
                  />
                  {ev}
                </label>
              ))}
            </div>
          </div>
          <Button size="sm" onClick={handleCreate}>Create</Button>
        </div>
      )}

      {webhooks.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No webhooks configured.</p>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => (
            <div key={wh._id} className="rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{wh.url}</p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {wh.events.map((ev) => <Badge key={ev} color="indigo">{ev}</Badge>)}
                </div>
                <p className="text-xs text-gray-400 mt-1">Fails: {wh.failCount} · {wh.status}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleToggle(wh._id)}>
                  {wh.status === 'active' ? 'Disable' : 'Enable'}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => handleDelete(wh._id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ApiKeysPanel() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setKeys(await listApiKeys()); } catch (err) { toast.error(getApiError(err)); } finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!name) { toast.error('Name required'); return; }
    try {
      await createApiKey({ name, scopes: ['skills:read'] });
      toast.success('API key created');
      setName(''); setShowForm(false);
      load();
    } catch (err) { toast.error(getApiError(err)); }
  }

  async function handleRevoke(id: string) {
    try { await revokeApiKey(id); toast.success('Revoked'); load(); } catch (err) { toast.error(getApiError(err)); }
  }

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">Manage read-only API keys for partner integrations.</p>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Key'}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
          <Input label="Key Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Library Kiosk" />
          <Button size="sm" onClick={handleCreate}>Create Key</Button>
        </div>
      )}

      {keys.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No API keys yet.</p>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k._id} className="rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{k.name}</p>
                <p className="text-xs text-gray-500 font-mono mt-1">{k.key.slice(0, 20)}...</p>
                <p className="text-xs text-gray-400 mt-1">
                  {k.requestCount}/{k.rateLimit} requests · {k.status}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge color={k.status === 'active' ? 'green' : 'red'}>{k.status}</Badge>
                {k.status === 'active' && (
                  <Button variant="secondary" size="sm" onClick={() => handleRevoke(k._id)}>Revoke</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CalendarsPanel() {
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const results: CalendarIntegration[] = [];
    for (const p of ['google', 'outlook']) {
      try { results.push(await getCalendarIntegration(p)); } catch { /* not connected */ }
    }
    setIntegrations(results);
    setLoading(false);
  }

  async function handleDisconnect(provider: string) {
    try { await disconnectCalendar(provider); toast.success('Disconnected'); load(); } catch (err) { toast.error(getApiError(err)); }
  }

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Sync your skill sessions with external calendars.</p>
      {integrations.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No calendars connected yet. Use the API to connect.</p>
      ) : (
        <div className="space-y-3">
          {integrations.map((c) => (
            <div key={c._id} className="rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 capitalize">{c.provider} Calendar</p>
                <p className="text-xs text-gray-500 mt-1">{c.calendarName} · {c.events.length} events synced</p>
                <Badge color={c.syncStatus === 'active' ? 'green' : 'red'}>{c.syncStatus}</Badge>
              </div>
              <Button variant="secondary" size="sm" onClick={() => handleDisconnect(c.provider)}>Disconnect</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BotsPanel() {
  const [bots, setBots] = useState<BotInstallation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try { setBots(await listBots()); } catch (err) { toast.error(getApiError(err)); } finally { setLoading(false); }
  }

  async function handleUninstall(id: string) {
    try { await uninstallBot(id); toast.success('Bot uninstalled'); load(); } catch (err) { toast.error(getApiError(err)); }
  }

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Manage Slack and Discord bot installations.</p>
      {bots.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No bots installed yet.</p>
      ) : (
        <div className="space-y-3">
          {bots.map((b) => (
            <div key={b._id} className="rounded-lg border border-gray-200 bg-white p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{b.name}</p>
                  <Badge color={b.platform === 'slack' ? 'purple' : 'blue'}>{b.platform}</Badge>
                </div>
                {b.teamName && <p className="text-xs text-gray-500 mt-1">{b.teamName}</p>}
                {b.channelName && <p className="text-xs text-gray-400">#{b.channelName}</p>}
                <p className="text-xs text-gray-400 mt-1">{b.commandCount} commands used</p>
              </div>
              <div className="flex gap-2">
                <Badge color={b.status === 'active' ? 'green' : 'red'}>{b.status}</Badge>
                <Button variant="secondary" size="sm" onClick={() => handleUninstall(b._id)}>Uninstall</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
