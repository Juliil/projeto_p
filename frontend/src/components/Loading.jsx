import { useEffect } from "react";

export default function Loading({ onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone && onDone(), 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="loading">
      <svg viewBox="0 0 120 124" xmlns="http://www.w3.org/2000/svg">
        {/* alça */}
        <path className="hz-stroke hz-draw" d="M44 58 C44 34 76 34 76 58" />
        {/* corpo da bolsa */}
        <path className="hz-stroke hz-draw" d="M32 58 H88 L93 106 H27 Z" />
        {/* aba abrindo */}
        <g className="hz-flap">
          <path className="hz-stroke hz-flap-fill" d="M32 58 H88 V72 Q60 84 32 72 Z" />
        </g>
      </svg>
      <div className="msg">Seja forte, seja <b>Hazak</b></div>
    </div>
  );
}
