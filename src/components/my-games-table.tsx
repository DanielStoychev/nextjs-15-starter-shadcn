"use client";

import { useState, useMemo } from 'react';
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
import { Input } from '@/registry/new-york-v4/ui/input';
import { Button } from '@/registry/new-york-v4/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from '@/registry/new-york-v4/ui/pagination';

type Game = {
    gameName: string;
    status: string;
    entryFee: string;
    prizeFund: string;
};

const initialGames: Game[] = [
    {
        gameName: 'Last Man Standing - Week 1',
        status: 'Active',
        entryFee: '£5.00',
        prizeFund: '£250.00'
    },
    {
        gameName: 'Table Predictor - 2024/2025',
        status: 'Pending',
        entryFee: '£10.00',
        prizeFund: '£500.00'
    },
    {
        gameName: 'Weekly Score Predictor - Week 2',
        status: 'Completed',
        entryFee: '£5.00',
        prizeFund: '£100.00'
    },
    {
        gameName: 'Race to 33 - Season Start',
        status: 'Active',
        entryFee: '£7.50',
        prizeFund: '£300.00'
    },
    {
        gameName: 'Fantasy Football League - 2024',
        status: 'Active',
        entryFee: '£15.00',
        prizeFund: '£1000.00'
    },
    {
        gameName: 'Champions League Predictor - Group Stage',
        status: 'Completed',
        entryFee: '£8.00',
        prizeFund: '£400.00'
    },
    {
        gameName: 'Premier League Top Scorer',
        status: 'Pending',
        entryFee: '£6.00',
        prizeFund: '£200.00'
    },
    {
        gameName: 'FA Cup Knockout Challenge',
        status: 'Active',
        entryFee: '£12.00',
        prizeFund: '£750.00'
    },
    {
        gameName: 'World Cup Sweepstake',
        status: 'Completed',
        entryFee: '£3.00',
        prizeFund: '£50.00'
    },
    {
        gameName: 'Euro 2024 Group Stage Predictor',
        status: 'Active',
        entryFee: '£9.00',
        prizeFund: '£600.00'
    }
];

const ITEMS_PER_PAGE = 5;

export function MyGamesTable() {
    const [filter, setFilter] = useState('');
    const [sortColumn, setSortColumn] = useState<keyof Game>('gameName');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredGames = useMemo(() => {
        return initialGames.filter(game =>
            game.gameName.toLowerCase().includes(filter.toLowerCase())
        );
    }, [filter]);

    const sortedGames = useMemo(() => {
        const sortableGames = [...filteredGames];
        sortableGames.sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            if (aValue < bValue) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });
        return sortableGames;
    }, [filteredGames, sortColumn, sortDirection]);

    const paginatedGames = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return sortedGames.slice(startIndex, endIndex);
    }, [sortedGames, currentPage]);

    const totalPages = useMemo(() => {
        return Math.ceil(filteredGames.length / ITEMS_PER_PAGE);
    }, [filteredGames]);

    const handleSort = (column: keyof Game) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
        setCurrentPage(1); // Reset to first page on sort change
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const activeGamesCount = useMemo(() => {
        return initialGames.filter(game => game.status === 'Active').length;
    }, []);

    return (
        <div className='w-full'>
            <div className='mb-4'>
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
            <Table>
                <TableCaption>A list of your active and past mini-competitions.</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead className='w-[200px]'>
                            <Button
                                variant='ghost'
                                onClick={() => handleSort('gameName')}
                                className='flex items-center'
                            >
                                Game Name
                                {sortColumn === 'gameName' && (
                                    sortDirection === 'asc' ? <ChevronUp className='ml-2 h-4 w-4' /> : <ChevronDown className='ml-2 h-4 w-4' />
                                )}
                            </Button>
                        </TableHead>
                        <TableHead>
                            <Button
                                variant='ghost'
                                onClick={() => handleSort('status')}
                                className='flex items-center'
                            >
                                Status
                                {sortColumn === 'status' && (
                                    sortDirection === 'asc' ? <ChevronUp className='ml-2 h-4 w-4' /> : <ChevronDown className='ml-2 h-4 w-4' />
                                )}
                            </Button>
                        </TableHead>
                        <TableHead>Entry Fee</TableHead>
                        <TableHead className='text-right'>Prize Fund</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedGames.length > 0 ? (
                        paginatedGames.map((game) => (
                            <TableRow key={game.gameName}>
                                <TableCell className='font-medium'>{game.gameName}</TableCell>
                                <TableCell>{game.status}</TableCell>
                                <TableCell>{game.entryFee}</TableCell>
                                <TableCell className='text-right'>{game.prizeFund}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className='h-24 text-center'>
                                No games found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={3}>Total Active Games</TableCell>
                        <TableCell className='text-right'>{activeGamesCount}</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
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
                                    onClick={() => handlePageChange(i + 1)}
                                >
                                    {i + 1}
                                </PaginationLink>
                            </PaginationItem>
                        ))}
                        <PaginationItem>
                            <PaginationNext
                                href='#'
                                onClick={() => handlePageChange(currentPage + 1)}
                                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : undefined}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
}
