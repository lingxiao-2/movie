import React from "react";
import { Img, staticFile, interpolate, Easing } from "remotion";

// A complete paper stand hinged on its flat bottom edge (rigid card).
// Motion = rotation about the base line (CSS rotateX inside the stage's single perspective), translation along
// the page, and a small sway about the base centre. Never scaled non-uniformly, never warped.
// When upright and still, the picture is drawn with NO transform at all, so it is exactly as sharp as the PNG.
export type StandCue = { rise: number; fall?: number; riseDur?: number; fallDur?: number };
const RISE = 0.42, FALL = 0.3;

/** hinge angle in degrees: 90 = lying flat on the page, 0 = upright (slight lean-back overshoot on rising) */
export function hingeAngle(t: number, c: StandCue) {
  const r = c.riseDur ?? RISE, f = c.fallDur ?? FALL;
  if (t < c.rise) return 90;
  let a = interpolate(t, [c.rise, c.rise + r], [90, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.25)) });
  if (c.fall !== undefined && t >= c.fall) a = interpolate(t, [c.fall, c.fall + f], [0, 90], { extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  return a;
}

export const Stand: React.FC<{
  src: string; w: number; h: number;      // display size of the whole stand (same aspect as the PNG)
  x: number; base: number;                // left edge and base line (stage px, 1920×1080)
  angle: number;                          // hinge angle (deg)
  sway?: number;                          // deg about the base centre
  mirror?: boolean;
  visible?: boolean;
}> = ({ src, w, h, x, base, angle, sway = 0, mirror, visible = true }) => {
  if (!visible || angle >= 89.5) return null;
  const up = Math.cos((Math.max(0, angle) * Math.PI) / 180);          // 1 upright … 0 flat
  const still = Math.abs(angle) < 0.05 && Math.abs(sway) < 0.05;
  const img = staticFile(src);
  const flip = mirror ? "scaleX(-1)" : "";
  const shade = 1 - 0.25 * (1 - up);                                  // a tilted card catches less light
  return (
    <>
      {/* contact shadow where the base touches the page (on the page, not on the card) */}
      <div style={{ position: "absolute", left: x + w * 0.08, top: base - 14, width: w * 0.84, height: 28, borderRadius: "50%",
        background: "radial-gradient(closest-side, rgba(45,20,45,.55), rgba(45,20,45,0))", opacity: 0.25 + 0.4 * up }} />
      {/* the folded tab the stand is glued to: a strip of paper lying on the page in front of the base */}
      <div style={{ position: "absolute", left: x + w * 0.3, top: base - 2, width: w * 0.4, height: 11,
        background: "linear-gradient(#efe4d6, #e3d5c4)", clipPath: "polygon(3% 0, 97% 0, 100% 100%, 0 100%)",
        boxShadow: "0 1px 2px rgba(60,30,50,.35)", opacity: Math.min(1, (90 - angle) / 20) }} />
      {/* soft cast shadow on the scenery behind (key light upper-left), grows as the card stands up */}
      <div style={{ position: "absolute", left: x, top: base - h, width: w, height: h, transformOrigin: "50% 100%",
        transform: `translate(${14 * up}px, ${-4 * up}px) rotate(${sway}deg) rotateX(${Math.max(angle, 0) + 8 * (1 - up)}deg) ${flip}`,
        opacity: 0.2 * up, filter: "brightness(0) blur(9px)" }}>
        <Img src={img} style={{ width: w, height: h, display: "block" }} />
      </div>
      {/* the card: paper core (thickness) behind the printed face */}
      <div style={{ position: "absolute", left: x, top: base - h, width: w, height: h, transformOrigin: "50% 100%",
        transformStyle: "preserve-3d", transform: still ? "none" : `rotate(${sway}deg) rotateX(${angle}deg)` }}>
        <div style={{ position: "absolute", inset: 0, transform: `translate3d(2.5px, 3px, -3px) ${flip}`, filter: "brightness(.78) sepia(.25)" }}>
          <Img src={img} style={{ width: w, height: h, display: "block" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, transform: flip || undefined, filter: shade < 0.999 ? `brightness(${shade})` : undefined }}>
          <Img src={img} style={{ width: w, height: h, display: "block" }} />
        </div>
      </div>
    </>
  );
};
