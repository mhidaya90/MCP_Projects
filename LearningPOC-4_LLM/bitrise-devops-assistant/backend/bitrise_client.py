
# backend/bitrise_client.py
import os, httpx, certifi

BASE = "https://api.bitrise.io/v0.1"
TOKEN = os.getenv("BITRISE_TOKEN")
headers = {"Authorization": TOKEN, "accept": "application/json"}

def _headers():
    token = os.getenv("BITRISE_TOKEN")
    if not token or not isinstance(token, str) or not token.strip():
        # Clear message instead of crashing with header NoneType
        raise ValueError("BITRISE_TOKEN is not set. Add it to backend/.env and load it before running.")
    return {"Authorization": token.strip(), "accept": "application/json"}

client_opts = dict(timeout=60, verify=certifi.where())

async def list_apps():
    async with httpx.AsyncClient(**client_opts) as client:
        r = await client.get(f"{BASE}/apps", headers=_headers())
        r.raise_for_status(); return r.json()

async def list_builds(app_slug: str, limit=50, branch=None, workflow=None, status=None):
    params = {"limit": limit}
    if branch: params["branch"] = branch
    if workflow: params["workflow"] = workflow
    if status is not None: params["status"] = status  # 0 not finished, 1 success, 2 failed, 3 aborted, 4 in-progress
    async with httpx.AsyncClient(**client_opts) as client:
        r = await client.get(f"{BASE}/apps/{app_slug}/builds", headers=headers, params=params)
        r.raise_for_status(); return r.json()

async def get_build_log(app_slug: str, build_slug: str):
    async with httpx.AsyncClient(timeout=120, verify=certifi.where()) as client:
        r = await client.get(f"{BASE}/apps/{app_slug}/builds/{build_slug}/log", headers=headers)
        r.raise_for_status(); return r.json()

async def trigger_build(app_slug: str, branch="main", workflow_id=None, envs=None):
    payload = {"hook_info": {"type": "bitrise"}, "build_params": {"branch": branch}}
    if workflow_id: payload["build_params"]["workflow_id"] = workflow_id
    if envs:
        payload["build_params"]["environments"] = [
            {"is_expand": True, "mapped_to": k, "value": v} for k, v in envs.items()
        ]
    async with httpx.AsyncClient(**client_opts) as client:
        r = await client.post(f"{BASE}/apps/{app_slug}/builds", headers=headers, json=payload)
        r.raise_for_status(); return r.json()

async def abort_build(app_slug: str, build_slug: str, reason=""):
    payload = {"abort_reason": reason, "abort_with_success": False}
    async with httpx.AsyncClient(**client_opts) as client:
        r = await client.post(f"{BASE}/apps/{app_slug}/builds/{build_slug}/abort", headers=headers, json=payload)
        r.raise_for_status(); return r.json()
