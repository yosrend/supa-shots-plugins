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
    const nodes: SceneNode[] = [];
    const gridSize = 3; // 3x3 grid
    const spacing = 40;
    const imageSize = 300;

    // Get starting position based on viewport
    const viewportCenter = figma.viewport.center;
    const startX = viewportCenter.x - ((gridSize * imageSize + (gridSize - 1) * spacing) / 2);
    const startY = viewportCenter.y - ((gridSize * imageSize + (gridSize - 1) * spacing) / 2);

    // Create a frame to group all results
    const frame = figma.createFrame();
    frame.name = 'Supa Shots Results';
    frame.resize(
      gridSize * imageSize + (gridSize - 1) * spacing + 40,
      gridSize * imageSize + (gridSize - 1) * spacing + 80
    );
    frame.x = startX - 20;
    frame.y = startY - 60;
    frame.fills = [{ type: 'SOLID', color: { r: 0.05, g: 0.05, b: 0.05 } }];
    frame.cornerRadius = 16;

    // Add title
    const title = figma.createText();
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    title.fontName = { family: 'Inter', style: 'Bold' };
    title.characters = 'Supa Shots';
    title.fontSize = 24;
    title.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    title.x = 20;
    title.y = 20;
    frame.appendChild(title);

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;

      // Create image from base64
      const imageData = Uint8Array.from(atob(img.data), c => c.charCodeAt(0));
      const imageHash = figma.createImage(imageData).hash;

      // Create rectangle with image fill
      const rect = figma.createRectangle();
      rect.name = img.name;
      rect.resize(imageSize, imageSize);
      rect.x = 20 + col * (imageSize + spacing);
      rect.y = 60 + row * (imageSize + spacing);
      rect.cornerRadius = 12;
      rect.fills = [{
        type: 'IMAGE',
        imageHash: imageHash,
        scaleMode: 'FILL'
      }];

      frame.appendChild(rect);
      nodes.push(rect);
    }

    figma.currentPage.appendChild(frame);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);

    figma.notify(`✨ Inserted ${images.length} shots!`, { timeout: 3000 });

    figma.ui.postMessage({
      type: 'insert-complete',
      success: true,
      count: images.length
    });
  } catch (error) {
    figma.notify(`Error inserting images: ${error instanceof Error ? error.message : 'Unknown error'}`, { error: true });
    figma.ui.postMessage({
      type: 'insert-complete',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Insert a single image to canvas
async function handleInsertSingle(msg: { type: string; id: string; name: string; data: string }): Promise<void> {
  try {
    const imageData = Uint8Array.from(atob(msg.data), c => c.charCodeAt(0));
    const imageHash = figma.createImage(imageData).hash;

    const rect = figma.createRectangle();
    rect.name = `Supa Shot - ${msg.name}`;
    rect.resize(400, 400);

    // Position at viewport center
    const center = figma.viewport.center;
    rect.x = center.x - 200;
    rect.y = center.y - 200;

    rect.cornerRadius = 12;
    rect.fills = [{
      type: 'IMAGE',
      imageHash: imageHash,
      scaleMode: 'FILL'
    }];

    figma.currentPage.appendChild(rect);
    figma.currentPage.selection = [rect];
    figma.viewport.scrollAndZoomIntoView([rect]);

    figma.notify(`✨ Inserted "${msg.name}"`, { timeout: 2000 });
  } catch (error) {
    figma.notify(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { error: true });
  }
}

// Listen for selection changes
figma.on('selectionchange', () => {
  handleGetSelection();
});
