'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { formatCurrency, formatDate } from '@/lib/formatting';
import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

import { ArrowRight, Clock, DollarSign, Gamepad2, Star, Target, TrendingUp, Users } from 'lucide-react';
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
    score: number;
    imgUrl: string;
}

interface GameRecommendationsProps {
    session: Session;
}

export default function GameRecommendations({ session }: GameRecommendationsProps) {
    const [recommendations, setRecommendations] = useState<GameRecommendation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const fetchRecommendations = async () => {
        try {
            const response = await fetch('/api/user/recommendations');
            if (response.ok) {
                const data = await response.json();
                setRecommendations(data.recommendations || []);
            }
        } catch (error) {
            console.error('Error fetching recommendations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Mock data for demonstration
    const mockRecommendations: GameRecommendation[] = [
        {
            id: '1',
            gameId: 'game-1',
            name: 'Premier League Race to 33',
            gameName: 'Race to 33',
            entryFee: 5.0,
            participants: 142,
            startDate: '2025-08-15T00:00:00Z',
            endDate: '2025-05-25T23:59:59Z',
            status: 'PENDING',
            score: 25,
            imgUrl: '/images/race-to-33-thumbnail.svg'
        },
        {
            id: '2',
            gameId: 'game-2',
            name: 'Championship Last Man Standing',
            gameName: 'Last Man Standing',
            entryFee: 10.0,
            participants: 89,
            startDate: '2025-07-20T00:00:00Z',
            endDate: '2025-04-30T23:59:59Z',
            status: 'PENDING',
            score: 18,
            imgUrl: '/images/last-man-standing-thumbnail.png'
        },
        {
            id: '3',
            gameId: 'game-3',
            name: 'Weekly Score Predictor - January',
            gameName: 'Weekly Score Predictor',
            entryFee: 2.0,
            participants: 234,
            startDate: '2025-01-01T00:00:00Z',
            endDate: '2025-01-31T23:59:59Z',
            status: 'ACTIVE',
            score: 15,
            imgUrl: '/images/weekly-score-predictor-thumbnail.svg'
        }
    ];

    // Get a difficulty level based on score
    const getDifficulty = (score: number) => {
        if (score > 20) return { level: 'Easy', color: 'bg-green-500' };
        if (score > 10) return { level: 'Medium', color: 'bg-yellow-500' };

        return { level: 'Hard', color: 'bg-red-500' };
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'default';
            case 'PENDING':
                return 'secondary';
            case 'COMPLETED':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className='p-6'>
                    <div className='animate-pulse space-y-4'>
                        <div className='bg-muted h-4 w-1/3 rounded'></div>
                        <div className='space-y-3'>
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className='bg-muted h-24 rounded'></div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const displayRecommendations = recommendations.length ? recommendations : mockRecommendations;

    return (
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                    <Target className='h-5 w-5' />
                    Recommended For You
                </CardTitle>
                <CardDescription>Games selected based on your playing style and preferences</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
                {displayRecommendations.map((game) => {
                    const difficulty = getDifficulty(game.score);
                    const maxCapacity = Math.max(200, game.participants * 1.5);

                    return (
                        <div key={game.id} className='space-y-3 rounded-lg border p-4'>
                            <div className='flex items-start justify-between'>
                                <div className='space-y-1'>
                                    <h3 className='flex items-center gap-2 font-semibold'>
                                        <Gamepad2 className='h-4 w-4' />
                                        {game.name}
                                    </h3>
                                    <p className='text-muted-foreground text-sm'>
                                        Join the {game.gameName} competition starting soon!
                                    </p>
                                    <p className='text-xs text-blue-600 italic'>
                                        Recommended based on your activity and preferences
                                    </p>
                                </div>
                                <div className='flex flex-col items-end gap-2'>
                                    <Badge variant={getStatusColor(game.status)}>{game.status}</Badge>
                                    <div className={`rounded-full px-2 py-1 text-xs text-white ${difficulty.color}`}>
                                        {difficulty.level}
                                    </div>
                                </div>
                            </div>

                            <div className='grid grid-cols-2 gap-4 text-sm md:grid-cols-4'>
                                <div className='flex items-center gap-1'>
                                    <DollarSign className='text-muted-foreground h-3 w-3' />
                                    <span>£{game.entryFee.toFixed(2)}</span>
                                </div>
                                <div className='flex items-center gap-1'>
                                    <Users className='text-muted-foreground h-3 w-3' />
                                    <span>{game.participants} players</span>
                                </div>
                                <div className='flex items-center gap-1'>
                                    <Clock className='text-muted-foreground h-3 w-3' />
                                    <span>Starts {formatDate(game.startDate)}</span>
                                </div>
                                <div className='flex items-center gap-1'>
                                    <TrendingUp className='text-muted-foreground h-3 w-3' />
                                    <span className='text-green-600'>
                                        {Math.round((game.participants / maxCapacity) * 100)}% full
                                    </span>
                                </div>
                            </div>

                            <div className='flex items-center justify-between pt-2'>
                                <div className='flex items-center gap-2'>
                                    <Star className='h-4 w-4 text-yellow-500' />
                                    <span className='text-muted-foreground text-sm'>Match score: {game.score}/30</span>
                                </div>
                                <Link href={`/games/${game.gameId}/${game.id}`}>
                                    <Button size='sm' className='flex items-center gap-1'>
                                        View Game
                                        <ArrowRight className='h-3 w-3' />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    );
                })}

                {/* Browse More Games */}
                <div className='border-t pt-4'>
                    <div className='flex items-center justify-between'>
                        <div>
                            <h4 className='font-medium'>Want more options?</h4>
                            <p className='text-muted-foreground text-sm'>Browse all available games and competitions</p>
                        </div>
                        <Link href='/games'>
                            <Button variant='outline' className='flex items-center gap-1'>
                                Browse All Games
                                <ArrowRight className='h-3 w-3' />
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
