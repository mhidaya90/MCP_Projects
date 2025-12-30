
const BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8001/api";

export async function listApps(limit = 50, next) {
  const url = new URL(`${BASE}/apps`);
  if (limit) url.searchParams.set("limit", String(limit));
  if (next) url.searchParams.set("next", next);
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listBuilds(appSlug, limit = 20, next) {
  const url = new URL(`${BASE}/apps/${appSlug}/builds`);
  if (limit) url.searchParams.set("limit", String(limit));
  if (next) url.searchParams.set("next", next);
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function triggerBuild(appSlug, { branch = "main", workflow_id, commit_message } = {}) {
  const url = `${BASE}/apps/${appSlug}/builds`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ branch, workflow_id, commit_message })
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getBuild(appSlug, buildSlug) {
  const url = `${BASE}/apps/${appSlug}/builds/${buildSlug}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getBuildLog(appSlug, buildSlug) {
  const url = `${BASE}/apps/${appSlug}/builds/${buildSlug}/log`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
