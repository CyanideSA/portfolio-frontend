export function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();

    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();

    o1.type = "sine";
    o2.type = "triangle";

    o1.frequency.value = 740; // F#5-ish
    o2.frequency.value = 554; // C#5-ish

    g.gain.value = 0.0001;

    o1.connect(g);
    o2.connect(g);
    g.connect(ctx.destination);

    const now = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    o1.start(now);
    o2.start(now);
    o1.stop(now + 0.38);
    o2.stop(now + 0.38);

    setTimeout(() => ctx.close(), 450);
  } catch {
    // ignore (browser autoplay rules etc.)
  }
}
