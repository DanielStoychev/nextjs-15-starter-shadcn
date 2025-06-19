'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import { GameInstance } from '@/generated/prisma';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

import { useSession } from 'next-auth/react';

interface Fixture {
    id: number;
    name: string;
    starting_at: string;
    participants: Array<{
        id: number;
        name: string;
        image_path: string;
        meta: {
            location: 'home' | 'away';
        };
    }>;
    scores: Array<{
        score: {
            home: number;
            away: number;
        };
        description: string;
        type: 'FT' | 'HT' | 'ET' | 'PEN';
    }>;
}

interface LastManStandingGameProps {
    gameInstance: GameInstance;
    fixtures: Fixture[];
    currentRoundId: string | null;
    isSeasonFinished: boolean;
}

export function LastManStandingGame({
    gameInstance,
    fixtures,
    currentRoundId,
    isSeasonFinished
}: LastManStandingGameProps) {
    const { data: session } = useSession();
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [currentPickForRound, setCurrentPickForRound] = useState<{ pickedTeamId: string; roundId: string } | null>(
        null
    ); // Store current round's pick
    const [formattedDates, setFormattedDates] = useState<Record<number, string>>({});
    const [previouslyPickedTeamIdsInOtherRounds, setPreviouslyPickedTeamIdsInOtherRounds] = useState<string[]>([]); // Renamed for clarity
    const [isLoadingPicks, setIsLoadingPicks] = useState<boolean>(true);
    const [pickPercentages, setPickPercentages] = useState<
        Array<{ teamId: string; teamName: string; percentage: number }>
    >([]);
    const [isLoadingPercentages, setIsLoadingPercentages] = useState<boolean>(false);
    const [isRoundInPlay, setIsRoundInPlay] = useState<boolean>(false); // New state for "in play"

    useEffect(() => {
        // Determine if the round is "in play" (picks locked)
        if (!fixtures || fixtures.length === 0 || !currentRoundId) {
            setIsRoundInPlay(false);

            return;
        }

        let earliestStartTime = Infinity;
        for (const fixture of fixtures) {
            const fixtureTime = new Date(fixture.starting_at).getTime();
            if (fixtureTime < earliestStartTime) {
                earliestStartTime = fixtureTime;
            }
        }

        if (earliestStartTime === Infinity) {
            setIsRoundInPlay(false);

            return;
        }

        // Picks lock when the first game of the round starts (or a defined deadline)
        const pickLockTime = earliestStartTime;
        const now = new Date().getTime();

        if (now >= pickLockTime) {
            setIsRoundInPlay(true);
        } else {
            setIsRoundInPlay(false);
            const timeToLock = pickLockTime - now;
            const timer = setTimeout(() => {
                setIsRoundInPlay(true);
            }, timeToLock);
            // Cleanup timer when component unmounts or dependencies change

            return () => clearTimeout(timer);
        }
    }, [fixtures, currentRoundId]);

    useEffect(() => {
        // Fetch user's pick data: all previously picked teams in this instance AND the pick for the current round
        const fetchUserPicksData = async () => {
            if (session?.user?.id && gameInstance.id && currentRoundId) {
                // Ensure currentRoundId is available
                setIsLoadingPicks(true);
                try {
                    const response = await fetch(
                        `/api/games/last-man-standing/user-picks?gameInstanceId=${gameInstance.id}&currentRoundId=${currentRoundId}`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        // Store teams picked in *other* rounds for the "already picked this team" rule
                        setPreviouslyPickedTeamIdsInOtherRounds(
                            (data.allPickedTeamIdsInInstance || []).filter(
                                (teamId: string) => data.currentRoundPick?.pickedTeamId !== teamId
                            )
                        );
                        setCurrentPickForRound(data.currentRoundPick || null);
                        if (data.currentRoundPick) {
                            setSelectedTeamId(Number(data.currentRoundPick.pickedTeamId));
                        } else {
                            setSelectedTeamId(null); // No pick for current round yet
                        }
                    } else {
                        console.error('Failed to fetch user picks data');
                        setPreviouslyPickedTeamIdsInOtherRounds([]);
                        setCurrentPickForRound(null);
                    }
                } catch (error) {
                    console.error('Error fetching user picks data:', error);
                    setPreviouslyPickedTeamIdsInOtherRounds([]);
                    setCurrentPickForRound(null);
                } finally {
                    setIsLoadingPicks(false);
                }
            } else {
                setPreviouslyPickedTeamIdsInOtherRounds([]);
                setCurrentPickForRound(null);
                setIsLoadingPicks(false);
            }
        };

        fetchUserPicksData();
    }, [session, gameInstance.id, currentRoundId]);

    useEffect(() => {
        // Fetch pick percentages for the current round
        const fetchPickPercentages = async () => {
            if (currentRoundId && gameInstance.id) {
                setIsLoadingPercentages(true);
                try {
                    const response = await fetch(
                        `/api/games/last-man-standing/pick-percentages?roundId=${currentRoundId}&gameInstanceId=${gameInstance.id}`
                    );
                    if (response.ok) {
                        const data = await response.json();
                        setPickPercentages(data.percentages || []);
                    } else {
                        console.error('Failed to fetch pick percentages');
                        setPickPercentages([]);
                    }
                } catch (error) {
                    console.error('Error fetching pick percentages:', error);
                    setPickPercentages([]);
                } finally {
                    setIsLoadingPercentages(false);
                }
            } else {
                setPickPercentages([]);
            }
        };

        // Only fetch percentages if currentRoundId and gameInstance.id are available
        // Add condition here if percentages should only be shown when "in play"
        if (currentRoundId && gameInstance.id && isRoundInPlay) {
            // Added isRoundInPlay condition
            fetchPickPercentages();
        } else {
            setPickPercentages([]); // Clear if not in play or no round
        }
    }, [currentRoundId, gameInstance.id, isRoundInPlay]); // Added isRoundInPlay to dependencies

    useEffect(() => {
        // Format dates on the client side after hydration
        const dates: Record<number, string> = {};
        fixtures.forEach((fixture) => {
            dates[fixture.id] = new Date(fixture.starting_at).toLocaleString();
        });
        setFormattedDates(dates);
    }, [fixtures]);

    const handlePickTeam = (teamId: number) => {
        if (isRoundInPlay) {
            alert('Picks are locked for this round.');

            return;
        }
        // Check if team was picked in a *different* round of this game instance
        if (previouslyPickedTeamIdsInOtherRounds.includes(String(teamId))) {
            alert('You have already picked this team in a previous round of this game cycle.');

            return;
        }
        setSelectedTeamId(teamId);
    };

    const handleSubmitPick = async () => {
        if (!session?.user?.id || !selectedTeamId || !currentRoundId) {
            alert('Please log in, select a team, and ensure the current round is available.');

            return;
        }

        try {
            const response = await fetch('/api/games/last-man-standing/pick', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gameInstanceId: gameInstance.id,
                    roundId: currentRoundId,
                    pickedTeamId: selectedTeamId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit pick');
            }

            alert(currentPickForRound ? 'Pick updated successfully!' : 'Pick submitted successfully!');
            window.location.reload(); // Refresh the page to get all updated states
            // No need to manually update local state like setSelectedTeamId or previouslyPickedTeamIds,
            // as the reload and subsequent fetchUserPicksData will handle it.
        } catch (err) {
            alert(`Error submitting pick: ${(err as Error).message}`);
        }
    };

    if (isSeasonFinished) {
        return (
            <p>
                The current Premier League season has finished. Please wait for the next season to start or select a
                different game.
            </p>
        );
    }

    if (!currentRoundId) {
        return <p>No current or upcoming round found for Last Man Standing. Please check back later.</p>;
    }

    if (fixtures.length === 0) {
        return <p>No upcoming fixtures found for this round.</p>;
    }

    if (isLoadingPicks) {
        return <p>Loading your previous picks...</p>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className='text-center'>Make Your Pick for This Week</CardTitle>
            </CardHeader>
            <CardContent>
                <p className='mb-4 text-center'>Select one team you predict will win their match this week.</p>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    {fixtures.map((fixture) => (
                        <div key={fixture.id} className='rounded-md border p-4'>
                            <h3 className='mb-2 text-center font-semibold'>
                                {fixture.participants.find((p) => p.meta.location === 'home')?.name} vs{' '}
                                {fixture.participants.find((p) => p.meta.location === 'away')?.name}
                            </h3>
                            <p className='text-muted-foreground text-center text-sm'>
                                Kick-off: {formattedDates[fixture.id] || new Date(fixture.starting_at).toISOString()}
                            </p>
                            <div className='mt-4 flex justify-around'>
                                {fixture.participants.map((participant) => {
                                    // Disable if round is in play OR if team was picked in another round of this instance
                                    const isTeamDisabledForOtherRounds = previouslyPickedTeamIdsInOtherRounds.includes(
                                        String(participant.id)
                                    );
                                    // Allow picking the currently picked team again (to change away from it)
                                    const isCurrentlyPickedTeam =
                                        currentPickForRound?.pickedTeamId === String(participant.id);

                                    const isSelectionDisabled =
                                        isRoundInPlay || (isTeamDisabledForOtherRounds && !isCurrentlyPickedTeam);

                                    const percentageData = pickPercentages.find(
                                        (p) => p.teamId === String(participant.id)
                                    );

                                    return (
                                        <div
                                            key={participant.id}
                                            onClick={() => !isSelectionDisabled && handlePickTeam(participant.id)}
                                            className={`flex h-auto flex-col items-center rounded-md border p-2 transition-colors ${
                                                isSelectionDisabled
                                                    ? 'bg-muted cursor-not-allowed opacity-50'
                                                    : 'hover:bg-accent cursor-pointer'
                                            } ${
                                                selectedTeamId === participant.id && !isSelectionDisabled
                                                    ? 'bg-primary text-primary-foreground'
                                                    : ''
                                            }`}>
                                            {participant.image_path && (
                                                <Image
                                                    src={participant.image_path}
                                                    alt={participant.name}
                                                    width={40}
                                                    height={40}
                                                    className='mb-1'
                                                />
                                            )}
                                            <span>{participant.name}</span>
                                            {isRoundInPlay && percentageData && (
                                                <span className='text-muted-foreground mt-1 text-xs'>
                                                    ({percentageData.percentage}%)
                                                </span>
                                            )}
                                            {/* Optionally, show a placeholder if !isRoundInPlay and percentages are hidden */}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                <Button
                    onClick={handleSubmitPick}
                    disabled={!selectedTeamId || isLoadingPicks || isRoundInPlay}
                    className='mt-6'>
                    {isRoundInPlay ? 'Picks Locked' : currentPickForRound ? 'Update Pick' : 'Submit Pick'}
                </Button>
            </CardContent>
        </Card>
    );
}
