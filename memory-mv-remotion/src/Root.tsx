import React from "react";
import { Composition } from "remotion";
import { GatePage, GATE_FRAMES } from "./pages/GatePage";
import { LegacyBook } from "./legacy/LegacyBook";
export const Root: React.FC = () => (
  <>
    {/* first CSS-3D paper page (stand-alone test, its own beat window of the song) */}
    <Composition id="GatePage" component={GatePage} durationInFrames={GATE_FRAMES} fps={24} width={1920} height={1080} />
    {/* step 1 shell: opening → act 4 of the existing Canvas engine (31.4 s) */}
    <Composition id="LegacyBook" component={LegacyBook} durationInFrames={754} fps={24} width={1920} height={1080} />
  </>
);
