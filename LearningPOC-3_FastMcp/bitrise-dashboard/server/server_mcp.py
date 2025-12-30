
# import os
# import json
# import typing as t
# import urllib.parse
# import http.client
# from fastmcp import FastMCP

# BITRISE_API_BASE = "https://api.bitrise.io/v0.1"   # v0.1 per Bitrise docs. [1](https://github.com/yjacquin/fast-mcp)
# TOKEN = os.getenv("BITRISE_API_TOKEN")
# if not TOKEN:
#     raise RuntimeError("BITRISE_API_TOKEN is not set.")

# mcp = FastMCP("Bitrise-MCP-POC 🚀")


# def _build_url(path: str, query: t.Optional[dict] = None) -> str:
#     url = BITRISE_API_BASE.rstrip("/") + "/" + path.lstrip("/")
#     if query:
#         parts = list(urllib.parse.urlparse(url))
#         q = dict(urllib.parse.parse_qsl(parts[4]))
#         q.update({k: str(v) for k, v in query.items() if v is not None})
#         parts[4] = urllib.parse.urlencode(q)
#         url = urllib.parse.urlunparse(parts)
#     return url


# def call_bitrise(method: str, path: str, body: t.Optional[dict] = None, query: t.Optional[dict] = None):
#     if not path.startswith("/"):
#         path = "/" + path
#     url = urllib.parse.urljoin(BITRISE_API_BASE, path)
#     if query:
#         url_parts = list(urllib.parse.urlparse(url))
#         q = dict(urllib.parse.parse_qsl(url_parts[4]))
#         q.update({k: str(v) for k, v in query.items() if v is not None})
#         url_parts[4] = urllib.parse.urlencode(q)
#         url = urllib.parse.urlunparse(url_parts)
#     parsed = urllib.parse.urlparse(url)
#     conn = http.client.HTTPSConnection(parsed.netloc, timeout=25)
#     headers = {
#         "Authorization": TOKEN,         # Raw token, no Bearer. [3](https://fastmcp.wiki/en/getting-started/welcome)
#         "Accept": "application/json",
#         "Content-Type": "application/json",
#     }
#     payload = json.dumps(body) if body is not None else None
#     conn.request(method, parsed.path + (("?" + parsed.query) if parsed.query else ""), body=payload, headers=headers)
#     resp = conn.getresponse()
#     data = resp.read()
#     conn.close()
#     j = json.loads(data) if data else {}
#     if resp.status >= 400:
#         raise RuntimeError(f"Bitrise API {resp.status} {resp.reason}: {j}")
#     return j

# @mcp.tool
# def list_apps(limit: int = 50, next: t.Optional[str] = None) -> dict:
#     """List apps accessible to your token."""
#     return call_bitrise("GET", "/apps", query={"limit": limit, "next": next})
#     # GET /apps [2](https://bing.com/search?q=FastMCP+Model+Context+Protocol+Fast+MCP+GitHub)

# @mcp.tool
# def list_builds(app_slug: str, limit: int = 20, next: t.Optional[str] = None) -> dict:
#     """List builds for a given app."""
#     return call_bitrise("GET", f"/apps/{app_slug}/builds", query={"limit": limit, "next": next})
#     # GET /apps/{app}/builds [2](https://bing.com/search?q=FastMCP+Model+Context+Protocol+Fast+MCP+GitHub)

# @mcp.tool
# def trigger_build(app_slug: str, branch: str = "main", workflow_id: t.Optional[str] = None, commit_message: t.Optional[str] = None) -> dict:
#     """Trigger a build; must include branch/tag/commit/workflow_id + hook_info.type='bitrise'."""
#     body = {
#         "hook_info": {"type": "bitrise"},     # required by Bitrise. [7](https://fastmcp.wiki/en/changelog)
#         "build_params": {"branch": branch}
#     }
#     if workflow_id:
#         body["build_params"]["workflow_id"] = workflow_id
#     if commit_message:
#         body["build_params"]["commit_message"] = commit_message
#     return call_bitrise("POST", f"/apps/{app_slug}/builds", body=body)
#     # POST /apps/{app}/builds [2](https://bing.com/search?q=FastMCP+Model+Context+Protocol+Fast+MCP+GitHub)

# @mcp.tool
# def get_build(app_slug: str, build_slug: str) -> dict:
#     """Get details for a specific build."""
#     return call_bitrise("GET", f"/apps/{app_slug}/builds/{build_slug}")
#     # GET /apps/{app}/builds/{build} [2](https://bing.com/search?q=FastMCP+Model+Context+Protocol+Fast+MCP+GitHub)

# @mcp.tool
# def get_build_log(app_slug: str, build_slug: str) -> dict:
#     """Get build log metadata/content."""
#     return call_bitrise("GET", f"/apps/{app_slug}/builds/{build_slug}/log")
#     # GET /apps/{app}/builds/{build}/log [2](https://bing.com/search?q=FastMCP+Model+Context+Protocol+Fast+MCP+GitHub)

# @mcp.resource("bitrise://apps")
# def apps_resource() -> dict:
#     """Expose apps as resource."""
#     return list_apps()

# @mcp.resource("bitrise://builds/{app_slug}")
# def builds_resource(app_slug: str) -> dict:
#     """Expose builds for an app as resource."""
#     return list_builds(app_slug=app_slug, limit=20)

# if __name__ == "__main__":
#     # MCP HTTP transport listens at /mcp on port 8000 by default for this run.
#     mcp.run(transport="http", host="127.0.0.1", port=8000)


