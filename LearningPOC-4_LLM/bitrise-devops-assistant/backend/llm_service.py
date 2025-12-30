
# backend/llm_service.py
import os, requests
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

LLM_URL   = os.getenv("LLM_URL", "http://localhost:11434/v1/chat/completions")
MODEL     = os.getenv("MODEL_NAME", "llama3.2:3b")
API_KEY   = os.getenv("LLM_API_KEY")  # not used for Ollama; required if pointing to hosted OpenAI

embed = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
try:
    vs = FAISS.load_local("rag_index", embeddings=embed, allow_dangerous_deserialization=True)
except Exception:
    vs = None

def _chat(system: str, user: str):
    payload = {
      "model": MODEL,
      "temperature": 0.2,
      "messages": [
        {"role":"system","content":system},
        {"role":"user","content":user}
      ]
    }
    headers = {}
    if API_KEY: headers["Authorization"] = f"Bearer {API_KEY}"  # for hosted providers
    r = requests.post(LLM_URL, json=payload, headers=headers, timeout=120)
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]

async def analyze_log(log_text: str):
    context = ""
    if vs:
        docs = vs.similarity_search(log_text, k=4)
        context = "\n\n".join([f"[{d.metadata.get('source')}]\n{d.page_content}" for d in docs])
    sys = "You are a DevOps assistant. Explain Bitrise build errors concisely and cite matching log snippets."
    usr = f"Build log:\n{log_text}\n\nRelevant context:\n{context}\nExplain root cause & impacted step."
    return _chat(sys, usr)

async def suggest_fix(log_text: str):
    context = ""
    if vs:
        docs = vs.similarity_search(log_text, k=4)
        context = "\n\n".join([d.page_content for d in docs])
    sys = "You suggest precise fixes for Bitrise/Android/iOS CI errors."
    usr = f"Log:\n{log_text}\n\nContext:\n{context}\nProvide step-by-step fix and commands."
    return _chat(sys, usr)