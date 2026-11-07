import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";

// Opening / ending of the anniversary film: ONE envelope, ONE approved card, ONE background.
// The ending is the very same scene played backwards (frame-exact mirror), so every motion is reversed.
// Fixed camera. Envelope = independent layers (lining · card · pocket · rigid two-sided flap · bow + seal).
// The cover is one rigid board opening on its own left fold line; it is never split, bent or redrawn. No text added.
export const ENV_FPS = 24, ENV_DUR = 6.75, ENV_FRAMES = Math.round(ENV_DUR * ENV_FPS);
const E = Easing.bezier(0.45, 0, 0.25, 1);          // gentle in-out, symmetric enough to play backwards
const io = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: E });
const lin = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const L = (a: number, b: number, u: number) => a + (b - a) * u;

// envelope geometry (env_open px) and placement
const EW = 951, FOLD = 356, K = 0.85;                 // stage px per envelope px
const EX = 960 - (EW * K) / 2, FOLD_Y = 342, EY = FOLD_Y - FOLD * K;
// bow (closed-envelope px): seal centre inside the bow image
const BOW_W = 635, BOW_H = 413, SEAL = [309, 100], BOW_K = 0.72;
// cover card (cover_obj canvas 1672×941); its hinge = the card's left edge
const CW = 1672, CH = 941, CTL = [97, 100], CBL = [150, 893], CTR = [1545, 22], CBR = [1640, 800];
const BETA = (Math.atan2(CBL[0] - CTL[0], CBL[1] - CTL[1]) * 180) / Math.PI;
const FULL = 1920 / CW;                               // the card filling the frame

