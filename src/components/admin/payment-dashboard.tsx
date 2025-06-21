'use client';

import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Clock, CreditCard, Loader2, TrendingUp, Users } from 'lucide-react';

interface PaymentAnalytics {
    summary: {
        totalRevenue: number;
        totalActiveEntries: number;
        totalPendingEntries: number;
        averageRevenuePerEntry: number;
    };
    revenueByGame: Array<{
        gameId: string;
        gameName: string;
        instanceName: string;
        entryFee: number;
        totalEntries: number;
        totalRevenue: number;
    }>;
    userStats: Array<{
        status: string;
        _count: { status: number };
    }>;
    recentTransactions: Array<{
        id: string;
        userEmail: string;
        userName: string | null;
        gameName: string;
        instanceName: string;
        entryFee: number;
        status: string;
        createdAt: string;
        updatedAt: string;
    }>;
}

export default function PaymentDashboard() {
    const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/payment-analytics');

            if (!response.ok) {
                throw new Error('Failed to fetch payment analytics');
            }

            const data = await response.json();
            setAnalytics(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return `£${(amount / 100).toFixed(2)}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className='flex h-64 items-center justify-center'>
                <Loader2 className='h-8 w-8 animate-spin' />
                <span className='ml-2'>Loading payment analytics...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant='destructive'>
                <AlertDescription>Error loading payment analytics: {error}</AlertDescription>
            </Alert>
        );
    }

    if (!analytics) {
        return (
            <Alert>
                <AlertDescription>No payment data available.</AlertDescription>
            </Alert>
        );
    }

    return (
        <div className='space-y-6'>
            {/* Summary Cards */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Total Revenue</CardTitle>
                        <TrendingUp className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold text-green-600'>
                            {formatCurrency(analytics.summary.totalRevenue)}
                        </div>
                        <p className='text-muted-foreground text-xs'>
                            From {analytics.summary.totalActiveEntries} paid entries
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Active Entries</CardTitle>
                        <Users className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold text-blue-600'>{analytics.summary.totalActiveEntries}</div>
                        <p className='text-muted-foreground text-xs'>Users currently playing</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Pending Payments</CardTitle>
                        <Clock className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold text-orange-600'>
                            {analytics.summary.totalPendingEntries}
                        </div>
                        <p className='text-muted-foreground text-xs'>Awaiting payment</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Avg. Entry Fee</CardTitle>
                        <CreditCard className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                            {formatCurrency(Math.round(analytics.summary.averageRevenuePerEntry))}
                        </div>
                        <p className='text-muted-foreground text-xs'>Per successful entry</p>
                    </CardContent>
                </Card>
            </div>

            {/* Revenue by Game */}
            <Card>
                <CardHeader>
                    <CardTitle>Revenue by Game</CardTitle>
                    <CardDescription>Breakdown of revenue by game instance</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='space-y-4'>
                        {analytics.revenueByGame.map((game, index) => (
                            <div key={index} className='flex items-center justify-between rounded-lg border p-4'>
                                <div className='space-y-1'>
                                    <h4 className='font-medium'>{game.gameName}</h4>
                                    <p className='text-muted-foreground text-sm'>{game.instanceName}</p>
                                    <p className='text-muted-foreground text-xs'>
                                        Entry Fee: {formatCurrency(game.entryFee)}
                                    </p>
                                </div>
                                <div className='text-right'>
                                    <div className='font-medium text-green-600'>
                                        {formatCurrency(game.totalRevenue)}
                                    </div>
                                    <p className='text-muted-foreground text-sm'>{game.totalEntries} entries</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Last 50 payment transactions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='space-y-2'>
                        {analytics.recentTransactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className='flex items-center justify-between rounded-lg border p-3'>
                                <div className='space-y-1'>
                                    <div className='flex items-center space-x-2'>
                                        <span className='font-medium'>
                                            {transaction.userName || transaction.userEmail}
                                        </span>
                                        <Badge variant={transaction.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                            {transaction.status}
                                        </Badge>
                                    </div>
                                    <p className='text-muted-foreground text-sm'>
                                        {transaction.gameName} - {transaction.instanceName}
                                    </p>
                                    <p className='text-muted-foreground text-xs'>{formatDate(transaction.updatedAt)}</p>
                                </div>
                                <div className='text-right'>
                                    <div className='font-medium text-green-600'>
                                        {formatCurrency(transaction.entryFee)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
