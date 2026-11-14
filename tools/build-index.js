// rebuilds index.json from skins/<id>/skin.json. run: node tools/build-index.js  (the github action runs it on every push)
// --check: exit 1 if a skin is broken or index.json is out of date, without writing
const fs = require("fs");
const path = require("path");
const { checkCss } = require("./check");
const root = path.join(__dirname, ".."), dir = path.join(root, "skins"), kId = /^[a-z0-9-]{2,32}$/;
// the repo clause downloads from: url()s may only point inside it. a fork sets SKINS_REPO (or GITHUB_REPOSITORY in the action)
const kRepo = process.env.SKINS_REPO || process.env.GITHUB_REPOSITORY || "kingonking/clause-skins";
const bad = [], skins = [];
for (const id of fs.readdirSync(dir).sort()) {
  const d = path.join(dir, id);
  if (!fs.statSync(d).isDirectory()) continue;
  let j;
  try { j = JSON.parse(fs.readFileSync(path.join(d, "skin.json"), "utf8")); } catch (e) { bad.push(id + ": skin.json " + e.message); continue; }
  let css = "";
  try { css = fs.readFileSync(path.join(d, "skin.css"), "utf8"); } catch { bad.push(id + ": no skin.css"); continue; }
  if (!kId.test(id) || id === "default") bad.push(id + ": folder name must be 2-32 of a-z 0-9 - (and not \"default\")");
  if (j.id !== id) bad.push(id + ": skin.json id is \"" + j.id + "\", must match the folder name");
  if (!j.name || !j.version) bad.push(id + ": skin.json needs a name and a version");
  if (typeof j.effects !== "boolean") bad.push(id + ": skin.json effects must be true or false");
  const why = checkCss(css, id, kRepo);
  if (why) bad.push(id + ": skin.css " + why);
  skins.push({ id, name: String(j.name), version: String(j.version), description: String(j.description || ""), author: String(j.author || ""), effects: j.effects !== false });
}
const out = JSON.stringify({ skins }, null, 2) + "\n", file = path.join(root, "index.json");
if (bad.length) { console.error(bad.join("\n")); process.exit(1); }
if (process.argv.includes("--check")) {
  let cur = ""; try { cur = fs.readFileSync(file, "utf8"); } catch {}
  if (cur !== out) { console.error("index.json is out of date: run node tools/build-index.js"); process.exit(1); }
} else fs.writeFileSync(file, out);
console.log(skins.length + " skin(s): " + skins.map((s) => s.id + "@" + s.version).join(", "));
