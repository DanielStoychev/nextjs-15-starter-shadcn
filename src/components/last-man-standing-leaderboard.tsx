'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/registry/new-york-v4/ui/table';

interface LeaderboardEntry {
    userId: string;
    userName: string;
    userEmail: string;
    status: string;
    latestPickRoundId: string | null;
    latestPickTeamId: number | null;
    latestPickTeamName: string | null;
    latestPickIsCorrect: boolean | null;
}

interface LastManStandingLeaderboardProps {
    gameInstanceId: string;
}

export function LastManStandingLeaderboard({ gameInstanceId }: LastManStandingLeaderboardProps) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `/api/games/last-man-standing/leaderboard?gameInstanceId=${gameInstanceId}`
                );
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch leaderboard');
                }
                const data: LeaderboardEntry[] = await response.json();
                setLeaderboard(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [gameInstanceId]);

    if (loading) {
        return <p>Loading leaderboard...</p>;
    }

    if (error) {
        return <p className='text-red-500'>Error: {error}</p>;
    }

    if (leaderboard.length === 0) {
        return <p>No leaderboard data available yet.</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Player</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Latest Pick</TableHead>
                            <TableHead>Latest Pick (Correct)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaderboard.map((entry) => (
                            <TableRow key={entry.userId}>
                                <TableCell>{entry.userName}</TableCell>
                                <TableCell>
                                    <span
                                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                                            entry.status === 'ACTIVE'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                        {entry.status}
                                    </span>
                                </TableCell>
                                <TableCell>{entry.latestPickTeamName || 'N/A'}</TableCell>
                                <TableCell>
                                    {entry.latestPickIsCorrect !== null ? (
                                        entry.latestPickIsCorrect ? (
                                            <span className='font-medium text-green-600'>Yes</span>
                                        ) : (
                                            <span className='font-medium text-red-600'>No</span>
                                        )
                                    ) : (
                                        'N/A'
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
