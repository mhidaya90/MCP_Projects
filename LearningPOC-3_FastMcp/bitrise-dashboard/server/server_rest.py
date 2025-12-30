
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import typing as t
import json, urllib.parse, http.client
import ssl
import certifi


BITRISE_API_BASE = "https://api.bitrise.io/v0.1/"
TOKEN = os.getenv("BITRISE_API_TOKEN")
if not TOKEN:
    raise RuntimeError("BITRISE_API_TOKEN is not set.")

app = FastAPI(title="Bitrise REST for Dashboard")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def call_bitrise(method: str, path: str, body: t.Optional[dict]=None, query: t.Optional[dict]=None):
    if not path.startswith("/"):
        path = "/" + path
    # url = urllib.parse.urljoin(BITRISE_API_BASE, path)
    url = BITRISE_API_BASE.rstrip("/") + "/" + path.lstrip("/")
    print("URL:", url)
    if query:
        url_parts = list(urllib.parse.urlparse(url))
        q = dict(urllib.parse.parse_qsl(url_parts[4]))
        q.update({k: str(v) for k, v in query.items() if v is not None})
        url_parts[4] = urllib.parse.urlencode(q)
        url = urllib.parse.urlunparse(url_parts)
    parsed = urllib.parse.urlparse(url)
    print("URL with query:", parsed.geturl())
    context = ssl.create_default_context(cafile=certifi.where())
    conn = http.client.HTTPSConnection(parsed.netloc, timeout=25, context=context)
    headers = {
        "Authorization": TOKEN,     # Raw token per Bitrise docs. [3](https://fastmcp.wiki/en/getting-started/welcome)
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    payload = json.dumps(body) if body is not None else None
    path_with_query = parsed.path + (("?" + parsed.query) if parsed.query else "")
    # --- ALWAYS initialize and perform request ---
    resp = None
    data = b""
    try:
        conn.request(method, path_with_query, body=payload, headers=headers)
        resp = conn.getresponse()
        data = resp.read()  # bytes
    finally:
        conn.close()

        # conn.request(method, parsed.path + (("?" + parsed.query) if parsed.query else ""), body=payload, headers=headers)
        # resp = conn.getresponse()
        # data = resp.read()
        # conn.close()

    try:
        parsed_json = json.loads(data) if data else {}
    except Exception:
        parsed_json = {"raw": data.decode("utf-8", errors="replace")}

    # Surface Bitrise status codes to client instead of 500
    if resp.status >= 400:
        raise HTTPException(status_code=resp.status, detail=parsed_json)
    return parsed_json

@app.get("/api/apps")
def api_list_apps(limit: int = 50, next: t.Optional[str] = None):
    return call_bitrise("GET", "/apps", query={"limit": limit, "next": next})
    # GET /apps [2](https://bing.com/search?q=FastMCP+Model+Context+Protocol+Fast+MCP+GitHub)

@app.get("/api/apps/{app_slug}/builds")
def api_list_builds(app_slug: str, limit: int = 20, next: t.Optional[str] = None):
    return call_bitrise("GET", f"/apps/{app_slug}/builds", query={"limit": limit, "next": next})
    # GET /apps/{app}/builds [2](https://bing.com/search?q=FastMCP+Model+Context+Protocol+Fast+MCP+GitHub)

@app.post("/api/apps/{app_slug}/builds")
def api_trigger_build(app_slug: str, branch: str = "main", workflow_id: t.Optional[str] = None, commit_message: t.Optional[str] = None):
    body = {
        "hook_info": {"type": "bitrise"},                # required. [7](https://fastmcp.wiki/en/changelog)
        "build_params": {"branch": branch}
    }
    if workflow_id:
        body["build_params"]["workflow_id"] = workflow_id
    if commit_message:
        body["build_params"]["commit_message"] = commit_message
    return call_bitrise("POST", f"/apps/{app_slug}/builds", body=body)
    # POST /apps/{app}/builds [2](https://bing.com/search?q=FastMCP+Model+Context+Protocol+Fast+MCP+GitHub)

@app.get("/api/apps/{app_slug}/builds/{build_slug}")
def api_get_build(app_slug: str, build_slug: str):
    return call_bitrise("GET", f"/apps/{app_slug}/builds/{build_slug}")
    # GET /apps/{app}/builds/{build} [2](https://bing.com/search?q=FastMCP+Model+Context+Protocol+Fast+MCP+GitHub)

@app.get("/api/apps/{app_slug}/builds/{build_slug}/log")
def api_get_build_log(app_slug: str, build_slug: str):
    return call_bitrise("GET", f"/apps/{app_slug}/builds/{build_slug}/log")
    # GET /apps/{app}/builds/{build}/log [2](https://bing.com/search?q=FastMCP+Model+Context+Protocol+Fast+MCP+GitHub)

