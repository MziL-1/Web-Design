"use client";

import { useMemo } from "react";

export default function StarField() {
  const stars = useMemo(
    () =>
      Array.from({ length: 420 }).map((_, i) => {
        const x = Math.random() * 1600;
        const y = Math.random() * 900;
        const angle = -25 + Math.random() * 8;
        const length = 10 + Math.random() * 60;
        const rad = (angle * Math.PI) / 180;
        const x2 = x + Math.cos(rad) * length;
        const y2 = y + Math.sin(rad) * length;

        return {
          id: i,
          x,
          y,
          x2,
          y2,
          opacity: 0.2 + Math.random() * 0.8,
          width: 0.4 + Math.random() * 1.4,
          delay: Math.random() * 4,
        };
      }),
    [],
  );

  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden bg-[#060816]"
      aria-hidden="true"
      onMouseMove={(e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        document.documentElement.style.setProperty("--mx", `${x}%`);
        document.documentElement.style.setProperty("--my", `${y}%`);
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1b2142_0%,#090b16_60%,#03050d_100%)]" />

      <div className="absolute inset-0 opacity-90 animate-[spin_180s_linear_infinite]">
        <svg viewBox="0 0 1600 900" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <filter id="star-glow">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#star-glow)">
            {stars.map((s) => (
              <line
                key={s.id}
                x1={s.x}
                y1={s.y}
                x2={s.x2}
                y2={s.y2}
                stroke="white"
                strokeWidth={s.width}
                strokeLinecap="round"
                opacity={s.opacity}
                className="animate-pulse"
                style={{
                  animationDelay: `${s.delay}s`,
                }}
              />
            ))}
          </g>
        </svg>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_var(--mx)_var(--my),rgba(255,255,255,0.06),transparent_22%)]" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  );
}
