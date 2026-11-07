import React from "react";
import { Composition } from "remotion";
import { GatePage, GATE_FRAMES } from "./pages/GatePage";
import { LegacyBook } from "./legacy/LegacyBook";
import { FinalMV, FINAL_FRAMES } from "./final/FinalMV";
import { EnvelopeScene, ENV_FRAMES } from "./envelope/EnvelopeScene";
export const Root: React.FC = () => (
  <>
    {/* opening / ending envelope (silent, same layers; the ending is the opening reversed) */}
    <Composition id="OpeningEnvelope" component={EnvelopeScene} durationInFrames={ENV_FRAMES} fps={24} width={1920} height={1080} defaultProps={{ reverse: false }} />
    <Composition id="EndingEnvelope" component={EnvelopeScene} durationInFrames={ENV_FRAMES} fps={24} width={1920} height={1080} defaultProps={{ reverse: true }} />
    {/* 《把回忆拼好给你》一周年 MV · V4.0 final (59.04 s) */}
    <Composition id="FinalMV" component={FinalMV} durationInFrames={FINAL_FRAMES} fps={24} width={1920} height={1080} />
    {/* first CSS-3D paper page (stand-alone test, its own beat window of the song) */}
    <Composition id="GatePage" component={GatePage} durationInFrames={GATE_FRAMES} fps={24} width={1920} height={1080} />
    {/* step 1 shell: opening → act 4 of the existing Canvas engine (31.4 s) */}
    <Composition id="LegacyBook" component={LegacyBook} durationInFrames={754} fps={24} width={1920} height={1080} />
  </>
);
