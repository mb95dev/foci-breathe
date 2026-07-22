# FOCI Breathe

Live app: https://mb95dev.github.io/foci-breathe/

## Modules

- **Breathing** — guided breathing sessions with patterns, timer, and sounds
- **Reminders** — mindfulness voice prompts via the companion Chrome extension

## Development

```bash
npm install
npm run dev          # web app at http://localhost:5174/foci-breathe/
npm test
npm run build        # production web build
npm run build:extension
```

## Chrome extension (Mindfulness Reminders)

**Important:** load `extension/dist`, **not** `dist`. The root `dist` folder is only the web app build and has no `manifest.json`.

1. Run `npm run build:extension`
2. Open `chrome://extensions` → enable **Developer mode**
3. Click **Load unpacked** and select this folder:

   `C:\Users\kosqe\Desktop\rep\foci-breathe\extension\dist`

4. Open the FOCI Breathe app → **Reminders** tab

The web module talks to the extension through a content-script bridge (`window.postMessage`), so reminders work while you browse any site and can be configured from either the extension popup or the Reminders tab.
