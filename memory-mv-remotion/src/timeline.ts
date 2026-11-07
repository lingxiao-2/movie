// Time is music: every cue is a measured beat of the original DJ mix (data/beats.json, librosa, 143.55 BPM)
// or a lyric line (data/lyrics.json, Whisper-aligned). Nothing is re-timed; the song is never stretched.
import beatsJson from "../data/beats.json";
import lyricsJson from "../data/lyrics.json";
export const FPS = 24;
export const BEATS: number[] = beatsJson.beats;
export const LYRICS: { t0: number; t1: number; text: string }[] = lyricsJson;
/** index of the first beat at or after song time t */
export const beatAt = (t: number) => BEATS.findIndex((b) => b >= t - 1e-6);
/** song time of beat i */
export const beat = (i: number) => BEATS[i];
export const toFrames = (sec: number) => Math.round(sec * FPS);
