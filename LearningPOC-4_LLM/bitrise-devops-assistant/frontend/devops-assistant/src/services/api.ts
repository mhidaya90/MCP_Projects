
export const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

export async function getApps() {
  const r = await fetch(`${API}/api/apps`); return r.json();
}

export async function getBuilds(appSlug: string, params: Record<string, string | number>) {
  const qs = new URLSearchParams(Object.entries(params).map(([k,v]) => [k, String(v)]));
  const r = await fetch(`${API}/api/apps/${appSlug}/builds?${qs.toString()}`);
  return r.json();
}

export async function getLog(appSlug: string, buildSlug: string) {
  const r = await fetch(`${API}/api/apps/${appSlug}/builds/${buildSlug}/log`);
  return r.json();
}

export async function triggerBuild(appSlug: string, body: {branch?: string; workflow_id?: string; envs?: Record<string,string>}) {
  const r = await fetch(`${API}/api/apps/${appSlug}/builds`, {
    method: "POST", headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });
  return r.json();
}

export async function abortBuild(appSlug: string, buildSlug: string, reason="") {
  const r = await fetch(`${API}/api/apps/${appSlug}/builds/${buildSlug}/abort?reason=${encodeURIComponent(reason)}`,
    { method: "POST" });
  return r.json();
}