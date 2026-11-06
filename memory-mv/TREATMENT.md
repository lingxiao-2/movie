# 把回忆拼好给你 · DJ 版 — 情侣纸艺回忆 MV · Treatment

Style: Lemo-Opuscar **纸片立体书 Paper Pop-up Book** (`styles/paper-popup/STYLE.md`).
Implementation: the style's three.js engine needs a GPU; this cloud machine has none. The film keeps the style's
invariants (pop-up book on a real desk, flat cut-paper actors with an off-white border and a grey card edge,
pieces rising back to front with overshoot, cut-out shaped shadows, page turns as scene changes, macro camera)
but renders them with a Canvas 2D pseudo-3D engine: a pinhole camera projects every card into the frame and
draws it with an affine map, so pop-ups, parallax and camera moves are real projections, not slides.

Format: 1080×1920, 24 fps, 59.04 s = the user's audio, untouched (no speed change, no cut, no extra music).

## Three candidate structures

1. **One spread, pulled again and again** — a single spread whose tabs change from chat to ride to life. Compact, but
   the ride needs space and the date needs its own page.
2. **Two books facing each other** — his book and her book, objects passed across the gap until the books merge.
   Strong for the online stage, weak for the life chapter.
3. **The memory book, chapter by chapter (chosen)** — one book on a desk; each act is a spread; page turns are the
   cuts and land on the music's beats. It matches the brief's six acts, gives the ride a dedicated road spread and
   lets the chorus become a fast scrapbook. Opening: the closed book on the desk opening in the first second (hook).
   Ending: the last page carries the handwritten line, then the book closes on its two-cat cover.

## Logline and arc

A boy finds a girl in a short-video feed, keeps writing to her across the distance, rides his red motorcycle to
her city, confesses in front of the mall on 2025.11.15, and the book fills with their everyday life — a story that
goes on.
Setup (screen, grey-blue) → turn (the ride, the meeting, the date) → ending (warm life, walking on together).

## Benchmark (grammar only)

- Robert Sabuda / Matthew Reinhart pop-up books: back-to-front rising pieces, V-folds, pull-tabs.
- Macro "tiny world on a desk" photography: warm practical light, soft contact shadows.
- Learn: pop-up timing, colour per spread, page turn as transition. Don't take: any character, design or layout.

## Characters (from the user's photos)

