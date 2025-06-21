'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const router = useRouter();
    const params = useParams();
    const token = params.token as string;

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token: params.token })
                });

                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    setMessage(data.message || 'Email verified successfully!');
                    toast.success('Email verified!', {
                        description: 'Your email has been successfully verified. You can now log in.'
                    });

                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        router.push('/auth/login');
                    }, 3000);
                } else {
                    setStatus('error');
                    setMessage(data.message || 'Failed to verify email');
                }
            } catch (error) {
                setStatus('error');
                setMessage('An unexpected error occurred');
            }
        };

        verifyEmail();
    }, [params.token, router]);

    if (status === 'loading') {
        return (
            <div className='flex min-h-[calc(100vh-14rem)] items-center justify-center p-4'>
                <Card className='w-full max-w-sm'>
                    <CardContent className='pt-6'>
                        <div className='text-center'>
                            <div className='border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2'></div>
                            <p className='text-muted-foreground mt-2 text-sm'>Verifying your email...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className='flex min-h-[calc(100vh-14rem)] items-center justify-center p-4'>
                <Card className='w-full max-w-sm'>
                    <CardHeader className='text-center'>
                        <CheckCircle className='mx-auto mb-2 h-12 w-12 text-green-500' />
                        <CardTitle className='text-2xl text-green-700'>Email Verified!</CardTitle>
                        <CardDescription>{message}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-4'>
                            <p className='text-muted-foreground text-center text-sm'>
                                You'll be redirected to the login page in a few seconds.
                            </p>
                            <Button asChild className='w-full'>
                                <Link href='/auth/login'>Continue to Login</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className='flex min-h-[calc(100vh-14rem)] items-center justify-center p-4'>
            <Card className='w-full max-w-sm'>
                <CardHeader className='text-center'>
                    <XCircle className='mx-auto mb-2 h-12 w-12 text-red-500' />
                    <CardTitle className='text-2xl text-red-700'>Verification Failed</CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='space-y-4'>
                        <p className='text-muted-foreground text-center text-sm'>
                            The verification link may be invalid or expired.
                        </p>
                        <div className='flex flex-col gap-2'>
                            <Button asChild className='w-full'>
                                <Link href='/auth/register'>Register Again</Link>
                            </Button>
                            <Button asChild variant='ghost' className='w-full'>
                                <Link href='/auth/login'>
                                    <ArrowLeft className='mr-2 h-4 w-4' />
                                    Back to Login
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
