# nodebb-theme-lumina

Tema NodeBB per il forum di Lumina. Estende `nodebb-theme-harmony` (default v4)
ereditandone i template, e sovrascrive solo CSS/SCSS per portare la palette
gold-on-ink, i font Cinzel/Crimson Text e le micro-interazioni del sito.

## Architettura

```
local-plugins/nodebb-theme-lumina/
├── theme.json          baseTheme: nodebb-theme-harmony
├── plugin.json         hook minimo, languages
├── library.js          init no-op (placeholder per future hook)
├── theme.scss          @import harmony + ./scss/lumina
├── templates/          vuota — eredita tutti i .tpl da harmony
├── languages/          en-GB + it
└── scss/
    ├── overrides.scss  SASS vars (compile-time, alimentano color-contrast/utilities BS)
    ├── _tokens.scss    CSS custom properties Lumina + bridge --bs-*
    ├── _fonts.scss     Cinzel / Crimson Text da Google Fonts
    ├── _surfaces.scss  body, card, scrollbar, tooltip, badge
    ├── _navbar.scss
    ├── _categories.scss
    ├── _topics.scss
    ├── _posts.scss
    ├── _buttons.scss
    ├── _forms.scss
    ├── _composer.scss
    ├── _footer.scss
    ├── _misc.scss      alerts, modals, dropdowns, tabs, pagination, chats, search
    └── lumina.scss     entry: importa tutti i partial nell'ordine giusto
```

NodeBB compone il CSS root così:

1. `./scss/overrides` (questo theme — SASS vars Bootstrap)
2. core `overrides.scss` + Bootstrap variables/maps/utilities
3. tutto Bootstrap 5 + utilities API
4. core mixins / generics / client.scss
5. **`./theme`** (theme.scss): `@import "../nodebb-theme-harmony/scss/harmony"` + `@import "./scss/lumina"`
6. Bootswatch skin (se selezionato)

## Setup su una macchina nuova

NodeBB scopre i temi dentro `nodebb/node_modules/`. Il sorgente del theme
vive in `local-plugins/` (versionato), e una junction lo espone a NodeBB:

```powershell
# da D:\vhrazul\lumina-forum
New-Item -ItemType Junction `
  -Path  ".\nodebb\node_modules\nodebb-theme-lumina" `
  -Value ".\local-plugins\nodebb-theme-lumina"
```

Su Linux/macOS:

```bash
ln -s ../../local-plugins/nodebb-theme-lumina nodebb/node_modules/nodebb-theme-lumina
```

Poi attivazione + build:

```powershell
cd D:\vhrazul\lumina-forum\nodebb
node nodebb reset -t nodebb-theme-lumina
node nodebb build
node loader.js
```

## Sviluppo

- Modifica i `.scss`, poi `node nodebb build clientcss` (≈10s) e refresh browser (Ctrl+F5).
- Per template override mirati: copia il `.tpl` corrispondente da
  `nodebb/node_modules/nodebb-theme-harmony/templates/<path>` dentro
  `templates/<stesso path>` qui — vince questo.
- `_tokens.scss` espone tutto come `--lumina-*` *e* `--bs-*`: per cambiare la
  palette globalmente basta toccare lì.

## Skin Bootswatch

Lumina è skin-agnostic: gli override sono scoped su `body`, quindi qualsiasi
skin Bootswatch selezionato dall'ACP convive. Per il look "puro Lumina"
consigliato lasciare lo skin a *default* (vuoto) dall'ACP → Settings → General.
