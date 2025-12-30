ollama Services for macbook

 brew services start ollama
 brew services stops ollama

Backend:

python3 -m venv .venv && source .venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000