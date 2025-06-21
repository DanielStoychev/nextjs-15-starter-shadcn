/**
 * Secure API client with CSRF protection
 */

interface APIRequestOptions extends RequestInit {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

/**
 * Makes a secure API request with CSRF protection headers
 */
export async function secureApiRequest(url: string, options: APIRequestOptions = {}) {
    const { method = 'GET', headers = {}, ...rest } = options;

    // Add CSRF protection headers for state-changing requests
    const secureHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string>)
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        secureHeaders['X-Requested-With'] = 'XMLHttpRequest';
    }

    const response = await fetch(url, {
        method,
        headers: secureHeaders,
        ...rest
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
    }

    return response;
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
    get: (url: string, options?: Omit<APIRequestOptions, 'method'>) =>
        secureApiRequest(url, { ...options, method: 'GET' }),

    post: (url: string, data?: any, options?: Omit<APIRequestOptions, 'method' | 'body'>) =>
        secureApiRequest(url, {
            ...options,
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined
        }),

    put: (url: string, data?: any, options?: Omit<APIRequestOptions, 'method' | 'body'>) =>
        secureApiRequest(url, {
            ...options,
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined
        }),

    patch: (url: string, data?: any, options?: Omit<APIRequestOptions, 'method' | 'body'>) =>
        secureApiRequest(url, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined
        }),

    delete: (url: string, options?: Omit<APIRequestOptions, 'method'>) =>
        secureApiRequest(url, { ...options, method: 'DELETE' })
};
