import React from "react";
// deterministic snow and lamp light (driven only by the frame time; never by real time)
const rnd = (seed: number) => { let s = seed | 0; return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
export const Snow: React.FC<{ t: number; n?: number }> = ({ t, n = 70 }) => {
  const R = rnd(11), flakes: React.ReactElement[] = [];
  for (let i = 0; i < n; i++) { const z = R(), x0 = R() * 1920, y0 = R() * 1120, x = ((x0 + Math.sin(t * 0.7 + i) * 26 + t * 12 * z) % 1920 + 1920) % 1920, y = ((y0 + t * (26 + z * 60)) % 1120) - 20, r = 1.2 + z * 3;
    flakes.push(<div key={i} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", background: `rgba(255,255,255,${0.3 + z * 0.45})` }} />); }
  return <>{flakes}</>;
};
export const Glow: React.FC<{ x: number; y: number; r: number; a: number; rgb?: string }> = ({ x, y, r, a, rgb = "255,214,150" }) => (
  <div style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%", mixBlendMode: "screen",
    background: `radial-gradient(closest-side, rgba(${rgb},${a}), rgba(${rgb},0))` }} />
);
// warm shop-light bokeh, breathing (deterministic)
export const Bokeh: React.FC<{ t: number; n?: number; a?: number }> = ({ t, n = 14, a = 1 }) => {
  const R = rnd(47), out: React.ReactElement[] = [];
  for (let i = 0; i < n; i++) { const x = R() * 1920, y = R() * 760, r = 22 + R() * 46, k = (0.1 + 0.12 * R()) * (0.4 + 0.6 * Math.sin(t * (1.6 + R() * 2.2) + i)) * a;
    out.push(<Glow key={i} x={x + Math.sin(t * 0.4 + i) * 6} y={y} r={r} a={k} rgb="255,210,170" />); }
  return <>{out}</>;
};
