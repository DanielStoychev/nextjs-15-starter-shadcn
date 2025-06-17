import Link from 'next/link';

import { GameRulesButton } from '@/components/game-rules-button';
// Corrected import for prisma
import { Game, GameInstance } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

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
                orderBy: {
                    startDate: 'asc'
                }
            }
        }
    });

    return (
        <div className='container mx-auto py-8'>
            <h1 className='mb-8 text-3xl font-bold'>Available Games</h1>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {games.length === 0 ? (
                    <p className='text-muted-foreground col-span-full text-center'>
                        No games available yet. Check back soon!
                    </p>
                ) : (
                    games.map((game: Game & { gameInstances: GameInstance[] }) => (
                        <Card key={game.id} className='flex flex-col'>
                            <CardHeader>
                                <div className='flex items-center justify-between'>
                                    <CardTitle>{game.name}</CardTitle>
                                    {game.description && (
                                        <GameRulesButton title={`${game.name} Rules`} description={game.description} />
                                    )}
                                </div>
                                <CardDescription>{game.description || 'No description available.'}</CardDescription>
                            </CardHeader>
                            <CardContent className='flex-grow'>
                                {game.gameInstances.length > 0 ? (
                                    <div className='space-y-4'>
                                        <h3 className='text-lg font-semibold'>Upcoming/Active Instances:</h3>
                                        {game.gameInstances.map((instance: GameInstance) => (
                                            <Link key={instance.id} href={`/games/${game.slug}/${instance.id}`}>
                                                <div className='hover:bg-accent rounded-md border p-4 transition-colors'>
                                                    <h4 className='font-medium'>{instance.name}</h4>
                                                    <p className='text-muted-foreground text-sm'>
                                                        Starts: {new Date(instance.startDate).toLocaleDateString()} |
                                                        Ends: {new Date(instance.endDate).toLocaleDateString()}
                                                    </p>
                                                    <p className='text-muted-foreground text-sm'>
                                                        Status: {instance.status} | Entry Fee: £
                                                        {(instance.entryFee / 100).toFixed(2)}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className='text-muted-foreground'>
                                        No active or upcoming instances for this game.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
