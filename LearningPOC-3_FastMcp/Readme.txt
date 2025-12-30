Enable virtual environment for Python development both rest and mcp:
    python3 -m venv .venv && source .venv/bin/activate   

Run Rest Server:
    export BITRISE_API_TOKEN=""  
    uvicorn server_rest:app --host 127.0.0.1 --port 8001 --reload


Run MCP Server:
    export BITRISE_API_TOKEN=""  
    python3 -m pip install certifi 
    python3 server_mcp.py

Run Web:(FastApi Testing)
    npm start

MCP Inspector:
    npx @modelcontextprotocol/inspector