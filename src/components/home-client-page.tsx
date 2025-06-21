'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Separator } from '@/registry/new-york-v4/ui/separator';
import { Skeleton } from '@/registry/new-york-v4/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/new-york-v4/ui/tabs';

import { format } from 'date-fns';
import { Calendar, ChevronRight, Clock, DollarSign, Target, Trophy } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

// Game recommendation interface
interface GameRecommendation {
    id: string;
    gameId: string;
    name: string;
    gameName: string;
    status: string;
    startDate: string;
    endDate: string;
    entryFee: number;
    participants: number;
    imgUrl: string;
}

// Activity interface
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

// User stats interface
interface UserStats {
    gamesPlayed: number;
    gamesWon: number;
    activeGames: number;
    winRate: number;
    bestRank: number;
    totalSpent: number;
    totalEarnings: number;
    favoriteGame: string;
}

// Game entry interface
interface GameEntry {
    id: string;
    gameId: string;
    instanceId: string;
    gameName: string;
    instanceName: string;
    status: string;
    startDate: string;
    endDate: string;
    entryFee: number;
}

export default function HomeClientPage() {
    const { data: session } = useSession();
    const [recommendations, setRecommendations] = useState<GameRecommendation[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [activeGames, setActiveGames] = useState<GameEntry[]>([]);
    const [upcomingGames, setUpcomingGames] = useState<GameRecommendation[]>([]);
    const [loading, setLoading] = useState({
        recommendations: true,
        activities: true,
        stats: true,
        entries: true
    });

    useEffect(() => {
        if (!session) return;

        // Fetch user stats
        async function fetchUserStats() {
            try {
                const response = await fetch('/api/user/stats');
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error fetching user stats:', error);
            } finally {
                setLoading((prev) => ({ ...prev, stats: false }));
            }
        }

        // Fetch game recommendations
        async function fetchRecommendations() {
            try {
                const response = await fetch('/api/user/recommendations');
                if (response.ok) {
                    const data = await response.json();
                    setRecommendations(data.recommendations || []);

                    // Filter for upcoming games to show in the quick access section
                    const upcoming = (data.recommendations || [])
                        .filter((game: GameRecommendation) => new Date(game.startDate) > new Date())
                        .sort(
                            (a: GameRecommendation, b: GameRecommendation) =>
                                new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
                        )
                        .slice(0, 3);
                    setUpcomingGames(upcoming);
                }
            } catch (error) {
                console.error('Error fetching game recommendations:', error);
            } finally {
                setLoading((prev) => ({ ...prev, recommendations: false }));
            }
        }

        // Fetch user activity
        async function fetchActivities() {
            try {
                const response = await fetch('/api/user/activity');
                if (response.ok) {
                    const data = await response.json();
                    setActivities(data.activities || []);
                }
            } catch (error) {
                console.error('Error fetching activity feed:', error);
            } finally {
                setLoading((prev) => ({ ...prev, activities: false }));
            }
        }

        // Fetch user game entries
        async function fetchUserEntries() {
            try {
                const response = await fetch('/api/user/entries?status=active');
                if (response.ok) {
                    const data = await response.json();
                    setActiveGames(data.entries || []);
                }
            } catch (error) {
                console.error('Error fetching user entries:', error);
            } finally {
                setLoading((prev) => ({ ...prev, entries: false }));
            }
        }

        fetchUserStats();
        fetchRecommendations();
        fetchActivities();
        fetchUserEntries();
    }, [session]);

    if (!session) {
        return <div className='flex min-h-screen items-center justify-center'>Loading...</div>;
    }

    return (
        <main className='flex min-h-[calc(100vh-14rem)] flex-col items-center p-4 sm:p-8'>
            <div className='w-full max-w-6xl'>
                {/* Welcome Header */}
                <div className='mb-8'>
                    <h1 className='mb-2 text-3xl font-bold sm:text-4xl'>
                        Welcome back, {session.user?.name || session.user?.email?.split('@')[0] || 'Player'}!
                    </h1>
                    <p className='text-muted-foreground'>Here's what's happening with your FootyGames competitions</p>
                </div>

                <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
                    {/* Left Column - Stats & Quick Access */}
                    <div className='space-y-6'>
                        {/* Stats Overview Card */}
                        <Card>
                            <CardHeader className='pb-2'>
                                <CardTitle className='text-xl'>Your Stats</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading.stats ? (
                                    <div className='space-y-4'>
                                        <Skeleton className='h-16 w-full' />
                                        <Skeleton className='h-16 w-full' />
                                    </div>
                                ) : (
                                    <div className='grid grid-cols-2 gap-4'>
                                        <div className='bg-muted/50 flex flex-col items-center justify-center rounded-lg p-3'>
                                            <div className='mb-1 flex items-center justify-center'>
                                                <Trophy className='mr-1 h-5 w-5 text-yellow-500' />
                                                <span className='text-xl font-bold'>{stats?.gamesWon || 0}</span>
                                            </div>
                                            <span className='text-muted-foreground text-xs'>Games Won</span>
                                        </div>
                                        <div className='bg-muted/50 flex flex-col items-center justify-center rounded-lg p-3'>
                                            <div className='mb-1 flex items-center justify-center'>
                                                <Target className='mr-1 h-5 w-5 text-blue-500' />
                                                <span className='text-xl font-bold'>{stats?.activeGames || 0}</span>
                                            </div>
                                            <span className='text-muted-foreground text-xs'>Active Games</span>
                                        </div>
                                        <div className='bg-muted/50 flex flex-col items-center justify-center rounded-lg p-3'>
                                            <div className='mb-1 flex items-center justify-center'>
                                                <DollarSign className='mr-1 h-5 w-5 text-green-500' />
                                                <span className='text-xl font-bold'>
                                                    £{((stats?.totalEarnings || 0) * 100).toFixed(2)}
                                                </span>
                                            </div>
                                            <span className='text-muted-foreground text-xs'>Earnings</span>
                                        </div>
                                        <div className='bg-muted/50 flex flex-col items-center justify-center rounded-lg p-3'>
                                            <div className='mb-1 flex items-center justify-center'>
                                                <span className='text-xl font-bold'>
                                                    {(stats?.winRate || 0).toFixed(1)}%
                                                </span>
                                            </div>
                                            <span className='text-muted-foreground text-xs'>Win Rate</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Access */}
                        <Card>
                            <CardHeader className='pb-2'>
                                <CardTitle className='text-xl'>Quick Access</CardTitle>
                            </CardHeader>
                            <CardContent className='space-y-4'>
                                <Button asChild variant='outline' className='w-full justify-between'>
                                    <Link href='/dashboard'>
                                        Dashboard
                                        <ChevronRight className='h-4 w-4' />
                                    </Link>
                                </Button>
                                <Button asChild variant='outline' className='w-full justify-between'>
                                    <Link href='/games'>
                                        Browse Games
                                        <ChevronRight className='h-4 w-4' />
                                    </Link>
                                </Button>
                                <Button asChild variant='outline' className='w-full justify-between'>
                                    <Link href='/leaderboards'>
                                        Leaderboards
                                        <ChevronRight className='h-4 w-4' />
                                    </Link>
                                </Button>
                                <Separator />
                                <Button
                                    onClick={() => signOut()}
                                    variant='ghost'
                                    className='text-muted-foreground hover:text-foreground w-full'>
                                    Sign out
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Middle Column - Active Games & Upcoming Deadlines */}
                    <div className='space-y-6'>
                        {/* Active Games */}
                        <Card>
                            <CardHeader className='pb-2'>
                                <CardTitle className='text-xl'>Your Active Games</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading.entries ? (
                                    <div className='space-y-4'>
                                        <Skeleton className='h-20 w-full' />
                                        <Skeleton className='h-20 w-full' />
                                    </div>
                                ) : activeGames.length === 0 ? (
                                    <div className='py-6 text-center'>
                                        <p className='text-muted-foreground mb-4'>You haven't joined any games yet</p>
                                        <Button asChild>
                                            <Link href='/games'>Find Games to Join</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className='space-y-4'>
                                        {activeGames.slice(0, 3).map((game) => (
                                            <div
                                                key={game.id}
                                                className='flex items-center justify-between border-b pb-3 last:border-0'>
                                                <div>
                                                    <h4 className='font-medium'>{game.gameName}</h4>
                                                    <p className='text-muted-foreground text-sm'>{game.instanceName}</p>
                                                    <div className='mt-1 flex items-center gap-1'>
                                                        <Clock className='text-muted-foreground h-3 w-3' />
                                                        <span className='text-muted-foreground text-xs'>
                                                            Ends {format(new Date(game.endDate), 'MMM d, yyyy')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button asChild size='sm'>
                                                    <Link href={`/games/${game.gameId}/${game.instanceId}`}>View</Link>
                                                </Button>
                                            </div>
                                        ))}
                                        {activeGames.length > 3 && (
                                            <Button asChild variant='ghost' className='w-full text-sm'>
                                                <Link href='/dashboard?tab=my-games'>
                                                    View all active games ({activeGames.length})
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Upcoming Games */}
                        <Card>
                            <CardHeader className='pb-2'>
                                <CardTitle className='text-xl'>Upcoming Games</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading.recommendations ? (
                                    <div className='space-y-4'>
                                        <Skeleton className='h-20 w-full' />
                                        <Skeleton className='h-20 w-full' />
                                    </div>
                                ) : upcomingGames.length === 0 ? (
                                    <div className='py-6 text-center'>
                                        <p className='text-muted-foreground mb-2'>No upcoming games at the moment</p>
                                        <Button asChild>
                                            <Link href='/games'>Browse All Games</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <div className='space-y-4'>
                                        {upcomingGames.map((game) => (
                                            <div
                                                key={game.id}
                                                className='flex items-center justify-between border-b pb-3 last:border-0'>
                                                <div className='flex items-center space-x-3'>
                                                    <div className='bg-muted h-12 w-12 overflow-hidden rounded-md'>
                                                        <img
                                                            src={game.imgUrl || '/logo.png'}
                                                            alt={game.gameName}
                                                            className='h-full w-full object-cover'
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = '/logo.png';
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h4 className='font-medium'>{game.gameName}</h4>
                                                        <p className='text-muted-foreground text-sm'>{game.name}</p>
                                                        <div className='mt-1 flex items-center gap-1'>
                                                            <Calendar className='text-muted-foreground h-3 w-3' />
                                                            <span className='text-muted-foreground text-xs'>
                                                                Starts {format(new Date(game.startDate), 'MMM d, yyyy')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='text-right'>
                                                    <p className='text-sm font-medium'>£{game.entryFee.toFixed(2)}</p>
                                                    <Button asChild size='sm' className='mt-1'>
                                                        <Link href={`/games/${game.gameId}/instances/${game.id}`}>
                                                            Join
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Activity */}
                    <div className='space-y-6'>
                        {/* Recent Activity Feed */}
                        <Card>
                            <CardHeader className='pb-2'>
                                <CardTitle className='text-xl'>Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading.activities ? (
                                    <div className='space-y-4'>
                                        <Skeleton className='h-16 w-full' />
                                        <Skeleton className='h-16 w-full' />
                                        <Skeleton className='h-16 w-full' />
                                    </div>
                                ) : activities.length === 0 ? (
                                    <div className='py-6 text-center'>
                                        <p className='text-muted-foreground'>No recent activity found.</p>
                                        <p className='text-muted-foreground mt-1 text-sm'>
                                            Join a game to see your activity here!
                                        </p>
                                    </div>
                                ) : (
                                    <div className='space-y-4'>
                                        {activities.slice(0, 5).map((activity) => (
                                            <div
                                                key={activity.id}
                                                className='flex flex-col space-y-1 border-b pb-3 last:border-0'>
                                                <div className='flex items-center justify-between'>
                                                    <h4 className='font-medium'>{activity.title}</h4>
                                                    <span className='text-muted-foreground text-xs'>
                                                        {format(new Date(activity.date), 'MMM d, yyyy')}
                                                    </span>
                                                </div>
                                                <p className='text-muted-foreground text-sm'>{activity.description}</p>
                                                {activity.type === 'payment' && activity.amount && (
                                                    <p className='text-sm font-medium text-green-600'>
                                                        £{activity.amount.toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                        {activities.length > 5 && (
                                            <Button asChild variant='ghost' className='w-full text-sm'>
                                                <Link href='/dashboard'>View all activity</Link>
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Game Recommendations */}
                        <Card>
                            <CardHeader className='pb-2'>
                                <CardTitle className='text-xl'>Recommended For You</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {loading.recommendations ? (
                                    <div className='space-y-4'>
                                        <Skeleton className='h-20 w-full' />
                                        <Skeleton className='h-20 w-full' />
                                    </div>
                                ) : recommendations.length === 0 ? (
                                    <div className='py-6 text-center'>
                                        <p className='text-muted-foreground'>No recommendations available.</p>
                                    </div>
                                ) : (
                                    <div className='space-y-4'>
                                        {recommendations.slice(0, 2).map((game) => (
                                            <div
                                                key={game.id}
                                                className='flex items-center justify-between border-b pb-3 last:border-0'>
                                                <div className='flex items-center space-x-3'>
                                                    <div className='bg-muted h-12 w-12 overflow-hidden rounded-md'>
                                                        <img
                                                            src={game.imgUrl || '/logo.png'}
                                                            alt={game.gameName}
                                                            className='h-full w-full object-cover'
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = '/logo.png';
                                                            }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h4 className='font-medium'>{game.gameName}</h4>
                                                        <p className='text-muted-foreground text-sm'>{game.name}</p>
                                                        <p className='text-xs'>
                                                            <span className='font-medium'>
                                                                £{game.entryFee.toFixed(2)}
                                                            </span>{' '}
                                                            • {game.participants} joined
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button asChild size='sm'>
                                                    <Link href={`/games/${game.gameId}/instances/${game.id}`}>
                                                        Join
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))}
                                        <Button asChild variant='ghost' className='w-full text-sm'>
                                            <Link href='/games'>View more games</Link>
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}
