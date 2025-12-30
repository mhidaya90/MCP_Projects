
import { useMcp } from 'use-mcp/react';

export function usePortalMcp(serverUrl: string) {
  const mcp = useMcp({
    url: serverUrl,
    clientName: 'WebPortalDashboardReact',
    autoReconnect: true,
  });
  return mcp; // { state, error, tools, resources, callTool, readResource, retry, authenticate }
}