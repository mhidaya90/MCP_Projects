
import React, { useEffect, useState } from "react";
import { listApps, listBuilds, triggerBuild, getBuildLog } from "./api";
import "./App.css";

export default function App() {
  const [apps, setApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [builds, setBuilds] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingBuilds, setLoadingBuilds] = useState(false);
  const [branch, setBranch] = useState("main");
  const [workflowId, setWorkflowId] = useState("");
  const [message, setMessage] = useState("");
  const [log, setLog] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoadingApps(true);
        const appsRes = await listApps(50);
        setApps(appsRes?.data || []);
      } catch (e) {
        setError(String(e));
      } finally {
        setLoadingApps(false);
      }
    })();
  }, []);

  async function loadBuilds(app) {
    setSelectedApp(app);
    setLog(null);
    try {
      setLoadingBuilds(true);
      const buildsRes = await listBuilds(app.slug, 20);
      setBuilds(buildsRes?.data || []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoadingBuilds(false);
    }
  }

  async function doTrigger() {
    if (!selectedApp) return;
    try {
      const resp = await triggerBuild(selectedApp.slug, {
        branch,
        workflow_id: workflowId || undefined,
        commit_message: message || undefined,
      });
      alert(`Triggered: build_slug=${resp?.data?.build_slug || "(see response)"}`);
      // reload builds
      const buildsRes = await listBuilds(selectedApp.slug, 20);
      setBuilds(buildsRes?.data || []);
    } catch (e) {
      setError(String(e));
    }
  }

  async function openLog(buildSlug) {
    if (!selectedApp) return;
    try {
      const logRes = await getBuildLog(selectedApp.slug, buildSlug);
      setLog(logRes);
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div className="container">
      <header>
        <h1>🚀 Bitrise Dashboard (FastMCP)</h1>
      </header>

      <section className="grid">
        <div className="panel">
          <h2>Applications</h2>
          {loadingApps ? <p>Loading apps…</p> : null}
          <ul className="list">
            {(apps || []).map(app => (
              <li key={app.slug}>
                <button className="link" onClick={() => loadBuilds(app)}>
                  {app.title} <small>({app.slug})</small>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <h2>Builds {selectedApp ? `— ${selectedApp.title}` : ""}</h2>
          {loadingBuilds ? <p>Loading builds…</p> : null}
          <ul className="list">
            {(builds || []).map(b => (
              <li key={b.slug}>
                <div className="row">
                  <div>
                    <strong>#{b.build_number}</strong> — {b.status_text || b.status} — {b.branch}
                  </div>
                  <div className="actions">
                    <button onClick={() => openLog(b.slug)}>Log</button>
                    <a className="link" href={b.build_url} target="_blank" rel="noreferrer">Open</a>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {selectedApp && (
            <div className="form">
              <h3>Trigger Build</h3>
              <label>Branch
                <input value={branch} onChange={e => setBranch(e.target.value)} />
              </label>
              <label>Workflow ID
                <input value={workflowId} onChange={e => setWorkflowId(e.target.value)} placeholder="(optional)"/>
              </label>
              <label>Commit Message
                <input value={message} onChange={e => setMessage(e.target.value)} placeholder="(optional)"/>
              </label>
              <button onClick={doTrigger}>Trigger</button>
            </div>
          )}
        </div>

        <div className="panel">
          <h2>Build Log</h2>
          {log ? (
            <pre className="log">{JSON.stringify(log, null, 2)}</pre>
          ) : (
            <p>Select a build and click “Log”.</p>
          )}
        </div>
      </section>

      {error && <div className="error"><strong>Error:</strong> {error}</div>}
    </div>
  );
}
