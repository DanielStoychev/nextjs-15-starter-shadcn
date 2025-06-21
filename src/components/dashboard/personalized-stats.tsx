'use client';

import { useEffect, useState } from 'react';

import ErrorMessage from '@/components/ui/error-message';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { formatCurrency, formatDate } from '@/lib/formatting';
import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Separator } from '@/registry/new-york-v4/ui/separator';

import { Activity, Award, Calendar, DollarSign, RefreshCw, Target, TrendingUp, Trophy, Users } from 'lucide-react';
import { Session } from 'next-auth';

interface UserStats {
    gamesPlayed: number;
    gamesWon: number;
    activeGames: number;
    winRate: number;
    bestRank: number;
    totalSpent: number;
    totalEarnings: number;
    favoriteGame: string;
    recentPerformance?: Array<{
        gameId: string;
        gameInstanceId: string;
        gameName: string;
        score: number;
        estimatedWinnings: number;
        date: string;
    }>;
}

interface PersonalizedStatsProps {
    session: Session;
}

export default function PersonalizedStats({ session }: PersonalizedStatsProps) {
    const [stats, setStats] = useState<UserStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUserStats();

        // Listen for payment success events to refresh stats
        const handlePaymentSuccess = () => {
            console.log('🔄 Payment success detected, refreshing user stats...');
            setTimeout(fetchUserStats, 1000); // Small delay to ensure order is processed
        };

        window.addEventListener('payment-success', handlePaymentSuccess);

        return () => {
            window.removeEventListener('payment-success', handlePaymentSuccess);
        };
    }, []);

    const fetchUserStats = async () => {
        try {
            setIsLoading(true);
            setError(null);

            console.log('🔄 PersonalizedStats - Fetching user stats...');

            const response = await fetch('/api/user/stats');

            console.log('📡 PersonalizedStats - API response status:', response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Please log in to view your stats');
                }
                throw new Error('Failed to fetch user stats');
            }

            const responseData = await response.json();

            console.log('📊 PersonalizedStats - Received data:', responseData);
            console.log('📊 PersonalizedStats - Full data object:', JSON.stringify(responseData, null, 2));

            // Handle wrapped response format
            const data = responseData.data || responseData;

            // Ensure we have numeric values
            if (data) {
                data.totalSpent = Number(data.totalSpent) || 0;
                data.totalEarnings = Number(data.totalEarnings) || 0;
                data.winRate = Number(data.winRate) || 0;
                data.gamesPlayed = Number(data.gamesPlayed) || 0;
                data.gamesWon = Number(data.gamesWon) || 0;
                data.activeGames = Number(data.activeGames) || 0;
                data.bestRank = Number(data.bestRank) || 0;
            }

            console.log('📋 PersonalizedStats - Processed data:', {
                totalSpent: data.totalSpent,
                totalEarnings: data.totalEarnings,
                gamesPlayed: data.gamesPlayed,
                activeGames: data.activeGames
            });

            setStats(data);
        } catch (error) {
            console.error('Error fetching user stats:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch user stats');
            // Set mock stats on error
            setStats(null);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className='p-6'>
                    <LoadingSpinner />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className='p-6'>
                    <ErrorMessage message={error} retry={fetchUserStats} />
                </CardContent>
            </Card>
        );
    }

    // Empty stats for new users or when API fails
    const mockStats: UserStats = {
        gamesPlayed: 0,
        gamesWon: 0,
        activeGames: 0,
        winRate: 0,
        bestRank: 0,
        totalSpent: 0,
        totalEarnings: 0,
        favoriteGame: 'None',
        recentPerformance: []
    };

    const displayStats = stats || mockStats;
    const formattedWinRate = (Number(displayStats.winRate) || 0).toFixed(1);

    // Calculate profit/loss with proper null handling and number conversion
    const totalSpent = Number(displayStats.totalSpent) || 0;
    const totalEarnings = Number(displayStats.totalEarnings) || 0;
    const profitLoss = totalEarnings - totalSpent;

    // Use actual data from API or reasonable defaults
    const gamesWon = Number(displayStats.gamesWon) || 0; // Use direct value from API
    const currentStreak = 0; // Default to 0 unless we have streak data from API
    const bestRank = Number(displayStats.bestRank) || 0; // Use best rank from API
    const averageScore = 0; // Default to 0 unless we have score data
    const joinedDate = new Date().toISOString().split('T')[0]; // Today's date as default

    return (
        <Card>
            <CardHeader>
                <div className='flex items-center justify-between'>
                    <div>
                        <CardTitle className='flex items-center gap-2'>
                            <Activity className='h-5 w-5' />
                            Your Statistics
                        </CardTitle>
                        <CardDescription>Personal performance and achievements</CardDescription>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Button
                            variant='outline'
                            size='sm'
                            onClick={fetchUserStats}
                            disabled={isLoading}
                            className='flex items-center gap-2'>
                            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className='space-y-6'>
                {/* Quick Stats Grid */}
                <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
                    <div className='bg-muted/50 rounded-lg p-4 text-center'>
                        <div className='mb-2 flex items-center justify-center'>
                            <Trophy className='h-5 w-5 text-yellow-500' />
                        </div>
                        <div className='text-2xl font-bold'>{gamesWon}</div>
                        <div className='text-muted-foreground text-sm'>Games Won</div>
                    </div>

                    <div className='bg-muted/50 rounded-lg p-4 text-center'>
                        <div className='mb-2 flex items-center justify-center'>
                            <Target className='h-5 w-5 text-blue-500' />
                        </div>
                        <div className='text-2xl font-bold'>{Number(displayStats.activeGames) || 0}</div>
                        <div className='text-muted-foreground text-sm'>Active Games</div>
                    </div>

                    <div className='bg-muted/50 rounded-lg p-4 text-center'>
                        <div className='mb-2 flex items-center justify-center'>
                            <TrendingUp className='h-5 w-5 text-green-500' />
                        </div>
                        <div className='text-2xl font-bold'>{formattedWinRate}%</div>
                        <div className='text-muted-foreground text-sm'>Win Rate</div>
                    </div>

                    <div className='bg-muted/50 rounded-lg p-4 text-center'>
                        <div className='mb-2 flex items-center justify-center'>
                            <Award className='h-5 w-5 text-purple-500' />
                        </div>
                        <div className='text-2xl font-bold'>#{bestRank}</div>
                        <div className='text-muted-foreground text-sm'>Best Rank</div>
                    </div>
                </div>

                <Separator />

                {/* Detailed Stats */}
                <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <div className='space-y-4'>
                        <h3 className='flex items-center gap-2 font-semibold'>
                            <Users className='h-4 w-4' />
                            Game Performance
                        </h3>
                        <div className='space-y-3'>
                            <div className='flex justify-between'>
                                <span className='text-muted-foreground'>Total Games:</span>
                                <span className='font-medium'>{Number(displayStats.gamesPlayed) || 0}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='text-muted-foreground'>Current Streak:</span>
                                <Badge variant={currentStreak > 2 ? 'default' : 'secondary'}>
                                    {currentStreak} games
                                </Badge>
                            </div>
                            <div className='flex justify-between'>
                                <span className='text-muted-foreground'>Average Score:</span>
                                <span className='font-medium'>{(averageScore || 0).toFixed(1)}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='text-muted-foreground'>Favorite Game:</span>
                                <span className='font-medium'>{displayStats.favoriteGame || 'None'}</span>
                            </div>
                        </div>
                    </div>

                    <div className='space-y-4'>
                        <h3 className='flex items-center gap-2 font-semibold'>
                            <DollarSign className='h-4 w-4' />
                            Financial Summary
                        </h3>
                        <div className='space-y-3'>
                            <div className='flex justify-between'>
                                <span className='text-muted-foreground'>Total Spent:</span>
                                <span className='font-medium'>£{totalSpent.toFixed(2)}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='text-muted-foreground'>Total Winnings:</span>
                                <span className='font-medium text-green-600'>£{totalEarnings.toFixed(2)}</span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='text-muted-foreground'>Net Profit/Loss:</span>
                                <span className={`font-medium ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {profitLoss >= 0 ? '+' : ''}£{Math.abs(profitLoss).toFixed(2)}
                                </span>
                            </div>
                            <div className='flex justify-between'>
                                <span className='text-muted-foreground'>Member Since:</span>
                                <span className='flex items-center gap-1 font-medium'>
                                    <Calendar className='h-3 w-3' />
                                    {formatDate(joinedDate)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='flex justify-end'>
                    <Button variant='outline' onClick={fetchUserStats} className='mt-4'>
                        <RefreshCw className='mr-2 h-4 w-4' />
                        Refresh Stats
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
