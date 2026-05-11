type RealtimePayload = Record<string, unknown>;

let ioInstance: any = null;

export function initializeRealtime(server: any, corsOrigins?: string[]) {
  // Use runtime require so the backend still type-checks even before dependencies are installed locally.
  // Install `socket.io` in the workspace before running the server in production.
  let Server: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Server = require('socket.io').Server;
  } catch {
    console.warn('Realtime socket skipped: install socket.io in backend to enable live sync.');
    return null;
  }

  ioInstance = new Server(server, {
    cors: corsOrigins && corsOrigins.length > 0 ? { origin: corsOrigins } : { origin: '*' },
  });

  ioInstance.on('connection', (socket: any) => {
    socket.emit('realtime:ready', {
      connectedAt: new Date().toISOString(),
      scopes: ['hotel', 'office'],
    });
  });

  return ioInstance;
}

export function emitRealtime(event: string, payload: RealtimePayload) {
  ioInstance?.emit(event, {
    ...payload,
    emittedAt: new Date().toISOString(),
  });
}

export function emitDataSync(domain: 'hotel' | 'office', entity: string, action: string, path: string) {
  const payload = {
    domain,
    entity,
    action,
    path,
  };

  emitRealtime('sync:event', payload);
  emitRealtime(`sync:${domain}`, payload);
  emitRealtime(`sync:${domain}:${entity}`, payload);
}
