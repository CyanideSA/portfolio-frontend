import React, { useEffect, useRef, useState } from "react";
import { createStompClient } from "../api/chatClient";
import { playChime } from "../chat/sound";

const LS_KEY = "live_chat_state_v1";

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "null");
  } catch {
    return null;
  }
}

function saveState(s) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {}
}

function makeRoomId() {
  return "room_" + crypto.randomUUID();
}

function normalizeAdminStatus(v) {
  if (!v) return "ADMIN_AWAY";
  if (v === "ADMIN_OFFLINE") return "ADMIN_AWAY";
  return v;
}

export default function LiveChatWidget({ inlineOnContact = false }) {
  const initial = loadState();

  const [roomId] = useState(initial?.roomId || makeRoomId());
  const [started, setStarted] = useState(!!initial?.started);
  const [minimized, setMinimized] = useState(!!initial?.minimized);

  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [text, setText] = useState("");

  const [adminStatus, setAdminStatus] = useState(
    normalizeAdminStatus(initial?.adminStatus || "ADMIN_AWAY")
  );
  const [messages, setMessages] = useState(initial?.messages || []);

  const stompRef = useRef(null);
  const roomSubRef = useRef(null);

  // refs to avoid stale closure
  const startedRef = useRef(started);
  const nameRef = useRef(name);
  const emailRef = useRef(email);

  useEffect(() => {
    startedRef.current = started;
  }, [started]);
  useEffect(() => {
    nameRef.current = name;
  }, [name]);
  useEffect(() => {
    emailRef.current = email;
  }, [email]);

  const open = started && !minimized;

  // ✅ DEDUPE (must be inside component)
  const seenIdsRef = useRef(new Set());

  function keyOf(m) {
    return m?.id || `${m?.ts || 0}|${m?.from || ""}|${m?.text || ""}`;
  }

  function markSeen(m) {
    const k = keyOf(m);
    if (seenIdsRef.current.has(k)) return false;
    seenIdsRef.current.add(k);
    return true;
  }

  // seed dedupe set from persisted messages once
  useEffect(() => {
    try {
      (messages || []).forEach((m) => seenIdsRef.current.add(keyOf(m)));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist
  useEffect(() => {
    saveState({ roomId, started, minimized, name, email, adminStatus, messages });
  }, [roomId, started, minimized, name, email, adminStatus, messages]);

  // connect WS (once)
  useEffect(() => {
    const client = createStompClient({
      onPresence: (p) => {
        if (!p) return;

        const t = p?.type;
        const value = p?.text || p?.status;

        if ((t === "STATUS" || t === "ADMIN_STATUS") && value) {
          setAdminStatus(normalizeAdminStatus(value));
        }
      },

      onConnected: (stomp) => {
        stompRef.current = stomp;

        // ask for current status immediately
        try {
          stomp.publish({ destination: "/app/presence/ping", body: "{}" });
        } catch {}

        // re-subscribe on every connect/reconnect
        try {
          roomSubRef.current?.unsubscribe?.();
        } catch {}

        roomSubRef.current = stomp.subscribe(`/topic/chat/${roomId}`, (frame) => {
          try {
            const msg = JSON.parse(frame.body);

            // status message from backend into the room
            if (msg?.type === "STATUS") {
              if (msg?.text) setAdminStatus(normalizeAdminStatus(msg.text));
              return;
            }

            // ✅ DEDUPE server echoes / duplicates
            if (!markSeen(msg)) return;

            setMessages((prev) => [...prev, msg].slice(-200));
            if (msg?.from === "admin") playChime();
          } catch {
            // ignore bad frames
          }
        });

        // if chat already started, announce join (backend replies with STATUS too)
        if (startedRef.current && nameRef.current && emailRef.current) {
          stomp.publish({
            destination: "/app/chat/join",
            body: JSON.stringify({
              roomId,
              name: nameRef.current,
              email: emailRef.current,
            }),
          });
        }
      },
    });

    return () => {
      try {
        roomSubRef.current?.unsubscribe?.();
      } catch {}
      try {
        client.deactivate();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when user clicks Start, publish join as soon as WS is connected
  useEffect(() => {
    const stomp = stompRef.current;
    if (!started) return;
    if (!name.trim() || !email.trim()) return;

    if (stomp?.connected) {
      // ping again (optional)
      try {
        stomp.publish({ destination: "/app/presence/ping", body: "{}" });
      } catch {}

      stomp.publish({
        destination: "/app/chat/join",
        body: JSON.stringify({ roomId, name, email }),
      });
    }
  }, [started, name, email, roomId]);

  function startChat(e) {
    e?.preventDefault?.();
    if (!name.trim() || !email.trim()) return;
    setStarted(true);
    setMinimized(false);
  }

  function sendMessage(e) {
    e?.preventDefault?.();
    const msgText = text.trim();
    if (!msgText) return;

    // ✅ Give it an id so echo can be deduped
    const outgoing = {
      id: crypto.randomUUID(),
      roomId,
      from: "visitor",
      name,
      email,
      text: msgText,
      ts: Date.now(),
      type: "MSG",
    };

    // mark as seen so server echo won't duplicate
    markSeen(outgoing);

    setMessages((prev) => [...prev, outgoing].slice(-200));
    setText("");

    const stomp = stompRef.current;
    if (stomp?.connected) {
      stomp.publish({
        destination: "/app/chat/visitorSend",
        body: JSON.stringify(outgoing),
      });
    }
  }

  function togglePanel() {
    if (!started) return;
    setMinimized((v) => !v);
  }

  const isOnline = adminStatus === "ADMIN_ONLINE";
  const statusLabel = isOnline ? "Admin: Online" : "Admin: Away";
  const statusDot = isOnline ? "online" : "away";

  if (!started && !inlineOnContact) return null;

  if (!started && inlineOnContact) {
    return (
      <div className="chatInline">
        <div className="chatInlineHead">
          <div className={`chatDot ${statusDot}`} />
          <div className="chatInlineTitle">Live Chat</div>
          <div className="chatInlineStatus">{statusLabel}</div>
        </div>

        <form className="chatInlineForm" onSubmit={startChat}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" required />
          <button className="chatStartBtn" type="submit">
            Start chat
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={`chatFloat ${open ? "open" : "closed"} started`}>
      <button
        type="button"
        className={`chatFab ${open ? "open" : ""}`}
        onClick={togglePanel}
        aria-label="Live chat"
        title="Live chat"
      >
        <span className="chatIcon" aria-hidden="true">
          💬
        </span>
      </button>

      <div className={`chatPanel ${open ? "show" : ""}`}>
        <div className="chatHeader">
          <div className="chatHeaderLeft">
            <div className={`chatDot ${statusDot}`} />
            <div className="chatTitle">Live Chat</div>
            <div className="chatStatus">{statusLabel}</div>
          </div>
          <button type="button" className="chatClose" onClick={() => setMinimized(true)}>
            ✕
          </button>
        </div>

        <div className="chatBody">
          {messages.map((m, i) => (
            <div key={m?.id || i} className={`chatMsg ${m.from === "admin" ? "fromAdmin" : "fromVisitor"}`}>
              <div className="bubble">
                <div className="bubbleText">{m.text}</div>
                <div className="bubbleTime">
                  {new Date(m.ts || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
        </div>

        <form className="chatComposer" onSubmit={sendMessage}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
