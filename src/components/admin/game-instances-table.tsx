'use client';

import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/new-york-v4/ui/table';

import { format } from 'date-fns';

// Define the expected structure for GameInstance and related Game
// This should align with what's fetched in src/app/admin/page.tsx
interface Game {
    id: string; // Changed from cuid
    name: string;
    slug: string; // Added slug, removed gameType
}

interface GameInstance {
    id: string; // Changed from cuid
    name: string;
    gameId: string;
    startDate: string; // Assuming ISO string date
    endDate?: string | null; // Assuming ISO string date
    entryFee: number;
    prizePool: number;
    status: string; // DRAFT, OPEN, ACTIVE, COMPLETED, CANCELLED
    numberOfRounds?: number | null;
    instanceRoundCUIDs: string[];
    game: Game; // Included relation
    // Add other fields as necessary
}

interface GameInstancesTableProps {
    gameInstances: GameInstance[];
}

export function GameInstancesTable({ gameInstances }: GameInstancesTableProps) {
    if (!gameInstances || gameInstances.length === 0) {
        return (
            <Card className='mt-6 w-full'>
                <CardHeader>
                    <CardTitle>Existing Game Instances</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>No game instances found.</p>
                </CardContent>
            </Card>
        );
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'ACTIVE':
            case 'OPEN':
                return 'success';
            case 'COMPLETED':
                return 'default';
            case 'DRAFT':
                return 'outline';
            case 'CANCELLED':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    return (
        <Card className='mt-8 w-full'>
            <CardHeader>
                <CardTitle>Existing Game Instances</CardTitle>
                <CardDescription>A list of all created game instances.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Instance Name</TableHead>
                            <TableHead>Game</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead className='text-center'>Rounds</TableHead>
                            <TableHead className='text-center'>Status</TableHead>
                            <TableHead className='text-right'>Entry Fee</TableHead>
                            <TableHead className='text-right'>Prize Pool</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {gameInstances.map((instance) => (
                            <TableRow key={instance.id}>
                                <TableCell className='font-medium'>{instance.name}</TableCell>
                                <TableCell>
                                    {instance.game.name} ({instance.game.slug})
                                </TableCell>
                                <TableCell>{format(new Date(instance.startDate), 'PPP')}</TableCell>
                                <TableCell>
                                    {instance.endDate ? format(new Date(instance.endDate), 'PPP') : 'N/A'}
                                </TableCell>
                                <TableCell className='text-center'>{instance.numberOfRounds ?? 'N/A'}</TableCell>
                                <TableCell className='text-center'>
                                    <Badge variant={getStatusBadgeVariant(instance.status) as any}>
                                        {instance.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className='text-right'>£{instance.entryFee.toFixed(2)}</TableCell>
                                <TableCell className='text-right'>£{instance.prizePool.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
