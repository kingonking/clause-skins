# clause skins

Skins for [Clause](https://github.com/kingonking/clause). Every Clause checks this repo (at startup, every 6 hours, and when you open the skin picker), downloads any new or updated skin, and keeps a copy on the PC so skins work offline. Adding a skin here needs no Clause release.

## Add a skin

1. Copy a folder in `skins/` (for example `skins/craigslist`) and rename the copy to your skin's id, like `skins/midnight`. The id is 2 to 32 characters, using only `a-z`, `0-9` and `-`. `default` is taken.
2. Edit `skin.json` in the new folder:
   ```json
   {
     "id": "midnight",
     "name": "midnight",
     "author": "you",
     "description": "one line the picker shows",
     "version": "1.0.0",
     "effects": true
   }
   ```
   `id` must match the folder name.
3. Edit `skin.css`. Put every rule under `:root[data-skin="midnight"]` (see the scoping rule below).
4. Replace `preview.png` with a screenshot of Clause wearing the skin.
5. Push to `main`. The GitHub Action checks the skin and adds it to `index.json`. Within a few minutes, every Clause shows it in the picker, marked "new" (or press "get skins" in the picker).

To update a skin, edit its files and **bump `version`** in `skin.json`. Clause only downloads a skin again when its version changes.

To remove a skin, delete its folder and push. Anyone already using it keeps their saved copy. The picker stops offering it to everyone else.

To check before pushing: `node tools/build-index.js` checks every skin and rewrites `index.json`. The Action runs the same script.

## The scoping rule

Clause sets `data-skin="<id>"` on `<html>` for the active skin and loads only that skin's `skin.css`. Every top-level selector must start with `:root[data-skin="<id>"]` (or `html[data-skin="<id>"]`), so a skin can never change the stock look or another skin. Nesting is the easy way to write this:

```css
:root[data-skin="midnight"]{
  --fg:#dde;--dim:#889;--line:#334;
  & body{background:#0b0b1a!important}
  & .msg.user{background:#1a1a33}
}
:root[data-skin="midnight"] .unity-app{ --fg:#dde }   /* plugin tabs go in the same file */
```

`@media`, `@supports`, `@container` and `@layer` are allowed if the rules inside them follow the same rule. `@keyframes`, `@font-face` and `@property` are allowed at the top level.

Clause refuses a skin (and the Action fails the push) when its `skin.css`:
- is over 300 KB
- has a rule outside its own `[data-skin="<id>"]`
- uses `@import`, `image-set()`, `src()`, `image()` or `element()`
- uses `url(...)` for anything other than `data:` or a file in this repo (`https://raw.githubusercontent.com/kingonking/clause-skins/main/...`). Other websites, relative paths and `//host` links are blocked.

## The effects flag

`"effects": true` keeps Clause's effects (the 3D background, sparks and rings, hack overlays, the 3D logo). `"effects": false` turns them all off while the skin is active, so nothing is drawn or loaded for them. Sounds still play. Use `false` for flat or light skins like craigslist. While a skin is active, the effects menu shows "off (skin)", and the color-scheme hue doesn't tint the page. Instead Clause puts the picked hue on `<html>` as `data-hue="<0-359>"` and `--clause-hue:<0-359>` (neither is there when the "default" swatch is picked), so a skin can use it, for example as its accent colour: `:root[data-skin="midnight"][data-hue="220"]{--accent:#2f78d4}`. The swatches are 190, 220, 270, 320, 355 and 40; the slider gives any other value. Older Clause versions don't set these, so keep the skin's default look without them.

Optional: `"themeColor": "#ffffff"` sets the window's title-bar color. Without it, the title bar is white when effects are off and dark when they're on.

## What to style

These are the main surfaces. Most colors come from `--fg` (text), `--dim` (secondary text), `--line` (borders) and `--accent`, so set those first.

| Surface | Selectors |
| --- | --- |
| page | `body`, `#gl` `#fx` `#scan` `#hack` `#scn` `#logo3d` (effects layers) |
| header | `header`, `#title`, `#sub`, `#status`, `#btns`, `#model`, `#backend`, `#updb` |
| plugin tab strip | `#tabs button`, `#tabs button[aria-selected=true]` |
| sidebar | `#side`, `#sidetop`, `#snew`, `#sq`, `.sh` (group heading), `.ch` (chat row), `.ch.on`, `.ch.run`, `.ch .t`, `.chatmeta`, `#sidefoot`, `#menub` |
| usage bar | `#usagebar`, `#contextmeter` |
| transcript | `#chatstage`, `main`, `.msg.user`, `.msg.bot`, `.msg.tool`, `.msg.err`, `.msgbody` (markdown: `code`, `pre`, `a`, `table`, `h1`-`h6`), `.acts button` |
| bars above the box | `#working`, `#qbar`, `#pend`, `#stopbar`, `#lockbar`, `#syncbar` |
| composer | `footer`, `#box`, `#go`, `#att`, `#plusb`, `#micb` |
| aside | `#asd`, `#asdh`, `#asdt`, `#asdmsgs`, `.am`, `.am.u`, `#asdbox` |
| menus and dialogs | `#ctx` (right-click and header menu), `#mod` `#modb` `#modh` `#modt` `#modc` (dialog), `.mrow` `.pnlrow` `.mbtn` `.mbtn.on` (settings rows and buttons), `#ptoast` (toast), `#lb` (lightbox) |
| split panes | `.pane`, `.panebar`, `.pbar` |
| visuals panel | `.vw-panel`, `.vr-dialog`, `.vr-head` |
| plugin tabs | `.ptab[data-tab="<plugin>"]`, then the plugin's own root, e.g. `.studio-app`, `.unity-app` |

`skins/craigslist/skin.css` styles all of these. It's the best reference.
