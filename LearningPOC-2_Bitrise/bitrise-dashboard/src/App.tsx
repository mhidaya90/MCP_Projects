
import { useEffect, useState } from 'react';
import { useMcp } from 'use-mcp/react';

type AppItem = { slug: string; title?: string };
type Counts = { on_hold: number; running: number; succeeded: number; failed: number; aborted: number; succeeded_with_abort: number };

export default function App() {
  const mcpUrl = `${window.location.origin}/mcp`; // CRA runs on 3000; MCP on 4000
  const { state, error, callTool } = useMcp({
    url: mcpUrl,
    clientName: 'BitrisePortal',
    autoReconnect: true,
  });

  const [apps, setApps] = useState<AppItem[]>([]);
  const [summaryByApp, setSummaryByApp] = useState<Record<string, Counts>>({});
  const [loading, setLoading] = useState(false);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const r = await callTool('list_apps', { limit: 50 });
      const list = (r as any)?.structuredContent?.apps ?? [];
      setApps(list);
    } finally { setLoading(false); }
  };

  const fetchSummaries = async () => {
    const map: Record<string, Counts> = {};
    for (const a of apps) {
      const s = await callTool('build_status_summary', { appSlug: a.slug, limit: 30 });
      map[a.slug] = (s as any)?.structuredContent?.counts;
    }
    setSummaryByApp(map);
  };

  useEffect(() => { if (state === 'ready') fetchApps(); }, [state]);
  useEffect(() => { if (apps.length) fetchSummaries(); }, [apps]);

  const connecting = state !== 'ready';

  return (
    <div className="app">
      <div className="header">
        <h1>Bitrise Dashboard</h1>
        <p>AI-Assisted Bitrise Portal with MCP Integration</p>
      </div>

      <div className="statusRow">
        <span className={`badge ${connecting ? 'info' : 'success'}`}>{connecting ? 'Connecting…' : 'Connected'}</span>
        <span className="muted">{mcpUrl}</span>
        <button className="button" onClick={() => { fetchApps().then(fetchSummaries); }} disabled={connecting || loading}>
          {loading ? 'Refreshing…' : 'Refresh data'}
        </button>
      </div>

      {state === 'failed' && <div className="badge danger">Failed: {String(error)}</div>}

      <div className="grid">
        {apps.map(a => {
          const c = summaryByApp[a.slug];
          return (
            <div className="card" key={a.slug}>
              <div className="cardTitle">{a.title || a.slug}</div>
              {!c ? (
                <div className="cardBody">Loading…</div>
              ) : (
                <div className="cardBody">
                  <div className="badges">
                    <span className="badge info">Running: {c.running}</span>
                    <span className="badge success">Succeeded: {c.succeeded}</span>
                    <span className="badge danger">Failed: {c.failed}</span>
                    <span className="badge neutral">Aborted: {c.aborted}</span>
                    <span className="badge neutral">On hold: {c.on_hold}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}