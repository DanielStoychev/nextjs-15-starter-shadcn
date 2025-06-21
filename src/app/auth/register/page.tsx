'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Input } from '@/registry/new-york-v4/ui/input';
import { Label } from '@/registry/new-york-v4/ui/label';

import { signIn } from 'next-auth/react';
import { toast } from 'sonner';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage = errorData.message || 'Registration failed.';
                toast.error('Registration Failed', {
                    description: errorMessage
                });

                return;
            }

            // Automatically sign in the user after successful registration
            const signInResult = await signIn('credentials', {
                redirect: false,
                email,
                password
            });

            if (signInResult?.error) {
                toast.error('Login After Registration Failed', {
                    description: signInResult.error
                });
            } else {
                toast.success('Registration Successful', {
                    description: 'You have been successfully registered and logged in.'
                });
                router.push('/dashboard'); // Redirect to dashboard on successful registration and login
            }
        } catch (error: any) {
            toast.error('An unexpected error occurred', {
                description: error.message || 'Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='flex min-h-[calc(100vh-14rem)] items-center justify-center p-4'>
            <Card className='w-full max-w-sm'>
                <CardHeader className='text-center'>
                    <CardTitle className='text-2xl'>Register</CardTitle>
                    <CardDescription>Create your account to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className='grid gap-4'>
                        <div className='grid gap-2'>
                            <Label htmlFor='name'>Name</Label>
                            <Input
                                id='name'
                                type='text'
                                placeholder='Your Name'
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div className='grid gap-2'>
                            <Label htmlFor='email'>Email</Label>
                            <Input
                                id='email'
                                type='email'
                                placeholder='m@example.com'
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className='grid gap-2'>
                            <Label htmlFor='password'>Password</Label>
                            <Input
                                id='password'
                                type='password'
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button type='submit' className='w-full' disabled={loading}>
                            {loading ? 'Registering...' : 'Register'}
                        </Button>
                        <div className='mt-4 text-center text-sm'>
                            Already have an account?{' '}
                            <Link href='/auth/login' className='underline'>
                                Login
                            </Link>
                        </div>
                    </form>
                    <div className='relative mt-6 text-center text-xs uppercase'>
                        <span className='bg-background text-muted-foreground px-2'>Or continue with</span>
                    </div>
                    <Button variant='outline' className='mt-4 w-full' onClick={() => signIn('google')}>
                        Sign up with Google
                    </Button>
                    <Button variant='outline' className='mt-2 w-full' onClick={() => signIn('github')}>
                        Sign up with GitHub
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
