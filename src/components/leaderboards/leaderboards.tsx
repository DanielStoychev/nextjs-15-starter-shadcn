'use client';

import { useMemo, useState } from 'react';

import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/registry/new-york-v4/ui/select';

import { Award, Calendar, Medal, Target, TrendingUp, Trophy } from 'lucide-react';

interface UserStats {
    userId: string;
    username: string;
    email?: string;
    totalGames: number;
    totalWins: number;
    totalEarnings: number;
    averageScore: number;
    winRate: number;
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Date;
    favoriteGame?: string;
    rank?: number;
}

interface LeaderboardsProps {
    userStats: UserStats[];
    currentUserId?: string;
}

type LeaderboardFilter = 'all-time' | 'monthly' | 'weekly' | 'race-to-33' | 'table-predictor' | 'score-predictor';
type SortBy = 'earnings' | 'wins' | 'winRate' | 'games' | 'streak';

export default function Leaderboards({ userStats, currentUserId }: LeaderboardsProps) {
    const [filter, setFilter] = useState<LeaderboardFilter>('all-time');
    const [sortBy, setSortBy] = useState<SortBy>('earnings');
    const [showTop, setShowTop] = useState(50);

    const sortedStats = useMemo(() => {
        // Apply time period filters
        let filteredStats = [...userStats];

        // Apply time-based filters
        if (filter === 'weekly' || filter === 'monthly') {
            const now = new Date();
            const filterDate = new Date();

            if (filter === 'weekly') {
                filterDate.setDate(now.getDate() - 7); // Last 7 days
            } else if (filter === 'monthly') {
                filterDate.setMonth(now.getMonth() - 1); // Last month
            }

            // Only include users active since the filter date
            filteredStats = filteredStats.filter((user) => new Date(user.lastActiveDate) >= filterDate);
        }

        // Apply game-specific filters (for a real implementation, we would need more data)
        // This is a placeholder for how we would filter by game type
        if (filter === 'race-to-33' || filter === 'table-predictor' || filter === 'score-predictor') {
            // In a real implementation, we would filter by game type here
            // For now, just ensure we don't return an empty list by not filtering
        }

        // Sort the filtered stats
        const sorted = filteredStats.sort((a, b) => {
            switch (sortBy) {
                case 'earnings':
                    return b.totalEarnings - a.totalEarnings;
                case 'wins':
                    return b.totalWins - a.totalWins;
                case 'winRate':
                    return b.winRate - a.winRate;
                case 'games':
                    return b.totalGames - a.totalGames;
                case 'streak':
                    return b.currentStreak - a.currentStreak;
                default:
                    return 0;
            }
        });

        // Add rank to each user
        return sorted
            .map((user, index) => ({
                ...user,
                rank: index + 1
            }))
            .slice(0, showTop);
    }, [userStats, filter, sortBy, showTop]);
    const currentUserStats = useMemo(() => {
        if (!currentUserId) return null;

        return sortedStats.find((user) => user.userId === currentUserId);
    }, [sortedStats, currentUserId]);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className='h-6 w-6 text-yellow-500' />;
            case 2:
                return <Medal className='h-6 w-6 text-gray-400' />;
            case 3:
                return <Award className='h-6 w-6 text-amber-600' />;
            default:
                return <span className='text-muted-foreground text-lg font-bold'>#{rank}</span>;
        }
    };

    const getRankBadge = (rank: number) => {
        if (rank <= 3) {
            return (
                <Badge variant='secondary' className='bg-gradient-to-r from-yellow-400 to-yellow-600 text-white'>
                    Top 3
                </Badge>
            );
        }
        if (rank <= 10) {
            return (
                <Badge variant='secondary' className='bg-gradient-to-r from-blue-400 to-blue-600 text-white'>
                    Top 10
                </Badge>
            );
        }
        if (rank <= 25) {
            return (
                <Badge variant='secondary' className='bg-gradient-to-r from-green-400 to-green-600 text-white'>
                    Top 25
                </Badge>
            );
        }

        return null;
    };

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='space-y-2'>
                <h1 className='flex items-center gap-2 text-3xl font-bold'>
                    <Trophy className='h-8 w-8 text-yellow-500' />
                    Leaderboards
                </h1>
                <p className='text-muted-foreground'>See how you stack up against other players</p>
            </div>

            {/* Current User Highlight */}
            {currentUserStats && (
                <Card className='border-primary'>
                    <CardHeader>
                        <CardTitle className='flex items-center justify-between'>
                            <span>Your Ranking</span>
                            {getRankBadge(currentUserStats.rank!)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='grid grid-cols-2 gap-4 md:grid-cols-5'>
                            <div className='text-center'>
                                <div className='mb-2 flex justify-center'>{getRankIcon(currentUserStats.rank!)}</div>
                                <p className='text-muted-foreground text-sm'>Rank</p>
                                <p className='font-bold'>#{currentUserStats.rank}</p>
                            </div>
                            <div className='text-center'>
                                <p className='text-muted-foreground text-sm'>Total Earnings</p>
                                <p className='font-bold text-green-600'>£{currentUserStats.totalEarnings.toFixed(2)}</p>
                            </div>
                            <div className='text-center'>
                                <p className='text-muted-foreground text-sm'>Games Won</p>
                                <p className='font-bold'>{currentUserStats.totalWins}</p>
                            </div>
                            <div className='text-center'>
                                <p className='text-muted-foreground text-sm'>Win Rate</p>
                                <p className='font-bold'>{(currentUserStats.winRate * 100).toFixed(1)}%</p>
                            </div>
                            <div className='text-center'>
                                <p className='text-muted-foreground text-sm'>Current Streak</p>
                                <p className='font-bold text-orange-600'>{currentUserStats.currentStreak}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <Card>
                <CardContent className='pt-6'>
                    <div className='flex flex-wrap items-center gap-4'>
                        <div className='flex items-center gap-2'>
                            <span className='text-sm font-medium'>Time Period:</span>
                            <Select value={filter} onValueChange={(value: LeaderboardFilter) => setFilter(value)}>
                                <SelectTrigger className='w-40'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='all-time'>All Time</SelectItem>
                                    <SelectItem value='monthly'>This Month</SelectItem>
                                    <SelectItem value='weekly'>This Week</SelectItem>
                                    <SelectItem value='race-to-33'>Race to 33</SelectItem>
                                    <SelectItem value='table-predictor'>Table Predictor</SelectItem>
                                    <SelectItem value='score-predictor'>Score Predictor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className='flex items-center gap-2'>
                            <span className='text-sm font-medium'>Sort By:</span>
                            <Select value={sortBy} onValueChange={(value: SortBy) => setSortBy(value)}>
                                <SelectTrigger className='w-32'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='earnings'>Earnings</SelectItem>
                                    <SelectItem value='wins'>Wins</SelectItem>
                                    <SelectItem value='winRate'>Win Rate</SelectItem>
                                    <SelectItem value='games'>Games Played</SelectItem>
                                    <SelectItem value='streak'>Current Streak</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className='flex items-center gap-2'>
                            <span className='text-sm font-medium'>Show:</span>
                            <Select value={showTop.toString()} onValueChange={(value) => setShowTop(parseInt(value))}>
                                <SelectTrigger className='w-24'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='25'>Top 25</SelectItem>
                                    <SelectItem value='50'>Top 50</SelectItem>
                                    <SelectItem value='100'>Top 100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <TrendingUp className='h-5 w-5' />
                        Leaderboard
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='space-y-4'>
                        {sortedStats.length === 0 ? (
                            <p className='text-muted-foreground py-8 text-center'>No leaderboard data available yet.</p>
                        ) : (
                            sortedStats.map((user) => (
                                <div
                                    key={user.userId}
                                    className={`flex items-center justify-between rounded-lg border p-4 ${
                                        user.userId === currentUserId
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:bg-accent/50'
                                    } transition-colors`}>
                                    <div className='flex items-center gap-4'>
                                        <div className='flex w-12 items-center justify-center'>
                                            {getRankIcon(user.rank!)}
                                        </div>

                                        <div className='space-y-1'>
                                            <div className='flex items-center gap-2'>
                                                <span className='font-medium'>{user.username}</span>
                                                {getRankBadge(user.rank!)}
                                                {user.userId === currentUserId && <Badge variant='outline'>You</Badge>}
                                            </div>
                                            <div className='text-muted-foreground flex items-center gap-4 text-sm'>
                                                <span className='flex items-center gap-1'>
                                                    <Target className='h-3 w-3' />
                                                    {user.totalGames} games
                                                </span>
                                                <span className='flex items-center gap-1'>
                                                    <Calendar className='h-3 w-3' />
                                                    {user.favoriteGame || 'Various'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className='space-y-1 text-right'>
                                        <div className='grid grid-cols-3 gap-4 text-sm'>
                                            <div>
                                                <p className='text-muted-foreground'>Earnings</p>
                                                <p className='font-bold text-green-600'>
                                                    £{user.totalEarnings.toFixed(2)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className='text-muted-foreground'>Wins</p>
                                                <p className='font-bold'>{user.totalWins}</p>
                                            </div>
                                            <div>
                                                <p className='text-muted-foreground'>Win Rate</p>
                                                <p className='font-bold'>{user.winRate.toFixed(1)}%</p>
                                            </div>
                                        </div>
                                        {user.currentStreak > 0 && (
                                            <p className='text-xs font-medium text-orange-600'>
                                                🔥 {user.currentStreak} win streak
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Load More */}
            {userStats.length > showTop && (
                <div className='text-center'>
                    <Button
                        variant='outline'
                        onClick={() => setShowTop((prev) => Math.min(prev + 50, userStats.length))}>
                        Show More Players
                    </Button>
                </div>
            )}
        </div>
    );
}
