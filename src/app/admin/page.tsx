import type { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { BatchOperations } from '@/components/admin/batch-operations';
import { CreateGameInstanceForm } from '@/components/admin/create-game-instance-form';
import { GameInstancesTable } from '@/components/admin/game-instances-table';
import JobManagement from '@/components/admin/job-management';
import { ResultsManagement } from '@/components/admin/results-management';
import StatisticsDashboard from '@/components/admin/statistics-dashboard';
// import { EnhancedGameInstanceForm } from '@/components/admin/enhanced-game-instance-form'; // Commented out due to type issues
import { authOptions } from '@/lib/auth-config';
import prisma from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import type {
    Game as PrismaGameForInclude,
    GameInstance as PrismaGameInstanceFull,
    GameStatus as PrismaGameStatus
} from '@prisma/client';

import { getServerSession } from 'next-auth';

export const metadata: Metadata = {
    title: 'Admin Dashboard',
    description: 'Admin panel for FootyGames.co.uk. Manage users, games, entries, and transactions.'
};

export default async function AdminDashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        // Ensure session and email exist
        redirect('/api/auth/signin'); // Redirect to sign-in if not authenticated
    }

    // Fetch the user directly from the database to get the latest role
    const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            role: true
        }
    });

    // Check if user exists and has ADMIN role
    if (!dbUser || dbUser.role !== 'ADMIN') {
        redirect('/api/auth/signin'); // Redirect if not admin
    }

    noStore(); // Ensure fresh data on every request for admin page

    const games = await prisma.game.findMany({
        select: { id: true, name: true, slug: true } // Corrected: use id, slug; remove gameType
    });

    const gameInstances = await prisma.gameInstance.findMany({
        include: {
            // Changed from select to include
            game: {
                select: {
                    id: true,
                    name: true,
                    slug: true
                }
            }
        },
        orderBy: { startDate: 'desc' } // Corrected: use startDate for ordering
    });

    // Serialize dates to strings for client component props if necessary,
    // or ensure client component handles Date objects. Prisma returns Date objects.
    // For simplicity, we'll assume client components can handle Date objects from Prisma.
    // If issues arise, map over gameInstances and format dates here.

    return (
        <main className='flex min-h-[calc(100vh-14rem)] flex-col items-center p-4 sm:p-8'>
            <Card className='bg-card text-card-foreground border-border w-full max-w-6xl shadow-xl'>
                {' '}
                {/* Increased max-width */}
                <CardHeader className='text-center'>
                    <CardTitle className='mb-4 text-3xl font-bold sm:text-4xl'>Admin Dashboard</CardTitle>
                    <CardDescription className='text-muted-foreground text-lg'>
                        Welcome, {session.user?.name || session.user?.email}! Manage your FootyGames.co.uk platform
                        here.
                    </CardDescription>
                </CardHeader>
                <CardContent className='grid gap-6'>
                    {/* Statistics Dashboard */}
                    <div className='mt-6'>
                        <StatisticsDashboard />
                    </div>

                    <p className='text-muted-foreground'>
                        This is the main administration area. You can manage various aspects of the platform from here.
                    </p>
                    {/* Placeholder for admin navigation/summary */}
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                        <Card className='bg-muted/50 rounded-lg p-4'>
                            <h3 className='text-foreground font-semibold'>User Management</h3>
                            <p className='text-muted-foreground text-sm'>View and manage user accounts.</p>
                        </Card>
                        <Card className='bg-muted/50 rounded-lg p-4'>
                            <h3 className='text-foreground font-semibold'>Game Management</h3>
                            <p className='text-muted-foreground text-sm'>Create and configure game instances.</p>
                        </Card>
                        <Card className='bg-muted/50 rounded-lg p-4'>
                            <h3 className='text-foreground font-semibold'>Entries & Results</h3>
                            <p className='text-muted-foreground text-sm'>Monitor game entries and process results.</p>
                        </Card>
                        <Link href='/admin/payments'>
                            <Card className='bg-muted/50 hover:bg-accent cursor-pointer rounded-lg p-4 transition-colors'>
                                <h3 className='text-foreground font-semibold'>Payment Analytics</h3>
                                <p className='text-muted-foreground text-sm'>
                                    View payment transactions, revenue, and analytics.
                                </p>
                            </Card>
                        </Link>
                    </div>

                    {/* Game Instance Management Section */}
                    <div className='mt-8'>
                        <CreateGameInstanceForm games={games} />
                    </div>

                    <div className='mt-8'>
                        <GameInstancesTable
                            gameInstances={gameInstances.map((instance) => ({
                                // Rely on inferred type for instance, use 'as any' for problematic fields
                                id: instance.id,
                                name: instance.name,
                                gameId: instance.gameId,
                                startDate: instance.startDate.toISOString(),
                                endDate: instance.endDate ? instance.endDate.toISOString() : null,
                                entryFee: instance.entryFee,
                                prizePool: instance.prizePool,
                                status: instance.status as string, // Cast GameStatus enum to string
                                numberOfRounds: (instance as any).numberOfRounds ?? null,
                                instanceRoundCUIDs: (instance as any).instanceRoundCUIDs ?? [],
                                game: (instance as any).game // game relation should be fine with include
                            }))}
                        />
                    </div>

                    {/* Batch Operations Section */}
                    <div className='mt-8'>
                        <BatchOperations
                            gameInstances={gameInstances.map((instance) => ({
                                id: instance.id,
                                name: instance.name,
                                status: instance.status as 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED',
                                startDate: instance.startDate.toISOString(),
                                endDate: instance.endDate ? instance.endDate.toISOString() : new Date().toISOString(),
                                entryFee: instance.entryFee,
                                prizePool: instance.prizePool,
                                game: {
                                    id: (instance as any).game.id,
                                    name: (instance as any).game.name,
                                    slug: (instance as any).game.slug
                                },
                                totalEntries: (instance as any)._count?.userEntries || 0,
                                totalRevenue: ((instance as any)._count?.userEntries || 0) * instance.entryFee,
                                completedEntries: 0, // We'd need to calculate this from userEntries
                                pendingEntries: 0 // We'd need to calculate this from userEntries
                            }))}
                        />
                    </div>

                    {/* Job Management Section */}
                    <div className='mt-8'>
                        <JobManagement />
                    </div>

                    {/* Results Management Section */}
                    <div className='mt-8'>
                        <Card>
                            <CardHeader>
                                <CardTitle>Results Management</CardTitle>
                                <CardDescription>
                                    Process game results, apply admin overrides, and view audit logs.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResultsManagement />
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
