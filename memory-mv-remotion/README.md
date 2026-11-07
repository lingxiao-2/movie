# memory-mv-remotion：《把回忆拼好给你》Remotion 制作目录

这是一个独立的新目录，采用渐进式接入，不覆盖任何旧工程：
- `memory-mv-book` 等旧的 Canvas / Puppeteer / FFmpeg 工程保持原样；
- 旧素材全部以只读方式引用，用硬链接放进 `public/`，并记录 md5。

## 环境
- Remotion **4.0.541**，所有依赖在 `package.json` 里精确锁版本，另附 `package-lock.json`。
- Remotion Skills 已装在**仓库根目录**：`.agents/skills/`，并软链接到 `.claude/skills/`。
  - 版本 4.0.541，与 npm 包一致。
  - 每个 Skill 的内容哈希锁定在根目录的 `skills-lock.json`。
  - 升级时使用 `remotion-upgrade` Skill，npm 包和 Skill 同步升级。
- 渲染时使用 Remotion 自带的 chrome-headless-shell，首次运行会自动下载。
- 图像预处理需要 Python 包：numpy、pillow、opencv-python-headless。

## 构建步骤
```bash
npm ci
python -I scripts/recut_stands.py /home/user/movie   # 立牌 alpha 精确贴合模切描边（去掉素材表自带的投影）
python -I scripts/prescale.py /home/user/movie       # 立牌按屏幕实际尺寸用 Lanczos 预缩放，浏览器 1:1 绘制
npm run assets                                      # 把已确认素材硬链接进 public/，并写入 data/assets.lock.json（md5）
npm run studio                                      # 交互预览
npm run gate                                        # 渲染学校门口页（无声），然后用 mux.sh 合成原曲片段
npm run legacy-check                                # 第一步套壳：旧 Canvas 引擎在 Remotion 内抽帧
```

## 目录
| 路径 | 内容 |
|---|---|
| `src/legacy/` | 第一步套壳。`book2.js` 复制自 `memory-mv-book/js/book2.js`，只改了素材 URL；`LegacyBook` 在 Remotion 中逐帧调用旧引擎 |
| `src/paper/Stand.tsx` | 完整纸雕立牌：底边铰链 rotateX、纸厚边、接触影、背景投影、折页小片；直立静止时不做任何 transform（像素级清晰） |
| `src/paper/PageFall.tsx` | 实体纸页以顶边为轴从上往下翻落：纸边、阴影、装订线 |
| `src/paper/Atmos.tsx` | 雪、灯光、光斑。全部由帧号驱动，确定性生成 |
| `src/pages/GatePage.tsx` | 第四幕·学校门口见面，第一张正式重做的纸艺页 |
| `src/timeline.ts` | 节拍（实测 beats.json）与歌词时间轴 |
| `data/assets.json` | 素材清单，含来源、母版、显示比例 |
| `立体纸艺动画规范.md` | 动画规范 |
| `probe/` | 早先的 3 帧兼容性探针 |
