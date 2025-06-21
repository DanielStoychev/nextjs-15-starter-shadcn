'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Skeleton } from '@/registry/new-york-v4/ui/skeleton';

import { format } from 'date-fns';
import { Session } from 'next-auth';

interface Activity {
    id: string;
    type: 'game' | 'payment';
    title: string;
    description: string;
    date: string;
    gameId?: string;
    gameInstanceId?: string;
    gameName?: string;
    instanceName?: string;
    status?: string;
    amount?: number;
}

interface ActivityFeedProps {
    session: Session | null;
}

export default function ActivityFeed({ session }: ActivityFeedProps) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!session) return;

        async function fetchActivities() {
            try {
                setLoading(true);
                const response = await fetch('/api/user/activity');

                if (!response.ok) {
                    throw new Error('Failed to fetch activities');
                }

                const data = await response.json();
                setActivities(data.activities || []);
                setError(null);
            } catch (err) {
                console.error('Error fetching activity feed:', err);
                setError('Could not load activity feed');
                setActivities([]);
            } finally {
                setLoading(false);
            }
        }

        fetchActivities();
    }, [session]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
                {loading ? (
                    <>
                        <Skeleton className='h-16 w-full' />
                        <Skeleton className='h-16 w-full' />
                        <Skeleton className='h-16 w-full' />
                    </>
                ) : error ? (
                    <p className='text-muted-foreground p-4 text-center text-sm'>{error}</p>
                ) : activities.length === 0 ? (
                    <div className='flex flex-col items-center justify-center p-6 text-center'>
                        <p className='text-muted-foreground text-sm'>
                            No recent activity found. Join a game to see activity here!
                        </p>
                    </div>
                ) : (
                    <div className='space-y-4'>
                        {activities.map((activity) => (
                            <div key={activity.id} className='flex flex-col space-y-1 border-b pb-3 last:border-0'>
                                <div className='flex items-center justify-between'>
                                    <h4 className='font-medium'>{activity.title}</h4>
                                    <span className='text-muted-foreground text-xs'>
                                        {format(new Date(activity.date), 'MMM d, yyyy')}
                                    </span>
                                </div>
                                <p className='text-muted-foreground text-sm'>{activity.description}</p>
                                {activity.type === 'payment' && activity.amount && (
                                    <p className='text-sm font-medium text-green-600'>
                                        £{(activity.amount || 0).toFixed(2)}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
