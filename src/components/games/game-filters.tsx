'use client';

import { useState } from 'react';

import { Badge } from '@/registry/new-york-v4/ui/badge';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Input } from '@/registry/new-york-v4/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/registry/new-york-v4/ui/select';

import { Calendar, DollarSign, Filter, Search, Trophy } from 'lucide-react';

export interface GameFilters {
    search: string;
    status: string;
    sortBy: string;
    priceRange: string;
    gameType: string;
}

interface GameFiltersProps {
    filters: GameFilters;
    onFiltersChange: (filters: GameFilters) => void;
    gameStats?: {
        totalGames: number;
        activeInstances: number;
        totalPrizePool: number;
    };
}

export function GameFiltersComponent({ filters, onFiltersChange, gameStats }: GameFiltersProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleFilterChange = (key: keyof GameFilters, value: string) => {
        onFiltersChange({
            ...filters,
            [key]: value
        });
    };

    const clearFilters = () => {
        onFiltersChange({
            search: '',
            status: 'all',
            sortBy: 'startDate',
            priceRange: 'all',
            gameType: 'all'
        });
    };

    return (
        <div className='space-y-4'>
            {/* Quick Stats */}
            {gameStats && (
                <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
                    <Card>
                        <CardContent className='flex items-center p-4'>
                            <Trophy className='text-primary mr-3 h-8 w-8' />
                            <div>
                                <p className='text-muted-foreground text-sm font-medium'>Total Games</p>
                                <p className='text-2xl font-bold'>{gameStats.totalGames}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className='flex items-center p-4'>
                            <Calendar className='mr-3 h-8 w-8 text-green-500' />
                            <div>
                                <p className='text-muted-foreground text-sm font-medium'>Active Instances</p>
                                <p className='text-2xl font-bold'>{gameStats.activeInstances}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className='flex items-center p-4'>
                            <DollarSign className='mr-3 h-8 w-8 text-yellow-500' />
                            <div>
                                <p className='text-muted-foreground text-sm font-medium'>Total Prize Pool</p>
                                <p className='text-2xl font-bold'>£{gameStats.totalPrizePool.toFixed(2)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filter Controls */}
            <Card>
                <CardHeader>
                    <div className='flex items-center justify-between'>
                        <CardTitle className='flex items-center'>
                            <Filter className='mr-2 h-5 w-5' />
                            Filter Games
                        </CardTitle>
                        <Button variant='outline' size='sm' onClick={() => setShowAdvanced(!showAdvanced)}>
                            {showAdvanced ? 'Hide' : 'Show'} Advanced
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                    {/* Basic Filters */}
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                        {/* Search */}
                        <div className='relative'>
                            <Search className='text-muted-foreground absolute top-3 left-3 h-4 w-4' />
                            <Input
                                placeholder='Search games...'
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                                className='pl-10'
                            />
                        </div>

                        {/* Status Filter */}
                        <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder='Filter by status' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='all'>All Status</SelectItem>
                                <SelectItem value='ACTIVE'>Active</SelectItem>
                                <SelectItem value='PENDING'>Pending</SelectItem>
                                <SelectItem value='COMPLETED'>Completed</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sort By */}
                        <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                            <SelectTrigger>
                                <SelectValue placeholder='Sort by' />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value='startDate'>Start Date</SelectItem>
                                <SelectItem value='endDate'>End Date</SelectItem>
                                <SelectItem value='entryFee'>Entry Fee</SelectItem>
                                <SelectItem value='name'>Name</SelectItem>
                                <SelectItem value='prizePool'>Prize Pool</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Advanced Filters */}
                    {showAdvanced && (
                        <div className='grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2'>
                            {/* Price Range */}
                            <Select
                                value={filters.priceRange}
                                onValueChange={(value) => handleFilterChange('priceRange', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder='Price range' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='all'>All Prices</SelectItem>
                                    <SelectItem value='free'>Free</SelectItem>
                                    <SelectItem value='0-5'>£0 - £5</SelectItem>
                                    <SelectItem value='5-10'>£5 - £10</SelectItem>
                                    <SelectItem value='10-20'>£10 - £20</SelectItem>
                                    <SelectItem value='20+'>£20+</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Game Type */}
                            <Select
                                value={filters.gameType}
                                onValueChange={(value) => handleFilterChange('gameType', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder='Game type' />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='all'>All Games</SelectItem>
                                    <SelectItem value='Race to 33'>Race to 33</SelectItem>
                                    <SelectItem value='Table Predictor'>Table Predictor</SelectItem>
                                    <SelectItem value='Weekly Score Predictor'>Weekly Score Predictor</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Active Filters Display */}
                    <div className='flex flex-wrap gap-2'>
                        {filters.search && (
                            <Badge
                                variant='secondary'
                                className='cursor-pointer'
                                onClick={() => handleFilterChange('search', '')}>
                                Search: {filters.search} ×
                            </Badge>
                        )}
                        {filters.status !== 'all' && (
                            <Badge
                                variant='secondary'
                                className='cursor-pointer'
                                onClick={() => handleFilterChange('status', 'all')}>
                                Status: {filters.status} ×
                            </Badge>
                        )}
                        {filters.priceRange !== 'all' && (
                            <Badge
                                variant='secondary'
                                className='cursor-pointer'
                                onClick={() => handleFilterChange('priceRange', 'all')}>
                                Price: {filters.priceRange} ×
                            </Badge>
                        )}
                        {filters.gameType !== 'all' && (
                            <Badge
                                variant='secondary'
                                className='cursor-pointer'
                                onClick={() => handleFilterChange('gameType', 'all')}>
                                Type: {filters.gameType} ×
                            </Badge>
                        )}
                        {(filters.search ||
                            filters.status !== 'all' ||
                            filters.priceRange !== 'all' ||
                            filters.gameType !== 'all') && (
                            <Button variant='ghost' size='sm' onClick={clearFilters}>
                                Clear All
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