export const EnvelopeScene: React.FC<{ reverse?: boolean }> = ({ reverse }) => {
  const f = useCurrentFrame(), t = reverse ? ENV_DUR - 1 / ENV_FPS - f / ENV_FPS : f / ENV_FPS;
  // ---- timeline (opening direction)
  const fadeIn = 1 - lin(t, 0, 0.4);
  const sealLift = io(t, 1.05, 1.28), bowAway = io(t, 1.28, 1.90);
  const flap = 180 * io(t, 1.85, 2.70);                              // 0 closed (hanging) → 180 open (pointing up)
  const rise = io(t, 2.60, 3.55);                                     // card slides up out of the pocket
  const go = io(t, 3.50, 4.50);                                       // envelope recedes, card comes forward to fill the frame
  const page = lin(t, 4.50, 4.70);                                    // the inner page appears under the cover
  const open = io(t, 4.80, 6.00);                                    // the cover opens on its fold
  // ---- envelope container: recedes down and back, then fades
  const envY = 520 * go, envS = 1 - 0.12 * go, envA = 1 - lin(t, 3.95, 4.5);
  // ---- card (cover object) position: inside the envelope → out → full frame
  const ci = 0.45, inX = 960 - 870 * ci, inY0 = 352, inY1 = -48;
  const cs = L(ci, FULL, go), cx = L(inX, 0, go), cy = L(L(inY0, inY1, rise), 0, go);
  const theta = 140 * open, coverA = 1 - interpolate(theta, [100, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cardInFront = flap > 90;                                     // the card is in front of the opened flap
  const flapInFront = flap <= 90;
  const flapT = `rotateX(${flap}deg)`;
  const Flap = (
    <div style={{ position: "absolute", left: 0, top: FOLD, width: EW, height: FOLD, transformOrigin: "50% 0", transformStyle: "preserve-3d", transform: flapT }}>
      <Img src={staticFile("envelope/flap_out.png")} style={{ position: "absolute", inset: 0, width: EW, height: FOLD, backfaceVisibility: "hidden", filter: `brightness(${1 - 0.18 * Math.sin((flap * Math.PI) / 180)})` }} />
      <Img src={staticFile("envelope/flap_in.png")} style={{ position: "absolute", inset: 0, width: EW, height: FOLD, backfaceVisibility: "hidden", transform: "rotateY(180deg)", filter: `brightness(${1 - 0.18 * Math.sin((flap * Math.PI) / 180)})` }} />
    </div>
  );
  const showCard = t > 2.5;
  const Card = showCard && (
    <div style={{ position: "absolute", left: 0, top: 0, width: CW, height: CH, transformOrigin: "0 0", transform: `translate(${cx}px, ${cy}px) scale(${cs})`, opacity: page >= 1 ? 0 : 1,
      filter: go < 1 ? `drop-shadow(0 ${6 + 10 * go}px ${10 + 14 * go}px rgba(70,30,50,${0.22}))` : undefined }}>
      <Img src={staticFile("envelope/cover.png")} style={{ width: CW, height: CH, display: "block" }} />
    </div>
  );
  return (
    <AbsoluteFill style={{ background: "#2a1428", overflow: "hidden" }}>
      <Img src={staticFile("envelope/bg.png")} style={{ position: "absolute", width: 1920, height: 1080 }} />
      {/* ---------------- the envelope (independent layers), fixed camera ---------------- */}
      {envA > 0 && (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: envA, transformOrigin: "960px 1080px", transform: `translateY(${envY}px) scale(${envS})` }}>
          {/* soft contact shadow of the envelope on the page */}
          <div style={{ position: "absolute", left: EX + 30, top: FOLD_Y + 470, width: EW * K - 60, height: 70, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(70,30,60,.32), rgba(70,30,60,0))" }} />
          <div style={{ position: "absolute", left: EX, top: EY, width: EW, height: 970, transformOrigin: "0 0", transform: `scale(${K})`, perspective: 2600, perspectiveOrigin: `${EW / 2}px ${FOLD}px` }}>
            <Img src={staticFile("envelope/lining.png")} style={{ position: "absolute", left: 0, top: 0, width: EW, height: 970 }} />
            {!flapInFront && Flap}
          </div>
        </div>
      )}
      {/* the card sits between the lining and the pocket while it is inside */}
      {go < 1 && rise < 1 && Card}
      {envA > 0 && (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: envA, transformOrigin: "960px 1080px", transform: `translateY(${envY}px) scale(${envS})` }}>
          <div style={{ position: "absolute", left: EX, top: EY, width: EW, height: 970, transformOrigin: "0 0", transform: `scale(${K})`, perspective: 2600, perspectiveOrigin: `${EW / 2}px ${FOLD}px` }}>
            <Img src={staticFile("envelope/pocket.png")} style={{ position: "absolute", left: 0, top: 0, width: EW, height: 970 }} />
            {flapInFront && Flap}
          </div>
          {/* bow + heart seal: the seal lifts, then the whole bow comes off upwards */}
          {bowAway < 1 && (
            <div style={{ position: "absolute", left: 960 - SEAL[0] * BOW_K, top: FOLD_Y + 268 - SEAL[1] * BOW_K, width: BOW_W * BOW_K, height: BOW_H * BOW_K,
              transformOrigin: `${SEAL[0] * BOW_K}px ${SEAL[1] * BOW_K}px`, opacity: 1 - bowAway,
              transform: `translateY(${-10 * sealLift - 130 * bowAway}px) rotate(${-4 * bowAway}deg) scale(${1 + 0.03 * sealLift})`,
              filter: `drop-shadow(0 ${3 + 8 * sealLift}px ${5 + 8 * sealLift}px rgba(90,30,50,.28))` }}>
              <Img src={staticFile("envelope/bow.png")} style={{ width: BOW_W * BOW_K, height: BOW_H * BOW_K, display: "block" }} />
            </div>
          )}
        </div>
      )}
      {/* once out of the pocket the card is in front of everything */}
      {(go > 0 || rise >= 1) && page < 1 && Card}
      {/* ---------------- the opened card: inner page + the cover turning on its fold ---------------- */}
      {page > 0 && (
        <AbsoluteFill style={{ opacity: page }}>
          <Img src={staticFile("envelope/inner.png")} style={{ position: "absolute", width: 1920, height: 1080 }} />
          {/* shadow the lifting cover throws on the page */}
          {open > 0 && open < 1 && <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(70,25,45,${0.32 * Math.sin(Math.PI * open)}) 0%, rgba(70,25,45,0) ${30 + 40 * open}%)` }} />}
          {coverA > 0 && (
            <AbsoluteFill style={{ perspective: 5200, perspectiveOrigin: "960px 540px" }}>
              <div style={{ position: "absolute", left: 0, top: 0, width: CW, height: CH, transformOrigin: "0 0", transform: `scale(${FULL})`, transformStyle: "preserve-3d", opacity: coverA }}>
                <div style={{ position: "absolute", inset: 0, transformOrigin: `${CTL[0]}px ${CTL[1]}px`, transformStyle: "preserve-3d",
                  transform: open > 0 ? `rotate(${-BETA}deg) rotateY(${-theta}deg) rotate(${BETA}deg)` : "none" }}>
                  {theta <= 90 ? (
                    <>
                      <Img src={staticFile("envelope/cover.png")} style={{ position: "absolute", inset: 0, width: CW, height: CH }} />
                      {theta > 0 && <div style={{ position: "absolute", inset: 0, background: `rgba(50,18,40,${0.3 * (1 - Math.cos((theta * Math.PI) / 180))})`, clipPath: `polygon(${CTL[0]}px ${CTL[1]}px, ${CTR[0]}px ${CTR[1]}px, ${CBR[0]}px ${CBR[1]}px, ${CBL[0]}px ${CBL[1]}px)` }} />}
                    </>
                  ) : (
                    // the plain back of the card (never a mirrored front)
                    <div style={{ position: "absolute", inset: 0, background: "#f3e6de", clipPath: `polygon(${CTL[0]}px ${CTL[1]}px, ${CTR[0]}px ${CTR[1]}px, ${CBR[0]}px ${CBR[1]}px, ${CBL[0]}px ${CBL[1]}px)`,
                      boxShadow: "inset 0 0 0 18px rgba(205,165,110,.35)", filter: `brightness(${0.75 + 0.2 * (1 + Math.cos((theta * Math.PI) / 180))})` }} />
                  )}
                </div>
              </div>
            </AbsoluteFill>
          )}
        </AbsoluteFill>
      )}
      {fadeIn > 0 && <AbsoluteFill style={{ background: `rgba(20,10,22,${fadeIn})` }} />}
    </AbsoluteFill>
  );
};
