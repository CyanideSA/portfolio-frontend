import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

/**
 * DEV: "/ws" (Vite proxy -> http://localhost:8081/ws)
 * PROD: VITE_WS_URL or Render URL
 *
 * FIX:
 * - DEV uses SockJS (works with Vite proxy)
 * - PROD uses native WebSocket (prevents SockJS /ws/info XHR -> fixes CORS)
 */
export function createStompClient({ onConnected, onPresence, authHeader } = {}) {
  const isDev = import.meta.env.DEV;

  const HTTP_BASE = isDev
    ? "/ws"
    : (import.meta.env?.VITE_WS_URL || "https://portfolio-f91h.onrender.com/ws");

  // ✅ Only admins will pass authHeader (or have it saved)
  const saved = sessionStorage.getItem("admin_basic_auth");
  const effectiveAuth = authHeader || saved || "";

 // ✅ For Spring SockJS endpoint, native WebSocket is /ws/websocket
  const HTTP_NATIVE = isDev ? null : `${HTTP_BASE.replace(/\/$/, "")}/websocket`;
  
   // ✅ Convert http(s) -> ws(s)
  const WS_NATIVE = !isDev
    ? HTTP_NATIVE.replace(/^https?:\/\//, (m) => (m === "https://" ? "wss://" : "ws://"))
    : null;

  const client = new Client({
    webSocketFactory: () => {
      // DEV: SockJS behind Vite proxy (works great locally)
      if (isDev) {
        return new SockJS(HTTP_BASE, null, { withCredentials: false });
      }

      // PROD: native ws to /ws/websocket (no SockJS /info XHR)
      return new WebSocket(WS_NATIVE);
    },

    reconnectDelay: 2000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,

    debug: (s) => console.log("[STOMP]", s),

    // ✅ Visitor -> empty. Admin -> Authorization header in STOMP CONNECT
    connectHeaders: effectiveAuth ? { Authorization: effectiveAuth } : {},
  });

  client.onConnect = () => {
    // subscribe presence on connect
    try {
      client.subscribe("/topic/presence", (frame) => {
        try {
          onPresence?.(JSON.parse(frame.body));
        } catch {}
      });
    } catch {}

    onConnected?.(client);
  };

  client.onWebSocketClose = (e) => console.log("[STOMP] ws closed", e);
  client.onWebSocketError = (e) => console.log("[STOMP] ws error", e);
  client.onStompError = (frame) =>
    console.log("[STOMP] stomp error", frame?.headers, frame?.body);

  client.activate();
  return client;
}

export function subscribeToRoom(client, roomId, onRoomMessage) {
  if (!client?.connected || !roomId) return null;

  return client.subscribe(`/topic/chat/${roomId}`, (frame) => {
    try {
      onRoomMessage?.(JSON.parse(frame.body));
    } catch {
      onRoomMessage?.(frame.body);
    }
  });
}
