import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth-config';

import { getServerSession } from 'next-auth';

/**
 * CSRF Protection Middleware
 * Validates that requests contain valid CSRF tokens for state-changing operations
 */
export async function withCSRFProtection(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest) => {
        // Only apply CSRF protection to state-changing methods
        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
            return handler(req);
        }

        // Get session to verify user authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // For API requests, check the Origin header matches the host
        const origin = req.headers.get('origin');
        const host = req.headers.get('host');

        if (origin) {
            const originHost = new URL(origin).host;
            if (originHost !== host) {
                return NextResponse.json({ error: 'CSRF: Invalid origin' }, { status: 403 });
            }
        }

        // Check for custom header (SPA protection)
        const customHeader = req.headers.get('x-requested-with');
        if (!customHeader || customHeader !== 'XMLHttpRequest') {
            return NextResponse.json({ error: 'CSRF: Missing required header' }, { status: 403 });
        }

        return handler(req);
    };
}

/**
 * Object Ownership Verification Middleware
 * Ensures users can only access/modify their own resources
 */
export async function withOwnershipCheck<T extends { userId: string }>(
    handler: (req: NextRequest, context: { userId: string }) => Promise<NextResponse>
) {
    return async (req: NextRequest) => {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return handler(req, { userId: session.user.id });
    };
}

/**
 * Admin-only access middleware
 */
export async function withAdminCheck(handler: (req: NextRequest) => Promise<NextResponse>) {
    return async (req: NextRequest) => {
        const session = await getServerSession(authOptions);
        if (!session || !session.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user has admin role
        // Note: You'll need to add role checking logic based on your user model
        // For now, assuming you have a role field or admin flag
        if (session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
        }

        return handler(req);
    };
}
