const PLUGIN_WIDTH = 320;
const PLUGIN_HEIGHT = 600;

// Message types for UI communication
interface PluginMessage {
  type: string;
  [key: string]: unknown;
}

interface GenerateMessage extends PluginMessage {
  type: 'generate';
  imageData: string;
  mode: 'human' | 'product';
  apiKey: string;
}

interface InsertImagesMessage extends PluginMessage {
  type: 'insert-images';
  images: Array<{
    id: string;
    name: string;
    data: string;
  }>;
}

interface GetSelectionMessage extends PluginMessage {
  type: 'get-selection';
}

interface StorageRequestMessage extends PluginMessage {
  type: 'STORAGE_REQUEST';
  messageId: string;
  operation: 'get' | 'set' | 'remove';
  key: string;
  value?: string;
}

// Storage keys that will be synced to UI
const STORAGE_KEYS = [
  'supa_shots_provider',
  'supa_shots_apikey_gemini',
  'supa_shots_apikey_openai',
  'supa_shots_apikey_anthropic',
  'supa_shots_apikey_fal',
  'supa_shots_apikey_replicate',
  'supa_shots_apikey_custom',
  'supa_shots_custom_api_url',
  'supa_shots_custom_model',
  'supa_shots_validated_gemini',
  'supa_shots_validated_openai',
  'supa_shots_validated_anthropic',
  'supa_shots_validated_fal',
  'supa_shots_validated_replicate',
  'supa_shots_validated_custom',
  'supa_shots_figma_id',
  'supa_shots_auth_token',
  'supa_shots_auth_user'
];

// Run plugin only in Figma design mode
if (figma.editorType === 'figma') {
  console.log('[Supa Shots] Plugin loaded - Version: Simplified Decode v3');

  // Show the plugin UI
  figma.showUI(__html__, {
    width: PLUGIN_WIDTH,
    height: PLUGIN_HEIGHT,
    themeColors: true
  });

  // Load and send initial storage data to UI
  async function initializeStorage() {
    const storage: Record<string, string | null> = {};
    for (const key of STORAGE_KEYS) {
      try {
        const value = await figma.clientStorage.getAsync(key);
        if (value !== undefined) {
          storage[key] = value;
        }
      } catch (e) {
        console.warn(`Error loading storage key ${key}:`, e);
      }
    }
    figma.ui.postMessage({ type: 'STORAGE_INIT', storage });
  }

  // Handle storage request from UI
  async function handleStorageRequest(msg: StorageRequestMessage) {
    const { messageId, operation, key, value } = msg;
    try {
      let result: string | null = null;
      switch (operation) {
        case 'get':
          const getResult = await figma.clientStorage.getAsync(key);
          result = getResult !== undefined ? getResult : null;
          break;
        case 'set':
          await figma.clientStorage.setAsync(key, value);
          result = value !== undefined ? value : null;
          break;
        case 'remove':
          await figma.clientStorage.deleteAsync(key);
          result = null;
          break;
      }
      figma.ui.postMessage({ type: 'STORAGE_RESPONSE', messageId, value: result });
    } catch (error) {
      figma.ui.postMessage({
        type: 'STORAGE_RESPONSE',
        messageId,
        error: error instanceof Error ? error.message : 'Storage error'
      });
    }
  }

  // Handle messages from UI
  figma.ui.onmessage = async (msg: PluginMessage) => {
    switch (msg.type) {
      case 'STORAGE_REQUEST':
        await handleStorageRequest(msg as StorageRequestMessage);
        break;

      case 'get-selection':
        await handleGetSelection();
        break;

      case 'insert-images':
        await handleInsertImages(msg as InsertImagesMessage);
        break;

      case 'insert-single':
        await handleInsertSingle(msg as { type: string; id: string; name: string; data: string });
        break;

      case 'notify':
        figma.notify(msg.message as string, {
          timeout: msg.timeout as number || 3000,
          error: msg.error as boolean || false
        });
        break;

      case 'close':
        figma.closePlugin();
        break;

      case 'resize':
        figma.ui.resize(
          (msg.width as number) || PLUGIN_WIDTH,
          (msg.height as number) || PLUGIN_HEIGHT
        );
        break;

      default:
        console.warn('Unknown message type:', msg.type);
    }
  };

  // Initialize storage and send initial selection to UI
  initializeStorage();
  handleGetSelection();
}

// Manual base64 decoder (atob is not available in Figma plugin environment)
function base64Decode(base64: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let str = '';

  // Remove padding
  base64 = base64.replace(/=+$/, '');

  for (let i = 0; i < base64.length;) {
    const a = chars.indexOf(base64.charAt(i++));
    const b = chars.indexOf(base64.charAt(i++));
    const c = chars.indexOf(base64.charAt(i++));
    const d = chars.indexOf(base64.charAt(i++));

    const bits = (a << 18) | (b << 12) | (c << 6) | d;

    str += String.fromCharCode((bits >> 16) & 0xFF);
    if (c !== -1) str += String.fromCharCode((bits >> 8) & 0xFF);
    if (d !== -1) str += String.fromCharCode(bits & 0xFF);
  }

  return str;
}

// Helper to decode base64 to Uint8Array
function decodeBase64(base64String: string): Uint8Array {
  try {
    // Remove data URL prefix if present
    const cleanBase64 = base64String.replace(/^data:image\/\w+;base64,/, '');

    // Decode using manual decoder (atob not available in Figma)
    const binaryString = base64Decode(cleanBase64);

    // Convert to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
  } catch (error) {
    console.error('[Supa Shots] Decode error:', error);
    console.error('[Supa Shots] Data sample:', base64String ? base64String.substring(0, 100) : 'undefined');
    throw new Error('Failed to decode image data');
  }
}

