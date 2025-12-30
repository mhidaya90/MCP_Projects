
// import { useEffect, useMemo, useState } from 'react';
// import { Header } from './components/Header';
// import { Card } from './components/Card';
// import { Badge } from './components/Badge';
// import { SectionGrid } from './components/SectionGrid';
// import { ListItem } from './components/ListItem';
// import { useMcp } from 'use-mcp/react';

// export default function App() {
//   // Use absolute same-origin URL if you proxied /mcp in Vite
//   const mcpUrl = `${window.location.origin}/mcp`;

//   const { state, error, callTool, retry, authenticate } = useMcp({
//     url: mcpUrl,
//     clientName: 'WebPortalDashboardReact',
//     autoReconnect: true,
//   });

//   // Data states
//   const [pipeline, setPipeline] = useState<{ successful: number; inProgress: number; awaitingReview: number } | null>(null);
//   const [sec, setSec] = useState<{ critical: number; high: number; medium: number; low: number } | null>(null);
//   const [comp, setComp] = useState<{ nist: number; owaspMasvs: number; csaCcm: number; overall: string } | null>(null);
//   const [store, setStore] = useState<{ appStore: string; testFlight: string; googlePlay: string; internalTesting: string } | null>(null);
//   const [activities, setActivities] = useState<string[] | null>(null);
//   const [roles, setRoles] = useState<{ developer: string; qa: string; release: string; secops: string } | null>(null);
//   const [serverUrlVisible, setServerUrlVisible] = useState(false); // hide input in final UI

//   // Fetch data when ready
//   useEffect(() => {
//     const fetchAll = async () => {
//       try {
//         const p = await callTool('get_pipeline_status', {});
//         const s = await callTool('get_security_findings', {});
//         const c = await callTool('get_compliance_status', {});
//         const st = await callTool('get_store_status', {});
//         const a = await callTool('get_recent_activities', {});
//         const r = await callTool('get_role_access', {});
//         setPipeline((p as any)?.structuredContent);
//         setSec((s as any)?.structuredContent);
//         setComp((c as any)?.structuredContent);
//         setStore((st as any)?.structuredContent);
//         setActivities((a as any)?.structuredContent?.items ?? []);
//         setRoles((r as any)?.structuredContent);
//       } catch {
//         // If server goes down, you can keep fallback values for demo
//         setPipeline({ successful: 12, inProgress: 2, awaitingReview: 1 });
//         setSec({ critical: 0, high: 2, medium: 5, low: 12 });
//         setComp({ nist: 94, owaspMasvs: 88, csaCcm: 91, overall: 'PASS' });
//         setStore({ appStore: 'Ready', testFlight: 'Active', googlePlay: 'Beta', internalTesting: 'Active' });
//         setActivities([
//           'iOS build submitted to App Store',
//           'Security scan completed',
//           'Android release pending approval',
//           'SBOM generation in progress',
//         ]);
//         setRoles({
//           developer: 'View pipelines, view code scans',
//           qa: 'Trigger tests, view findings',
//           release: 'Manage releases, promote stages',
//           secops: 'Full security access',
//         });
//       }
//     };
//     if (state === 'ready') fetchAll();
//   }, [state, callTool]);

//   const subtitle = useMemo(() => 'AI-Assisted DevOps Portal with MCP Integration', []);

//   const connecting = state !== 'ready';

//   return (
//     <div className="p-8">
//       <Header title="Web Portal Dashboard" subtitle={subtitle} />

//       {/* (Optional) Server URL / Status row (hide in final screenshot) */}
//       <div className="mb-6 flex items-center gap-3">
//         {serverUrlVisible && (
//           <input
//             className="w-full max-w-md rounded-lg border px-3 py-2 bg-white/95"
//             placeholder="MCP server URL"
//             defaultValue={mcpUrl}
//             readOnly
//           />
//         )}
//         <Badge text={connecting ? 'Connecting…' : 'Connected'} tone={connecting ? 'info' : 'success'} />
//       </div>

//       <SectionGrid>
//         <Card title="Pipeline Status">
//           {pipeline ? (
//             <div className="space-y-2">
//               <Badge text={`✓ ${pipeline.successful} Successful`} tone="success" />
//               <Badge text={`⚠️ ${pipeline.inProgress} In Progress`} tone="warning" />
//               <Badge text={`ℹ️ ${pipeline.awaitingReview} Awaiting Review`} tone="info" />
//             </div>
//           ) : <div className="text-gray-500">Loading…</div>}
//         </Card>

