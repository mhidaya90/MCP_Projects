
# backend/app.py

from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import bitrise_client as bc
import httpx
import os
from fastapi import HTTPException
from llm_service import analyze_log, suggest_fix


app = FastAPI(title="Bitrise DevOps Assistant (Ollama)")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class TriggerReq(BaseModel):
    branch: str = "main"
    workflow_id: str | None = None
    envs: dict[str, str] | None = None

# @app.get("/api/apps")
# async def apps(): return await bc.list_apps()

@app.get("/config")
def config():
    return {
        "BITRISE_TOKEN_set": bool(os.getenv("BITRISE_TOKEN")),
        "LLM_URL": os.getenv("LLM_URL"),
        "MODEL_NAME": os.getenv("MODEL_NAME")
    }

@app.get("/health")
def health():  # quick check
    return {"ok": True}

@app.get("/api/apps")
async def apps():
    try:
        return await bc.list_apps()
    except httpx.HTTPStatusError as e:
        # Forward Bitrise status code & message to frontend
        raise HTTPException(status_code=e.response.status_code,
                            detail={"error": "Bitrise API error", "text": e.response.text})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/apps/{app_slug}/builds")
async def builds(app_slug: str, limit: int = 50, branch: str | None = None,
                 workflow: str | None = None, status: int | None = None):
    return await bc.list_builds(app_slug, limit, branch, workflow, status)

@app.get("/api/apps/{app_slug}/builds/{build_slug}/log")
async def logs(app_slug: str, build_slug: str):
    data = await bc.get_build_log(app_slug, build_slug)
    # Handle Bitrise log response format:
    raw_text = ""
    if isinstance(data, dict):
        raw_text = data.get("log_chunks", [{}])[-1].get("chunk", "") if "log_chunks" in data else str(data)
    else:
        raw_text = str(data)
    return {
        "raw": data,
        "analysis": await analyze_log(raw_text),
        "suggestion": await suggest_fix(raw_text)
    }

@app.post("/api/apps/{app_slug}/builds")
async def trigger(app_slug: str, req: TriggerReq):
    return await bc.trigger_build(app_slug, req.branch, req.workflow_id, req.envs)

@app.post("/api/apps/{app_slug}/builds/{build_slug}/abort")
async def abort(app_slug: str, build_slug: str, reason: str = ""):
    return await bc.abort_build(app_slug, build_slug, reason)