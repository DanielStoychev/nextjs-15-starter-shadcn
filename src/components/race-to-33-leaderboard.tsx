'use client';

import React, { useEffect, useState } from 'react';

import Image from 'next/image';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { useToast } from './ui/use-toast';

interface Team {
    sportMonksId: number;
    name: string;
    logoPath: string | null;
}

interface LeaderboardEntry {
    id: string;
    userGameEntryId: string;
    assignedTeamIds: string[]; // Changed from number[] to string[]
    cumulativeGoals: number;
    userGameEntry: {
        user: {
            id: string;
            name: string | null;
            username: string | null;
            image: string | null;
        };
    };
    assignedTeams: Team[]; // Populated by the API
}

interface RaceTo33LeaderboardProps {
    gameInstanceId: string;
}

export function RaceTo33Leaderboard({ gameInstanceId }: RaceTo33LeaderboardProps) {
    const { toast } = useToast();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLeaderboard = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/games/race-to-33/leaderboard?gameInstanceId=${gameInstanceId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch leaderboard: ${response.statusText}`);
            }
            const data: LeaderboardEntry[] = await response.json();
            setLeaderboard(data);
        } catch (error: any) {
            console.error('Error fetching Race to 33 leaderboard:', error);
            toast({
                title: 'Error',
                description: error.message || 'Failed to load leaderboard.',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [gameInstanceId]);

    if (isLoading) {
        return <div className='py-8 text-center'>Loading Race to 33 leaderboard...</div>;
    }

    if (leaderboard.length === 0) {
        return <div className='py-8 text-center'>No leaderboard data available yet for this game.</div>;
    }

    return (
        <Card className='mx-auto w-full max-w-4xl'>
            <CardHeader>
                <CardTitle>Race to 33 Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>Player</TableHead>
                            <TableHead>Assigned Teams</TableHead>
                            <TableHead>Goals</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {leaderboard.map((entry, index) => (
                            <TableRow key={entry.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>
                                    <div className='flex items-center space-x-2'>
                                        {entry.userGameEntry.user.image && (
                                            <Image
                                                src={entry.userGameEntry.user.image}
                                                alt={entry.userGameEntry.user.name || 'User'}
                                                width={24}
                                                height={24}
                                                className='rounded-full'
                                            />
                                        )}
                                        <span>
                                            {entry.userGameEntry.user.username ||
                                                entry.userGameEntry.user.name ||
                                                'N/A'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className='flex flex-wrap gap-2'>
                                        {entry.assignedTeams.map((team) => (
                                            <div key={team.sportMonksId} className='flex items-center space-x-1'>
                                                {team.logoPath && (
                                                    <Image
                                                        src={team.logoPath}
                                                        alt={team.name}
                                                        width={20}
                                                        height={20}
                                                        className='rounded-full'
                                                    />
                                                )}
                                                <span className='text-xs'>{team.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>{entry.cumulativeGoals}</TableCell>
                                <TableCell>
                                    {entry.cumulativeGoals === 33 ? (
                                        <span className='font-semibold text-green-600'>Completed</span>
                                    ) : entry.cumulativeGoals > 33 ? (
                                        <span className='font-semibold text-red-600'>Bust</span>
                                    ) : (
                                        <span className='text-yellow-600'>Active</span>
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
