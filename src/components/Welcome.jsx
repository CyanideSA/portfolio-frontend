import React, { useEffect, useRef } from "react";
import suvoPhoto from "../assets/suvo.jpg";

export default function Welcome({ entered, onEnter }) {
  const startY = useRef(null);

  useEffect(() => {
    const onWheel = (e) => {
      if (!entered && e.deltaY > 10) onEnter();
    };

    const onTouchStart = (e) => {
      startY.current = e.touches?.[0]?.clientY ?? null;
    };

    const onTouchMove = (e) => {
      if (entered) return;
      const y = e.touches?.[0]?.clientY ?? null;
      if (startY.current == null || y == null) return;
      if (startY.current - y > 25) onEnter(); // swipe up
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [entered, onEnter]);

  return (
    <section className={`welcomePanel ${entered ? "hide" : ""}`}>
      {/* background image */}
      <div
        className="welcomeBg"
        style={{ backgroundImage: `url(${suvoPhoto})` }}
        aria-hidden="true"
      />
      <div className="welcomeShade" />

      <div className="welcomeCenter">
        <div className="welcomeCard">
          <div className="welcomeEmoji" aria-hidden="true">
            😄✨
          </div>

          <h1 className="welcomeTitle">Welcome to my Portfolio</h1>
          <div className="welcomeName">— Suvo Ahmed</div>
          <div className="welcomeSmiley">:)</div>

          <button className="welcomeHintBtn" onClick={onEnter} type="button">
            Slide / Scroll down ↓
          </button>
        </div>
      </div>
    </section>
  );
}
