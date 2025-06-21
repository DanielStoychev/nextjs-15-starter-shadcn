'use client';

import { useState } from 'react';

import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

import { AlertCircle, CheckCircle, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface EmailVerificationPromptProps {
    userEmail: string;
    onResend?: () => void;
}

export function EmailVerificationPrompt({ userEmail, onResend }: EmailVerificationPromptProps) {
    const [isResending, setIsResending] = useState(false);
    const [resentCount, setResentCount] = useState(0);

    const handleResend = async () => {
        setIsResending(true);
        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            });

            if (response.ok) {
                setResentCount((prev) => prev + 1);
                toast.success('Verification email sent!', {
                    description: 'Check your inbox for the verification link.'
                });
                onResend?.();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to resend verification email');
            }
        } catch (error) {
            console.error('Resend verification error:', error);
            toast.error('Error', {
                description:
                    error instanceof Error ? error.message : 'Failed to resend verification email. Please try again.'
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <Card className='mx-auto w-full max-w-md'>
            <CardHeader className='text-center'>
                <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100'>
                    <AlertCircle className='h-6 w-6 text-yellow-600' />
                </div>
                <CardTitle className='text-xl'>Verify Your Email</CardTitle>
                <CardDescription>
                    We've sent a verification link to <strong>{userEmail}</strong>
                </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='text-muted-foreground text-center text-sm'>
                    <Mail className='mr-1 inline h-4 w-4' />
                    Check your inbox and click the verification link to activate your account.
                </div>

                <div className='flex flex-col space-y-2'>
                    <Button
                        onClick={handleResend}
                        disabled={isResending || resentCount >= 3}
                        variant='outline'
                        className='w-full'>
                        {isResending ? (
                            <>
                                <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                                Sending...
                            </>
                        ) : (
                            'Resend Verification Email'
                        )}
                    </Button>

                    {resentCount > 0 && (
                        <div className='text-muted-foreground text-center text-xs'>
                            <CheckCircle className='mr-1 inline h-3 w-3' />
                            Email sent {resentCount} time{resentCount > 1 ? 's' : ''}
                        </div>
                    )}

                    {resentCount >= 3 && (
                        <div className='text-center text-xs text-red-600'>
                            Maximum resend attempts reached. Please contact support if you continue having issues.
                        </div>
                    )}
                </div>

                <div className='text-muted-foreground text-center text-xs'>
                    <strong>Note:</strong> If you don't see the email, check your spam folder.
                </div>
            </CardContent>
        </Card>
    );
}
