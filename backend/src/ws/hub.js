import { WebSocketServer } from 'ws';

let wss;

export function attachWebSockets(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (socket, request) => {
    const url = new URL(request.url, 'http://localhost');
    const token = url.searchParams.get('token');
    socket.meta = { token, subscribed: new Set(['public']) };

    socket.send(
      JSON.stringify({
        type: 'hello',
        channels: ['public', 'odds', 'matches', 'notifications'],
        at: new Date().toISOString(),
      }),
    );

    socket.on('message', (raw) => {
      try {
        const msg = JSON.parse(String(raw));
        if (msg.type === 'subscribe' && Array.isArray(msg.channels)) {
          for (const ch of msg.channels) socket.meta.subscribed.add(String(ch));
          socket.send(JSON.stringify({ type: 'subscribed', channels: [...socket.meta.subscribed] }));
        }
        if (msg.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong', at: Date.now() }));
        }
      } catch {
        socket.send(JSON.stringify({ type: 'error', error: 'JSON inválido' }));
      }
    });
  });

  return wss;
}

export function broadcast(channel, payload) {
  if (!wss) return;
  const message = JSON.stringify({ channel, ...payload, at: new Date().toISOString() });
  for (const client of wss.clients) {
    if (client.readyState !== 1) continue;
    if (!client.meta?.subscribed?.has(channel) && channel !== 'public') continue;
    client.send(message);
  }
}
