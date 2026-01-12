// LiveChat.jsx (ADMIN) — FULL REWRITE (copy-paste)
// ✅ Rooms + messages persist when you leave /admin/live-chat and come back
// ✅ Admin can log out/in and still see all rooms/messages
// ✅ Admin receives messages from ALL rooms (auto-subscribes)
// ✅ Admin sending uses REST (/api/admin/chat/rooms/{roomId}/send) secured by Basic Auth
// ✅ Visitor sending stays via STOMP (/app/chat/visitorSend)
// ✅ No illegal hooks inside functions

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard.jsx";
import SectionTitle from "../components/SectionTitle.jsx";

import { api, setAdminAuth } from "../api/client.js";
import { createStompClient, subscribeToRoom } from "../api/chatClient.js";

function toBasicAuth(user, pass) {
  return "Basic " + btoa(`${user}:${pass}`);
}

async function validateAdminAuth(authHeader) {
  const res = await api.get("/admin/ping", {
    headers: { Authorization: authHeader },
    validateStatus: () => true,
  });
  return res.status !== 401 && res.status !== 403;
}

// ------------------- persistent cache -------------------
const CACHE_KEY = "admin_livechat_cache_v2";
const MAX_MSGS_PER_ROOM = 300;

function safeReadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeWriteCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
}

function msgKey(m) {
  // Works even if backend doesn’t send id (but yours does)
  return m?.id || `${m?.ts || 0}|${m?.from || ""}|${m?.text || ""}`;
}

