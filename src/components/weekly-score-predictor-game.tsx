'use client';

import React, { useEffect, useState } from 'react';

import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';
import { Input } from '@/registry/new-york-v4/ui/input';
import { Label } from '@/registry/new-york-v4/ui/label';

import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface Fixture {
    id: string;
    homeTeam: { id: string; name: string; logoPath: string };
    awayTeam: { id: string; name: string; logoPath: string };
    matchDate: string;
}

interface Prediction {
    fixtureId: string;
    predictedHomeScore: number | '';
    predictedAwayScore: number | '';
}

interface WeeklyScorePredictorGameProps {
    gameInstanceId: string;
    initialFixtures: Fixture[];
}

const WeeklyScorePredictorGame: React.FC<WeeklyScorePredictorGameProps> = ({ gameInstanceId, initialFixtures }) => {
    const { data: session } = useSession();
    const [predictions, setPredictions] = useState<Prediction[]>(
        initialFixtures.map((fixture) => ({
            fixtureId: fixture.id,
            predictedHomeScore: '',
            predictedAwayScore: ''
        }))
    );
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formattedMatchDates, setFormattedMatchDates] = useState<Record<string, string>>({});

    useEffect(() => {
        // Format match dates on the client side to avoid hydration mismatch
        const dates: Record<string, string> = {};
        initialFixtures.forEach((fixture) => {
            dates[fixture.id] = new Date(fixture.matchDate).toLocaleString();
        });
        setFormattedMatchDates(dates);
    }, [initialFixtures]);

    // useEffect for fetching existing predictions (currently a placeholder)
    useEffect(() => {
        // In a real scenario, you'd fetch existing predictions here
        // For now, simulate it
    }, [gameInstanceId]);

    const handleScoreChange = (fixtureId: string, type: 'home' | 'away', value: string) => {
        setPredictions((prevPredictions) =>
            prevPredictions.map((pred) =>
                pred.fixtureId === fixtureId
                    ? {
                          ...pred,
                          [type === 'home' ? 'predictedHomeScore' : 'predictedAwayScore']:
                              value === '' ? '' : Number(value)
                      }
                    : pred
            )
        );
    };

    const handleSubmit = async () => {
        if (!session?.user?.id) {
            toast.error('You must be logged in to submit predictions.');

            return;
        }

        const incompletePredictions = predictions.some(
            (pred) => pred.predictedHomeScore === '' || pred.predictedAwayScore === ''
        );

        if (incompletePredictions) {
            toast.error('Please enter predictions for all matches before submitting.');

            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/games/weekly-score-predictor/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gameInstanceId,
                    predictions: predictions.map((pred) => ({
                        fixtureId: pred.fixtureId,
                        predictedHomeScore: Number(pred.predictedHomeScore),
                        predictedAwayScore: Number(pred.predictedAwayScore)
                    }))
                })
            });

            if (response.ok) {
                toast.success('Predictions submitted successfully!');
                setHasSubmitted(true);
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to submit predictions.');
            }
        } catch (error) {
            console.error('Error submitting predictions:', error);
            toast.error('An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className='mx-auto my-8 w-full max-w-2xl'>
            <CardHeader className='text-center'>
                <CardTitle className='text-2xl font-bold'>Weekly Score Predictor</CardTitle>
                <p className='text-muted-foreground'>Predict the scores for this week's selected matches.</p>
            </CardHeader>
            <CardContent>
                {hasSubmitted ? (
                    <div className='p-4 text-center'>
                        <h3 className='mb-2 text-xl font-semibold'>Predictions Submitted!</h3>
                        <p className='text-muted-foreground'>
                            You have already submitted your predictions for this week.
                        </p>
                        <p className='text-muted-foreground mt-2'>
                            Come back after the matches to see your score on the leaderboard!
                        </p>
                    </div>
                ) : (
                    <>
                        <div className='mb-6'>
                            <h4 className='mb-4 text-center text-lg font-semibold'>Matches for This Week</h4>
                            <div className='space-y-4'>
                                {initialFixtures.map((fixture) => {
                                    const currentPrediction = predictions.find((p) => p.fixtureId === fixture.id);

                                    return (
                                        <div key={fixture.id} className='bg-card rounded-md border p-4 shadow-sm'>
                                            <div className='mb-2 flex items-center justify-between'>
                                                <div className='flex items-center'>
                                                    {fixture.homeTeam.logoPath && (
                                                        <img
                                                            src={fixture.homeTeam.logoPath}
                                                            alt={fixture.homeTeam.name}
                                                            className='mr-2 h-6 w-6'
                                                        />
                                                    )}
                                                    <span className='font-semibold'>{fixture.homeTeam.name}</span>
                                                </div>
                                                <span className='text-lg font-bold'>vs</span>
                                                <div className='flex items-center'>
                                                    <span className='mr-2 font-semibold'>{fixture.awayTeam.name}</span>
                                                    {fixture.awayTeam.logoPath && (
                                                        <img
                                                            src={fixture.awayTeam.logoPath}
                                                            alt={fixture.awayTeam.name}
                                                            className='h-6 w-6'
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <p className='text-muted-foreground mb-4 text-center text-sm'>
                                                Kick-off:{' '}
                                                {formattedMatchDates[fixture.id] ||
                                                    new Date(fixture.matchDate).toISOString()}
                                            </p>
                                            <div className='flex items-center justify-center space-x-4'>
                                                <div className='flex flex-col items-center'>
                                                    <Label htmlFor={`home-score-${fixture.id}`} className='mb-1'>
                                                        Home Score
                                                    </Label>
                                                    <Input
                                                        id={`home-score-${fixture.id}`}
                                                        type='number'
                                                        min='0'
                                                        value={currentPrediction?.predictedHomeScore}
                                                        onChange={(e) =>
                                                            handleScoreChange(fixture.id, 'home', e.target.value)
                                                        }
                                                        className='w-20 text-center'
                                                    />
                                                </div>
                                                <span className='text-xl font-bold'>-</span>
                                                <div className='flex flex-col items-center'>
                                                    <Label htmlFor={`away-score-${fixture.id}`} className='mb-1'>
                                                        Away Score
                                                    </Label>
                                                    <Input
                                                        id={`away-score-${fixture.id}`}
                                                        type='number'
                                                        min='0'
                                                        value={currentPrediction?.predictedAwayScore}
                                                        onChange={(e) =>
                                                            handleScoreChange(fixture.id, 'away', e.target.value)
                                                        }
                                                        className='w-20 text-center'
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className='text-center'>
                            <Button onClick={handleSubmit} disabled={isLoading} className='w-full max-w-xs'>
                                {isLoading ? 'Submitting...' : 'Submit Predictions'}
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default WeeklyScorePredictorGame;