// Get the currently selected image and send to UI
async function handleGetSelection(): Promise<void> {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.ui.postMessage({
      type: 'selection-update',
      hasSelection: false,
      error: 'No selection. Please select an image on the canvas.'
    });
    return;
  }

  const node = selection[0];

  // Check if node has image fills
  if (!('fills' in node)) {
    figma.ui.postMessage({
      type: 'selection-update',
      hasSelection: false,
      error: 'Selected element has no image fill. Please select an image.'
    });
    return;
  }

  const fills = node.fills as Paint[];
  const imageFill = fills.find(fill => fill.type === 'IMAGE') as ImagePaint | undefined;

  if (!imageFill || !imageFill.imageHash) {
    figma.ui.postMessage({
      type: 'selection-update',
      hasSelection: false,
      error: 'No image found in selection. Please select an element with an image fill.'
    });
    return;
  }

  try {
    // Get the image data
    const image = figma.getImageByHash(imageFill.imageHash);
    if (!image) {
      throw new Error('Could not retrieve image data');
    }

    const bytes = await image.getBytesAsync();
    const base64 = figma.base64Encode(bytes);

    // Get image dimensions
    const size = await image.getSizeAsync();

    figma.ui.postMessage({
      type: 'selection-update',
      hasSelection: true,
      imageData: `data:image/png;base64,${base64}`,
      imageName: node.name,
      imageWidth: size.width,
      imageHeight: size.height
    });
  } catch (error) {
    figma.ui.postMessage({
      type: 'selection-update',
      hasSelection: false,
      error: `Error reading image: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}

// Insert multiple generated images to canvas
async function handleInsertImages(msg: InsertImagesMessage): Promise<void> {
  const { images } = msg;

  if (!images || images.length === 0) {
    figma.notify('No images to insert', { error: true });
    return;
  }

  try {
    const gridSize = 3;
    const spacing = 40;
    const itemsPerRow = gridSize;

    // Create a frame to group all results
    const frame = figma.createFrame();
    frame.name = 'Supa Shots Results';
    frame.fills = [{ type: 'SOLID', color: { r: 0.05, g: 0.05, b: 0.05 } }];
    frame.cornerRadius = 16;
    frame.paddingTop = 80;
    frame.paddingBottom = 40;
    frame.paddingLeft = 40;
    frame.paddingRight = 40;

    // Load font for title
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    const title = figma.createText();
    title.fontName = { family: 'Inter', style: 'Bold' };
    title.characters = 'Supa Shots';
    title.fontSize = 28;
    title.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    frame.appendChild(title);

    let currentX = 40;
    let currentY = 80;
    let maxRowHeight = 0;

    for (let i = 0; i < images.length; i++) {
      const imgData = images[i];
      const bytes = decodeBase64(imgData.data);
      const image = figma.createImage(bytes);
      const size = await image.getSizeAsync();

      // Determine dimensions (max 300px width/height while maintaining aspect ratio)
      const scale = Math.min(300 / size.width, 300 / size.height);
      const width = size.width * scale;
      const height = size.height * scale;

      const rect = figma.createRectangle();
      rect.name = imgData.name;
      rect.resize(width, height);
      rect.cornerRadius = 12;
      rect.fills = [{
        type: 'IMAGE',
        imageHash: image.hash,
        scaleMode: 'FIT' // Use FIT instead of FILL for proper embedding
      }];

      const col = i % itemsPerRow;
      if (col === 0 && i !== 0) {
        currentX = 40;
        currentY += maxRowHeight + spacing;
        maxRowHeight = 0;
      }

      rect.x = currentX;
      rect.y = currentY;

      frame.appendChild(rect);
      currentX += width + spacing;
      maxRowHeight = Math.max(maxRowHeight, height);
    }

    // Resize frame to fit content
    frame.resize(
      Math.max(400, (300 + spacing) * itemsPerRow + 40),
      currentY + maxRowHeight + 40
    );

    figma.currentPage.appendChild(frame);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    figma.notify(`✨ Inserted ${images.length} shots!`);

    figma.ui.postMessage({
      type: 'insert-complete',
      success: true,
      count: images.length
    });
  } catch (error) {
    console.error('[Supa Shots] Insert error:', error);
    figma.notify(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { error: true });
  }
}

// Insert a single image to canvas
async function handleInsertSingle(msg: { type: string; id: string; name: string; data: string }): Promise<void> {
  try {
    const bytes = decodeBase64(msg.data);
    const image = figma.createImage(bytes);
    const size = await image.getSizeAsync();

    const rect = figma.createRectangle();
    rect.name = `Supa Shot - ${msg.name}`;

    // Default to max 400px while maintaining aspect ratio
    const scale = Math.min(400 / size.width, 400 / size.height);
    rect.resize(size.width * scale, size.height * scale);

    const center = figma.viewport.center;
    rect.x = center.x - rect.width / 2;
    rect.y = center.y - rect.height / 2;

    rect.cornerRadius = 12;
    rect.fills = [{
      type: 'IMAGE',
      imageHash: image.hash,
      scaleMode: 'FIT' // Use FIT for proper embedding
    }];

    figma.currentPage.appendChild(rect);
    figma.currentPage.selection = [rect];
    figma.viewport.scrollAndZoomIntoView([rect]);

    figma.notify(`✨ Inserted "${msg.name}"`);
  } catch (error) {
    console.error('[Supa Shots] Insert single error:', error);
    figma.notify(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { error: true });
  }
}

// Listen for selection changes
figma.on('selectionchange', () => {
  handleGetSelection();
});
