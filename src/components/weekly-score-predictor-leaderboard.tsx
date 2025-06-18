'use client';

import React, { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/new-york-v4/ui/table';

import { toast } from 'sonner';

interface AggregatedLeaderboardEntry {
    // Updated interface name and structure
    userId: string;
    userName: string;
    totalPoints: number;
}

interface WeeklyScorePredictorLeaderboardProps {
    gameInstanceId: string;
    // fixtures prop is no longer needed as individual predictions are not displayed
}

const WeeklyScorePredictorLeaderboard: React.FC<WeeklyScorePredictorLeaderboardProps> = ({
    gameInstanceId
    // fixtures prop removed
}) => {
    const [leaderboard, setLeaderboard] = useState<AggregatedLeaderboardEntry[]>([]); // Use updated interface
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(
                    `/api/games/weekly-score-predictor/leaderboard?gameInstanceId=${gameInstanceId}`
                );
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({})); // Try to parse error
                    throw new Error(errorData.message || 'Failed to fetch leaderboard data.');
                }
                const data: AggregatedLeaderboardEntry[] = await response.json(); // Use updated interface
                setLeaderboard(data);
            } catch (err) {
                console.error('Error fetching leaderboard:', err);
                setError((err as Error).message);
                toast.error('Failed to load leaderboard.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, [gameInstanceId]);

    // getFixtureDetails function is no longer needed

    return (
        <Card className='mx-auto my-8 w-full max-w-4xl'>
            <CardHeader className='text-center'>
                <CardTitle className='text-2xl font-bold'>Weekly Score Predictor Leaderboard</CardTitle>
                <p className='text-muted-foreground'>See how others predicted match scores.</p>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className='p-4 text-center'>Loading leaderboard...</div>
                ) : error ? (
                    <div className='text-destructive p-4 text-center'>{error}</div>
                ) : leaderboard.length === 0 ? (
                    <div className='text-muted-foreground p-4 text-center'>No predictions submitted yet.</div>
                ) : (
                    <div className='overflow-x-auto'>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className='w-[50px]'>Rank</TableHead>
                                    <TableHead>Player</TableHead>
                                    <TableHead>Total Points</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaderboard.map((entry, index) => (
                                    <TableRow key={entry.userId}>
                                        {' '}
                                        {/* Use userId as key, assuming it's unique per entry */}
                                        <TableCell className='font-medium'>{index + 1}</TableCell>
                                        <TableCell>{entry.userName}</TableCell>
                                        <TableCell>{entry.totalPoints}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default WeeklyScorePredictorLeaderboard;
