import { Hono } from 'hono';
import type { AppEnv } from '../env';

export const realtimeRouter = new Hono<AppEnv>();

realtimeRouter.get('/', async (c) => {
  // In a real Cloudflare Workers environment, we would use:
  // const upgradeHeader = c.req.header('Upgrade');
  // if (upgradeHeader !== 'websocket') return new Response('Expected Upgrade: websocket', { status: 426 });
  // ... and return a WebSocket Response bound to a Durable Object.
  
  return c.json({
    status: 'realtime_stub',
    message: 'WebSocket upgrade endpoint. Use ws://.../api/v1/realtime to connect.',
    supportedProtocols: ['lumibase-sync-v1']
  });
});