//         <Card title="Security Findings">
//           {sec ? (
//             <div className="space-y-1">
//               <div>Critical: {sec.critical}</div>
//               <div>High: {sec.high}</div>
//               <div>Medium: {sec.medium}</div>
//               <div>Low: {sec.low}</div>
//             </div>
//           ) : <div className="text-gray-500">Loading…</div>}
//         </Card>

//         <Card title="Compliance Status">
//           {comp ? (
//             <div className="space-y-1">
//               <div> NIST Controls: <b>{comp.nist}%</b></div>
//               <div> MASVS Coverage: <b>{comp.owaspMasvs}%</b></div>
//               <div> CSA CCM: <b>{comp.csaCcm}%</b></div>
//               <div className="mt-1"> Overall: <Badge text={comp.overall === 'PASS' ? '✓ PASS' : '✗ FAIL'} tone={comp.overall === 'PASS' ? 'success' : 'danger'} /></div>
//             </div>
//           ) : <div className="text-gray-500">Loading…</div>}
//         </Card>

//         <Card title="Store Status">
//           {store ? (
//             <div className="space-y-1">
//               <div> App Store: <Badge text={store.appStore} tone="success" /></div>
//               <div> TestFlight: <Badge text={store.testFlight} tone="info" /></div>
//               <div> Google Play: <Badge text={store.googlePlay} tone="warning" /></div>
//               <div> Internal Testing: <Badge text={store.internalTesting} tone="info" /></div>
//             </div>
//           ) : <div className="text-gray-500">Loading…</div>}
//         </Card>

//         <Card title="Recent Activities">
//           {activities ? (
//             <div className="space-y-1">
//               {activities.map((item, idx) => (
//                 <ListItem key={idx}>{item}</ListItem>
//               ))}
//             </div>
//           ) : <div className="text-gray-500">Loading…</div>}
//         </Card>

//         <Card title="Team Role Access">
//           {roles ? (
//             <div className="space-y-1">
//               <ListItem><b>Developer:</b> {roles.developer}</ListItem>
//               <ListItem><b>QA:</b> {roles.qa}</ListItem>
//               <ListItem><b>Release:</b> {roles.release}</ListItem>
//               <ListItem><b>SecOps:</b> {roles.secops}</ListItem>
//             </div>
//           ) : <div className="text-gray-500">Loading…</div>}
//         </Card>
//       </SectionGrid>
//     </div>
//   );
// }

import { useEffect, useMemo, useState } from 'react';
import { useMcp } from 'use-mcp/react';

