import Link from 'next/link';

import { GameRulesButton } from '@/components/game-rules-button';
import prisma from '@/lib/prisma';
import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Progress } from '@/registry/new-york-v4/ui/progress';
import { Separator } from '@/registry/new-york-v4/ui/separator';
// Import Prisma types
import { Game, GameInstance } from '@prisma/client';

import {
    Activity,
    Award,
    Calendar,
    Clock,
    GamepadIcon,
    Play,
    PoundSterling,
    Star,
    Target,
    TrendingUp,
    Trophy,
    Users
} from 'lucide-react';

// Import Prisma generated types

export default async function GamesPage() {
    const games = await prisma.game.findMany({
        include: {
            gameInstances: {
                where: {
                    status: {
                        in: ['ACTIVE', 'PENDING']
                    }
                },
                include: {
                    userEntries: {
                        select: {
                            id: true,
                            status: true
                        }
                    }
                },
                orderBy: {
                    startDate: 'asc'
                }
            }
        }
    });

    return (
        <div className='space-y-6 p-6'>
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='flex items-center gap-3 text-3xl font-bold tracking-tight'>
                        <GamepadIcon className='text-primary h-8 w-8' />
                        Available Games
                    </h1>
                    <p className='text-muted-foreground'>Choose from our exciting football prediction games</p>
                </div>
            </div>

            {/* Quick Stats Section */}
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Total Games</CardTitle>
                        <Trophy className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>{games.length}</div>
                        <p className='text-muted-foreground text-xs'>Available to play</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Active Instances</CardTitle>
                        <Activity className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                            {games.reduce((acc, game) => acc + game.gameInstances.length, 0)}
                        </div>
                        <p className='text-muted-foreground text-xs'>Running competitions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Prize Pool</CardTitle>
                        <PoundSterling className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                            £
                            {games
                                .reduce(
                                    (acc, game) =>
                                        acc +
                                        game.gameInstances.reduce((instAcc, inst) => instAcc + inst.prizePool / 100, 0),
                                    0
                                )
                                .toFixed(0)}
                        </div>
                        <p className='text-muted-foreground text-xs'>Total available</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <CardTitle className='text-sm font-medium'>Avg Entry Fee</CardTitle>
                        <Target className='text-muted-foreground h-4 w-4' />
                    </CardHeader>
                    <CardContent>
                        <div className='text-2xl font-bold'>
                            £
                            {(() => {
                                const allInstances = games.flatMap((game) => game.gameInstances);
                                if (allInstances.length === 0) return '0.00';
                                const totalEntryFees = allInstances.reduce((sum, inst) => sum + inst.entryFee, 0);

                                return (totalEntryFees / (100 * allInstances.length)).toFixed(2);
                            })()}
                        </div>
                        <p className='text-muted-foreground text-xs'>Average cost</p>
                    </CardContent>
                </Card>
            </div>

            <div className='grid gap-6 md:grid-cols-2'>
                {' '}
                {games.length === 0 ? (
                    <div className='col-span-full'>
                        <Card>
                            <CardContent className='flex items-center justify-center py-8'>
                                <p className='text-muted-foreground'>No games available yet. Check back soon!</p>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    games.map(
                        (
                            game: Game & {
                                gameInstances: (GameInstance & { userEntries: { id: string; status: string }[] })[];
                            }
                        ) => (
                            <Card key={game.id} className='transition-shadow hover:shadow-md'>
                                <CardHeader>
                                    <div className='flex items-center justify-between'>
                                        <CardTitle className='flex items-center gap-2'>
                                            <Trophy className='h-5 w-5 text-yellow-500' />
                                            {game.name}
                                        </CardTitle>
                                        {game.description && (
                                            <GameRulesButton
                                                title={`${game.name} Rules`}
                                                description={game.description}
                                                gameName={game.name}
                                            />
                                        )}
                                    </div>
                                    <CardDescription
                                        className='text-sm leading-relaxed'
                                        style={{
                                            textOverflow: 'unset',
                                            overflow: 'visible',
                                            whiteSpace: 'normal',
                                            wordBreak: 'break-word',
                                            maxWidth: 'none',
                                            width: '100%'
                                        }}>
                                        {game.description || 'No description available.'}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className='space-y-4'>
                                    {game.gameInstances.length > 0 ? (
                                        <>
                                            <Separator />
                                            <div className='space-y-3'>
                                                <h4 className='flex items-center gap-2 text-sm font-medium'>
                                                    <Users className='h-4 w-4 text-blue-500' />
                                                    Active Instances
                                                </h4>
                                                {game.gameInstances.map(
                                                    (
                                                        instance: GameInstance & {
                                                            userEntries: { id: string; status: string }[];
                                                        }
                                                    ) => (
                                                        <div key={instance.id} className='space-y-2'>
                                                            <Link href={`/games/${game.slug}/${instance.id}`}>
                                                                <div className='group hover:bg-accent rounded-lg border p-3 transition-colors'>
                                                                    <div className='flex items-center justify-between'>
                                                                        <h5 className='font-medium'>{instance.name}</h5>
                                                                        <Button
                                                                            size='sm'
                                                                            variant='ghost'
                                                                            className='opacity-0 group-hover:opacity-100'>
                                                                            <Play className='h-4 w-4' />
                                                                        </Button>
                                                                    </div>
                                                                    <div className='text-muted-foreground mt-2 flex flex-wrap items-center gap-4 text-sm'>
                                                                        <span className='flex items-center gap-1'>
                                                                            <Calendar className='h-3 w-3' />
                                                                            {new Date(
                                                                                instance.startDate
                                                                            ).toLocaleDateString()}
                                                                        </span>
                                                                        <span className='flex items-center gap-1'>
                                                                            <Clock className='h-3 w-3' />
                                                                            {(() => {
                                                                                const now = new Date();
                                                                                const start = new Date(
                                                                                    instance.startDate
                                                                                );
                                                                                const end = new Date(instance.endDate);

                                                                                if (now < start) {
                                                                                    const days = Math.ceil(
                                                                                        (start.getTime() -
                                                                                            now.getTime()) /
                                                                                            (1000 * 60 * 60 * 24)
                                                                                    );

                                                                                    return `Starts in ${days} day${days !== 1 ? 's' : ''}`;
                                                                                } else if (now < end) {
                                                                                    const days = Math.ceil(
                                                                                        (end.getTime() -
                                                                                            now.getTime()) /
                                                                                            (1000 * 60 * 60 * 24)
                                                                                    );

                                                                                    return `${days} day${days !== 1 ? 's' : ''} left`;
                                                                                }

                                                                                return 'Ended';
                                                                            })()}
                                                                        </span>
                                                                        <span className='flex items-center gap-1'>
                                                                            <Users className='h-3 w-3' />
                                                                            {instance.userEntries.length} participant
                                                                            {instance.userEntries.length !== 1
                                                                                ? 's'
                                                                                : ''}
                                                                        </span>
                                                                        <span className='flex items-center gap-1'>
                                                                            <PoundSterling className='h-3 w-3 text-green-500' />
                                                                            £{(instance.entryFee / 100).toFixed(2)}
                                                                        </span>
                                                                        <span className='flex items-center gap-1'>
                                                                            <Trophy className='h-3 w-3 text-yellow-500' />
                                                                            £{(instance.prizePool / 100).toFixed(2)}
                                                                        </span>
                                                                        <Badge
                                                                            variant={
                                                                                instance.status === 'ACTIVE'
                                                                                    ? 'default'
                                                                                    : 'secondary'
                                                                            }>
                                                                            {instance.status}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </Link>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className='py-4 text-center'>
                                            <p className='text-muted-foreground text-sm'>
                                                No active instances for this game.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    )
                )}
            </div>
        </div>
    );
}
