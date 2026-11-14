// the same css checks clause runs on every downloaded skin (copied from clause's skins.js). build-index.js uses them so a
// skin clause would refuse fails the push check instead of silently not showing up
const kHost = "raw.githubusercontent.com", kMaxCss = 300 * 1024;
// ---- checks ----
// what the browser will actually see: css escapes decoded (\75 rl( is url()
function unescapeCss(s) {
  return s.replace(/\\([0-9a-fA-F]{1,6})[ \t\n\r\f]?/g, (m, h) => { const c = parseInt(h, 16); return c > 0 && c <= 0x10ffff && !(c >= 0xd800 && c <= 0xdfff) ? String.fromCodePoint(c) : "�"; })
    .replace(/\\([\s\S])/g, "$1");
}
// top-level rule preludes (and the ones inside @media/@supports/@container/@layer blocks), skipping strings and comments
function preludes(css) {
  const out = []; let i = 0, depth = 0, start = 0; const stack = [];   // stack: per open brace, whether its contents are "top level"
  const top = () => stack.every((x) => x);
  while (i < css.length) {
    const c = css[i];
    if (c === "/" && css[i + 1] === "*") { const e = css.indexOf("*/", i + 2); i = e < 0 ? css.length : e + 2; continue; }
    if (c === '"' || c === "'") { i++; while (i < css.length && css[i] !== c) { if (css[i] === "\\") i++; else if (css[i] === "\n") break; i++; } i++; continue; }
    if (c === "\\") { i += 2; continue; }
    if (c === "{") {
      const pre = top() ? css.slice(start, i).replace(/\/\*[\s\S]*?\*\//g, "").trim() : null;
      if (pre !== null) out.push(pre);
      stack.push(pre !== null && /^@(media|supports|container|layer)\b/i.test(pre)); depth++; start = i + 1;
    } else if (c === "}") { stack.pop(); depth = Math.max(0, depth - 1); start = i + 1; }
    else if (c === ";" && top()) { const pre = css.slice(start, i).replace(/\/\*[\s\S]*?\*\//g, "").trim(); if (pre) out.push(pre + ";"); start = i + 1; }
    i++;
  }
  if (depth) out.push({ unbalanced: true });
  return out;
}
// split a selector list on top-level commas (not the ones inside :is(...) or [..])
function splitSel(s) { const out = []; let d = 0, st = 0; for (let i = 0; i < s.length; i++) { const c = s[i]; if (c === "(" || c === "[") d++; else if (c === ")" || c === "]") d--; else if (c === "," && !d) { out.push(s.slice(st, i)); st = i + 1; } } out.push(s.slice(st)); return out.map((x) => x.trim()); }
// a skin's css: size cap, every rule under :root[data-skin="<id>"], no @import, no remote urls except this skins repo
function checkCss(css, id, repo) {
  if (typeof css !== "string") return "not text";
  if (Buffer.byteLength(css) > kMaxCss) return "over " + (kMaxCss >> 10) + "KB";
  if (/\u0000/.test(css)) return "has a null byte";
  const plain = unescapeCss(css), low = plain.toLowerCase();
  if (/@import/.test(low)) return "uses @import";
  if (/(^|[^\w-])(image-set|-webkit-image-set|src|image|cross-fade|element)\s*\(/.test(low)) return "uses image-set()/src()/image()/element(), only url() is allowed";
  const pre = repo ? "/" + repo + "/" : null;
  for (const m of plain.matchAll(/url\s*\(\s*(["']?)([^"')]*)/gi)) {
    const u = m[2].trim();
    if (/^data:/i.test(u)) continue;
    let p = null; try { p = new URL(u); } catch {}
    if (!p || p.protocol !== "https:" || p.hostname !== kHost || p.username || p.password || p.port || !pre || !p.pathname.startsWith(pre)) return "links " + (u.slice(0, 80) || "an empty url") + " (only data: and " + kHost + pre + " are allowed)";
  }
  const scope = new RegExp('^(:root|html)?\\[data-skin=(["\']?)' + id + '\\2\\](?![\\w-])', "i");
  for (const p of preludes(css)) {
    if (p.unbalanced) return "has unbalanced { }";
    if (/^@(media|supports|container|layer)\b/i.test(p)) continue;   // its rules are checked one by one
    if (/^@(keyframes|-webkit-keyframes|font-face|property|charset|layer)\b/i.test(p)) continue;
    if (p[0] === "@") return "uses " + p.split(/[\s{;(]/)[0] + " (not allowed at the top level)";
    if (p.endsWith(";")) continue;   // a stray declaration at the top level does nothing
    for (const s of splitSel(p)) if (!scope.test(s)) return "has a rule outside :root[data-skin=\"" + id + "\"]: " + s.slice(0, 80);
  }
  return "";
}
// skin.json -> the fields clause uses, or a reason it's no good
module.exports = { checkCss };
