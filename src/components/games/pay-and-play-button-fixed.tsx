'use client';

import { useEffect, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { CheckCircle, CreditCard, Loader2, XCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface PayAndPlayProps {
    gameInstance: {
        id: string;
        name: string;
        entryFee: number;
        status: string;
        game: {
            id: string;
            name: string;
            slug: string;
            description?: string;
        };
    };
    userEntry?: {
        id: string;
        status: string;
    } | null;
    onPaymentSuccess?: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
    }).format(amount / 100);
};

export default function PayAndPlayButton({ gameInstance, userEntry, onPaymentSuccess }: PayAndPlayProps) {
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();

    // Auto-confirm payment on return from Stripe
    useEffect(() => {
        const confirmPayment = async () => {
            const success = searchParams.get('success');
            const sessionId = searchParams.get('session_id');

            if (success === 'true' && sessionId && userEntry?.status === 'PENDING_PAYMENT') {
                setIsLoading(true);
                try {
                    const response = await fetch('/api/games/entry/manual-confirm', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            sessionId: sessionId,
                            gameInstanceId: gameInstance.id
                        })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        // Clear URL parameters and refresh the page to show updated status
                        const url = new URL(window.location.href);
                        url.searchParams.delete('success');
                        url.searchParams.delete('session_id');
                        router.replace(url.pathname + url.search);

                        // Trigger parent component refresh if callback provided
                        if (onPaymentSuccess) {
                            onPaymentSuccess();
                        }

                        // Force page refresh to update entry status
                        window.location.reload();
                    } else {
                        setError(data.error || 'Failed to confirm payment');
                    }
                } catch (err) {
                    setError('Failed to confirm payment');
                    console.error('Payment confirmation error:', err);
                } finally {
                    setIsLoading(false);
                }
            }
        };

        confirmPayment();
    }, [searchParams, userEntry, gameInstance.id, router, onPaymentSuccess]);

    const handlePayment = async () => {
        if (!session) {
            window.location.href = '/auth/login';

            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/games/entry/payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gameInstanceId: gameInstance.id
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Payment failed');
            }

            // Redirect to Stripe Checkout
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No payment URL received');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment failed');
            setIsLoading(false);
        }
    };

    // Show different states based on user entry status
    if (userEntry) {
        switch (userEntry.status) {
            case 'ACTIVE':
                return (
                    <Card className='w-full max-w-md'>
                        <CardHeader>
                            <CardTitle className='flex items-center gap-2 text-green-600'>
                                <CheckCircle className='h-5 w-5' />
                                Entry Confirmed
                            </CardTitle>
                            <CardDescription>You're successfully entered in {gameInstance.name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Badge variant='default' className='bg-green-100 text-green-800'>
                                Active Player
                            </Badge>
                        </CardContent>
                    </Card>
                );

            case 'PENDING_PAYMENT':
                return (
                    <Card className='w-full max-w-md border-orange-200'>
                        <CardHeader>
                            <CardTitle className='text-orange-600'>Payment Pending</CardTitle>
                            <CardDescription>Complete your payment to secure your entry</CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                            <div className='text-2xl font-bold'>{formatCurrency(gameInstance.entryFee)}</div>
                            <Button onClick={handlePayment} disabled={isLoading} className='w-full' size='lg'>
                                {isLoading ? (
                                    <>
                                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CreditCard className='mr-2 h-4 w-4' />
                                        Complete Payment
                                    </>
                                )}
                            </Button>
                            {error && (
                                <Alert variant='destructive'>
                                    <XCircle className='h-4 w-4' />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                );

            case 'ELIMINATED':
                return (
                    <Card className='w-full max-w-md border-red-200'>
                        <CardHeader>
                            <CardTitle className='text-red-600'>Eliminated</CardTitle>
                            <CardDescription>You were eliminated from {gameInstance.name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Badge variant='destructive'>Eliminated</Badge>
                        </CardContent>
                    </Card>
                );

            default:
                return (
                    <Card className='w-full max-w-md border-gray-200'>
                        <CardHeader>
                            <CardTitle className='text-gray-600'>Entry Status Unknown</CardTitle>
                            <CardDescription>Please contact support for assistance</CardDescription>
                        </CardHeader>
                    </Card>
                );
        }
    }

    // No user entry - show payment button
    if (!session) {
        return (
            <Card className='w-full max-w-md'>
                <CardHeader>
                    <CardTitle>Login Required</CardTitle>
                    <CardDescription>Please log in to join {gameInstance.name}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => (window.location.href = '/auth/login')} className='w-full' size='lg'>
                        Login to Play
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className='w-full max-w-md'>
            <CardHeader>
                <CardTitle>Join {gameInstance.game.name}</CardTitle>
                <CardDescription>{gameInstance.game.description || 'Enter this exciting game!'}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='text-2xl font-bold'>{formatCurrency(gameInstance.entryFee)}</div>
                <Button onClick={handlePayment} disabled={isLoading} className='w-full' size='lg'>
                    {isLoading ? (
                        <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Processing...
                        </>
                    ) : (
                        <>
                            <CreditCard className='mr-2 h-4 w-4' />
                            Pay & Play
                        </>
                    )}
                </Button>
                {error && (
                    <Alert variant='destructive'>
                        <XCircle className='h-4 w-4' />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
