'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Skeleton } from '@/registry/new-york-v4/ui/skeleton';

import { format } from 'date-fns';
import { Session } from 'next-auth';

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

interface GameRecommendationsProps {
    session: Session | null;
}

export default function GameRecommendations({ session }: GameRecommendationsProps) {
    const [recommendations, setRecommendations] = useState<GameRecommendation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!session) return;

        async function fetchRecommendations() {
            try {
                setLoading(true);
                const response = await fetch('/api/user/recommendations');

                if (!response.ok) {
                    throw new Error('Failed to fetch recommendations');
                }

                const data = await response.json();
                setRecommendations(data.recommendations || []);
                setError(null);
            } catch (err) {
                console.error('Error fetching game recommendations:', err);
                setError('Could not load game recommendations');
                setRecommendations([]);
            } finally {
                setLoading(false);
            }
        }

        fetchRecommendations();
    }, [session]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recommended Games</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
                {loading ? (
                    <>
                        <Skeleton className='h-24 w-full' />
                        <Skeleton className='h-24 w-full' />
                        <Skeleton className='h-24 w-full' />
                    </>
                ) : error ? (
                    <p className='text-muted-foreground p-4 text-center text-sm'>{error}</p>
                ) : recommendations.length === 0 ? (
                    <div className='flex flex-col items-center justify-center p-6 text-center'>
                        <p className='text-muted-foreground text-sm'>
                            No game recommendations available at the moment.
                        </p>
                        <Button asChild className='mt-4'>
                            <Link href='/games'>Browse All Games</Link>
                        </Button>
                    </div>
                ) : (
                    <div className='space-y-4'>
                        {recommendations.map((game) => (
                            <div
                                key={game.id}
                                className='flex items-center justify-between border-b pb-4 last:border-0'>
                                <div className='flex items-center space-x-4'>
                                    <div className='flex h-16 w-16 items-center justify-center overflow-hidden rounded-md bg-gray-100'>
                                        {' '}
                                        <img
                                            src={game.imgUrl}
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
                                        <p className='text-muted-foreground text-xs'>
                                            Starts {format(new Date(game.startDate), 'MMM d, yyyy')}
                                        </p>
                                        <p className='text-xs'>
                                            <span className='font-medium'>£{(game.entryFee || 0).toFixed(2)}</span> •{' '}
                                            {game.participants} joined
                                        </p>
                                    </div>
                                </div>
                                <Button asChild size='sm'>
                                    <Link href={`/games/${game.gameId}/instances/${game.id}`}>Join</Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
