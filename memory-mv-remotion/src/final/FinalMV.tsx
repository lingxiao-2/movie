import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useDelayRender } from "remotion";
// The final V4.0 film: the Canvas engine src/final/mv_final.js drawn frame by frame (time = frame / 24).
// @ts-ignore
import { load, frame, setBase } from "./mv_final.js";
let ready: Promise<void> | null = null;
export const FINAL_FRAMES = Math.round(59.04 * 24);
export const FinalMV: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null), f = useCurrentFrame();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [ok, setOk] = useState(false);
  const [handle] = useState(() => delayRender("final engine assets", { timeoutInMilliseconds: 180000 }));
  useEffect(() => {
    const cv = ref.current!; setBase(staticFile("legacy/").replace(/\/?$/, "/"));
    ready ??= load(1920, 1080, cv.getContext("2d"));
    ready.then(() => { setOk(true); continueRender(handle); }).catch((e) => cancelRender(e));
  }, []);
  useLayoutEffect(() => { if (ok) frame(f / 24); }, [f, ok]);
  return <AbsoluteFill><canvas ref={ref} width={1920} height={1080} /></AbsoluteFill>;
};
