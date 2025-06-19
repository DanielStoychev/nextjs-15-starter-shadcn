'use client';

import React, { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/new-york-v4/ui/table';

import { toast } from 'sonner';

interface LeaderboardEntry {
    predictionId: string;
    userId: string;
    userName: string;
    score: number | null;
    predictedOrder?: string[]; // Array of team IDs - now optional
    predictedTotalGoals?: number; // Now optional
}

interface TablePredictorLeaderboardProps {
    gameInstanceId: string;
    // In a real scenario, you'd pass a map of teamId to teamName/logoPath
    // For now, we'll assume a simple mapping or fetch it if needed.
    teams: { id: string; name: string; logoPath: string }[];
}

const TablePredictorLeaderboard: React.FC<TablePredictorLeaderboardProps> = ({ gameInstanceId, teams }) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setIsLoading(true);
                setError(null); // Reset error state on new fetch
                const response = await fetch(`/api/games/table-predictor/leaderboard?gameInstanceId=${gameInstanceId}`);
                // Removed 403 specific error throw, API now returns different data shapes
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({})); // Try to parse error, default if fails
                    throw new Error(errorData.message || 'Failed to fetch leaderboard data.');
                }
                const responseData = await response.json();

                // Check if the API indicates the leaderboard is not yet available
                if (responseData.message && responseData.leaderboard && responseData.leaderboard.length === 0) {
                    setError(responseData.message); // Use the message from the API
                    setLeaderboard([]);
                } else {
                    setLeaderboard(responseData.leaderboard || responseData); // Handle if API returns array directly or nested
                }
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

    const getTeamName = (teamId: string) => {
        const team = teams.find((t) => t.id === teamId);

        return team ? team.name : `Unknown Team (${teamId})`;
    };

    const showDetailedView = leaderboard.length > 0 && leaderboard[0].predictedOrder !== undefined;

    return (
        <Card className='mx-auto my-8 w-full max-w-4xl'>
            <CardHeader className='text-center'>
                <CardTitle className='text-2xl font-bold'>Table Predictor Leaderboard</CardTitle>
                <p className='text-muted-foreground'>See how others predicted the league table.</p>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className='p-4 text-center'>Loading leaderboard...</div>
                ) : error ? (
                    // Display the error message (which might be the "not available yet" message)
                    <div className='text-muted-foreground p-4 text-center'>{error}</div>
                ) : leaderboard.length === 0 ? (
                    // This case might be redundant if 'error' state now handles the "not available" message
                    <div className='text-muted-foreground p-4 text-center'>
                        No predictions submitted or leaderboard not yet available.
                    </div>
                ) : (
                    <div className='overflow-x-auto'>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className='w-[50px]'>Rank</TableHead>
                                    <TableHead>Player</TableHead>
                                    <TableHead>Score</TableHead>
                                    {showDetailedView && <TableHead>Predicted Order</TableHead>}
                                    {showDetailedView && <TableHead>Predicted Goals</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaderboard.map((entry, index) => (
                                    <TableRow key={entry.predictionId}>
                                        <TableCell className='font-medium'>{index + 1}</TableCell>
                                        <TableCell>{entry.userName}</TableCell>
                                        <TableCell>{entry.score !== null ? entry.score : 'N/A'}</TableCell>
                                        {showDetailedView && (
                                            <TableCell>
                                                <div className='flex flex-wrap gap-1'>
                                                    {entry.predictedOrder?.map((teamId, idx) => (
                                                        <span
                                                            key={idx}
                                                            className='bg-secondary rounded-full px-2 py-1 text-xs'>
                                                            {getTeamName(teamId)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </TableCell>
                                        )}
                                        {showDetailedView && <TableCell>{entry.predictedTotalGoals}</TableCell>}
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

export default TablePredictorLeaderboard;
