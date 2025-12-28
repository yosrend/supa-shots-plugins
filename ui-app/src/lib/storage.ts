/**
 * Storage adapter for Figma plugins
 * 
 * Figma plugin iframes run inside data: URLs where localStorage is disabled.
 * This adapter provides a compatible storage API that:
 * 1. Uses message passing to communicate with the main plugin code
 * 2. Falls back to in-memory storage if message passing isn't available
 * 3. Caches values in memory for synchronous access
 */

// In-memory cache for synchronous access
const memoryCache: Record<string, string | null> = {};

// Check if we're in a Figma plugin environment
const isFigmaPlugin = typeof window !== 'undefined' &&
    (window.location.protocol === 'data:' ||
        window.location.href.includes('figma') ||
        // Check if localStorage is actually disabled
        (() => {
            try {
                localStorage.getItem('test');
                return false;
            } catch {
                return true;
            }
        })());

// Pending storage operations waiting for response from main thread
const pendingOperations: Map<string, {
    resolve: (value: string | null) => void;
    reject: (error: Error) => void;
}> = new Map();

let messageIdCounter = 0;

// Listen for storage responses from main plugin code
if (typeof window !== 'undefined') {
    window.addEventListener('message', (event) => {
        const data = event.data;
        if (data && typeof data === 'object' && data.type === 'STORAGE_RESPONSE') {
            const { messageId, value, error } = data;
            const pending = pendingOperations.get(messageId);
            if (pending) {
                pendingOperations.delete(messageId);
                if (error) {
                    pending.reject(new Error(error));
                } else {
                    pending.resolve(value);
                }
            }
        }

        // Handle initial storage data when plugin loads
        if (data && typeof data === 'object' && data.type === 'STORAGE_INIT') {
            Object.entries(data.storage || {}).forEach(([key, value]) => {
                memoryCache[key] = value as string | null;
            });
            console.log('[Storage] Initialized with', Object.keys(data.storage || {}).length, 'items');
        }
    });
}

/**
 * Request storage operation from main plugin code
 */
function requestStorageOperation(
    operation: 'get' | 'set' | 'remove',
    key: string,
    value?: string
): Promise<string | null> {
    return new Promise((resolve, reject) => {
        const messageId = `storage_${++messageIdCounter}`;

        pendingOperations.set(messageId, { resolve, reject });

        // Send request to parent (Figma main code)
        parent.postMessage({
            pluginMessage: {
                type: 'STORAGE_REQUEST',
                messageId,
                operation,
                key,
                value
            }
        }, '*');

        // Timeout after 5 seconds
        setTimeout(() => {
            if (pendingOperations.has(messageId)) {
                pendingOperations.delete(messageId);
                // Don't reject, just resolve with cached value
                resolve(memoryCache[key] ?? null);
            }
        }, 5000);
    });
}

/**
 * Storage API compatible with localStorage
 */
export const storage = {
    /**
     * Get an item from storage
     * Returns cached value synchronously, updates cache asynchronously
     */
    getItem(key: string): string | null {
        // Return cached value immediately for synchronous compatibility
        if (key in memoryCache) {
            return memoryCache[key];
        }

        // If not in Figma plugin, try localStorage
        if (!isFigmaPlugin) {
            try {
                const value = localStorage.getItem(key);
                memoryCache[key] = value;
                return value;
            } catch {
                // localStorage not available, return null
            }
        }

        // Schedule async fetch to update cache (for next access)
        requestStorageOperation('get', key).then(value => {
            memoryCache[key] = value;
        }).catch(() => {
            // Ignore errors, cache will remain empty
        });

        return null;
    },

    /**
     * Get an item from storage asynchronously
     * Use this when you need the actual stored value
     */
    async getItemAsync(key: string): Promise<string | null> {
        if (!isFigmaPlugin) {
            try {
                const value = localStorage.getItem(key);
                memoryCache[key] = value;
                return value;
            } catch {
                // localStorage not available
            }
        }

        // Check cache first
        if (key in memoryCache) {
            return memoryCache[key];
        }

        const value = await requestStorageOperation('get', key);
        memoryCache[key] = value;
        return value;
    },

    /**
     * Set an item in storage
     */
    setItem(key: string, value: string): void {
        // Update cache immediately
        memoryCache[key] = value;

        // Try localStorage first if not in Figma plugin
        if (!isFigmaPlugin) {
            try {
                localStorage.setItem(key, value);
                return;
            } catch {
                // localStorage not available, use message passing
            }
        }

        // Send to main plugin code
        requestStorageOperation('set', key, value).catch(() => {
            // Ignore errors, value is in cache
        });
    },

    /**
     * Remove an item from storage
     */
    removeItem(key: string): void {
        // Update cache immediately
        delete memoryCache[key];
        memoryCache[key] = null;

        // Try localStorage first if not in Figma plugin
        if (!isFigmaPlugin) {
            try {
                localStorage.removeItem(key);
                return;
            } catch {
                // localStorage not available, use message passing
            }
        }

        // Send to main plugin code
        requestStorageOperation('remove', key).catch(() => {
            // Ignore errors
        });
    },

    /**
     * Initialize storage with data from main plugin code
     * Call this at app startup to pre-populate cache
     */
    initFromCache(data: Record<string, string | null>): void {
        Object.entries(data).forEach(([key, value]) => {
            memoryCache[key] = value;
        });
    },

    /**
     * Get all keys from cache
     */
    getKeys(): string[] {
        return Object.keys(memoryCache);
    },

    /**
     * Check if we're in Figma plugin mode
     */
    isFigmaPlugin(): boolean {
        return isFigmaPlugin;
    }
};

export default storage;
