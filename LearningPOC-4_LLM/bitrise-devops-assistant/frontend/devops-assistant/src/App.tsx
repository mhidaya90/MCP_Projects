// import React from 'react';
// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.tsx</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;


import { useEffect, useState } from "react";
import { getApps, getBuilds, getLog, triggerBuild, abortBuild } from "./services/api";

type AppItem = { slug: string; title?: string; };
type BuildItem = { slug: string; status: number; status_text?: string; branch?: string; triggered_workflow?: string; build_number?: number; };

export default function App() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [builds, setBuilds] = useState<BuildItem[]>([]);
  const [selectedBuild, setSelectedBuild] = useState<string>("");
  const [analysis, setAnalysis] = useState<string>("");
  const [suggestion, setSuggestion] = useState<string>("");

  useEffect(() => { getApps().then(({data}) => setApps(data || [])); }, []);

  const loadBuilds = async (appSlug: string) => {
    setSelectedApp(appSlug);
    const resp = await getBuilds(appSlug, { limit: 50 });
    setBuilds(resp.data || []);
  };

  const loadLog = async (buildSlug: string) => {
    setSelectedBuild(buildSlug);
    const resp = await getLog(selectedApp, buildSlug);
    setAnalysis(resp.analysis || "");
    setSuggestion(resp.suggestion || "");
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>🚀 Bitrise DevOps Assistant (Ollama)</h2>

      <h3>Apps</h3>
      <ul>
        {apps.map(a => (
          <li key={a.slug}>
            <button onClick={() => loadBuilds(a.slug)}>{a.title || a.slug}</button>
          </li>
        ))}
      </ul>

      {selectedApp && (
        <>
          <h3>Builds — {selectedApp}</h3>
          <table border={1} cellPadding={6}>
            <thead><tr><th>#</th><th>Slug</th><th>Status</th><th>Branch</th><th>Workflow</th><th>Actions</th></tr></thead>
            <tbody>
              {builds.map(b => (
                <tr key={b.slug}>
                  <td>{b.build_number}</td>
                  <td>{b.slug}</td>
                  <td>{b.status_text || b.status}</td>
                  <td>{b.branch}</td>
                  <td>{b.triggered_workflow}</td>
                  <td>
                    <button onClick={() => loadLog(b.slug)}>Log & AI fix</button>
                    <button onClick={() => triggerBuild(selectedApp, { branch: b.branch || "main", workflow_id: b.triggered_workflow })}>Rebuild</button>
                    <button onClick={() => abortBuild(selectedApp, b.slug, "Abort from dashboard")}>Abort</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedBuild && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
              <div>
                <h4>Root Cause</h4>
                <pre style={{ whiteSpace: "pre-wrap" }}>{analysis}</pre>
              </div>
              <div>
                <h4>Suggested Fix</h4>
                <pre style={{ whiteSpace: "pre-wrap" }}>{suggestion}</pre>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}