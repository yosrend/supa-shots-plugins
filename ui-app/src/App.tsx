import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PROVIDERS, providers, validateApiKey } from '@/lib/providers';
import { getShots, type ShotConfig } from '@/lib/shots';
import { generateWithProvider, type GenerationResult } from '@/lib/api';
import { storage } from '@/lib/storage';
import confetti from 'canvas-confetti';
import {
  Zap, User, Package, Check, ClipboardPaste,
  RefreshCw, Pencil,
  Upload, Loader2, CheckCircle, X, Edit, Plus, Sparkles, Eye, ZoomIn, ZoomOut
} from 'lucide-react';

type Mode = 'human' | 'product';

interface SelectionState {
  hasImage: boolean;
  imageData: string | null;
  imageName: string;
  imageWidth: number;
  imageHeight: number;
}

interface ResultWithSelection extends GenerationResult {
  selected: boolean;
  shot: ShotConfig;
}

interface CustomRatio {
  width: number;
  height: number;
}

const ASPECT_RATIOS = [
  { id: '3:4', label: '3:4 Portrait', width: 768, height: 1024 },
  { id: '1:1', label: '1:1 Square', width: 1024, height: 1024 },
  { id: '4:3', label: '4:3 Standard', width: 1024, height: 768 },
  { id: '16:9', label: '16:9 Wide', width: 1024, height: 576 },
  { id: '9:16', label: '9:16 Portrait', width: 576, height: 1024 },
  { id: 'custom', label: 'Custom', width: 1024, height: 1024 },
];

