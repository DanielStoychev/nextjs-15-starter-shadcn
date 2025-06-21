import { NextRequest, NextResponse } from 'next/server';

import { resend } from '@/lib/email';

/**
 * Test email delivery with Resend sandbox domain
 * Uses Resend's test email addresses for proper sandbox testing
 */
export async function POST(request: NextRequest) {
    try {
        const { testType = 'delivered' } = await request.json();

        // Resend sandbox test email addresses
        const testEmails = {
            delivered: 'delivered@resend.dev',
            bounced: 'bounced@resend.dev',
            complained: 'complained@resend.dev'
        };

        const testEmail = testEmails[testType as keyof typeof testEmails] || testEmails.delivered;

        console.log(`\n=== RESEND SANDBOX TEST ===`);
        console.log(`Test Type: ${testType}`);
        console.log(`Test Email: ${testEmail}`);
        console.log(`From Email: ${process.env.FROM_EMAIL}`);
        console.log(`API Key: ${process.env.RESEND_API_KEY?.substring(0, 8)}...`);

        const { data, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL!,
            to: [testEmail],
            subject: `Resend Sandbox Test - ${testType.charAt(0).toUpperCase() + testType.slice(1)}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            FootyGames Email Test
          </h1>
          <p style="color: #666; line-height: 1.6;">
            This is a test email sent from FootyGames.co.uk using Resend's sandbox domain.
          </p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #007bff;">Test Details:</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Test Type:</strong> ${testType}</li>
              <li><strong>Test Email:</strong> ${testEmail}</li>
              <li><strong>From Domain:</strong> ${process.env.FROM_EMAIL}</li>
              <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
            </ul>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee;">
            This email was sent using Resend's sandbox domain for testing purposes.
          </p>
        </div>
      `,
            text: `
FootyGames Email Test

This is a test email sent from FootyGames.co.uk using Resend's sandbox domain.

Test Details:
- Test Type: ${testType}
- Test Email: ${testEmail}
- From Domain: ${process.env.FROM_EMAIL}
- Timestamp: ${new Date().toISOString()}

This email was sent using Resend's sandbox domain for testing purposes.
      `
        });
        if (error) {
            console.error('Resend API Error:', error);

            return NextResponse.json(
                {
                    success: false,
                    error: error.message,
                    details: error
                },
                { status: 500 }
            );
        }

        console.log('Email sent successfully:', data);
        console.log(`========================\n`);

        return NextResponse.json({
            success: true,
            data,
            message: `Test email sent to ${testEmail}`,
            testType,
            note:
                testType === 'delivered'
                    ? 'Email should be delivered successfully'
                    : testType === 'bounced'
                      ? 'Email should simulate a hard bounce'
                      : 'Email should simulate spam complaint'
        });
    } catch (error) {
        console.error('Unexpected error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                details: error
            },
            { status: 500 }
        );
    }
}