# server.py (patched)
import os
import json
import typing as t
import urllib.parse
import http.client
import ssl
import certifi
from fastmcp import FastMCP

BITRISE_API_BASE = "https://api.bitrise.io/v0.1/"  # versioned base
TOKEN = os.getenv("BITRISE_API_TOKEN")
if not TOKEN:
    raise RuntimeError("BITRISE_API_TOKEN is not set.")

mcp = FastMCP("Bitrise-MCP-POC 🚀")

# ---------- URL builder (avoid urljoin dropping /v0.1) ----------
def _build_url(path: str, query: t.Optional[dict] = None) -> str:
    url = BITRISE_API_BASE.rstrip("/") + "/" + path.lstrip("/")
    if query:
        parts = list(urllib.parse.urlparse(url))
        q = dict(urllib.parse.parse_qsl(parts[4]))
        q.update({k: str(v) for k, v in query.items() if v is not None})
        parts[4] = urllib.parse.urlencode(q)
        url = urllib.parse.urlunparse(parts)
    return url

# ---------- Raw Bitrise call ----------
def call_bitrise(method: str, path: str, body: t.Optional[dict] = None, query: t.Optional[dict] = None) -> dict:
    url = _build_url(path, query)
    parsed = urllib.parse.urlparse(url)

    # macOS-friendly SSL context (avoids CERTIFICATE_VERIFY_FAILED)
    context = ssl.create_default_context(cafile=certifi.where())
    conn = http.client.HTTPSConnection(parsed.netloc, timeout=25, context=context)

    headers = {
        "Authorization": TOKEN,       # raw token (no 'Bearer')
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    payload = json.dumps(body) if body is not None else None
    path_with_query = parsed.path + (("?" + parsed.query) if parsed.query else "")

    try:
        conn.request(method, path_with_query, body=payload, headers=headers)
        resp = conn.getresponse()
        data = resp.read()
    finally:
        conn.close()

    try:
        j = json.loads(data) if data else {}
    except Exception:
        j = {"raw": data.decode("utf-8", errors="replace")}

    if resp.status >= 400:
        raise RuntimeError(f"Bitrise API {resp.status} {resp.reason}: {j}")

    return j

# ---------- HTTP helpers (plain Python functions) ----------
def bitrise_list_apps(limit: int = 50, next: t.Optional[str] = None) -> dict:
    return call_bitrise("GET", "apps", query={"limit": limit, "next": next})

def bitrise_list_builds(app_slug: str, limit: int = 20, next: t.Optional[str] = None) -> dict:
    return call_bitrise("GET", f"apps/{app_slug}/builds", query={"limit": limit, "next": next})

def bitrise_trigger_build(app_slug: str, branch: str = "main",
                          workflow_id: t.Optional[str] = None,
                          commit_message: t.Optional[str] = None) -> dict:
    body = {
        "hook_info": {"type": "bitrise"},
        "build_params": {"branch": branch}
    }
    if workflow_id:
        body["build_params"]["workflow_id"] = workflow_id
    if commit_message:
        body["build_params"]["commit_message"] = commit_message
    return call_bitrise("POST", f"apps/{app_slug}/builds", body=body)

def bitrise_get_build(app_slug: str, build_slug: str) -> dict:
    return call_bitrise("GET", f"apps/{app_slug}/builds/{build_slug}")

def bitrise_get_build_log(app_slug: str, build_slug: str) -> dict:
    return call_bitrise("GET", f"apps/{app_slug}/builds/{build_slug}/log")

# ---------- MCP tools (wrappers around helpers) ----------
@mcp.tool(name="list_apps")
def tool_list_apps(limit: int = 50, next: t.Optional[str] = None) -> dict:
    """List apps accessible to your token."""
    return bitrise_list_apps(limit=limit, next=next)

@mcp.tool(name="list_builds")
def tool_list_builds(app_slug: str, limit: int = 20, next: t.Optional[str] = None) -> dict:
    """List builds for a given app."""
    return bitrise_list_builds(app_slug=app_slug, limit=limit, next=next)

@mcp.tool(name="trigger_build")
def tool_trigger_build(app_slug: str, branch: str = "main",
                       workflow_id: t.Optional[str] = None,
                       commit_message: t.Optional[str] = None) -> dict:
    """Trigger a build on Bitrise."""
    return bitrise_trigger_build(app_slug=app_slug, branch=branch,
                                 workflow_id=workflow_id, commit_message=commit_message)

@mcp.tool(name="get_build")
def tool_get_build(app_slug: str, build_slug: str) -> dict:
    """Get build details."""
    return bitrise_get_build(app_slug=app_slug, build_slug=build_slug)

@mcp.tool(name="get_build_log")
def tool_get_build_log(app_slug: str, build_slug: str) -> dict:
    """Get build log metadata/content."""
    return bitrise_get_build_log(app_slug=app_slug, build_slug=build_slug)

# ---------- MCP resources (call helpers, NOT tool wrappers) ----------
@mcp.resource("bitrise://apps")
def apps_resource() -> dict:
    """Expose apps as a resource (read-only context)."""
    return bitrise_list_apps(limit=50)

@mcp.resource("bitrise://builds/{app_slug}")
def builds_resource(app_slug: str) -> dict:
    """Expose recent builds for an app as a resource."""
    return bitrise_list_builds(app_slug=app_slug, limit=20)

if __name__ == "__main__":
    # Keep MCP on port 8000
    mcp.run(transport="http", host="127.0.0.1", port=8000)
