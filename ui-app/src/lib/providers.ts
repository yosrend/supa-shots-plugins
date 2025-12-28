// Provider configurations for AI image generation
export interface ProviderConfig {
    id: string;
    name: string;
    apiUrl: string;
    model: string;
    keyPlaceholder: string;
    helpLink: string;
    helpLinkText: string;
    keyPattern: RegExp;
    keyExample: string;
    isCustom?: boolean;
}

export const PROVIDERS: Record<string, ProviderConfig> = {
    gemini: {
        id: 'gemini',
        name: 'Gemini 3.0 Pro',
        apiUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-3-pro-image-preview',
        keyPlaceholder: 'AIzaSy...',
        helpLink: 'https://aistudio.google.com/apikey',
        helpLinkText: 'Google AI Studio',
        keyPattern: /^AIza[0-9A-Za-z-_]{35}$/,
        keyExample: 'AIzaSyABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
    },
    openai: {
        id: 'openai',
        name: 'OpenAI DALL-E 3',
        apiUrl: 'https://api.openai.com/v1',
        model: 'dall-e-3',
        keyPlaceholder: 'sk-proj-...',
        helpLink: 'https://platform.openai.com/api-keys',
        helpLinkText: 'OpenAI Platform',
        keyPattern: /^sk-(proj-)?[a-zA-Z0-9]{48,}$/,
        keyExample: 'sk-proj-1234567890abcdefghijklmnopqrstuvwxyz'
    },
    together: {
        id: 'together',
        name: 'Together AI (FLUX)',
        apiUrl: 'https://api.together.xyz/v1',
        model: 'black-forest-labs/FLUX.1-schnell',
        keyPlaceholder: 'tog_...',
        helpLink: 'https://api.together.xyz/settings/api-keys',
        helpLinkText: 'Together AI',
        keyPattern: /^[a-f0-9]{64}$/,
        keyExample: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    },
    stability: {
        id: 'stability',
        name: 'Stability AI (SD3)',
        apiUrl: 'https://api.stability.ai/v2beta',
        model: 'sd3-large',
        keyPlaceholder: 'sk-...',
        helpLink: 'https://platform.stability.ai/account/keys',
        helpLinkText: 'Stability AI',
        keyPattern: /^sk-[a-zA-Z0-9]{48,}$/,
        keyExample: 'sk-1234567890abcdefghijklmnopqrstuvwxyz'
    },
    replicate: {
        id: 'replicate',
        name: 'Replicate (FLUX)',
        apiUrl: 'https://api.replicate.com/v1',
        model: 'black-forest-labs/flux-schnell',
        keyPlaceholder: 'r8_...',
        helpLink: 'https://replicate.com/account/api-tokens',
        helpLinkText: 'Replicate',
        keyPattern: /^r8_[a-zA-Z0-9]{40,}$/,
        keyExample: 'r8_abcdefghijklmnopqrstuvwxyz1234567890'
    },
    custom: {
        id: 'custom',
        name: 'Custom API',
        apiUrl: '',
        model: '',
        keyPlaceholder: 'Your API key',
        helpLink: '',
        helpLinkText: 'Custom API',
        keyPattern: /.+/,
        keyExample: 'any-api-key-format',
        isCustom: true
    }
};

export const providers = Object.values(PROVIDERS);

// Validate API key format for a provider
export function validateApiKey(providerId: string, apiKey: string): { valid: boolean; error?: string } {
    const provider = PROVIDERS[providerId];
    if (!provider) {
        return { valid: false, error: 'Unknown provider' };
    }

    if (!apiKey || apiKey.trim() === '') {
        return { valid: false, error: 'API key is required' };
    }

    // Skip pattern validation for custom provider
    if (provider.isCustom) {
        return { valid: true };
    }

    if (!provider.keyPattern.test(apiKey.trim())) {
        return {
            valid: false,
            error: `Invalid ${provider.name} API key format. Expected format: ${provider.keyExample.substring(0, 20)}...`
        };
    }

    return { valid: true };
}
