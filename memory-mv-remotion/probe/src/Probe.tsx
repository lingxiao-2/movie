import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
// fixed camera; a paper stand hinged at its base (rotateX about the bottom edge); the next page falls from the top edge
const Stand: React.FC<{ src: string; x: number; h: number; t0: number; mirror?: boolean }> = ({ src, x, h, t0, mirror }) => {
  const f = useCurrentFrame();
  const a = interpolate(f, [t0, t0 + 10], [90, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.6)) });
  const lift = Math.cos((a * Math.PI) / 180);
  return (
    <div style={{ position: "absolute", left: x, bottom: 60, height: h, transformOrigin: "50% 100%", transform: `perspective(1800px) rotateX(${a}deg)`, transformStyle: "preserve-3d" }}>
      <Img src={staticFile(src)} style={{ height: h, transform: mirror ? "scaleX(-1)" : undefined, filter: `drop-shadow(0 ${6 + 8 * lift}px ${10 + 10 * lift}px rgba(60,25,50,.4))` }} />
    </div>
  );
};
export const Probe = () => {
  const f = useCurrentFrame();
  const fall = interpolate(f, [44, 62], [-88, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ background: "#2a1428" }}>
      <Img src={staticFile("bg_gate.png")} style={{ width: 1920, height: 1080 }} />
      <Stand src="m_norm.png" x={330} h={700} t0={4} />
      <Stand src="f_norm.png" x={1050} h={690} t0={10} mirror />
      {f >= 44 && (
        <AbsoluteFill style={{ transformOrigin: "50% 0%", transform: `perspective(2600px) rotateX(${fall}deg)` }}>
          <Img src={staticFile("bg_mall.png")} style={{ width: 1920, height: 1080 }} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
