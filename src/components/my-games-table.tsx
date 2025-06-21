'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import EmptyState from '@/components/ui/empty-state';
import ErrorMessage from '@/components/ui/error-message';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Input } from '@/registry/new-york-v4/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from '@/registry/new-york-v4/ui/pagination';
import { Skeleton } from '@/registry/new-york-v4/ui/skeleton';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow
} from '@/registry/new-york-v4/ui/table';

import { AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useSession } from 'next-auth/react';

// Define the type for our game entries
type GameEntry = {
    id: string;
    gameName: string;
    instanceName: string;
    gameInstanceId: string;
    gameSlug: string;
    status: string;
    entryFee: string;
    prizePool: string;
    currentScore: number;
    potentialWinnings: string;
    startDate: string;
    endDate: string | null;
    gameStatus: string;
    createdAt: string;
};

// Define the stats type
type GameStats = {
    totalEntries: number;
    activeEntries: number;
    completedEntries: number;
    totalWinnings: string;
};

const ITEMS_PER_PAGE = 5;

export function MyGamesTable() {
    const { data: session } = useSession();
    const [filter, setFilter] = useState('');
    const [sortColumn, setSortColumn] = useState<keyof GameEntry>('gameName');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [entries, setEntries] = useState<GameEntry[]>([]);
    const [stats, setStats] = useState<GameStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch user game entries
    useEffect(() => {
        async function fetchUserEntries() {
            if (!session) return;

            try {
                setLoading(true);
                setError(null);

                // Add query parameters for sorting and filtering
                const params = new URLSearchParams();
                if (sortColumn) params.append('sortBy', sortColumn);
                if (sortDirection) params.append('order', sortDirection);

                const response = await fetch(`/api/user/entries?${params.toString()}`);

                console.log('🎮 MyGamesTable - API response status:', response.status);

                if (!response.ok) {
                    if (response.status === 401) {
                        throw new Error('Please log in to view your games');
                    }
                    throw new Error('Failed to fetch your game entries');
                }

                const data = await response.json();

                console.log('🎮 MyGamesTable - Received data:', data);
                console.log('🎮 MyGamesTable - Full data object:', JSON.stringify(data, null, 2));

                // Handle the API response structure (data might be wrapped in success/data envelope)
                const responseData = data.success ? data.data : data;

                console.log('🎮 MyGamesTable - Processed responseData:', responseData);

                // Ensure entries is always an array with proper null checks
                const entriesData = responseData?.entries || [];

                console.log('🎮 MyGamesTable - Entries data:', entriesData);
                console.log('🎮 MyGamesTable - Entries count:', entriesData.length);

                setEntries(Array.isArray(entriesData) ? entriesData : []);
                setStats(
                    responseData?.stats || {
                        totalEntries: 0,
                        activeEntries: 0,
                        completedEntries: 0,
                        totalWinnings: '£0.00'
                    }
                );
            } catch (err) {
                console.error('Error fetching user entries:', err);
                setError((err as Error).message || 'Failed to load your games');
                setEntries([]); // Ensure entries is always an array
                setStats(null);
            } finally {
                setLoading(false);
            }
        }

        fetchUserEntries();
    }, [session, sortColumn, sortDirection]);

    // Filter games by name
    const filteredGames = useMemo(() => {
        // Safety check to ensure entries is an array
        if (!Array.isArray(entries) || entries.length === 0) return [];

        return entries.filter(
            (entry) =>
                entry?.gameName?.toLowerCase().includes(filter.toLowerCase()) ||
                entry?.instanceName?.toLowerCase().includes(filter.toLowerCase())
        );
    }, [entries, filter]);

    // Sort games
    const sortedGames = useMemo(() => {
        if (filteredGames.length === 0) return [];

        return [...filteredGames].sort((a, b) => {
            let aValue: any = a[sortColumn];
            let bValue: any = b[sortColumn];

            // Handle special cases for string representations
            if (sortColumn === 'entryFee' || sortColumn === 'prizePool' || sortColumn === 'potentialWinnings') {
                aValue = parseFloat(aValue.replace('£', ''));
                bValue = parseFloat(bValue.replace('£', ''));
            }

            if (aValue < bValue) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortDirection === 'asc' ? 1 : -1;
            }

            return 0;
        });
    }, [filteredGames, sortColumn, sortDirection]);

    // Paginate games
    const paginatedGames = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;

        return sortedGames.slice(startIndex, endIndex);
    }, [sortedGames, currentPage]);

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(filteredGames.length / ITEMS_PER_PAGE));
    }, [filteredGames]);

    // Handle sorting
    const handleSort = (column: keyof GameEntry) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
        setCurrentPage(1); // Reset to first page on sort change
    };

    // Handle page changes
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Display game status with appropriate styling
    const renderStatus = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return (
                    <span className='rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800'>
                        Active
                    </span>
                );
            case 'COMPLETED':
                return (
                    <span className='rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800'>
                        Completed
                    </span>
                );
            case 'PENDING_PAYMENT':
                return (
                    <span className='rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800'>
                        Payment Pending
                    </span>
                );
            case 'ELIMINATED':
                return (
                    <span className='rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800'>
                        Eliminated
                    </span>
                );
            case 'BUST':
                return (
                    <span className='rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800'>Bust</span>
                );
            default:
                return (
                    <span className='rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800'>
                        {status}
                    </span>
                );
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <ErrorMessage message={error} retry={() => window.location.reload()} />;
    }

    if (!entries.length) {
        return (
            <EmptyState
                title='No games yet'
                message="You haven't entered any games yet. Start by browsing available games!"
                action={
                    <Button asChild>
                        <Link href='/games'>Browse Games</Link>
                    </Button>
                }
            />
        );
    }

    return (
        <div className='w-full'>
            {' '}
            <div className='mb-4 flex justify-between'>
                <Input
                    type='text'
                    placeholder='Filter games by name...'
                    value={filter}
                    onChange={(e) => {
                        setFilter(e.target.value);
                        setCurrentPage(1); // Reset to first page on filter change
                    }}
                    className='max-w-sm'
                />
            </div>
            {/* Stats summary */}
            {stats && (
                <div className='mb-6 grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4'>
                    <div className='bg-card text-card-foreground rounded-lg border p-3 shadow-sm'>
                        <div className='text-muted-foreground text-sm'>Total Entries</div>
                        <div className='text-2xl font-bold'>{stats.totalEntries}</div>
                    </div>
                    <div className='bg-card text-card-foreground rounded-lg border p-3 shadow-sm'>
                        <div className='text-muted-foreground text-sm'>Active Entries</div>
                        <div className='text-2xl font-bold'>{stats.activeEntries}</div>
                    </div>
                    <div className='bg-card text-card-foreground rounded-lg border p-3 shadow-sm'>
                        <div className='text-muted-foreground text-sm'>Completed Entries</div>
                        <div className='text-2xl font-bold'>{stats.completedEntries}</div>
                    </div>
                    <div className='bg-card text-card-foreground rounded-lg border p-3 shadow-sm'>
                        <div className='text-muted-foreground text-sm'>Total Winnings</div>
                        <div className='text-2xl font-bold'>{stats.totalWinnings}</div>
                    </div>
                </div>
            )}
            <Table>
                <TableCaption>A list of your active and past mini-competitions.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className='w-[200px]'>
                            <Button
                                variant='ghost'
                                onClick={() => handleSort('gameName')}
                                className='flex items-center'>
                                Game Name
                                {sortColumn === 'gameName' &&
                                    (sortDirection === 'asc' ? (
                                        <ChevronUp className='ml-2 h-4 w-4' />
                                    ) : (
                                        <ChevronDown className='ml-2 h-4 w-4' />
                                    ))}
                            </Button>
                        </TableHead>
                        <TableHead>
                            <Button variant='ghost' onClick={() => handleSort('status')} className='flex items-center'>
                                Status
                                {sortColumn === 'status' &&
                                    (sortDirection === 'asc' ? (
                                        <ChevronUp className='ml-2 h-4 w-4' />
                                    ) : (
                                        <ChevronDown className='ml-2 h-4 w-4' />
                                    ))}
                            </Button>
                        </TableHead>
                        <TableHead>Entry Fee</TableHead>
                        <TableHead className='text-right'>Prize Pool</TableHead>
                        <TableHead className='text-right'>Winnings</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedGames.length > 0 ? (
                        paginatedGames.map((entry) => (
                            <TableRow key={entry.id}>
                                <TableCell className='font-medium'>
                                    <Link
                                        href={`/games/${entry.gameSlug}/${entry.gameInstanceId}`}
                                        className='hover:underline'>
                                        {entry.gameName} - {entry.instanceName}
                                    </Link>
                                </TableCell>
                                <TableCell>{renderStatus(entry.status)}</TableCell>
                                <TableCell>{entry.entryFee}</TableCell>
                                <TableCell className='text-right'>{entry.prizePool}</TableCell>
                                <TableCell className='text-right'>{entry.potentialWinnings}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className='h-24 text-center'>
                                {filter
                                    ? 'No matching games found. Try clearing your filter.'
                                    : "You haven't entered any games yet."}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                {stats && (
                    <TableFooter>
                        <TableRow>
                            <TableCell colSpan={4}>Total Active Games</TableCell>
                            <TableCell className='text-right'>{stats.activeEntries}</TableCell>
                        </TableRow>
                    </TableFooter>
                )}
            </Table>
            {totalPages > 1 && (
                <div className='mt-4 flex justify-center'>
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href='#'
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : undefined}
                                />
                            </PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => (
                                <PaginationItem key={i + 1}>
                                    <PaginationLink
                                        href='#'
                                        isActive={currentPage === i + 1}
                                        onClick={() => handlePageChange(i + 1)}>
                                        {i + 1}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <PaginationNext
                                    href='#'
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    className={
                                        currentPage === totalPages ? 'pointer-events-none opacity-50' : undefined
                                    }
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}
