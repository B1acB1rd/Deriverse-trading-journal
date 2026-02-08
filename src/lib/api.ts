const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function apiRequest<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error(`[API] Request failed for ${endpoint}:`, error);
        throw error;
    }
}

export function getApiUrl(endpoint: string): string {
    return `${API_BASE_URL}${endpoint}`;
}
