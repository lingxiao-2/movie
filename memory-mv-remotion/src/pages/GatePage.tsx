import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { Stand, hingeAngle } from "../paper/Stand";
import { PageFall } from "../paper/PageFall";
import { Snow, Glow, Bokeh } from "../paper/Atmos";
import { BEATS, FPS, beatAt } from "../timeline";

// 第四幕 · 学校门口见面 — fixed camera, the whole paper stage is always in view.
// He stands up → she stands up → her bouquet pops up in front of her and is held out towards him →
// his stand folds down and the "stunned" pose stands up → bouquet, her, him fold down → the next page falls.
// No hug, no hand-holding. Sizes: all three people/props keep the V02 sheet's relative scale.
export const GATE_SONG_START = BEATS[beatAt(24.86)];              // first beat of the page (song seconds)
const b = (k: number) => BEATS[beatAt(24.86) + k] - GATE_SONG_START; // local time of the k-th beat of the page
export const GATE_CUES = {
  him: { rise: b(1), fall: b(9) - 0.42 },
  her: { rise: b(2), fall: b(14) },
  bouquet: { rise: b(4), fall: b(13) },
  handOver: [b(5), b(7)] as [number, number],
  stunned: { rise: b(9), fall: b(14) + 3 / FPS },
  pageFall: b(17) - 0.75,                                         // the next page lands on beat 17
  end: b(19),
};
export const GATE_FRAMES = Math.round(GATE_CUES.end * FPS);

import SIZES from "../sizes.json";
// stands are pre-scaled to their exact screen size (scripts/prescale.py): drawn 1:1, placed on whole pixels
const BASE = 1032;                   // the stands' base line on the pavement
const wh = (k: string) => { const [w, h] = (SIZES as Record<string, number[]>)[`gate/${k}`]; return { w, h }; };
const HIM_LEFT = Math.round(600 - wh("m_norm").w / 2);
const HER_CX = 1390;

export const GatePage: React.FC = () => {
  const t = useCurrentFrame() / FPS, C = GATE_CUES;
  const her = wh("f_norm"), bq = wh("bouquet");
  const hand = interpolate(t, C.handOver, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const bqCx = 1235 + (1085 - 1235) * hand, bqSway = Math.sin(Math.PI * hand) * -2.2 + Math.sin(t * 2.1) * 0.35 * (t > C.handOver[1] ? 1 : 0);
  const fadeIn = interpolate(t, [0, 0.25], [1, 0], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#2a1428", overflow: "hidden" }}>
      {/* the page: approved clean winter-night school gate, shown whole */}
      <Img src={staticFile("gate/bg_gate.png")} style={{ position: "absolute", width: 1920, height: 1080 }} />
      <Glow x={362} y={208} r={150} a={0.22 + 0.07 * Math.sin(t * 2.6)} />
      {/* the stage: one camera (perspective) for every stand on this page */}
      <AbsoluteFill style={{ perspective: 2200, perspectiveOrigin: "960px 380px" }}>
        <Stand src="gate/m_norm.png" {...wh("m_norm")} x={HIM_LEFT} base={BASE} angle={hingeAngle(t, C.him)} />
        <Stand src="gate/m_surp.png" {...wh("m_surp")} x={HIM_LEFT} base={BASE} angle={hingeAngle(t, C.stunned)} />
        <Stand src="gate/f_norm.png" {...her} x={Math.round(HER_CX - her.w / 2)} base={BASE} angle={hingeAngle(t, C.her)} mirror />
        <Stand src="gate/bouquet.png" {...bq} x={Math.round(bqCx - bq.w / 2)} base={BASE + 14} angle={hingeAngle(t, C.bouquet)} sway={bqSway} />
      </AbsoluteFill>
      <Snow t={t} n={60} />
      {/* soft vignette (no colour change of the art) */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(35,15,35,0) 55%, rgba(35,15,35,.22) 100%)" }} />
      <PageFall src="gate/bg_mall.png" t={t} t0={C.pageFall} />
      {/* the next page (mall) is alive as soon as it has landed */}
      {t > C.pageFall + 0.75 && <><Bokeh t={t} a={interpolate(t, [C.pageFall + 0.75, C.pageFall + 1.1], [0, 1], { extrapolateRight: "clamp" })} /><Snow t={t} n={30} /></>}
      {fadeIn > 0 && <AbsoluteFill style={{ background: `rgba(20,10,22,${fadeIn})` }} />}
    </AbsoluteFill>
  );
};
