# 🎨 Supa Shots - AI-Powered Image Generator for Figma

Transform your images into professional shots with AI. Generate multiple variations, angles, and styles directly in Figma.

![Version](https://img.shields.io/badge/version-2.0-blue)
![Figma](https://img.shields.io/badge/Figma-Plugin-green)
![License](https://img.shields.io/badge/license-MIT-orange)

---

## ✨ Features

### 🤖 Multi-Provider AI Support
- **Google Gemini** (Recommended)
- OpenAI DALL-E
- Together AI
- Stability AI
- Replicate
- Custom API endpoints

### 🎯 Generation Modes
- **Human Portrait:** 9 professional camera angles
  - Close-up, headshot, full body, candid, environmental, etc.
- **Product Showcase:** 9 display styles
  - Flat lay, lifestyle, studio, macro, minimal, etc.

### 📐 Aspect Ratio Control
- **Presets:** 1:1, 9:16, 16:9, 4:3, 3:4
- **Custom:** Define your own ratio

### 🖼️ Smart Canvas Integration
- Batch insert (3×3 grid layout)
- Individual insert with selection
- Proper image embedding (cross-project compatible)
- Zero distortion (maintains aspect ratio)

### 💾 State Persistence
- Auto-save session state
- Resume work after closing plugin
- Preserves: results, selection, mode, aspect ratio

### 🎨 Split-View Interface
- **320px** (Step 1: API setup)
- **800px** (Step 2+: Form + Results)
- Left panel: Scrollable form
- Right panel: Fixed 3×3 grid (no scroll!)
- Yellow placeholder before generation

---

## 📦 Installation

### Method 1: Import from Manifest (Development)

1. **Download/Clone this repository:**
   ```bash
   git clone https://github.com/yoseprendi/supa-shots-plugins.git
   cd supa-shots-plugins
   ```

2. **Open Figma Desktop** (not browser version)

3. **Go to Plugins Menu:**
   - Click `Plugins` → `Development` → `Import plugin from manifest...`

4. **Select Manifest File:**
   - Navigate to the plugin folder
   - Select `manifest.json`
   - Click "Open"

5. **Plugin Installed!**
   - Find it under: `Plugins` → `Development` → `Supa Shots`

### Method 2: Build from Source

If you want to modify the plugin:

```bash
# Install dependencies
npm install
cd ui-app && npm install && cd ..

# Build plugin
npm run build

# Build UI
cd ui-app && npm run build && cd ..
node build-ui.js  # If you have the build script
```

Then follow Method 1 to import.

---

## 🚀 Quick Start Guide

### Step 1: API Configuration

1. **Open the plugin** in Figma
2. **Select AI Provider** (e.g., Google Gemini)
3. **Get API Key:**
   - Gemini: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
   - OpenAI: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
4. **Paste API key** and click "Validate"
5. **Plugin expands to 800px** once validated ✨

### Step 2: Select Image

**Option A: From Canvas**
- Select an image frame in Figma
- Plugin auto-detects and loads it

**Option B: Upload**
- Click "Upload Image"
- Choose from your computer

**Option C: Paste**
- Copy image to clipboard
- Click "Paste Image" or use Ctrl/Cmd+V

### Step 3: Choose Settings

1. **Shot Mode:**
   - Human Portrait (9 angles)
   - Product Showcase (9 styles)

2. **Aspect Ratio:**
   - Select from presets
   - Or set custom ratio

### Step 4: Generate!

1. Click **"Generate Shots"** button
2. **Progress tracking** shows current shot being generated
3. **Results appear** in right panel (3×3 grid)
4. **Yellow placeholder** updates with thumbnails

### Step 5: Insert to Canvas

**Option A: Insert Selected**
- Check boxes on desired shots
- Click "Insert Selected (X)"
- Images inserted in organized grid

**Option B: Insert All**
- All successful shots inserted together
- Professional frame layout with title

**Option C: Individual Insert**
- Click image thumbnail
- Individual insert to viewport center

---

## ✅ Do's and ❌ Don'ts

### ✅ DO:

- ✅ **Use clear, high-quality source images**
  - Best results with well-lit, focused images
  - Minimum 512px per side recommended

- ✅ **Validate API key before generating**
  - Prevents wasted generation attempts
  - Plugin shows green checkmark when valid

- ✅ **Save results before closing**
  - Plugin auto-saves, but check "Generated Shots" count
  - Use "Insert Selected" to preserve specific results

- ✅ **Reload plugin completely after updates**
  - Remove plugin
  - Quit Figma (Cmd/Ctrl+Q)
  - Reopen and re-import

- ✅ **Use appropriate aspect ratios**
  - Portrait subjects: 9:16, 4:3
  - Product shots: 1:1, 16:9
  - Match your design needs

### ❌ DON'T:

- ❌ **Don't use extremely large images**
  - Max supported: 4096×4096px
  - Plugin will fail with oversized images

- ❌ **Don't expect instant results**
  - AI generation takes 10-30 seconds per image
  - Be patient during batch generation

- ❌ **Don't close mid-generation**
  - Let batch complete for best results
  - Partial results won't be saved

- ❌ **Don't forget to clear results**
  - Old results persist across sessions
  - Click "Clear All" to start fresh

- ❌ **Don't use in Figma browser version**
  - Plugin requires Figma Desktop
  - Browser version has limited plugin support

- ❌ **Don't share API keys**
  - Keys are stored locally in Figma
  - But never commit them to Git

---

## 🔧 Troubleshooting

### Plugin Shows Blank Screen

**Solution:**
1. Remove plugin from Figma
2. Completely quit Figma (Cmd/Ctrl+Q)
3. Reopen Figma
4. Re-import plugin from manifest

### Images Not Inserting

**Check:**
- ✅ Generation completed successfully?
- ✅ Green checkmark next to image?
- ✅ If error message, check API key validity

**Fix:**
- Try "Clear All" and regenerate
- Verify API key hasn't expired
- Check internet connection

### "Invalid Image" Error When Copying

This was fixed in v2.0! If you still see this:
1. Update to latest plugin version
2. Regenerate images (old ones may use old embedding)

### Character Encoding Issues (â, Ã, etc.)

Fixed in v2.0 with UTF-8 build script. If persisting:
1. Rebuild UI: `cd ui-app && npm run build`
2. Run build script with UTF-8 encoding
3. Reload plugin

### Plugin Stuck After Reopening

v2.0 has state persistence! Plugin should:
- Restore previous results
- Show last selected mode
- Remember aspect ratio

If stuck: Click "Clear All" to reset

---

## 🛠️ Advanced Configuration

### Custom API Endpoints

1. Select **"Custom"** as provider
2. Enter **API URL** (e.g., `https://api.example.com/v1`)
3. Enter **Model name** (e.g., `gpt-4-vision`)
4. Paste API key
5. Validate

**Note:** Custom endpoints must follow OpenAI-compatible format

### Browser Developer Console

For debugging:
1. Right-click plugin window
2. Select "Inspect Element"
3. Check Console tab for errors
4. Look for `[Supa Shots]` prefixed logs

---

## 📚 Technical Details

### Built With
- **Frontend:** React 19, TypeScript, Vite
- **UI Library:** Shadcn UI, Tailwind CSS
- **AI Integration:** Google Gemini API (primary)
- **Figma API:** Plugin API v1

### Key Technical Features
- Manual base64 decoder (no `atob()` dependency)
- Async image sizing with `getSizeAsync()`
- Proper image embedding (`scaleMode: 'FIT'`)
- UTF-8 safe build pipeline
- State persistence via `figma.clientStorage`

### File Structure
```
Supa Shots/
├── code.ts              # Main plugin logic
├── ui.html              # Bootstrap loader
├── manifest.json        # Plugin configuration
├── ui-app/
│   ├── src/
│   │   ├── App.tsx      # React component
│   │   ├── lib/
│   │   │   ├── api.ts   # AI provider implementations
│   │   │   └── shots.ts # Shot templates
│   │   └── components/  # UI components
│   └── package.json
└── package.json
```

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

MIT License - feel free to use in your own projects!

---

## 🙋 Support & Contact

**Created by:** [Yosep Rendi](https://x.com/yoseprendi)

**Issues?** Open an issue on GitHub or contact via Twitter/X

**Questions?** Check the [walkthrough document](./walkthrough.md) for detailed technical info

---

## 🎉 Changelog

### v2.0 (2025-12-28)
- ✨ Added split-view interface (800px)
- ✨ State persistence across sessions
- ✨ Yellow placeholder panel
- 🐛 Fixed base64 decoding (manual decoder)
- 🐛 Fixed aspect ratio application
- 🐛 Fixed cross-project image embedding
- 🐛 Fixed UTF-8 character encoding
- 🐛 Fixed icon alignment issues
- 🎨 Improved UI/UX with better layout

### v1.0 (Initial Release)
- 🎯 Multi-provider AI support
- 🎯 Human & Product modes
- 🎯 Batch generation
- 🎯 Basic canvas integration

---

**⭐ If you find this plugin useful, please star the repo!**

**📢 Share your creations with #SupaShots**
