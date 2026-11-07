import React from "react";
import { AbsoluteFill, Img, staticFile, interpolate, Easing } from "remotion";

// The next page of the book falls from its top edge (the binding) onto the current page: a rigid sheet rotating
// about the top edge, from nearly edge-on (towards the viewer) down to flat. It throws a shadow on the page
// below, shows its paper edge, and the binding gutter darkens. The whole frame never rotates.
export function fallAngle(t: number, t0: number, dur = 0.75) {
  return interpolate(t, [t0, t0 + dur], [86, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.5, 0, 0.25, 1) });
}
export const PageFall: React.FC<{ src: string; t: number; t0: number; dur?: number }> = ({ src, t, t0, dur = 0.75 }) => {
  if (t < t0) return null;
  const a = fallAngle(t, t0, dur), r = (a * Math.PI) / 180, landed = a < 0.05;
  // where the falling page's bottom edge appears (for the shadow it throws on the page below)
  const P = 4224, eyeY = 324, yEdge = (() => { const z = 1080 * Math.sin(r), y = 1080 * Math.cos(r); return eyeY + (y - eyeY) * (P / (P - z)); })();
  const s = Math.sin(r);
  return (
    <AbsoluteFill style={{ perspective: P, perspectiveOrigin: `960px ${eyeY}px` }}>
      {/* shadow of the falling sheet on the page below: darkest just under its edge */}
      {!landed && <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: Math.min(1080, yEdge + 160 * s + 30),
        background: `linear-gradient(rgba(40,15,35,${0.25 + 0.2 * s}), rgba(40,15,35,${0.35 * s + 0.08}) ${Math.max(1, yEdge)}px, rgba(40,15,35,0) ${Math.min(1080, yEdge + 160 * s + 30)}px)` }} />}
      <AbsoluteFill style={{ transformOrigin: "50% 0%", transform: landed ? "none" : `rotateX(${a}deg)`, backfaceVisibility: "hidden" }}>
        <Img src={staticFile(src)} style={{ width: 1920, height: 1080, display: "block" }} />
        {/* light falling off while the sheet is still tilted towards the viewer */}
        {!landed && <AbsoluteFill style={{ background: `rgba(40,20,40,${0.32 * s})` }} />}
        {/* the sheet's paper edge (bottom) */}
        {!landed && <div style={{ position: "absolute", left: 0, bottom: 0, width: 1920, height: 5 + 6 * s, background: `rgba(255,248,240,${0.95 - 0.4 * (1 - s)})` }} />}
      </AbsoluteFill>
      {/* binding gutter */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 24, background: "linear-gradient(rgba(40,15,35,.32), rgba(40,15,35,0))" }} />
    </AbsoluteFill>
  );
};
