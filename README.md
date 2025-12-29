# 🎨 Supa Shots - AI-Powered Image Generator for Figma

Transform your images into professional shots with AI. Generate multiple variations, angles, and styles directly in Figma.

![Version](https://img.shields.io/badge/version-2.3-blue)
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

###  Advanced Controls
- **Preview Modal:** Full-screen preview with zoom (50%-200%)
- **Regenerate:** Re-generate individual shots
- **Edit Prompt:** Customize prompts for specific variations
- **Batch Selection:** Select All / Deselect All
- **Individual Actions:** Insert, regenerate, or preview any shot

### 💾 Smart Features
- Auto-save session state
- Resume work after closing
- Proper image embedding (works across projects)

---

## 📦 Installation

### Quick Start

1. **Download/Clone this repository:**
   ```bash
   git clone https://github.com/yoseprendi/supa-shots-plugins.git
   ```

2. **Open Figma Desktop** (not browser version)

3. **Import Plugin:**
   - `Plugins` → `Development` → `Import plugin from manifest...`
   - Select `manifest.json` from the plugin folder
   - Click "Open"

4. **Done!** Find it under: `Plugins` → `Development` → `Supa Shots`

---

## 🚀 How to Use

### Step 1: Setup API

1. Open the plugin in Figma
2. Select your AI Provider (e.g., Google Gemini)
3. Get your API key:
   - Gemini: [Get API Key](https://aistudio.google.com/app/apikey)
   - OpenAI: [Get API Key](https://platform.openai.com/api-keys)
4. Paste and click "Validate"

### Step 2: Upload Image

Choose one method:
- **From Canvas:** Select image in Figma (auto-detected)
- **Upload:** Click "Upload Image"
- **Paste:** Copy image and Ctrl/Cmd+V

### Step 3: Configure Settings

1. **Choose Mode:**
   - Human Portrait (9 angles)
   - Product Showcase (9 styles)

2. **Select Aspect Ratio:**
   - Use presets or custom dimensions

### Step 4: Generate

1. Click **"Generate Shots"**
2. Wait for generation (10-30 seconds per image)
3. Results appear in 3×3 grid

### Step 5: Use Your Images

**Preview:**
- Click eye icon for full-screen preview
- Zoom in/out to inspect details

**Insert to Canvas:**
- Check boxes on shots you want
- Click "Insert Selected"

**Individual Actions:**
- **Insert:** Add directly to canvas
- **Regenerate:** Create new variation
- **Edit Prompt:** Customize and regenerate

---

## 💡 Tips for Best Results

### ✅ DO:
- Use clear, well-lit source images (min 512px)
- Validate API key before generating
- Match aspect ratio to your design needs
- Let batch generation complete

### ❌ DON'T:
- Use images larger than 4096×4096px
- Close plugin during generation
- Use in Figma browser version (Desktop only)
- Share your API keys

---

## 🔧 Common Issues

### Plugin Shows Blank Screen
1. Remove plugin from Figma
2. Quit Figma completely (Cmd/Ctrl+Q)
3. Reopen and re-import plugin

### Images Not Generating
- Check API key is valid
- Verify internet connection
- Try "New Generate" to reset

### Need to Start Fresh?
Click "New Generate" button to clear all results and start over.

---

## 🙋 Support & Contact

### Creator
**Yosep Rendi**
Let's connect :  x.com/yoseprendi

