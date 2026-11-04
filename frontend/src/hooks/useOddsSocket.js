import { useEffect, useRef, useState } from 'react';
import { API_URL } from '../api/client';

function toWsUrl() {
  try {
    // Same-origin (VITE_API_URL vacío): wss://host/ws o ws://host/ws
    if (!API_URL) {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//${window.location.host}/ws`;
    }
    const url = new URL(API_URL);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = '/ws';
    url.search = '';
    return url.toString();
  } catch {
    return 'ws://localhost:4000/ws';
  }
}

/**
 * Suscripción ligera a canales WS (odds / matches).
 * No tumba la UI si el socket falla.
 */
export function useOddsSocket(channels = ['odds', 'matches']) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    let closed = false;
    let retry;
    const connect = () => {
      try {
        const socket = new WebSocket(toWsUrl());
        socketRef.current = socket;
        socket.addEventListener('open', () => {
          if (closed) return;
          setConnected(true);
          socket.send(JSON.stringify({ type: 'subscribe', channels }));
        });
        socket.addEventListener('message', (event) => {
          try {
            setLastEvent(JSON.parse(event.data));
          } catch {
            /* ignore */
          }
        });
        socket.addEventListener('close', () => {
          setConnected(false);
          if (!closed) retry = setTimeout(connect, 4000);
        });
        socket.addEventListener('error', () => {
          socket.close();
        });
      } catch {
        setConnected(false);
      }
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      socketRef.current?.close();
    };
  }, [channels.join(',')]);

  return { connected, lastEvent };
}
