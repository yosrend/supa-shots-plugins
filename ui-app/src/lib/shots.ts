export interface ShotConfig {
    id: string;
    name: string;
    prompt: string;
}

// Human Portrait Mode - 9 Cinematic Angles
// Each prompt explicitly instructs to preserve the EXACT person from the input image
export const humanPortraitShots: ShotConfig[] = [
    {
        id: 'mcu',
        name: 'Medium Close-Up',
        prompt: 'Create a cinematic medium close-up shot of THIS EXACT PERSON. Frame from head to shoulders with dramatic lighting emphasizing facial features. Professional photography with shallow depth of field and bokeh background. CRITICAL: The person must be identical to the input - same face, skin tone, hair, features, expressions.'
    },
    {
        id: 'ms',
        name: 'Medium Shot',
        prompt: 'Create a professional medium shot of THIS EXACT PERSON. Frame from waist up showing upper body and gestures. Studio lighting with clean background. High-end fashion photography aesthetic. CRITICAL: Preserve exact likeness - same face, body proportions, clothing style, all identifying features.'
    },
    {
        id: 'os',
        name: 'Over-the-Shoulder',
        prompt: 'Create an over-the-shoulder perspective of THIS EXACT PERSON. Show from a slight angle behind, creating depth and cinematic feel. Professional movie-style composition with atmospheric lighting. CRITICAL: Same person - recognize by hair, skin tone, clothing, body shape.'
    },
    {
        id: 'ws',
        name: 'Wide Shot',
        prompt: 'Create a wide establishing shot of THIS EXACT PERSON. Show full body within an elegant environment. Professional editorial photography with environmental context. CRITICAL: Same person fully visible - identical face, body, clothing, all physical characteristics.'
    },
    {
        id: 'ha',
        name: 'High Angle',
        prompt: 'Create a high angle shot of THIS EXACT PERSON. Camera positioned above looking down, unique perspective with dramatic shadows. Artistic composition. CRITICAL: The face and features must be the SAME person from the input image.'
    },
    {
        id: 'la',
        name: 'Low Angle',
        prompt: 'Create a powerful low angle shot of THIS EXACT PERSON. Camera below looking up, heroic and empowering perspective. Dramatic sky or ceiling in background. CRITICAL: Identical person - same face, skin, hair, all recognizable features preserved.'
    },
    {
        id: 'profile',
        name: 'Profile',
        prompt: 'Create an elegant profile shot of THIS EXACT PERSON. Pure side view emphasizing facial silhouette and contours. Artistic rim or side lighting. CRITICAL: Same person from profile angle - identical nose, lips, chin, forehead, hair.'
    },
    {
        id: 'threeq',
        name: 'Three-Quarter',
        prompt: 'Create a classic three-quarter view of THIS EXACT PERSON. 45-degree angle to camera, the most flattering portrait angle. Professional Rembrandt lighting. CRITICAL: SAME person - all facial features, skin texture, expression must match input.'
    },
    {
        id: 'back',
        name: 'Back View',
        prompt: 'Create an artistic back view of THIS EXACT PERSON. Show from behind creating mystery and intrigue. Elegant silhouette with atmospheric lighting. CRITICAL: Same person - identical hair color/style, body proportions, clothing, skin tone visible.'
    }
];

// Premium Product Mode - 9 Editorial Styles
// Each prompt instructs to use the EXACT product from the input image
export const productShots: ShotConfig[] = [
    {
        id: 'luxury',
        name: 'Luxury Editorial',
        prompt: 'Photograph THIS EXACT PRODUCT in a luxury editorial style. High-end magazine aesthetic with sophisticated lighting and premium feel. Elegant shadows, refined reflections. Vogue/Harper\'s Bazaar quality. CRITICAL: Same product - identical shape, color, branding, materials, all details.'
    },
    {
        id: 'minimal',
        name: 'Minimal Studio',
        prompt: 'Photograph THIS EXACT PRODUCT in minimal studio style. Pure white seamless background, perfect even lighting. Clean e-commerce but elevated. No distractions, product hero focus. CRITICAL: Same product - exact shape, color, texture, branding, every detail preserved.'
    },
    {
        id: 'dramatic',
        name: 'Dramatic Lighting',
        prompt: 'Photograph THIS EXACT PRODUCT with dramatic lighting. Bold chiaroscuro with deep shadows and bright highlights. Moody, artistic, gallery-worthy. CRITICAL: Same product - identical in every detail, only lighting changes.'
    },
    {
        id: 'lifestyle',
        name: 'Natural Lifestyle',
        prompt: 'Photograph THIS EXACT PRODUCT in a natural lifestyle setting. Authentic, aspirational usage context. Warm natural lighting, styled environment. CRITICAL: Same product placed in lifestyle scene - all product details preserved.'
    },
    {
        id: 'macro',
        name: 'Macro Detail',
        prompt: 'Photograph THIS EXACT PRODUCT as extreme macro detail. Focus on textures, materials, craftsmanship. Shallow depth of field. CRITICAL: Zoomed view of the SAME product - showing actual materials and quality.'
    },
    {
        id: 'colorpop',
        name: 'Color Pop',
        prompt: 'Photograph THIS EXACT PRODUCT with vibrant color pop style. Bold saturated colors, complementary backdrop. Eye-catching, energetic. CRITICAL: Same product with enhanced color styling - product details unchanged.'
    },
    {
        id: 'vintage',
        name: 'Vintage Film',
        prompt: 'Photograph THIS EXACT PRODUCT in vintage film style. Classic film grain, warm color grading, nostalgic aesthetic. Medium format film look. CRITICAL: Same product with vintage treatment - all product features preserved.'
    },
    {
        id: 'tech',
        name: 'Tech Modern',
        prompt: 'Photograph THIS EXACT PRODUCT in sleek tech-modern style. Futuristic aesthetic with gradient lighting, possible neon accents. Silicon Valley launch style. CRITICAL: Same product in tech setting - exact product details maintained.'
    },
    {
        id: 'artisan',
        name: 'Artisan Craft',
        prompt: 'Photograph THIS EXACT PRODUCT in artisan craft style. Emphasis on handmade quality, raw materials. Warm authentic lighting, workshop environment. CRITICAL: Same product - highlighting its actual craftsmanship.'
    }
];

export function getShots(mode: 'human' | 'product'): ShotConfig[] {
    return mode === 'human' ? humanPortraitShots : productShots;
}
