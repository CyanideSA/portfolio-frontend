import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function WaterNav({ buttons = [], ensurePortfolioVisible }) {
  const nav = useNavigate();
  const location = useLocation();
  const [armed, setArmed] = useState(null);

  // auto-disarm after 2.5s
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(null), 2500);
    return () => clearTimeout(t);
  }, [armed]);

  // disarm on route change
  useEffect(() => {
    setArmed(null);
  }, [location.pathname]);

  function onTap(btn) {
    ensurePortfolioVisible?.();

    // 1st tap = arm
    if (armed !== btn.id) {
      setArmed(btn.id);
      return;
    }

    // 2nd tap = disarm first (animate), then navigate
    setArmed(null);
    window.setTimeout(() => {
      if (location.pathname !== btn.to) nav(btn.to);
    }, 240); // must match CSS transform transition time
  }

  return (
    <div className="waterNav" aria-label="Edge navigation">
      {buttons.map((btn) => {
        const initial = (btn.label?.trim()?.[0] ?? "?").toUpperCase();
        const isArmed = armed === btn.id;

        return (
          <button
            key={btn.id}
            type="button"
            className={`edgeBtn ${btn.pos} ${isArmed ? "armed" : ""}`}
            onClick={() => onTap(btn)}
            aria-label={btn.label}
          >
            <span className="edgeInitial">{initial}</span>

            {/* full-name bubble (shows only when armed) */}
            <span className={`edgeLabel ${isArmed ? "show" : ""}`}>
              {btn.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
