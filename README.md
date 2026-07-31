# FOCI Breathe

Live app: https://mb95dev.github.io/foci-breathe/

## Modules

- **Breathing** — guided breathing sessions with patterns, timer, and sounds
- **Reminders** — mindfulness voice prompts in the browser (no extension required). Interval, volume, and custom prompts are saved in local storage.

## Development

```bash
npm install
npm run dev          # web app at http://localhost:5174/foci-breathe/
npm test
npm run build        # production web build
npm run build:extension  # optional companion extension
```

## Mindfulness Reminders (web)

1. Open the app → **Reminders** tab
2. Customize prompts / interval / volume (saved automatically in this browser)
3. Click **Start** — prompts are spoken on schedule via the Web Speech API
4. Keep the FOCI Breathe tab open (you can switch between Breathing and Reminders)

## Optional Chrome extension

The extension is optional. Use it if you want reminders while browsing *other* sites without keeping FOCI Breathe open.

1. Run `npm run build:extension`
2. Open `chrome://extensions` → enable **Developer mode**
3. **Load unpacked** → select `extension/dist` (not root `dist`)
