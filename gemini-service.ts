// Gemini AI Service for Supa Shots
import { ShotConfig, getShots, buildGenerationPrompt } from './prompts';

export interface GenerationResult {
    shotId: string;
    shotName: string;
    imageData: string; // base64
    success: boolean;
    error?: string;
}

export interface GenerationProgress {
    current: number;
    total: number;
    shotName: string;
}

export class GeminiService {
    private apiKey: string;
    private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    private model = 'gemini-2.0-flash-exp'; // or 'gemini-1.5-pro-vision'

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async generateShots(
        imageBase64: string,
        mode: 'human' | 'product',
        onProgress?: (progress: GenerationProgress) => void
    ): Promise<GenerationResult[]> {
        const shots = getShots(mode);
        const results: GenerationResult[] = [];

        for (let i = 0; i < shots.length; i++) {
            const shot = shots[i];

            if (onProgress) {
                onProgress({
                    current: i + 1,
                    total: shots.length,
                    shotName: shot.name
                });
            }

            try {
                const result = await this.generateSingleShot(imageBase64, shot);
                results.push({
                    shotId: shot.id,
                    shotName: shot.name,
                    imageData: result,
                    success: true
                });
            } catch (error) {
                results.push({
                    shotId: shot.id,
                    shotName: shot.name,
                    imageData: '',
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }

            // Small delay between requests to avoid rate limiting
            if (i < shots.length - 1) {
                await this.delay(500);
            }
        }

        return results;
    }

    private async generateSingleShot(imageBase64: string, shot: ShotConfig): Promise<string> {
        const prompt = buildGenerationPrompt('', shot);

        // Remove data URL prefix if present
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

        const requestBody = {
            contents: [{
                parts: [
                    {
                        text: prompt
                    },
                    {
                        inline_data: {
                            mime_type: 'image/png',
                            data: cleanBase64
                        }
                    }
                ]
            }],
            generationConfig: {
                responseModalities: ['image', 'text'],
                responseMimeType: 'image/png'
            }
        };

        const response = await fetch(
            `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();

        // Extract image from response
        const candidates = data.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error('No response generated');
        }

        const parts = candidates[0].content?.parts;
        if (!parts) {
            throw new Error('Invalid response format');
        }

        // Find the image part
        for (const part of parts) {
            if (part.inline_data?.data) {
                return part.inline_data.data;
            }
        }

        throw new Error('No image in response');
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Validate API key
    async validateApiKey(): Promise<boolean> {
        try {
            const response = await fetch(
                `${this.baseUrl}/models?key=${this.apiKey}`,
                { method: 'GET' }
            );
            return response.ok;
        } catch {
            return false;
        }
    }
}

// Singleton instance management
let serviceInstance: GeminiService | null = null;

export function initGeminiService(apiKey: string): GeminiService {
    serviceInstance = new GeminiService(apiKey);
    return serviceInstance;
}

export function getGeminiService(): GeminiService | null {
    return serviceInstance;
}
