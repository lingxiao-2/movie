import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useDelayRender } from "remotion";
// Step 1 · shell: the existing Canvas engine (memory-mv-book/js/book2.js, copied unchanged except asset URLs)
// drawn into a Remotion canvas, frame by frame. Same pixels as the Puppeteer renderer.
// @ts-ignore
import { load, frame, setBase } from "./book2.js";
let ready: Promise<void> | null = null;
export const LegacyBook: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null), f = useCurrentFrame();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [ok, setOk] = useState(false);
  const [handle] = useState(() => delayRender("legacy engine assets"));
  useEffect(() => {
    const cv = ref.current!; setBase(staticFile("legacy/").replace(/\/?$/, "/"));
    ready ??= load(1920, 1080, cv.getContext("2d"));
    ready.then(() => { setOk(true); continueRender(handle); }).catch((e) => cancelRender(e));
  }, []);
  useLayoutEffect(() => { if (ok) frame(f / 24); }, [f, ok]);
  return <AbsoluteFill><canvas ref={ref} width={1920} height={1080} /></AbsoluteFill>;
};
