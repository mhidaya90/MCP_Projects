
import express from 'express';
import { z } from 'zod';
import cors from 'cors';
import {
  McpServer,
  ResourceTemplate
} from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport }
  from '@modelcontextprotocol/sdk/server/streamableHttp.js';

const server = new McpServer({ name: 'web-portal-server', version: '1.0.0' });

server.registerTool('get_pipeline_status', {
  title: 'Pipeline Status',
  description: 'Returns pipeline counts by status',
  inputSchema: { },
  outputSchema: {
    successful: z.number(),
    inProgress: z.number(),
    awaitingReview: z.number(),
  }
}, async () => ({
  content: [{ type: 'text', text: JSON.stringify({ successful: 12, inProgress: 2, awaitingReview: 1 }) }],
  structuredContent: { successful: 12, inProgress: 2, awaitingReview: 1 }
}));

server.registerTool('get_security_findings', {
  title: 'Security Findings',
  description: 'Returns vulnerability counts by severity',
  inputSchema: { },
  outputSchema: { critical: z.number(), high: z.number(), medium: z.number(), low: z.number() }
}, async () => ({
  content: [{ type: 'text', text: JSON.stringify({ critical: 0, high: 2, medium: 5, low: 12 }) }],
  structuredContent: { critical: 0, high: 2, medium: 5, low: 12 }
}));

server.registerTool('get_compliance_status', {
  title: 'Compliance Status',
  description: 'Returns framework coverage & overall status',
  inputSchema: { },
  outputSchema: { nist: z.number(), owaspMasvs: z.number(), csaCcm: z.number(), overall: z.string() }
}, async () => ({
  content: [{ type: 'text', text: JSON.stringify({ nist: 94, owaspMasvs: 88, csaCcm: 91, overall: 'PASS' }) }],
  structuredContent: { nist: 94, owaspMasvs: 88, csaCcm: 91, overall: 'PASS' }
}));

server.registerTool('get_store_status', {
  title: 'Store Status',
  description: 'Returns store states',
  inputSchema: { },
  outputSchema: {
    appStore: z.string(), testFlight: z.string(), googlePlay: z.string(), internalTesting: z.string()
  }
}, async () => ({
  content: [{ type: 'text', text: JSON.stringify({ appStore: 'Ready', testFlight: 'Active', googlePlay: 'Beta', internalTesting: 'Active' }) }],
  structuredContent: { appStore: 'Ready', testFlight: 'Active', googlePlay: 'Beta', internalTesting: 'Active' }
}));

server.registerTool('get_recent_activities', {
  title: 'Recent Activities',
  description: 'Returns recent DevSecOps items',
  inputSchema: { },
  outputSchema: { items: z.array(z.string()) }
}, async () => ({
  content: [{ type: 'text', text: JSON.stringify({
    items: [
      'iOS build submitted to App Store',
      'Security scan completed',
      'Android release pending approval',
      'SBOM generation in progress'
    ]
  }) }],
  structuredContent: {
    items: [
      'iOS build submitted to App Store',
      'Security scan completed',
      'Android release pending approval',
      'SBOM generation in progress'
    ]
  }
}));

server.registerTool('get_role_access', {
  title: 'Team Role Access',
  description: 'Returns role access notes',
  inputSchema: { },
  outputSchema: { developer: z.string(), qa: z.string(), release: z.string(), secops: z.string() }
}, async () => ({
  content: [{ type: 'text', text: JSON.stringify({
    developer: 'View pipelines, view code scans',
    qa: 'Trigger tests, view findings',
    release: 'Manage releases, promote stages',
    secops: 'Full security access'
  }) }],
  structuredContent: {
    developer: 'View pipelines, view code scans',
    qa: 'Trigger tests, view findings',
    release: 'Manage releases, promote stages',
    secops: 'Full security access'
  }
}));

// Optional resource
server.registerResource(
  'portal-info',
  new ResourceTemplate('portal://info', { list: undefined }),
  { title: 'Portal Info', description: 'Static portal metadata' },
  async (uri) => ({ contents: [{ uri: uri.href, text: `Web Portal Dashboard` }] })
);

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json());
// app.post('/mcp', async (req, res) => {
//   const transport = new StreamableHTTPServerTransport({ enableJsonResponse: true });
//   res.on('close', () => transport.close());
//   await server.connect(transport);
//   await transport.handleRequest(req, res, req.body);
// });

app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ enableJsonResponse: true });

  // Optional: satisfy strict TS configs
  transport.onclose = transport.onclose ?? (() => {});
  res.on('close', () => transport.onclose!());

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});


// app.get('/mcp', (_req, res) => {
//   res.status(200).json({ ok: true, message: 'MCP endpoint expects POST requests with JSON body' });
// });


const port = parseInt(process.env.PORT || '3000');
app.listen(port, () =>
  console.log(`MCP server running at http://localhost:${port}/mcp`)
);
