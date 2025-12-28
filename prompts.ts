// Supa Shots - Prompt Templates for AI Image Generation

export interface ShotConfig {
    id: string;
    name: string;
    prompt: string;
    description: string;
}

// Human Portrait Mode - 9 Cinematic Angles
export const humanPortraitShots: ShotConfig[] = [
    {
        id: 'mcu',
        name: 'Medium Close-Up',
        description: 'Head and shoulders framing',
        prompt: 'Transform this portrait into a cinematic medium close-up shot. Frame the subject from head to shoulders, with dramatic lighting that emphasizes facial features. Professional photography style with shallow depth of field, bokeh background. Maintain subject likeness exactly.'
    },
    {
        id: 'ms',
        name: 'Medium Shot',
        description: 'Waist up framing',
        prompt: 'Transform this portrait into a professional medium shot. Frame the subject from waist up, showing upper body and gestures. Studio lighting with clean background. Maintain subject likeness and clothing, high-end fashion photography aesthetic.'
    },
    {
        id: 'os',
        name: 'Over-the-Shoulder',
        description: 'View from behind, looking at subject',
        prompt: 'Transform this portrait into an over-the-shoulder perspective. Show the subject from a slight angle behind, creating depth and cinematic feel. Professional movie-style composition with atmospheric lighting. Maintain exact subject likeness.'
    },
    {
        id: 'ws',
        name: 'Wide Shot',
        description: 'Full body with environment',
        prompt: 'Transform this portrait into a wide establishing shot. Show full body of the subject within an elegant environment. Professional editorial photography with environmental context. Maintain subject likeness, add sophisticated backdrop.'
    },
    {
        id: 'ha',
        name: 'High Angle',
        description: 'Looking down at subject',
        prompt: 'Transform this portrait into a high angle shot. Camera positioned above looking down at the subject, creating a unique perspective. Artistic composition with dramatic shadows. Maintain exact subject likeness and features.'
    },
    {
        id: 'la',
        name: 'Low Angle',
        description: 'Looking up at subject',
        prompt: 'Transform this portrait into a powerful low angle shot. Camera positioned below looking up at the subject, creating heroic and empowering perspective. Dramatic sky or ceiling in background. Maintain exact subject likeness.'
    },
    {
        id: 'profile',
        name: 'Profile',
        description: 'Side view silhouette',
        prompt: 'Transform this portrait into an elegant profile shot. Pure side view emphasizing facial silhouette and contours. Artistic rim lighting or dramatic side lighting. Maintain exact subject likeness from profile angle.'
    },
    {
        id: 'threeq',
        name: 'Three-Quarter',
        description: '45-degree angle view',
        prompt: 'Transform this portrait into a classic three-quarter view. Subject positioned at 45-degree angle to camera, the most flattering portrait angle. Professional Rembrandt lighting setup. Maintain exact subject likeness with this angle.'
    },
    {
        id: 'back',
        name: 'Back View',
        description: 'From behind the subject',
        prompt: 'Transform this portrait into an artistic back view shot. Show the subject from behind, creating mystery and intrigue. Elegant silhouette with atmospheric lighting. Maintain subject hair, clothing, and proportions.'
    }
];

// Premium Product Mode - 9 Luxury Editorial Styles
export const premiumProductShots: ShotConfig[] = [
    {
        id: 'luxury-editorial',
        name: 'Luxury Editorial',
        description: 'High-end magazine style',
        prompt: 'Transform this product into a luxury editorial photograph. High-end magazine aesthetic with sophisticated lighting and premium feel. Elegant shadows, refined reflections. Style of Vogue or Harper\'s Bazaar product photography.'
    },
    {
        id: 'minimal-studio',
        name: 'Minimal Studio',
        description: 'Clean white background',
        prompt: 'Transform this product into a minimal studio shot. Pure white seamless background, perfect even lighting. Clean e-commerce style but elevated. No distractions, product hero focus. Professional packshot quality.'
    },
    {
        id: 'dramatic-lighting',
        name: 'Dramatic Lighting',
        description: 'Bold shadows and highlights',
        prompt: 'Transform this product into a dramatically lit photograph. Bold chiaroscuro lighting with deep shadows and bright highlights. Moody, artistic, gallery-worthy. High contrast studio photography style.'
    },
    {
        id: 'natural-lifestyle',
        name: 'Natural Lifestyle',
        description: 'In-context usage scene',
        prompt: 'Transform this product into a natural lifestyle photograph. Show the product in an authentic, aspirational usage context. Warm natural lighting, styled environment. Premium lifestyle brand photography aesthetic.'
    },
    {
        id: 'macro-detail',
        name: 'Macro Detail',
        description: 'Extreme close-up textures',
        prompt: 'Transform this product into an extreme macro detail shot. Focus on textures, materials, and craftsmanship. Shallow depth of field, emphasis on quality details. Luxury brand close-up photography style.'
    },
    {
        id: 'color-pop',
        name: 'Color Pop',
        description: 'Vibrant saturated colors',
        prompt: 'Transform this product into a vibrant color pop photograph. Bold, saturated colors with complementary backdrop. Eye-catching, energetic styling. Modern advertising photography with color impact.'
    },
    {
        id: 'vintage-film',
        name: 'Vintage Film',
        description: 'Retro aesthetic look',
        prompt: 'Transform this product into a vintage film photograph. Classic film grain, warm color grading, nostalgic aesthetic. Hasselblad or medium format film look. Timeless, heritage brand photography style.'
    },
    {
        id: 'tech-modern',
        name: 'Tech Modern',
        description: 'Sleek futuristic style',
        prompt: 'Transform this product into a sleek tech-modern photograph. Futuristic aesthetic with gradient lighting, neon accents possible. Clean, minimal, Silicon Valley product launch style. Premium tech brand photography.'
    },
    {
        id: 'artisan-craft',
        name: 'Artisan Craft',
        description: 'Handmade quality aesthetic',
        prompt: 'Transform this product into an artisan craft photograph. Emphasis on handmade quality, raw materials, craftsmanship. Warm, authentic lighting. Workshop or atelier environment. Luxury artisan brand aesthetic.'
    }
];

// Get shots based on mode
export function getShots(mode: 'human' | 'product'): ShotConfig[] {
    return mode === 'human' ? humanPortraitShots : premiumProductShots;
}

// Build full prompt for Gemini
export function buildGenerationPrompt(basePrompt: string, shotConfig: ShotConfig): string {
    return `${shotConfig.prompt}

Original image context will be provided. Generate a high-quality, photorealistic result.
Output requirements:
- Maintain exact subject likeness/product identity
- Professional photography quality
- Consistent lighting and style
- High resolution output

${basePrompt}`;
}