function App() {
  // API state
  const [provider, setProvider] = useState<string>(
    storage.getItem('supa_shots_provider') || 'gemini'
  );
  const [apiKey, setApiKey] = useState<string>(
    storage.getItem(`supa_shots_apikey_${storage.getItem('supa_shots_provider') || 'gemini'}`) || ''
  );
  const [apiValidated, setApiValidated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showApiEdit, setShowApiEdit] = useState(true); // Show API config by default

  // Custom API state
  const [customApiUrl, setCustomApiUrl] = useState<string>(
    storage.getItem('supa_shots_custom_api_url') || ''
  );
  const [customModel, setCustomModel] = useState<string>(
    storage.getItem('supa_shots_custom_model') || ''
  );

  // Image state
  const [selection, setSelection] = useState<SelectionState>({
    hasImage: false,
    imageData: null,
    imageName: '',
    imageWidth: 0,
    imageHeight: 0,
  });
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generation state
  const [mode, setMode] = useState<Mode>('human');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [customRatio, setCustomRatio] = useState<CustomRatio>({ width: 1024, height: 1024 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 9, name: '' });
  const [results, setResults] = useState<ResultWithSelection[]>([]);

  // Modal state
  const [editPromptModal, setEditPromptModal] = useState<{ open: boolean, result: ResultWithSelection | null, prompt: string }>({
    open: false,
    result: null,
    prompt: ''
  });
  const [previewModal, setPreviewModal] = useState<{ open: boolean; imageData: string | null; name: string }>({
    open: false,
    imageData: null,
    name: ''
  });
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    // Restore previous session state
    try {
      const savedResults = storage.getItem('last_results');
      const savedSelection = storage.getItem('last_selection');
      const savedMode = storage.getItem('last_mode');
      const savedAspectRatio = storage.getItem('last_aspectRatio');

      if (savedResults && savedSelection) {
        const parsedResults = JSON.parse(savedResults);
        const parsedSelection = JSON.parse(savedSelection);

        setResults(parsedResults);
        setSelection(parsedSelection);
        if (savedMode) setMode(savedMode as 'human' | 'product');
        if (savedAspectRatio) setAspectRatio(savedAspectRatio);

        // Resize to show results panel if we have results
        if (parsedResults.length > 0) {
          parent.postMessage({ pluginMessage: { type: 'resize', width: 800, height: 800 } }, '*');
        }
      }
    } catch (e) {
      console.error('Failed to restore state:', e);
    }
  }, []);

  // Save state when results change
  useEffect(() => {
    if (results.length > 0) {
      storage.setItem('last_results', JSON.stringify(results));
      storage.setItem('last_selection', JSON.stringify(selection));
      storage.setItem('last_mode', mode);
      storage.setItem('last_aspectRatio', aspectRatio);
    }
  }, [results, selection, mode, aspectRatio]);

  // Dynamic plugin resizing based on API validation (expand from step 2)
  useEffect(() => {
    if (apiValidated) {
      // Expand to 800px once API is validated (step 2 onwards)
      parent.postMessage({ pluginMessage: { type: 'resize', width: 800, height: 800 } }, '*');
    } else {
      // Step 1: Compact view
      parent.postMessage({ pluginMessage: { type: 'resize', width: 320, height: 800 } }, '*');
    }
  }, [apiValidated]);

  // Update API key when provider changes
  useEffect(() => {
    const savedKey = storage.getItem(`supa_shots_apikey_${provider}`) || '';
    setApiKey(savedKey);
    storage.setItem('supa_shots_provider', provider);

    // Load custom API settings if custom provider
    if (provider === 'custom') {
      const savedUrl = storage.getItem('supa_shots_custom_api_url') || '';
      const savedModel = storage.getItem('supa_shots_custom_model') || '';
      setCustomApiUrl(savedUrl);
      setCustomModel(savedModel);
    }

    // Check if previously validated
    const validated = storage.getItem(`supa_shots_validated_${provider}`);
    setApiValidated(validated === 'true' && savedKey !== '');
  }, [provider]);

  const handleApiKeyChange = useCallback((value: string) => {
    setApiKey(value);
    setApiValidated(false);
    storage.setItem(`supa_shots_validated_${provider}`, 'false');
  }, [provider]);

  const handleValidateApi = async () => {
    if (!apiKey) {
      alert('Please enter an API key');
      return;
    }

    // Validate API key format first
    const validation = validateApiKey(provider, apiKey);
    if (!validation.valid) {
      alert(`Invalid API Key Format\n\n${validation.error}`);
      return;
    }

    setIsValidating(true);
    try {
      const providerConfig = PROVIDERS[provider];

      // Test API key with a simple request
      if (provider === 'gemini') {
        const response = await fetch(
          `${providerConfig.apiUrl}/models?key=${apiKey}`
        );
        if (!response.ok) throw new Error('Invalid API key or access denied');
      } else if (provider === 'openai') {
        const response = await fetch(
          `${providerConfig.apiUrl}/models`,
          { headers: { 'Authorization': `Bearer ${apiKey}` } }
        );
        if (!response.ok) throw new Error('Invalid API key or access denied');
      }
      // For other providers, we'll rely on format validation for now

      storage.setItem(`supa_shots_apikey_${provider}`, apiKey);
      storage.setItem(`supa_shots_validated_${provider}`, 'true');
      setApiValidated(true);
      setShowApiEdit(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      alert(`API Key Validation Failed\n\n${errorMsg}\n\nPlease check your key and try again.`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        setTimeout(() => {
          setSelection({
            hasImage: true,
            imageData: ev.target?.result as string,
            imageName: file.name,
            imageWidth: img.width,
            imageHeight: img.height,
          });
          setIsScanning(false);
        }, 1500);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!selection.hasImage || !selection.imageData || !apiKey || !apiValidated) return;

    setIsGenerating(true);

    const shots = getShots(mode);

    // Pre-create 9 thumbnail slots with loading state
    const initialResults: ResultWithSelection[] = shots.map(shot => ({
      id: shot.id,
      name: shot.name,
      data: null,
      success: false,
      error: undefined,
      selected: true, // Default checked
      shot
    }));
    setResults(initialResults);

    for (let i = 0; i < shots.length; i++) {
      const shot = shots[i];
      setProgress({ current: i + 1, total: shots.length, name: shot.name });

      // const startTime = Date.now();
      // let success = false;


      try {
        const imageData = await generateWithProvider(
          provider,
          apiKey,
          selection.imageData!,
          shot,
          aspectRatio,
          provider === 'custom' ? { apiUrl: customApiUrl, model: customModel } : undefined
        );

        // Update the specific slot in initialResults
        initialResults[i] = {
          ...initialResults[i],
          data: imageData,
          success: true,
          error: undefined
        };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        // Update the slot with error
        initialResults[i] = {
          ...initialResults[i],
          error: errorMsg,
          success: false
        };
      }

      // Update results incrementally to show progress
      setResults([...initialResults]);
    }

    // Trigger confetti if all successful
    const allSuccess = initialResults.every(r => r.success);
    if (allSuccess) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    setIsGenerating(false);
  };

  const handleRegenerate = async (result: ResultWithSelection) => {
    if (!selection.imageData) return;

    const idx = results.findIndex(r => r.id === result.id);
    if (idx === -1) return;

    const updatedResults = [...results];
    updatedResults[idx] = { ...updatedResults[idx], data: null, success: false, error: 'Regenerating...' };
    setResults(updatedResults);

    try {
      const imageData = await generateWithProvider(
        provider,
        apiKey,
        selection.imageData,
        result.shot,
        aspectRatio,
        provider === 'custom' ? { apiUrl: customApiUrl, model: customModel } : undefined
      );
      updatedResults[idx] = { ...updatedResults[idx], data: imageData, success: true, error: undefined };
    } catch (error) {
      updatedResults[idx] = { ...updatedResults[idx], success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
    setResults([...updatedResults]);
  };

  const handleEditPrompt = (result: ResultWithSelection) => {
    setEditPromptModal({ open: true, result, prompt: result.shot.prompt });
  };

  const handleGenerateWithEditedPrompt = async () => {
    if (!editPromptModal.result || !selection.imageData) return;

    const idx = results.findIndex(r => r.id === editPromptModal.result!.id);
    if (idx === -1) return;

    setEditPromptModal(prev => ({ ...prev, open: false }));

    const updatedResults = [...results];
    const modifiedShot = { ...editPromptModal.result.shot, prompt: editPromptModal.prompt };
    updatedResults[idx] = { ...updatedResults[idx], data: null, success: false, error: 'Generating...' };
    setResults(updatedResults);

    try {
      const imageData = await generateWithProvider(
        provider,
        apiKey,
        selection.imageData,
        modifiedShot,
        aspectRatio,
        provider === 'custom' ? { apiUrl: customApiUrl, model: customModel } : undefined
      );
      updatedResults[idx] = { ...updatedResults[idx], data: imageData, success: true, error: undefined, shot: modifiedShot };
    } catch (error) {
      updatedResults[idx] = { ...updatedResults[idx], success: false, error: error instanceof Error ? error.message : 'Failed' };
    }
    setResults([...updatedResults]);
  };







  const currentProvider = PROVIDERS[provider];

  const canGenerate = apiValidated && selection.hasImage && !isGenerating;

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Main Form (Scrollable) */}
      <div className="min-h-screen w-[320px] flex-shrink-0 bg-background p-4 flex flex-col gap-4 overflow-y-auto">
        {/* Edit API Button (Moved from Header) */}
        {apiValidated && !showApiEdit && (
          <div className="flex justify-end -mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowApiEdit(true)}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <Edit className="w-3 h-3 mr-1" /> Edit API
            </Button>
          </div>
        )}

        {/* API Configuration */}
        {(!apiValidated || showApiEdit) && (
          <Card className="border-2 border-primary">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className={`w - 5 h - 5 ${apiValidated ? 'text-green-500' : 'text-muted-foreground'} `} />
                <Label className="text-sm font-medium">Step 1: API Configuration</Label>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Choose your AI provider and validate your API key to get started.</p>

              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Platform" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>


              {/* Custom API Configuration */}
              {provider === 'custom' && (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">API Endpoint</Label>
                    <Input
                      type="text"
                      placeholder="https://api.example.com/v1"
                      value={customApiUrl}
                      onChange={(e) => {
                        setCustomApiUrl(e.target.value);
                        storage.setItem('supa_shots_custom_api_url', e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Model Name</Label>
                    <Input
                      type="text"
                      placeholder="model-name"
                      value={customModel}
                      onChange={(e) => {
                        setCustomModel(e.target.value);
                        storage.setItem('supa_shots_custom_model', e.target.value);
                      }}
                    />
                  </div>
                </>
              )}

              <div className="relative">
                <Input
                  type="password"
                  placeholder={`Paste your ${currentProvider?.name} API key`}
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange(e.target.value)}
                  className="pr-10"
                />
                <button
                  onClick={async () => {
                    try {
                      if (navigator.clipboard && navigator.clipboard.readText) {
                        const text = await navigator.clipboard.readText();
                        handleApiKeyChange(text);
                      } else {
                        alert('Paste from clipboard tidak tersedia di Figma plugin. Gunakan Ctrl+V di input field.');
                      }
                    } catch (e) {
                      console.warn('Clipboard access denied:', e);
                      alert('Akses clipboard ditolak. Gunakan Ctrl+V di input field.');
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <ClipboardPaste className="w-4 h-4" />
                </button>
              </div>

              <Button
                onClick={handleValidateApi}
                disabled={!apiKey || isValidating}
                className="w-full"
              >
                {isValidating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Validating...</>
                ) : (
                  <><Check className="w-4 h-4 mr-2" /> Validate API Key</>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Get your key from{' '}
                <a href={currentProvider?.helpLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {currentProvider?.helpLinkText}
                </a>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Generation Area */}
        {apiValidated && !showApiEdit && (
          <>
            {/* Image Upload */}
            <Card className={!apiValidated ? 'opacity-50 pointer-events-none' : ''}>
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label className="text-sm font-medium">Step 2: Upload Source Image</Label>
                  <p className="text-xs text-muted-foreground mt-1">Upload or paste an image to transform into AI-generated shots. Supports PNG, JPG, and JPEG formats.</p>
                </div>

                {isScanning ? (
                  <div className="h-32 border-2 border-dashed border-primary rounded-lg flex flex-col items-center justify-center gap-2 bg-primary/5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent animate-pulse" />
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary animate-[scan_1.5s_ease-in-out_infinite]" />
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-sm text-primary font-medium">Scanning image...</span>
                  </div>
                ) : selection.hasImage && selection.imageData ? (
                  <div className="relative group">
                    <img
                      src={selection.imageData}
                      alt="Preview"
                      className="w-full max-h-[300px] object-contain rounded-lg bg-black"
                      style={{ height: 'auto' }}
                    />
                    <button
                      onClick={() => setSelection({ hasImage: false, imageData: null, imageName: '', imageWidth: 0, imageHeight: 0 })}
                      className="absolute top-2 right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span title={selection.imageName}>
                        {selection.imageName.length > 30
                          ? `${selection.imageName.substring(0, 27)}...`
                          : selection.imageName}
                      </span>
                      <span>{selection.imageWidth} × {selection.imageHeight}</span>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to Upload Image</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>

            {/* Shot Mode */}
            <Card className={!apiValidated ? 'opacity-50 pointer-events-none' : ''}>
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label className="text-sm font-medium">Step 3: Choose Shot Mode</Label>
                  <p className="text-xs text-muted-foreground mt-1">Select the type of shots you want to generate.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMode('human')}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center text-center ${mode === 'human' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                  >
                    <User className="w-5 h-5 mb-1" />
                    <div className="font-medium text-sm">Human Portrait</div>
                    <div className="text-xs text-muted-foreground">9 professional angles</div>
                  </button>
                  <button
                    onClick={() => setMode('product')}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center justify-center text-center ${mode === 'product' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                  >
                    <Package className="w-5 h-5 mb-1" />
                    <div className="font-medium text-sm">Product</div>
                    <div className="text-xs text-muted-foreground">9 showcase styles</div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Aspect Ratio */}
            <Card className={!apiValidated ? 'opacity-50 pointer-events-none' : ''}>
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label className="text-sm font-medium">Step 4: Select Aspect Ratio</Label>
                  <p className="text-xs text-muted-foreground mt-1">Choose the output dimensions for your generated images.</p>
                </div>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS.map(ar => (
                      <SelectItem key={ar.id} value={ar.id}>{ar.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {aspectRatio === 'custom' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Width (px)</Label>
                      <Input
                        type="number"
                        value={customRatio.width}
                        onChange={(e) => setCustomRatio(prev => ({ ...prev, width: parseInt(e.target.value) || 1024 }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Height (px)</Label>
                      <Input
                        type="number"
                        value={customRatio.height}
                        onChange={(e) => setCustomRatio(prev => ({ ...prev, height: parseInt(e.target.value) || 1024 }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generate Button */}
            <div className="space-y-2">
              <Button
                onClick={handleGenerate}
                disabled={!canGenerate}
                className="w-full h-12 text-base font-semibold bg-primary hover:opacity-90 transition-opacity"
              >
                {isGenerating ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Zap className="w-5 h-5 mr-2" /> Generate 9 Images</>
                )}
              </Button>
              {!apiValidated && (
                <p className="text-xs text-center text-muted-foreground">
                  ⚠️ Please validate your API key first to enable generation
                </p>
              )}
              {apiValidated && !selection.hasImage && (
                <p className="text-xs text-center text-muted-foreground">
                  ⚠️ Please upload an image to continue
                </p>
              )}
            </div>
          </>
        )}


        {/* Progress */}
        {isGenerating && (
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between text-sm mb-2">
                <span>{progress.name}</span>
                <span className="text-muted-foreground">{progress.current}/{progress.total}</span>
              </div>
              <Progress value={(progress.current / progress.total) * 100} className="h-2" />
            </CardContent>
          </Card>
        )}



        {/* Edit Prompt Modal */}
        {editPromptModal.open && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Label className="font-medium">Edit Prompt</Label>
                  <button onClick={() => setEditPromptModal({ open: false, result: null, prompt: '' })}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <textarea
                  value={editPromptModal.prompt}
                  onChange={(e) => setEditPromptModal(prev => ({ ...prev, prompt: e.target.value }))}
                  className="w-full h-32 p-3 rounded-lg border border-border bg-input text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button onClick={handleGenerateWithEditedPrompt} className="w-full mt-4">
                  <Zap className="w-4 h-4 mr-2" /> Generate with New Prompt
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Preview Modal with Zoom */}
        {previewModal.open && previewModal.imageData && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setPreviewModal({ open: false, imageData: null, name: '' });
              setZoomLevel(100);
            }}
          >
            <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 bg-black/80 p-4 flex items-center justify-between z-10">
                <h3 className="text-white font-semibold">{previewModal.name}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
                    className="text-white hover:bg-white/20"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-white text-sm min-w-[60px] text-center">{zoomLevel}%</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                    className="text-white hover:bg-white/20"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPreviewModal({ open: false, imageData: null, name: '' });
                      setZoomLevel(100);
                    }}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Image */}
              <div className="overflow-auto max-h-[90vh] mt-16">
                <img
                  src={previewModal.imageData.startsWith('data:') ? previewModal.imageData : `data:image/png;base64,${previewModal.imageData}`}
                  alt={previewModal.name}
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'center',
                    transition: 'transform 0.2s ease-in-out'
                  }}
                  className="max-w-full h-auto"
                />
              </div>
            </div>
          </div>
        )}

        <style>{`
    @keyframes scan {
      0%, 100% { top: 0; }
      50% { top: calc(100% - 4px); }
    }
    `}</style>
        {/* Credits Footer */}
        <div className="text-[11px] text-muted-foreground/50 text-center py-1">
          Created by <a href="https://x.com/yoseprendi" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Yosep Rendi</a>
        </div>
      </div>

      {/* Right Panel - Results Sidebar (Always visible from step 2) */}
      {apiValidated && (
        <div className="flex-1 h-screen bg-yellow-50 dark:bg-yellow-900/20 p-6 pb-20 flex flex-col overflow-hidden">
          {results.length === 0 ? (
            // Placeholder state
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground space-y-2">
                <h2 className="text-4xl font-bold mb-4">Supa Shots</h2>
                <h3 className="text-lg font-semibold">Ready to Generate</h3>
                <p className="text-sm">Your generated shots will appear here in a 3×3 grid</p>
                <p className="text-xs mt-4">No scrolling needed!</p>
              </div>
            </div>
          ) : (
            // Results view
            <>
              <div className="mb-4 flex items-center justify-between flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setResults([]);
                    setSelection({ hasImage: false, imageData: null, imageName: '', imageWidth: 0, imageHeight: 0 });
                    storage.removeItem('last_results');
                    storage.removeItem('last_selection');
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-1" /> New Generate
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const allSelected = results.every(r => r.selected);
                    setResults(results.map(r => ({ ...r, selected: !allSelected })));
                  }}
                >
                  {results.every(r => r.selected) ? 'Deselect All' : 'Select All'}
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3 flex-1">
                {results.map((result) => (
                  <div key={result.id} className="relative group">
                    {result.success && result.data ? (
                      <div className="space-y-2">
                        <div className="relative aspect-square overflow-hidden bg-secondary">
                          <img
                            src={result.data.startsWith('data:') ? result.data : `data:image/png;base64,${result.data}`}
                            alt={result.name}
                            className="w-full h-full object-cover"
                            style={{ borderRadius: 0 }}
                          />

                          {/* Checkbox */}
                          <div className="absolute top-2 left-2 z-10">
                            <input
                              type="checkbox"
                              checked={result.selected}
                              onChange={() => {
                                const updated = results.map(r =>
                                  r.id === result.id ? { ...r, selected: !r.selected } : r
                                );
                                setResults(updated);
                              }}
                              className="w-4 h-4"
                            />
                          </div>

                          {/* Hover Overlay with Actions */}
                          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={() => setPreviewModal({ open: true, imageData: result.data, name: result.name })}
                              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                              title="Preview"
                            >
                              <Eye className="w-5 h-5 text-white" />
                            </button>
                            <button
                              onClick={() => {
                                parent.postMessage({
                                  pluginMessage: {
                                    type: 'insert-single',
                                    id: result.id,
                                    name: result.name,
                                    data: result.data
                                  }
                                }, '*');
                              }}
                              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                              title="Insert to Canvas"
                            >
                              <Plus className="w-5 h-5 text-white" />
                            </button>
                            <button
                              onClick={() => handleRegenerate(result)}
                              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                              title="Regenerate"
                            >
                              <RefreshCw className="w-5 h-5 text-white" />
                            </button>
                            <button
                              onClick={() => handleEditPrompt(result)}
                              className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                              title="Edit Prompt"
                            >
                              <Pencil className="w-5 h-5 text-white" />
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{result.name}</div>
                      </div>
                    ) : result.error ? (
                      <div className="aspect-square bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                        <div className="text-xs text-destructive text-center p-2">
                          {result.error}
                        </div>
                      </div>
                    ) : (
                      // Loading state
                      <div className="aspect-square bg-secondary/30 border-2 border-dashed border-muted flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {results.filter(r => r.success && r.selected).length > 0 && (
                <div className="mt-4 flex gap-2 flex-shrink-0">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      const selected = results.filter(r => r.success && r.selected && r.data);
                      parent.postMessage({
                        pluginMessage: {
                          type: 'insert-images',
                          images: selected.map(r => ({ id: r.id, name: r.name, data: r.data }))
                        }
                      }, '*');
                    }}
                  >
                    Insert Selected ({results.filter(r => r.success && r.selected).length})
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
