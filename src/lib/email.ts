// Email service for sending various types of emails
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Export resend instance for use in other modules
export { resend };

// Email templates
const getPasswordResetEmailTemplate = (userName: string, resetUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - FootyGames</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="color: #1a365d; margin-bottom: 10px;">FootyGames.co.uk</h1>
    <p style="color: #666; font-size: 16px;">Reset Your Password</p>
  </div>

  <div style="background: #f7fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
    <h2 style="color: #1a365d; margin-bottom: 20px;">Hi ${userName},</h2>

    <p style="margin-bottom: 20px;">You requested to reset your password for your FootyGames account. Click the button below to set a new password:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #3182ce; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Reset Password
      </a>
    </div>

    <p style="margin-bottom: 10px; font-size: 14px; color: #666;">
      <strong>This link expires in 1 hour</strong> for security reasons.
    </p>

    <p style="font-size: 14px; color: #666;">
      If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
    </p>
  </div>

  <div style="text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e2e8f0; padding-top: 20px;">
    <p>© 2025 FootyGames.co.uk. All rights reserved.</p>
    <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
    <p style="word-break: break-all;">${resetUrl}</p>
  </div>
</body>
</html>
`;

const getEmailVerificationTemplate = (userName: string, verificationUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - FootyGames</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="color: #1a365d; margin-bottom: 10px;">Welcome to FootyGames.co.uk!</h1>
    <p style="color: #666; font-size: 16px;">Verify Your Email Address</p>
  </div>

  <div style="background: #f7fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
    <h2 style="color: #1a365d; margin-bottom: 20px;">Hi ${userName},</h2>

    <p style="margin-bottom: 20px;">Welcome to FootyGames! To get started with your account, please verify your email address by clicking the button below:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background: #38a169; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
        Verify Email Address
      </a>
    </div>

    <p style="margin-bottom: 10px; font-size: 14px; color: #666;">
      <strong>This link expires in 24 hours</strong> for security reasons.
    </p>

    <p style="font-size: 14px; color: #666;">
      If you didn't create an account with FootyGames, please ignore this email.
    </p>
  </div>

  <div style="background: #ebf8ff; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
    <h3 style="color: #1a365d; margin-bottom: 15px;">What's Next?</h3>
    <ul style="color: #4a5568; padding-left: 20px;">
      <li>Enter football competitions and games</li>
      <li>Track your performance on leaderboards</li>
      <li>Compete with other football fans</li>
      <li>Win prizes for your predictions</li>
    </ul>
  </div>

  <div style="text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e2e8f0; padding-top: 20px;">
    <p>© 2025 FootyGames.co.uk. All rights reserved.</p>
    <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
    <p style="word-break: break-all;">${verificationUrl}</p>
  </div>
</body>
</html>
`;

export async function sendPasswordResetEmail(email: string, resetToken: string, userName: string): Promise<void> {
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password/${resetToken}`;

    try {
        if (!process.env.RESEND_API_KEY) {
            console.log('RESEND_API_KEY not found. Email would be sent to:', email);
            console.log('Reset URL:', resetUrl);

            return;
        }

        await resend.emails.send({
            from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
            to: email,
            subject: 'Reset Your Password - FootyGames',
            html: getPasswordResetEmailTemplate(userName, resetUrl)
        });

        console.log('Password reset email sent successfully to:', email);
    } catch (error) {
        console.error('Failed to send password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
}

export async function sendVerificationEmail(email: string, verificationToken: string, userName: string): Promise<void> {
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email/${verificationToken}`;

    try {
        if (!process.env.RESEND_API_KEY) {
            console.log('RESEND_API_KEY not found. Verification email would be sent to:', email);
            console.log('Verification URL:', verificationUrl);

            return;
        }

        await resend.emails.send({
            from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
            to: email,
            subject: 'Verify Your Email - Welcome to FootyGames!',
            html: getEmailVerificationTemplate(userName, verificationUrl)
        });

        console.log('Email verification sent successfully to:', email);
    } catch (error) {
        console.error('Failed to send verification email:', error);
        throw new Error('Failed to send verification email');
    }
}
