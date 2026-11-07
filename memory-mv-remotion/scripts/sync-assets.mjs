// Link (hard link, else copy) the approved source images into public/ without touching the originals,
// and record md5 + size so a later render can prove it used exactly the approved files.
import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto";
const ROOT = path.resolve(import.meta.dirname, "../.."), HERE = path.resolve(import.meta.dirname, "..");
const put = (src, dst) => { fs.mkdirSync(path.dirname(dst), { recursive: true }); try { fs.rmSync(dst, { force: true }); fs.linkSync(src, dst); } catch { fs.copyFileSync(src, dst); } };
const md5 = f => crypto.createHash("md5").update(fs.readFileSync(f)).digest("hex");
const lock = {}, missing = [];
// 1 · new paper pages
const A = JSON.parse(fs.readFileSync(path.join(HERE, "data/assets.json"), "utf8"));
for (const [grp, items] of Object.entries(A)) { if (grp.startsWith("_")) continue;
  for (const [k, v] of Object.entries(items)) { const src = path.join(ROOT, v.src); if (!fs.existsSync(src)) { missing.push(v.src); continue; }
    put(src, path.join(HERE, "public", grp, k + ".png")); lock[`${grp}/${k}`] = { src: v.src, md5: md5(src), bytes: fs.statSync(src).size }; } }
// 2 · the legacy Canvas engine (memory-mv-book/js/book2.js): exactly the files it loads
const B = path.join(ROOT, "memory-mv-book"), rel = [];
const J = f => JSON.parse(fs.readFileSync(path.join(B, f), "utf8"));
rel.push("pc/cut/stickers.json", "cut/pieces.json", "cut/lift.json", "up/bg_lace.png", "cut/act3_map_clean2.png", "pc/up/act3_map.png", "pc/cut/act3_map_clean.png",
  "card/layers/inner_page.png", "card/layers/pop_couple.png", "card/layers/pop_cats.png", "card/layers/pop_bike.png", "card/layers/pop_plaque.png", "anniv/obj/cover_obj.png");
for (const n of Object.keys(J("pc/cut/stickers.json").act3_map)) rel.push(`pc/cut/act3_map_${n}.png`);
for (const n of Object.keys(J("cut/pieces.json"))) rel.push(`cut/${n}.png`);
const LIFT = J("cut/lift.json"); for (const pn of Object.keys(LIFT)) for (const n of Object.keys(LIFT[pn])) rel.push(`cut/lift_${pn}_${n}.png`);
for (const n of ["bg_gate", "bg_mall", "bg_dorm", "bg_ride", "m_norm", "m_surp", "f_norm", "bouquet", "pair", "m_low", "m_firm", "rider"]) rel.push(`cut/v02/${n}.png`);
// final V4.0 engine (src/final/mv_final.js): the approved full illustrations, their stickers, polaroids, dorm poses
const STK = J("pc/cut/stickers.json");
for (const p of ["act3_ride", "act4_gate", "act4_mall", "act5_gift", "act8_cake"]) { rel.push(`pc/up/${p}.png`, `pc/cut/${p}_clean.png`); for (const n of Object.keys(STK[p])) rel.push(`pc/cut/${p}_${n}.png`); }
rel.push("src/stage_plain.png"); for (const n of ["noodle", "study", "night", "city"]) rel.push(`pc/cut/pol_${n}.png`);
for (const n of ["act3_map_clean", "act8_cake_clean"]) { const src = path.join(HERE, "build/plates", n + ".png"); if (fs.existsSync(src)) put(src, path.join(HERE, "public/legacy/plates", n + ".png")); else missing.push("memory-mv-remotion/build/plates/" + n + ".png"); }
for (const n of ["m_low", "m_firm"]) { const src = path.join(HERE, "build/stands", n + ".png"); if (fs.existsSync(src)) put(src, path.join(HERE, "public/legacy/stands", n + ".png")); else missing.push("memory-mv-remotion/build/stands/" + n + ".png"); }
for (const r of rel) { const src = fs.realpathSync.native ? (fs.existsSync(path.join(B, r)) ? fs.realpathSync(path.join(B, r)) : null) : null;
  if (!src) { missing.push("memory-mv-book/" + r); continue; } put(src, path.join(HERE, "public/legacy", r)); }
fs.writeFileSync(path.join(HERE, "data/assets.lock.json"), JSON.stringify(lock, null, 1));
console.log(`linked ${Object.keys(lock).length} page assets + ${rel.length - missing.filter(m => m.startsWith("memory-mv-book/")).length} legacy files`);
if (missing.length) { console.error("MISSING:\n  " + missing.join("\n  ")); process.exit(1); }
