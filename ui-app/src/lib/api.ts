import { PROVIDERS, type ProviderConfig } from './providers';
import type { ShotConfig } from './shots';

export interface GenerationResult {
    id: string;
    name: string;
    data: string | null;
    success: boolean;
    error?: string;
}

export async function generateWithProvider(
    providerId: string,
    apiKey: string,
    imageData: string,
    shot: ShotConfig,
    customConfig?: { apiUrl: string; model: string }
): Promise<string> {
    let provider = PROVIDERS[providerId];
    if (!provider) throw new Error('Unknown provider');

    // Override provider config for custom API
    if (providerId === 'custom' && customConfig) {
        provider = {
            ...provider,
            apiUrl: customConfig.apiUrl,
            model: customConfig.model
        };
    }

    switch (providerId) {
        case 'gemini':
            return generateWithGemini(imageData, shot, provider, apiKey);
        case 'openai':
            return generateWithOpenAI(imageData, shot, provider, apiKey);
        case 'together':
            return generateWithTogether(imageData, shot, provider, apiKey);
        case 'stability':
            return generateWithStability(imageData, shot, provider, apiKey);
        case 'replicate':
            return generateWithReplicate(imageData, shot, provider, apiKey);
        case 'custom':
            return generateWithCustom(imageData, shot, provider, apiKey);
        default:
            throw new Error('Unsupported provider');
    }
}

// Helper to detect image mime type from base64
function detectMimeType(base64Data: string): string {
    if (base64Data.startsWith('/9j/')) return 'image/jpeg';
    if (base64Data.startsWith('iVBORw')) return 'image/png';
    if (base64Data.startsWith('R0lGOD')) return 'image/gif';
    if (base64Data.startsWith('UklGR')) return 'image/webp';
    return 'image/png'; // Default to PNG
}

// Gemini Image Editing - PROPER IMPLEMENTATION
// Uses inlineData for image input and responseModalities for image output
async function generateWithGemini(
    imageData: string,
    shot: ShotConfig,
    provider: ProviderConfig,
    apiKey: string
): Promise<string> {
    // Clean base64 data (remove data:image/...;base64, prefix if present)
    const cleanBase64 = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const mimeType = detectMimeType(cleanBase64);

    // Build prompt that references the input image
    const editPrompt = `Using the provided image as the reference subject, ${shot.prompt}

IMPORTANT: 
- The person/subject in the output MUST be the EXACT same person/subject from the input image
- Preserve all identifying features: face shape, skin tone, hair color/style, eye color, expressions
- Only change the camera angle, lighting, and composition as described
- The output should look like a different photo of the SAME person, not a different person`;

    const response = await fetch(
        `${provider.apiUrl}/models/${provider.model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: cleanBase64
                            }
                        },
                        { text: editPrompt }
                    ]
                }],
                generationConfig: {
                    responseModalities: ["IMAGE", "TEXT"],
                    temperature: 1,
                    topP: 0.95,
                    topK: 40
                }
            })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Gemini API error: ${response.status}`;
        try {
            const error = JSON.parse(errorText);
            errorMessage = error.error?.message || errorMessage;
        } catch {
            errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) throw new Error('Invalid response from Gemini API');

    // Look for inline data with image
    for (const part of parts) {
        if (part.inlineData?.data) return part.inlineData.data;
        if (part.inline_data?.data) return part.inline_data.data;
    }

    throw new Error('No image found in Gemini response');
}

// OpenAI DALL-E 3 - Image variation/generation
async function generateWithOpenAI(
    _imageData: string,
    shot: ShotConfig,
    provider: ProviderConfig,
    apiKey: string
): Promise<string> {
    // DALL-E 3 doesn't support image-to-image editing via this endpoint
    // We'll use the prompt to describe what we want
    const response = await fetch(`${provider.apiUrl}/images/generations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: provider.model,
            prompt: shot.prompt,
            n: 1,
            size: '1024x1024',
            quality: 'hd',
            response_format: 'b64_json'
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `OpenAI API error: ${response.status}`;
        try {
            const error = JSON.parse(errorText);
            errorMessage = error.error?.message || errorMessage;
        } catch {
            errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.data?.[0]?.b64_json) {
        throw new Error('No image found in OpenAI response');
    }

    return data.data[0].b64_json;
}

// Together AI (FLUX) - Text to image
async function generateWithTogether(
    _imageData: string,
    shot: ShotConfig,
    provider: ProviderConfig,
    apiKey: string
): Promise<string> {
    const response = await fetch(`${provider.apiUrl}/images/generations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: provider.model,
            prompt: shot.prompt,
            n: 1,
            steps: 4,
            response_format: 'b64_json'
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Together API error: ${response.status}`;
        try {
            const error = JSON.parse(errorText);
            errorMessage = error.error?.message || errorMessage;
        } catch {
            errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.data?.[0]?.b64_json) {
        throw new Error('No image found in Together response');
    }

    return data.data[0].b64_json;
}

// Stability AI (SD3)
async function generateWithStability(
    _imageData: string,
    shot: ShotConfig,
    provider: ProviderConfig,
    apiKey: string
): Promise<string> {
    const formData = new FormData();
    formData.append('prompt', shot.prompt);
    formData.append('output_format', 'png');
    formData.append('mode', 'text-to-image');

    const response = await fetch(`${provider.apiUrl}/stable-image/generate/sd3`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json'
        },
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Stability API error: ${response.status}`;
        try {
            const error = JSON.parse(errorText);
            errorMessage = error.errors?.[0] || error.message || errorMessage;
        } catch {
            errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.image) {
        throw new Error('No image found in Stability response');
    }

    return data.image;
}

// Replicate (FLUX)
async function generateWithReplicate(
    _imageData: string,
    shot: ShotConfig,
    provider: ProviderConfig,
    apiKey: string
): Promise<string> {
    // Start prediction
    const startResponse = await fetch(`${provider.apiUrl}/predictions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            version: 'f2c0d1c1d9e9b7f6e5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1',
            input: {
                prompt: shot.prompt,
                num_outputs: 1,
                aspect_ratio: '1:1',
                output_format: 'png'
            }
        })
    });

    if (!startResponse.ok) {
        const errorText = await startResponse.text();
        throw new Error(`Replicate API error: ${errorText}`);
    }

    const prediction = await startResponse.json();

    // Poll for result
    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const pollResponse = await fetch(result.urls.get, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        result = await pollResponse.json();
    }

    if (result.status === 'failed') {
        throw new Error(result.error || 'Replicate generation failed');
    }

    // Get image URL and convert to base64
    const imageUrl = result.output?.[0];
    if (!imageUrl) throw new Error('No image in Replicate response');

    const imageResponse = await fetch(imageUrl);
    const blob = await imageResponse.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    return base64;
}

// Custom API
async function generateWithCustom(
    imageData: string,
    shot: ShotConfig,
    provider: ProviderConfig,
    apiKey: string
): Promise<string> {
    // Try to detect API format and send appropriately
    const cleanBase64 = imageData.replace(/^data:image\/[a-z]+;base64,/, '');

    const response = await fetch(provider.apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: provider.model,
            prompt: shot.prompt,
            image: cleanBase64,
            n: 1,
            response_format: 'b64_json'
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Custom API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Try various response formats
    if (data.data?.[0]?.b64_json) return data.data[0].b64_json;
    if (data.images?.[0]) return data.images[0];
    if (data.image) return data.image;
    if (data.output) return data.output;
    if (data.candidates?.[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
            if (part.inlineData?.data) return part.inlineData.data;
        }
    }

    throw new Error('Could not find image in custom API response');
}
