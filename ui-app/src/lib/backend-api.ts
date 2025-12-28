// Backend API client for Supa Shots
// Handles authentication, session tracking, and image logging

import { storage } from './storage';

const BACKEND_URL = 'http://localhost:3000';

interface AuthResponse {
    user: {
        id: string;
        email: string;
        figmaUserId?: string;
        createdAt: string;
    };
    token: string;
}

interface Session {
    id: string;
    userId: string;
    provider: string;
    shotMode: string;
    aspectRatio: string;
    startedAt: string;
    endedAt?: string;
    isActive: boolean;
    totalImages: number;
    successImages: number;
    failedImages: number;
}

interface ApiCallLog {
    sessionId: string;
    provider: string;
    model: string;
    prompt: string;
    status: 'success' | 'failed' | 'pending';
    errorMessage?: string;
    responseTime?: number;
    estimatedCost?: number;
}

interface ImageSave {
    sessionId: string;
    apiCallId: string;
    shotName: string;
    shotMode: string;
    aspectRatio: string;
    provider: string;
    width?: number;
    height?: number;
    fileSize?: number;
    imageUrl?: string;
    thumbnailUrl?: string;
}

interface UserStats {
    totalSessions: number;
    totalApiCalls: number;
    totalImages: number;
    successRate: number;
    mostUsedProvider: string;
    imagesByMode: {
        human: number;
        product: number;
    };
}

// Storage keys
const TOKEN_KEY = 'supa_shots_auth_token';
const USER_KEY = 'supa_shots_user';

class BackendApiClient {
    private token: string | null = null;
    private user: AuthResponse['user'] | null = null;

    constructor() {
        // Load from storage (async load will update later)
        this.token = storage.getItem(TOKEN_KEY);
        const userJson = storage.getItem(USER_KEY);
        if (userJson) {
            try {
                this.user = JSON.parse(userJson);
            } catch {
                this.user = null;
            }
        }
    }

    private getHeaders(): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            ...options,
            headers: this.getHeaders()
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Auth methods
    async register(email: string, password: string, figmaUserId?: string): Promise<AuthResponse> {
        const data = await this.request<AuthResponse>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, figmaUserId })
        });

        this.token = data.token;
        this.user = data.user;
        storage.setItem(TOKEN_KEY, data.token);
        storage.setItem(USER_KEY, JSON.stringify(data.user));

        return data;
    }

    async login(email: string, password: string): Promise<AuthResponse> {
        const data = await this.request<AuthResponse>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        this.token = data.token;
        this.user = data.user;
        storage.setItem(TOKEN_KEY, data.token);
        storage.setItem(USER_KEY, JSON.stringify(data.user));

        return data;
    }

    logout(): void {
        this.token = null;
        this.user = null;
        storage.removeItem(TOKEN_KEY);
        storage.removeItem(USER_KEY);
    }

    isAuthenticated(): boolean {
        return !!this.token;
    }

    getUser(): AuthResponse['user'] | null {
        return this.user;
    }

    // Session methods
    async createSession(provider: string, shotMode: string, aspectRatio: string): Promise<Session> {
        return this.request<Session>('/api/sessions', {
            method: 'POST',
            body: JSON.stringify({ provider, shotMode, aspectRatio })
        });
    }

    async getActiveSession(): Promise<Session | null> {
        return this.request<Session | null>('/api/sessions/active');
    }

    async endSession(sessionId: string): Promise<void> {
        await this.request(`/api/sessions/${sessionId}/end`, {
            method: 'PATCH'
        });
    }

    async getSessions(page = 1, limit = 20): Promise<{ sessions: Session[]; pagination: any }> {
        return this.request(`/api/sessions?page=${page}&limit=${limit}`);
    }

    // Tracking methods
    async logApiCall(data: ApiCallLog): Promise<{ id: string }> {
        return this.request('/api/tracking', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async saveImage(data: ImageSave): Promise<{ id: string }> {
        return this.request('/api/tracking/images', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getStats(): Promise<UserStats> {
        return this.request<UserStats>('/api/tracking/stats');
    }

    async getImages(page = 1, limit = 50, filters?: { shotMode?: string; provider?: string }): Promise<{ images: any[]; pagination: any }> {
        let url = `/api/tracking/images?page=${page}&limit=${limit}`;
        if (filters?.shotMode) url += `&shotMode=${filters.shotMode}`;
        if (filters?.provider) url += `&provider=${filters.provider}`;
        return this.request(url);
    }

    // Quick auth - auto login/register based on figmaUserId
    async autoAuth(figmaUserId: string): Promise<AuthResponse | null> {
        if (this.isAuthenticated()) {
            return { user: this.user!, token: this.token! };
        }

        // Try to login first with figmaUserId as email
        const email = `${figmaUserId}@figma.supa-shots.local`;
        const password = `figma_${figmaUserId}_auto`;

        try {
            return await this.login(email, password);
        } catch {
            // If login fails, register
            try {
                return await this.register(email, password, figmaUserId);
            } catch (error) {
                console.error('Auto auth failed:', error);
                return null;
            }
        }
    }
}

// Singleton instance
export const backendApi = new BackendApiClient();

// Helper function to track a generation
export async function trackGeneration(
    provider: string,
    model: string,
    _shotName: string,
    _shotMode: 'human' | 'product',
    _aspectRatio: string,
    prompt: string,
    sessionId: string
): Promise<{ apiCallId: string } | null> {
    if (!backendApi.isAuthenticated()) return null;

    try {
        // Log the API call as pending
        const apiCall = await backendApi.logApiCall({
            sessionId,
            provider,
            model,
            prompt,
            status: 'pending'
        });

        return { apiCallId: apiCall.id };
    } catch (error) {
        console.error('Failed to track generation:', error);
        return null;
    }
}

export async function completeGeneration(
    sessionId: string,
    apiCallId: string,
    success: boolean,
    shotName: string,
    shotMode: 'human' | 'product',
    aspectRatio: string,
    provider: string,
    responseTime: number,
    errorMessage?: string
): Promise<void> {
    if (!backendApi.isAuthenticated()) return;

    try {
        // Update API call status
        await backendApi.logApiCall({
            sessionId,
            provider,
            model: '',
            prompt: '',
            status: success ? 'success' : 'failed',
            errorMessage,
            responseTime
        });

        // If success, save image record
        if (success) {
            await backendApi.saveImage({
                sessionId,
                apiCallId,
                shotName,
                shotMode,
                aspectRatio,
                provider
            });
        }
    } catch (error) {
        console.error('Failed to complete generation tracking:', error);
    }
}