export default function LiveChat() {
  const nav = useNavigate();

  // ---- STOMP refs
  const stompRef = useRef(null);
  const roomSubsRef = useRef(new Map()); // roomId -> subscription

  // ---- Dedup + history tracking
  const seenRef = useRef(new Map()); // roomId -> Set(keys)
  const loadedHistoryRef = useRef(new Set()); // roomId -> loaded once

  // ---- Keep latest state in refs for callbacks
  const roomsRef = useRef([]);
  const activeRoomRef = useRef("");

  // ---- Login form
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  // ---- Admin session
  const [auth, setAuth] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginStatus, setLoginStatus] = useState("");
  const [connected, setConnected] = useState(false);

  // ---- Data
  const [rooms, setRooms] = useState([]); // [{roomId,name,email,lastTs}]
  const [activeRoomId, setActiveRoomId] = useState("");
  const [messagesByRoom, setMessagesByRoom] = useState({}); // roomId -> messages[]
  const [watchRoomId, setWatchRoomId] = useState("");
  const [replyText, setReplyText] = useState("");

  // keep refs in sync
  useEffect(() => {
    roomsRef.current = rooms;
  }, [rooms]);

  useEffect(() => {
    activeRoomRef.current = activeRoomId;
  }, [activeRoomId]);

  const candidateAuth = useMemo(() => {
    if (!user || !pass) return "";
    return toBasicAuth(user, pass);
  }, [user, pass]);

  // ------------------- cache restore (runs once) -------------------
  useEffect(() => {
    const cached = safeReadCache();
    if (!cached) return;

    if (Array.isArray(cached.rooms)) setRooms(cached.rooms);
    if (cached.activeRoomId) setActiveRoomId(cached.activeRoomId);

    if (cached.messagesByRoom && typeof cached.messagesByRoom === "object") {
      setMessagesByRoom(cached.messagesByRoom);

      // rebuild dedupe sets
      try {
        Object.entries(cached.messagesByRoom).forEach(([rid, msgs]) => {
          const set = new Set();
          (msgs || []).forEach((m) => set.add(msgKey(m)));
          seenRef.current.set(rid, set);
        });
      } catch {}
    }
  }, []);

  // persist cache
  useEffect(() => {
    safeWriteCache({ rooms, activeRoomId, messagesByRoom });
  }, [rooms, activeRoomId, messagesByRoom]);

  // ------------------- helpers -------------------
  function ensureSeenSet(roomId) {
    if (!roomId) return null;
    if (!seenRef.current.has(roomId)) seenRef.current.set(roomId, new Set());
    return seenRef.current.get(roomId);
  }

  function addOrUpdateRoom(meta) {
    const roomId = meta?.roomId;
    if (!roomId) return;
    const now = Date.now();

    setRooms((prev) => {
      const exists = prev.some((r) => r.roomId === roomId);

      const next = exists
        ? prev.map((r) =>
            r.roomId === roomId
              ? {
                  ...r,
                  ...meta,
                  lastTs: Math.max(r.lastTs || 0, meta.lastTs || 0, now),
                }
              : r
          )
        : [{ ...meta, lastTs: meta.lastTs || now }, ...prev];

      next.sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0));
      return next;
    });

    setActiveRoomId((cur) => cur || roomId);
  }

  function pushMessage(roomId, msg) {
    if (!roomId) return;

    const key = msgKey(msg);
    const seen = ensureSeenSet(roomId);
    if (seen?.has(key)) return;
    seen?.add(key);

    setMessagesByRoom((prev) => {
      const list = prev[roomId] || [];
      const next = [...list, msg].slice(-MAX_MSGS_PER_ROOM);
      return { ...prev, [roomId]: next };
    });

    // bump lastTs/order
    setRooms((prev) =>
      prev
        .map((r) => (r.roomId === roomId ? { ...r, lastTs: Date.now() } : r))
        .sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0))
    );
  }

  async function fetchRoomsFromBackend() {
    const res = await api.get("/admin/chat/rooms", { validateStatus: () => true });
    if (!(res.status >= 200 && res.status < 300) || !Array.isArray(res.data)) return;

    res.data.forEach((r) =>
      addOrUpdateRoom({
        roomId: r.roomId,
        name: r.name,
        email: r.email,
        lastTs: r.lastTs || Date.now(),
      })
    );

    // subscribe to all rooms so admin receives all messages
    res.data.forEach((r) => ensureRoomSubscription(r.roomId));
  }

  async function fetchRoomHistory(roomId) {
    if (!roomId) return;
    if (loadedHistoryRef.current.has(roomId)) return;

    const res = await api.get(`/admin/chat/rooms/${roomId}/messages`, { validateStatus: () => true });
    if (!(res.status >= 200 && res.status < 300) || !Array.isArray(res.data)) return;

    loadedHistoryRef.current.add(roomId);

    const seen = ensureSeenSet(roomId);
    res.data.forEach((m) => seen?.add(msgKey(m)));

    setMessagesByRoom((prev) => ({
      ...prev,
      [roomId]: res.data.slice(-MAX_MSGS_PER_ROOM),
    }));
  }

  function ensureRoomSubscription(roomId) {
    const client = stompRef.current;
    if (!client?.connected || !roomId) return;
    if (roomSubsRef.current.has(roomId)) return;

    const sub = subscribeToRoom(client, roomId, (msg) => {
      const rid = msg?.roomId || roomId;
      if (msg?.type === "STATUS") return;

      pushMessage(rid, msg);

      // keep visitor meta up to date
      if (msg?.name || msg?.email) {
        addOrUpdateRoom({
          roomId: rid,
          name: msg?.name,
          email: msg?.email,
          lastTs: msg?.ts || Date.now(),
        });
      }
    });

    if (sub) roomSubsRef.current.set(roomId, sub);
  }

  function cleanupWs() {
    try {
      stompRef.current?.deactivate?.();
    } catch {}
    stompRef.current = null;

    roomSubsRef.current.forEach((sub) => {
      try {
        sub?.unsubscribe?.();
      } catch {}
    });
    roomSubsRef.current.clear();

    setConnected(false);
  }

  function connectWs(authHeader) {
    cleanupWs();

    createStompClient({
      authHeader,
      onConnected: async (stomp) => {

        stompRef.current = stomp;
        setConnected(true);

        // ✅ Subscribe to join announcements
        stomp.subscribe("/topic/chat/join", (frame) => {
          try {
            const ev = JSON.parse(frame.body);
            if (!ev?.roomId) return;

            addOrUpdateRoom({
              roomId: ev.roomId,
              name: ev?.name,
              email: ev?.email,
              lastTs: ev?.ts || Date.now(),
            });

            ensureRoomSubscription(ev.roomId);
          } catch {}
        });

        // ✅ Re-subscribe to cached rooms (so old rooms still receive messages)
        roomsRef.current.forEach((r) => ensureRoomSubscription(r.roomId));

        // ✅ Reload rooms from backend (source of truth)
        try {
          await fetchRoomsFromBackend();
        } catch {}

        // ✅ Subscribe active room + load its history
        const cur = activeRoomRef.current;
        if (cur) {
          ensureRoomSubscription(cur);
          fetchRoomHistory(cur).catch(() => {});
        }

        // ✅ Also load history for ALL known rooms once (optional but useful)
        roomsRef.current.forEach((r) => fetchRoomHistory(r.roomId).catch(() => {}));
      },

      onPresence: (p) => {
        // optional: for debugging/admin UI
        if (p?.type === "STATUS" && p?.text) {
         console.log("[PRESENCE]", p.text, p.ts);
        }

        if (p?.type === "JOIN" && p?.roomId) {
          addOrUpdateRoom({
            roomId: p.roomId,
            name: p?.name,
            email: p?.email,
            lastTs: p?.ts || Date.now(),
          });
          ensureRoomSubscription(p.roomId);
        }
      },
    });
  }

  // ------------------- session restore on mount -------------------
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_basic_auth");
    if (!saved) return;

    let cancelled = false;

    (async () => {
      setLoginStatus("Restoring admin session...");
      try {
        const ok = await validateAdminAuth(saved);
        if (cancelled) return;

        if (!ok) {
          sessionStorage.removeItem("admin_basic_auth");
          setLoginStatus("Session expired. Please log in again.");
          return;
        }

        setAuth(saved);
        setAdminAuth(saved);
        setLoggedIn(true);
        setLoginStatus("");

        // ✅ Load rooms/messages immediately even before WS (optional)
        try {
          await fetchRoomsFromBackend();
        } catch {}

        connectWs(saved);
      } catch {
        if (!cancelled) setLoginStatus("❌ Could not reach backend!");
      }
    })();

    return () => {
      cancelled = true;
      cleanupWs();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onLogin(e) {
    e.preventDefault();
    setLoginStatus("Logging in...");

    if (!candidateAuth) {
      setLoginStatus("❌ Enter username and password");
      return;
    }

    try {
      const ok = await validateAdminAuth(candidateAuth);
      if (!ok) {
        setLoginStatus("❌ Wrong username or password");
        return;
      }

      setAuth(candidateAuth);
      setAdminAuth(candidateAuth);
      setLoggedIn(true);
      sessionStorage.setItem("admin_basic_auth", candidateAuth);
      setLoginStatus("");

      // ✅ Load rooms as soon as logged in
      try {
        await fetchRoomsFromBackend();
      } catch {}

      connectWs(candidateAuth);
    } catch {
      setLoginStatus("❌ Could not reach backend!");
    }
  }

  function onLogout() {
    cleanupWs();
    setLoggedIn(false);
    setAuth("");
    setAdminAuth("");
    sessionStorage.removeItem("admin_basic_auth");
    setLoginStatus("");

    // ✅ DO NOT clear local cache — rooms/messages stay visible
    nav("/admin");
  }

  // When admin selects a room: ensure subscription + history
  useEffect(() => {
    if (!connected || !activeRoomId) return;
    ensureRoomSubscription(activeRoomId);
    fetchRoomHistory(activeRoomId).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoomId, connected]);

  // ------------------- sending (REST secured) -------------------
    async function sendAdminMessage(e) {
    e?.preventDefault?.();
    const text = replyText.trim();
    if (!text || !activeRoomId) return;

    const id = crypto.randomUUID(); // ✅ keep same id

    // optimistic UI
    pushMessage(activeRoomId, {
      id,
      roomId: activeRoomId,
      from: "admin",
      text,
      ts: Date.now(),
      type: "MSG",
    });

    setReplyText("");

    // ✅ send same id so echo can dedupe
    await api.post(
      `/admin/chat/rooms/${activeRoomId}/send`,
      { id, text },
      { validateStatus: () => true }
    );
  }


  // ------------------- UI -------------------
  if (!loggedIn) {
    return (
      <div className="space-y-6">
        <SectionTitle eyebrow="ADMIN" title="Live Chat (Admin)" subtitle="Rooms/messages persist across navigation." />

        <GlassCard className="p-6 space-y-4">
          <form onSubmit={onLogin} className="space-y-3">
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
              placeholder="username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoComplete="username"
            />
            <input
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
              placeholder="password"
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
            />
            <button type="submit" className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2">
              Login
            </button>

            {loginStatus && <div className="text-sm text-white/70">{loginStatus}</div>}
          </form>
        </GlassCard>
      </div>
    );
  }

  const activeMessages = activeRoomId ? messagesByRoom[activeRoomId] || [] : [];

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="ADMIN"
        title="Live Chat (Admin)"
        subtitle={connected ? "Connected ✅" : "Connecting..."}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => nav("/admin")}
          className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2"
          type="button"
        >
          Back to Admin
        </button>

        <button
          onClick={onLogout}
          className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2"
          type="button"
        >
          Logout
        </button>

        <button
          onClick={() => fetchRoomsFromBackend().catch(() => {})}
          className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2"
          type="button"
        >
          Refresh rooms
        </button>

        <div className="text-sm text-white/70">
          Rooms: {rooms.length} {connected ? "(live)" : "(offline)"}
        </div>
      </div>

      {/* Manual watch */}
      <GlassCard className="p-6 space-y-3">
        <div className="font-semibold">Watch a room (manual)</div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
            placeholder="room_... (paste roomId)"
            value={watchRoomId}
            onChange={(e) => setWatchRoomId(e.target.value)}
          />
          <button
            type="button"
            className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2"
            onClick={() => {
              const id = watchRoomId.trim();
              if (!id) return;

              addOrUpdateRoom({ roomId: id, lastTs: Date.now() });
              ensureRoomSubscription(id);
              setActiveRoomId(id);
              fetchRoomHistory(id).catch(() => {});
            }}
          >
            Watch
          </button>
        </div>
        <div className="text-xs text-white/50">
          Visitor roomId is in localStorage <code>live_chat_state_v1</code> → <code>roomId</code>.
        </div>
      </GlassCard>

      {/* Rooms */}
      <GlassCard className="p-6 space-y-3">
        <div className="font-semibold">Rooms</div>

        {rooms.length === 0 ? (
          <div className="text-sm text-white/60">
            No rooms yet. When a visitor starts chat, it will appear here.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {rooms.map((r) => (
              <button
                key={r.roomId}
                type="button"
                onClick={() => setActiveRoomId(r.roomId)}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  activeRoomId === r.roomId
                    ? "bg-white/15 border-white/20"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}
              >
                <div className="font-semibold">{r.roomId}</div>
                {(r.name || r.email) && (
                  <div className="text-xs text-white/60">
                    {r.name || ""} {r.email ? `(${r.email})` : ""}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Messages + composer */}
      <GlassCard className="p-6 space-y-3">
        <div className="font-semibold">Messages {activeRoomId ? `— ${activeRoomId}` : ""}</div>

        <div className="space-y-2 max-h-[420px] overflow-auto pr-2">
          {activeMessages.length === 0 ? (
            <div className="text-sm text-white/60">
              {activeRoomId ? "No messages yet for this room." : "Select a room to view messages."}
            </div>
          ) : (
            activeMessages.map((m, idx) => (
              <div key={idx} className="rounded-xl bg-white/5 border border-white/10 p-3">
                <div className="text-xs text-white/50">
                  {m?.from ? `From: ${m.from}` : "Message"}
                  {m?.ts ? ` • ${new Date(m.ts).toLocaleTimeString()}` : ""}
                </div>
                <div className="text-sm">{m?.text ?? JSON.stringify(m)}</div>
              </div>
            ))
          )}
        </div>

        {activeRoomId && (
          <form className="flex gap-2" onSubmit={sendAdminMessage}>
            <input
              className="flex-1 rounded-xl bg-white/5 border border-white/10 px-4 py-3 outline-none"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type reply to visitor..."
            />
            <button
              type="submit"
              className="rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2"
            >
              Send
            </button>
          </form>
        )}

        <div className="text-xs text-white/50">Auth in use: {auth ? "✅ loaded" : "❌ missing"}</div>
      </GlassCard>
    </div>
  );
}