- **他 Him**: black slightly fluffy short hair, big black square glasses (identity anchor, always on except under the
  helmet), round face, warm open smile; black tee with a white-line cat print (black cat head with a white kitten
  peeking below, on the chest, viewer's right), black trousers with small white flower prints at the hem, grey/white
  sneakers. Riding: black jacket, khaki trousers, white full-face helmet with amber visor, white shoes.
- **她 Her**: long dark-brown hair with a centre part and loose strands, big bright eyes, soft features; white tee
  with a large black-line white cat (pink cheeks, paws); wooden bead bracelet + silver bangle (both in her photos).
  Cat ears in one photo are a filter → not part of the character. Lower body is not in the photos: plain light jeans.
- **Motorcycle**: red sport bike, black smoked windscreen, red/black fairings, gold fork, silver exhaust.
- One model sheet (`model_sheet.jpg`) drawn by the same code that draws every shot.

## Lyric timing (measured, not averaged)

Whisper small (lines 1–8) and Whisper medium (lines 9–15) on the original MP3, word timestamps. English chants
("I gotta say…") sit between chorus lines and are not subtitled.

| # | line | in | out |
|---|---|---|---|
| 1 | 我们都是渺小真实存在 | 1.56 | 4.62 |
| 2 | 祈愿小世界里不只有挫败 | 4.70 | 7.96 |
| 3 | 直到遇见你我以为就光明起来 | 8.32 | 11.44 |
| 4 | 眼睛里看到的都是广袤无垠的大海 | 11.80 | 14.82 |
| 5 | 有你在的日子不可能被取代 | 15.60 | 18.66 |
| 6 | 在最灰暗的日子你陪着我发呆 | 19.02 | 22.04 |
| 7 | 你让我学会如何拨开阴霾 | 22.52 | 24.98 |
| 8 | 将快乐全都收集将不开心全都淘汰 | 25.42 | 28.00 |
| 9 | 你对我说的情话 | 28.98 | 31.40 |
| 10 | 像转瞬即逝的烟花 | 31.50 | 34.60 |
| 11 | 只停在绽放一刹那 | 35.66 | 38.30 |
| 12 | 我却已无法自拔 | 38.46 | 41.40 |
| 13 | 我们的爱总有时差 | 42.58 | 44.60 |
| 14 | 也为你骗自己放下 | 44.64 | 48.10 |
| 15 | 爱炙热的你，却忘了爱自己 | 48.56 | 53.20 |

Tempo ≈ 140 BPM (beat ≈ 0.43 s, librosa). The beat drop is at 28.0 s; the song ends ≈ 55.5 s, a short tag follows.

## Shot list / beat sheet

| t (s) | Act | Shot | Camera | Why |
|---|---|---|---|---|
| 0.0–1.5 | 0 | Closed book on the desk, cover with two cats, opens | high 3/4, slow push | hook: the book is the film |
| 1.5–8.2 | 1 相遇 | Grey-blue spread; two phones pop up; he finds her video, taps ♥, a paper plane carries his message to her phone | eye-level macro, track left→right with the plane | he reaches out first |
| 8.2–11.6 | 1 | Stars rise, a light thread connects the two phones, sky warms a little | pull up to 3/4 | "光明起来" |
| 11.6–22.3 | 2 陪伴 | Night spread: his room / her room split by a wall card; moon, sea in her window, paper-cup telephone over the wall, wall calendars flipping, both chin-on-hands with phones glowing | wide → push on her → push on him → wide | closeness through distance |
| 22.3–25.4 | 3 奔现 | Map spread top-down; grey clouds slide apart (pull-tab); the red motorcycle pops up from a fold at his pin and sets off along the dotted route | top-down → tilt | "拨开阴霾" |
| 25.4–29.7 | 3 | Road spread, side view: overpass with ivy pillar, trees, city; bike rides, wheels spin, parallax; speed lines on the 28.0 drop | tracking macro | the ride is the climax |
| 29.7–31.5 | 3 | Mall pops up; bike stops, he takes the helmet off (glasses back); she turns — a phone frame around him falls away | 2-shot, push | the person from the screen is real |
| 31.5–34.7 | 4 表白 | He offers paper flowers, paper fireworks bloom, hearts | low 2-shot | "烟花" |
| 34.7–38.4 | 4 | Calendar pops up, pages flip, lands on **2025.11.15**, gold heart stamp | locked frame on the mechanism, push | the date is the event |
| 38.4–48.5 | 5 生活 | Scrapbook spread, a backdrop pull-tab changes every ~2.5 s on the beat: café (her chin-on-fists), fast food (she feeds him a burger), sunny bench (he smiles with a water bottle), selfie together; real photos pinned as polaroids | eye-level, small pushes per vignette | real life, in their own photos |
| 48.5–53.6 | 6 未来 | Back view: they walk hand in hand down a paper road into warm light; flowers and stars pop up on both sides | low behind → crane up | going on together |
| 53.6–56.6 | 6 | Last page: handwritten 「我们的故事，未来再续……」 writes itself | top-down on the page | the ending line |
| 56.6–59.04 | 6 | The book closes on the two-cat cover; fade | pull back | echo of the opening |

## Cue map

Cuts and page turns snap to detected beats: open 0.3, turn ≈ 11.6, ≈ 22.3, cut 25.4, drop 28.0 (speed lines),
mall 29.7, date lands ≈ 36.6, life tabs every 6 beats in the chorus, close ≈ 56.6. Calm verse (0–28): long eased
moves. Chorus (28–55): faster turns, bouncier pop-ups.

## Sound design

The user's DJ track only, unaltered in time; mastered to about −14 LUFS for phone playback. No added music. No foley
(the track is full-range and dense; extra paper sounds would fight it).

## Subtitles and titles

Lyrics on a cream paper strip near the bottom (dark-brown ink, ZCOOL KuaiLe), popping in with a small overshoot on
the measured start, never over the faces. Date in Fredoka digits on the calendar. Final line in Ma Shan Zheng
(handwriting). Exported as `把回忆拼好给你.srt`.

## Colour

Act 1 grey-blue + cream; Act 2 night blue + warm phone glow; Act 3 cream map → clear sky; Act 4 warm gold/pink;
Act 5 cream, pink, butter yellow; Act 6 golden light. Recurring accents: his red bike, the two cats, gold stars.
