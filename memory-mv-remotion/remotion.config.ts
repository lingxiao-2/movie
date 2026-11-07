import { Config } from "@remotion/cli/config";
// 1920×1080 / 24 fps H.264 yuv420p (iPhone). PNG frames so the paper edges are never JPEG-softened before encoding.
Config.setVideoImageFormat("png");
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
Config.setCrf(16);
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
