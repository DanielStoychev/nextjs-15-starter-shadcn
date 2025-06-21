import { NextRequest, NextResponse } from 'next/server';

import { sendPasswordResetEmail, sendVerificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const { type, email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        console.log(`Testing ${type} email to: ${email}`);
        if (type === 'reset') {
            await sendPasswordResetEmail(email, 'test-reset-token-123', 'Test User');

            return NextResponse.json({
                success: true,
                message: 'Password reset email sent successfully!',
                details: `Sent to ${email} from ${process.env.FROM_EMAIL}`
            });
        }

        if (type === 'verification') {
            await sendVerificationEmail(email, 'test-verification-token-456', 'Test User');

            return NextResponse.json({
                success: true,
                message: 'Verification email sent successfully!',
                details: `Sent to ${email} from ${process.env.FROM_EMAIL}`
            });
        }

        return NextResponse.json({ error: 'Invalid type. Use "reset" or "verification"' }, { status: 400 });
    } catch (error) {
        console.error('Email test error:', error);

        return NextResponse.json(
            {
                error: 'Failed to send email',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Email test endpoint',
        usage: 'POST with {"type": "reset|verification", "email": "test@example.com"}',
        environment: {
            fromEmail: process.env.FROM_EMAIL,
            hasResendKey: !!process.env.RESEND_API_KEY,
            hasRedisUrl: !!process.env.UPSTASH_REDIS_REST_URL
        }
    });
}
