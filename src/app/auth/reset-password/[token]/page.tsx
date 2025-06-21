'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Input } from '@/registry/new-york-v4/ui/input';
import { Label } from '@/registry/new-york-v4/ui/label';

import { ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();
    const params = useParams();
    const token = params.token as string;

    useEffect(() => {
        // Validate token on page load
        const validateToken = async () => {
            try {
                const response = await fetch(`/api/auth/reset-password/validate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token: params.token })
                });

                setIsValidToken(response.ok);
            } catch (error) {
                setIsValidToken(false);
            }
        };

        validateToken();
    }, [params.token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error("Passwords don't match");

            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');

            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: params.token,
                    password
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to reset password');
            }

            setSuccess(true);
            toast.success('Password updated!', {
                description: 'Your password has been successfully updated.'
            });

            // Redirect to login after 3 seconds
            setTimeout(() => {
                router.push('/auth/login');
            }, 3000);
        } catch (error: any) {
            toast.error('Error', {
                description: error.message || 'Failed to reset password'
            });
        } finally {
            setLoading(false);
        }
    };

    if (isValidToken === null) {
        return (
            <div className='flex min-h-[calc(100vh-14rem)] items-center justify-center p-4'>
                <Card className='w-full max-w-sm'>
                    <CardContent className='pt-6'>
                        <div className='text-center'>
                            <div className='border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2'></div>
                            <p className='text-muted-foreground mt-2 text-sm'>Validating reset link...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isValidToken === false) {
        return (
            <div className='flex min-h-[calc(100vh-14rem)] items-center justify-center p-4'>
                <Card className='w-full max-w-sm'>
                    <CardHeader className='text-center'>
                        <CardTitle className='text-destructive text-2xl'>Invalid Link</CardTitle>
                        <CardDescription>This password reset link is invalid or has expired.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-4'>
                            <p className='text-muted-foreground text-center text-sm'>
                                Reset links expire after 1 hour for security reasons.
                            </p>
                            <div className='flex flex-col gap-2'>
                                <Button asChild className='w-full'>
                                    <Link href='/auth/forgot-password'>Request New Reset Link</Link>
                                </Button>
                                <Button asChild variant='ghost' className='w-full'>
                                    <Link href='/auth/login'>
                                        <ArrowLeft className='mr-2 h-4 w-4' />
                                        Back to login
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className='flex min-h-[calc(100vh-14rem)] items-center justify-center p-4'>
                <Card className='w-full max-w-sm'>
                    <CardHeader className='text-center'>
                        <CheckCircle className='mx-auto mb-2 h-12 w-12 text-green-500' />
                        <CardTitle className='text-2xl text-green-700'>Password Updated!</CardTitle>
                        <CardDescription>Your password has been successfully updated.</CardDescription>
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
                    <CardTitle className='text-2xl'>Reset Password</CardTitle>
                    <CardDescription>Enter your new password below.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className='space-y-4'>
                        <div className='space-y-2'>
                            <Label htmlFor='password'>New Password</Label>
                            <Input
                                id='password'
                                type='password'
                                placeholder='Enter new password'
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={6}
                            />
                        </div>
                        <div className='space-y-2'>
                            <Label htmlFor='confirmPassword'>Confirm Password</Label>
                            <Input
                                id='confirmPassword'
                                type='password'
                                placeholder='Confirm new password'
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                minLength={6}
                            />
                        </div>
                        {password && confirmPassword && password !== confirmPassword && (
                            <p className='text-destructive text-sm'>Passwords don't match</p>
                        )}
                        <Button type='submit' className='w-full' disabled={loading || password !== confirmPassword}>
                            {loading ? 'Updating...' : 'Update Password'}
                        </Button>
                        <Button asChild variant='ghost' className='w-full'>
                            <Link href='/auth/login'>
                                <ArrowLeft className='mr-2 h-4 w-4' />
                                Back to login
                            </Link>
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
