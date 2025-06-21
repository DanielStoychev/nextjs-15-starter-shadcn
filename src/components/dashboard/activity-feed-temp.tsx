'use client';

import { useEffect, useState } from 'react';

import { formatDate, formatDateTime } from '@/lib/formatting';
import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Separator } from '@/registry/new-york-v4/ui/separator';

import {
    Activity,
    AlertCircle,
    Award,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Gamepad2,
    RefreshCw,
    Target,
    TrendingDown,
    TrendingUp,
    Trophy,
    Users
} from 'lucide-react';
import { Session } from 'next-auth';

interface ActivityItem {
    id: string;
    type: string; // 'game' or 'payment'
    title: string;
    description: string;
    date: string;
    // Game specific fields
    gameId?: string;
    gameInstanceId?: string;
    gameName?: string;
    instanceName?: string;
    status?: string;
    // Payment specific fields
    amount?: number;
    paymentStatus?: string;
}

interface ActivityFeedProps {
    session: Session;
}

export default function ActivityFeed({ session }: ActivityFeedProps) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'games' | 'achievements' | 'payments'>('all');

    useEffect(() => {
        fetchActivityFeed();
    }, []);

    const fetchActivityFeed = async () => {
        try {
            const response = await fetch('/api/user/activity');
            if (response.ok) {
                const data = await response.json();
                setActivities(data.activities || []);
            }
        } catch (error) {
            console.error('Error fetching activity feed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Mock data for demonstration
    const mockActivities: ActivityItem[] = [
        {
            id: 'game-1',
            type: 'game',
            title: 'Joined Premier League Race to 33',
            description: 'Successfully entered the competition with 5 assigned teams',
            date: '2025-06-20T10:30:00Z',
            gameId: 'game-1',
            gameInstanceId: 'instance-1',
            gameName: 'Race to 33',
            instanceName: 'Premier League Race to 33',
            status: 'ACTIVE'
        },
        {
            id: 'game-2',
            type: 'game',
            title: 'Moved up in Weekly Score Predictor',
            description: 'Your prediction accuracy earned you points',
            date: '2025-06-19T15:45:00Z',
            gameId: 'game-2',
            gameInstanceId: 'instance-2',
            gameName: 'Weekly Score Predictor',
            instanceName: 'Weekly Score Predictor June',
            status: 'ACTIVE'
        },
        {
            id: 'payment-1',
            type: 'payment',
            title: 'Payment Processed',
            description: 'Entry fee paid for Championship Last Man Standing',
            date: '2025-06-19T09:20:00Z',
            amount: 10.0,
            paymentStatus: 'COMPLETED'
        },
        {
            id: 'game-3',
            type: 'game',
            title: 'Achievement Unlocked: Hot Streak!',
            description: "Won 3 games in a row - you're on fire!",
            date: '2025-06-18T20:15:00Z',
            gameId: 'game-3',
            gameInstanceId: 'instance-3',
            gameName: 'Last Man Standing',
            status: 'COMPLETED'
        },
        {
            id: 'game-4',
            type: 'game',
            title: 'Prediction Submitted',
            description: "Made predictions for this week's Premier League matches",
            date: '2025-06-18T14:30:00Z',
            gameId: 'game-4',
            gameInstanceId: 'instance-4',
            gameName: 'Weekly Score Predictor',
            status: 'ACTIVE'
        },
        {
            id: 'game-5',
            type: 'game',
            title: 'Eliminated from Last Man Standing',
            description: 'Your pick Liverpool lost 2-1 to Brighton',
            date: '2025-06-17T17:00:00Z',
            gameId: 'game-5',
            gameInstanceId: 'instance-5',
            gameName: 'Last Man Standing',
            status: 'ELIMINATED'
        },
        {
            id: 'game-6',
            type: 'game',
            title: 'Completed Weekly Score Predictor',
            description: 'Earned 75 points and finished 12th overall',
            date: '2025-06-16T22:00:00Z',
            gameId: 'game-6',
            gameInstanceId: 'instance-6',
            gameName: 'Weekly Score Predictor',
            status: 'COMPLETED'
        }
    ];

    const displayActivities = activities.length ? activities : mockActivities;

    const filteredActivities = displayActivities.filter((activity) => {
        if (filter === 'all') return true;
        if (filter === 'games') return activity.type === 'game';
        if (filter === 'payments') return activity.type === 'payment';
        if (filter === 'achievements') {
            return activity.title.toLowerCase().includes('achievement') || activity.title.includes('Moved up');
        }

        return true;
    });

    const getActivityIcon = (activity: ActivityItem) => {
        if (activity.type === 'payment') {
            return <DollarSign className='h-5 w-5' />;
        }

        if (activity.title.includes('Achievement')) {
            return <Trophy className='h-5 w-5 text-yellow-500' />;
        }

        if (activity.title.includes('Joined')) {
            return <Gamepad2 className='h-5 w-5 text-blue-500' />;
        }

        if (activity.title.includes('Eliminated')) {
            return <AlertCircle className='h-5 w-5 text-red-500' />;
        }

        if (activity.title.includes('Completed')) {
            return <CheckCircle className='h-5 w-5 text-green-500' />;
        }

        if (activity.title.includes('Prediction')) {
            return <Target className='h-5 w-5 text-purple-500' />;
        }

        if (activity.title.includes('Moved up')) {
            return <TrendingUp className='h-5 w-5 text-green-500' />;
        }

        return <Activity className='h-5 w-5' />;
    };

    const getRankChangeIcon = (activity: ActivityItem) => {
        if (activity.title.includes('Moved up')) {
            return <TrendingUp className='h-3 w-3 text-green-500' />;
        } else if (activity.title.includes('Moved down')) {
            return <TrendingDown className='h-3 w-3 text-red-500' />;
        }

        return null;
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className='p-6'>
                    <div className='animate-pulse space-y-4'>
                        <div className='bg-muted h-4 w-1/4 rounded'></div>
                        <div className='space-y-2'>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className='bg-muted h-16 rounded'></div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                    <Activity className='h-5 w-5' />
                    Activity Feed
                </CardTitle>
                <CardDescription>Your recent game activity and achievements</CardDescription>
                <div className='flex items-center space-x-2 pt-2'>
                    <Button
                        size='sm'
                        variant={filter === 'all' ? 'default' : 'outline'}
                        onClick={() => setFilter('all')}
                        className='text-xs'>
                        All
                    </Button>
                    <Button
                        size='sm'
                        variant={filter === 'games' ? 'default' : 'outline'}
                        onClick={() => setFilter('games')}
                        className='text-xs'>
                        Games
                    </Button>
                    <Button
                        size='sm'
                        variant={filter === 'achievements' ? 'default' : 'outline'}
                        onClick={() => setFilter('achievements')}
                        className='text-xs'>
                        Achievements
                    </Button>
                    <Button
                        size='sm'
                        variant={filter === 'payments' ? 'default' : 'outline'}
                        onClick={() => setFilter('payments')}
                        className='text-xs'>
                        Payments
                    </Button>
                </div>
            </CardHeader>
            <CardContent className='max-h-[500px] space-y-6 overflow-y-auto px-6 py-0 pb-6'>
                {filteredActivities.length === 0 && (
                    <div className='flex flex-col items-center justify-center py-8'>
                        <div className='bg-muted mb-4 rounded-full p-3'>
                            <Activity className='h-6 w-6 text-gray-500' />
                        </div>
                        <p className='text-muted-foreground text-center'>No activity found for this filter</p>
                    </div>
                )}
                {filteredActivities.map((activity, index) => (
                    <div key={activity.id}>
                        <div className='flex items-start gap-4'>
                            <div className='bg-muted rounded-full p-2'>{getActivityIcon(activity)}</div>
                            <div className='flex-1 space-y-1'>
                                <div className='flex items-start justify-between'>
                                    <h4 className='text-sm font-medium'>{activity.title}</h4>
                                    <time className='text-muted-foreground text-xs'>
                                        {formatDateTime(activity.date)}
                                    </time>
                                </div>
                                <p className='text-muted-foreground text-xs'>{activity.description}</p>
                                <div className='flex flex-wrap gap-2 pt-1'>
                                    {activity.gameName && (
                                        <div className='flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800'>
                                            <Gamepad2 className='h-3 w-3' />
                                            {activity.gameName}
                                        </div>
                                    )}

                                    {activity.type === 'payment' && activity.amount && (
                                        <div className='flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs text-green-800'>
                                            <DollarSign className='h-3 w-3' />£{activity.amount.toFixed(2)}
                                        </div>
                                    )}

                                    {getRankChangeIcon(activity) && (
                                        <div className='flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800'>
                                            {getRankChangeIcon(activity)}
                                            Rank change
                                        </div>
                                    )}

                                    {activity.status && (
                                        <div className='flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800'>
                                            <Clock className='h-3 w-3' />
                                            {activity.status}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {index < filteredActivities.length - 1 && <Separator className='my-4' />}
                    </div>
                ))}
                <div className='pt-4 text-center'>
                    <Button variant='outline' size='sm' className='w-full text-xs' onClick={fetchActivityFeed}>
                        <RefreshCw className='mr-2 h-3 w-3' />
                        Refresh Activity
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
