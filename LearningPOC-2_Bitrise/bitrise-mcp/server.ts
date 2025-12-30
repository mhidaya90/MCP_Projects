import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import {
  McpServer,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  StreamableHTTPServerTransport
} from '@modelcontextprotocol/sdk/server/streamableHttp.js';

// ---- Boot logs
console.log('[BOOT] Starting Bitrise MCP server ...');

// ---- Env checks
const PORT = parseInt(process.env.PORT || '4000', 10);
const BITRISE_TOKEN = process.env.BITRISE_TOKEN;
const BITRISE_API_BASE = process.env.BITRISE_API_BASE || 'https://api.bitrise.io/v0.1';

if (!BITRISE_TOKEN) {
  console.warn('[WARN] BITRISE_TOKEN is not set. Tools that call Bitrise will fail until you add it to .env');
}
console.log(`[BOOT] PORT=${PORT}, BITRISE_API_BASE=${BITRISE_API_BASE}`);

// ---- Node fetch availability (Node 18+ has global fetch)
const hasFetch = typeof (globalThis as any).fetch === 'function';
if (!hasFetch) {
  console.error('[ERROR] global fetch is not available. Use Node >= 18, or add node-fetch.');
  process.exit(1);
}

// ---- Helper: Bitrise GET
async function apiGet(path: string, query?: Record<string, string | number | boolean>) {
  if (!BITRISE_TOKEN) throw new Error('Missing BITRISE_TOKEN');
 
  const BASE = BITRISE_API_BASE.endsWith('/') ? BITRISE_API_BASE : BITRISE_API_BASE + '/';
  const relativePath = path.replace(/^\/+/, '');
  const url = new URL(relativePath, BASE);
  console.log(`[Bitrise API] GET ${url.toString()}`);
  Object.entries(query ?? {}).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const res = await fetch(url.toString(), {
    headers: {
      'Authorization': BITRISE_TOKEN,
      'accept': 'application/json'
    }
  });

  if (!res.ok) {
    const body = await res.text();
    console.log(res);
    console.error(`[Bitrise API] ${res.status} ${res.statusText}: ${body}`);
    throw new Error(`Bitrise API error ${res.status}`);
  }

  return res.json();
}

// ---- MCP server
const mcp = new McpServer({ name: 'bitrise-mcp', version: '1.0.0' });

// Tool: list_apps
mcp.registerTool(
  'list_apps',
  {
    title: 'List Bitrise apps',
    description: 'Returns the accessible application list',
    inputSchema: { limit: z.number().optional(), next: z.string().optional(), sortBy: z.string().optional() },
    outputSchema: { apps: z.array(z.object({ slug: z.string(), title: z.string().optional() })), next: z.string().optional() }
  },
  async ({ limit = 50, next, sortBy = 'last_build_at' }) => {
    const q: Record<string, string | number | boolean> = { limit, sort_by: sortBy };
    if (next) q.next = next;
    const json = await apiGet('/apps', q);
    const apps = (json.data ?? []).map((a: any) => ({ slug: a.slug, title: a.title ?? a.project_type ?? a.slug }));
    return { content: [{ type: 'text', text: JSON.stringify({ apps, next: json.next }) }], structuredContent: { apps, next: json.next } };
  }
);

// Tool: build_status_summary
mcp.registerTool(
  'build_status_summary',
  {
    title: 'Build status summary',
    description: 'Aggregate latest pipeline/build statuses for an app',
    inputSchema: { appSlug: z.string(), limit: z.number().optional(), after: z.string().optional(), before: z.string().optional() },
    outputSchema: { counts: z.object({
      on_hold: z.number(), running: z.number(), succeeded: z.number(),
      failed: z.number(), aborted: z.number(), succeeded_with_abort: z.number()
    }) }
  },
  async ({ appSlug, limit = 30, after, before }) => {
    const q: Record<string, string | number | boolean> = { limit };
    if (after) q.after = after;
    if (before) q.before = before;
    const json = await apiGet(`/apps/${appSlug}/builds`, q);
    console.log(json);
    const items = json.data ?? [];
    const counts = { on_hold: 0, running: 0, succeeded: 0, failed: 0, aborted: 0, succeeded_with_abort: 0 };
    for (const i of items) {
      const s = String(i.status_text || i.status_name || i.status);
      switch (s) {
        case 'on_hold': counts.on_hold++; break;
        case 'running': counts.running++; break;
        case 'success': counts.succeeded++; break;
        case 'error': counts.failed++; break;
        case 'aborted': counts.aborted++; break;
        case 'succeeded_with_abort': counts.succeeded_with_abort++; break;
        default: break;
      }
    }
    return { content: [{ type: 'text', text: JSON.stringify({ counts }) }], structuredContent: { counts } };
  }
);

// Tool: list_builds
mcp.registerTool(
  'list_builds',
  {
    title: 'List builds for app',
    description: 'Returns recent builds of an app with status details',
    inputSchema: { appSlug: z.string(), limit: z.number().optional(), branch: z.string().optional(), workflow: z.string().optional() },
    outputSchema: { builds: z.array(z.object({
      slug: z.string(),
      status_text: z.string().optional(),
      status: z.number().optional(),
      build_number: z.number().optional(),
      triggered_at: z.string().optional(),
      finished_at: z.string().optional(),
      is_on_hold: z.boolean().optional(),
      branch: z.string().optional(),
      triggered_workflow: z.string().optional()
    })) }
  },
  async ({ appSlug, limit = 20, branch, workflow }) => {
    const q: Record<string, string | number> = { limit };
    if (branch) q.branch = branch;
    if (workflow) q.workflow = workflow;
    const json = await apiGet(`/apps/${appSlug}/builds`, q);
    const builds = (json.data ?? []).map((b: any) => ({
      slug: b.slug, status_text: b.status_text, status: b.status,
      build_number: b.build_number, triggered_at: b.triggered_at,
      finished_at: b.finished_at, is_on_hold: b.is_on_hold,
      branch: b.branch, triggered_workflow: b.triggered_workflow
    }));
    return { content: [{ type: 'text', text: JSON.stringify({ builds }) }], structuredContent: { builds } };
  }
);

// ---- Express app
const app = express();

// CORS for CRA dev server
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// MCP endpoint
app.post('/mcp', async (req, res) => {
  console.log('[REQ] /mcp', { bodyKeys: Object.keys(req.body || {}) });
  const transport = new StreamableHTTPServerTransport({ enableJsonResponse: true });

  // satisfy strict typings when exactOptionalPropertyTypes is on
  transport.onclose = transport.onclose ?? (() => { console.log('[TRANSPORT] onclose'); });

  res.on('close', () => transport.onclose!());

  try {
    await mcp.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('[ERROR] handleRequest failed', err);
    res.status(500).json({ error: String(err) });
  }
});

// ---- Global error/exit handlers
process.on('uncaughtException', (e) => {
  console.error('[uncaughtException]', e);
});
process.on('unhandledRejection', (e) => {
  console.error('[unhandledRejection]', e);
});

// ---- Start listening (with error handler)
const server = app.listen(PORT, () => {
  console.log(`[BOOT] MCP server on http://localhost:${PORT}/mcp`);
}).on('error', (err) => {
  console.error('[LISTEN ERROR]', err);
  process.exit(1);
});