export default function App() {
  const mcpUrl = `${window.location.origin}/mcp`;
  const { state, error, callTool, retry, authenticate } = useMcp({
    url: mcpUrl,
    clientName: 'WebPortalDashboardReact',
    autoReconnect: true,
  });

  const [pipeline, setPipeline] = useState<{ successful: number; inProgress: number; awaitingReview: number } | null>(null);
  const [sec, setSec] = useState<{ critical: number; high: number; medium: number; low: number } | null>(null);
  const [comp, setComp] = useState<{ nist: number; owaspMasvs: number; csaCcm: number; overall: string } | null>(null);
  const [store, setStore] = useState<{ appStore: string; testFlight: string; googlePlay: string; internalTesting: string } | null>(null);
  const [activities, setActivities] = useState<string[] | null>(null);
  const [roles, setRoles] = useState<{ developer: string; qa: string; release: string; secops: string } | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const p = await callTool('get_pipeline_status', {});
        const s = await callTool('get_security_findings', {});
        const c = await callTool('get_compliance_status', {});
        const st = await callTool('get_store_status', {});
        const a = await callTool('get_recent_activities', {});
        const r = await callTool('get_role_access', {});
        setPipeline((p as any)?.structuredContent);
        setSec((s as any)?.structuredContent);
        setComp((c as any)?.structuredContent);
        setStore((st as any)?.structuredContent);
        setActivities((a as any)?.structuredContent?.items ?? []);
        setRoles((r as any)?.structuredContent);
      } catch {
        // optional fallback
        setPipeline({ successful: 12, inProgress: 2, awaitingReview: 1 });
        setSec({ critical: 0, high: 2, medium: 5, low: 12 });
        setComp({ nist: 94, owaspMasvs: 88, csaCcm: 91, overall: 'PASS' });
        setStore({ appStore: 'Ready', testFlight: 'Active', googlePlay: 'Beta', internalTesting: 'Active' });
        setActivities([
          'iOS build submitted to App Store',
          'Security scan completed',
          'Android release pending approval',
          'SBOM generation in progress',
        ]);
        setRoles({
          developer: 'View pipelines, view code scans',
          qa: 'Trigger tests, view findings',
          release: 'Manage releases, promote stages',
          secops: 'Full security access',
        });
      }
    };
    if (state === 'ready') fetchAll();
  }, [state, callTool]);

  const subtitle = useMemo(() => 'AI-Assisted DevOps Portal with MCP Integration', []);
  const connecting = state !== 'ready';

  return (
    <div className="app">
      <div className="header">
        <h1>🚀 Web Portal Dashboard</h1>
        <p>{subtitle}</p>
      </div>

      <div className="statusRow">
        <span className={`badge ${connecting ? 'info' : 'success'}`}>
          {connecting ? 'Connecting…' : 'Connected'}
        </span>
        <span className="muted">{mcpUrl}</span>
      </div>

      <div className="grid">
        {/* Pipeline Status */}
        <div className="card">
          <div className="cardTitle">Pipeline Status</div>
          <div className="cardBody">
            {!pipeline ? 'Loading…' : (
              <div className="badges">
                <span className="badge success">✓ {pipeline.successful} Successful</span>
                <span className="badge warning">⚠️ {pipeline.inProgress} In Progress</span>
                <span className="badge info">ℹ️ {pipeline.awaitingReview} Awaiting Review</span>
              </div>
            )}
          </div>
        </div>

        {/* Security Findings */}
        <div className="card">
          <div className="cardTitle">Security Findings</div>
          <div className="cardBody">
            {!sec ? 'Loading…' : (
              <>
                <div>Critical: {sec.critical}</div>
                <div>High: {sec.high}</div>
                <div>Medium: {sec.medium}</div>
                <div>Low: {sec.low}</div>
              </>
            )}
          </div>
        </div>

        {/* Compliance Status */}
        <div className="card">
          <div className="cardTitle">Compliance Status</div>
          <div className="cardBody">
            {!comp ? 'Loading…' : (
              <>
                <div>NIST Controls: <b>{comp.nist}%</b></div>
                <div>MASVS Coverage: <b>{comp.owaspMasvs}%</b></div>
                <div>CSA CCM: <b>{comp.csaCcm}%</b></div>
                <div className="mt8">Overall: <span className="statusPill">{comp.overall === 'PASS' ? '✓ PASS' : '✗ FAIL'}</span></div>
              </>
            )}
          </div>
        </div>

        {/* Store Status */}
        <div className="card">
          <div className="cardTitle">Store Status</div>
          <div className="cardBody">
            {!store ? 'Loading…' : (
              <div className="list">
                <div>App Store: <span className="badge success">{store.appStore}</span></div>
                <div>TestFlight: <span className="badge info">{store.testFlight}</span></div>
                <div>Google Play: <span className="badge warning">{store.googlePlay}</span></div>
                <div>Internal Testing: <span className="badge info">{store.internalTesting}</span></div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="card">
          <div className="cardTitle">Recent Activities</div>
          <div className="cardBody">
            {!activities ? 'Loading…' : (
              <div className="list">
                {activities.map((a, i) => (
                  <div className="listItem" key={i}>
                    <span className="listDot" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Team Role Access */}
        <div className="card">
          <div className="cardTitle">Team Role Access</div>
          <div className="cardBody">
            {!roles ? 'Loading…' : (
              <div className="list">
                <div className="listItem"><span className="listDot" /><span><b>Developer:</b> {roles.developer}</span></div>
                <div className="listItem"><span className="listDot" /><span><b>QA:</b> {roles.qa}</span></div>
                <div className="listItem"><span className="listDot" /><span><b>Release:</b> {roles.release}</span></div>
                <div className="listItem"><span className="listDot" /><span><b>SecOps:</b> {roles.secops}</span></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}