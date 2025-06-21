export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export async function safeApiCall<T>(
    apiCall: () => Promise<T>,
    defaultValue: T,
    onError?: (error: Error) => void
): Promise<T> {
    try {
        return await apiCall();
    } catch (error) {
        console.error('API error:', error);
        onError?.(error as Error);

        return defaultValue;
    }
}

export function createApiResponse<T>(data: T): Response {
    return Response.json({
        success: true,
        data
    });
}

export function createApiError(message: string, status: number = 500): Response {
    return Response.json(
        {
            success: false,
            error: message
        },
        { status }
    );
}

export async function withErrorHandling<T>(handler: () => Promise<T>): Promise<Response> {
    try {
        const result = await handler();

        return createApiResponse(result);
    } catch (error) {
        console.error('API error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';

        // Handle specific error types
        if (message === 'Unauthorized') {
            return createApiError(message, 401);
        }

        return createApiError(message);
    }
}
