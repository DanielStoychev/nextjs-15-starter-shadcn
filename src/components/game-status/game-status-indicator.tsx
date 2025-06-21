'use client';

import React, { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { AlertTriangle, Calendar, CheckCircle, Clock, Play, Timer, Trophy, XCircle } from 'lucide-react';

export interface GameStatus {
    id: string;
    status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
    startDate?: Date;
    endDate?: Date;
    entryDeadline?: Date;
    name: string;
}

interface GameStatusIndicatorProps {
    gameStatus: GameStatus;
    showCountdown?: boolean;
    showNotifications?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'badge' | 'card' | 'inline';
}

interface TimeRemaining {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
}

function calculateTimeRemaining(targetDate: Date): TimeRemaining {
    const now = new Date().getTime();
    const target = targetDate.getTime();
    const difference = target - now;

    if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isExpired: false };
}

function formatTimeRemaining(timeRemaining: TimeRemaining): string {
    if (timeRemaining.isExpired) return 'Expired';

    const { days, hours, minutes, seconds } = timeRemaining;

    if (days > 0) {
        return `${days}d ${hours}h`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

function getStatusConfig(status: GameStatus['status']) {
    switch (status) {
        case 'PENDING':
            return {
                icon: Clock,
                color: 'bg-yellow-500',
                badgeVariant: 'secondary' as const,
                text: 'Pending',
                description: 'Waiting to start'
            };
        case 'ACTIVE':
            return {
                icon: Play,
                color: 'bg-green-500',
                badgeVariant: 'default' as const,
                text: 'Active',
                description: 'Currently running'
            };
        case 'COMPLETED':
            return {
                icon: CheckCircle,
                color: 'bg-blue-500',
                badgeVariant: 'secondary' as const,
                text: 'Completed',
                description: 'Finished'
            };
        case 'CANCELLED':
            return {
                icon: XCircle,
                color: 'bg-red-500',
                badgeVariant: 'destructive' as const,
                text: 'Cancelled',
                description: 'Cancelled'
            };
        case 'ARCHIVED':
            return {
                icon: Trophy,
                color: 'bg-gray-500',
                badgeVariant: 'outline' as const,
                text: 'Archived',
                description: 'Archived'
            };
        default:
            return {
                icon: Clock,
                color: 'bg-gray-500',
                badgeVariant: 'outline' as const,
                text: 'Unknown',
                description: 'Unknown status'
            };
    }
}

export function GameStatusIndicator({
    gameStatus,
    showCountdown = true,
    showNotifications = true,
    size = 'md',
    variant = 'badge'
}: GameStatusIndicatorProps) {
    const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const statusConfig = getStatusConfig(gameStatus.status);
    const StatusIcon = statusConfig.icon;

    // Determine which date to countdown to
    const getCountdownTarget = (): Date | null => {
        const now = new Date();

        if (gameStatus.entryDeadline && gameStatus.entryDeadline > now) {
            return gameStatus.entryDeadline;
        }

        if (gameStatus.startDate && gameStatus.startDate > now) {
            return gameStatus.startDate;
        }

        if (gameStatus.endDate && gameStatus.endDate > now) {
            return gameStatus.endDate;
        }

        return null;
    };

    // Update countdown every second
    useEffect(() => {
        if (!showCountdown) return;

        const target = getCountdownTarget();
        if (!target) return;

        const updateCountdown = () => {
            setTimeRemaining(calculateTimeRemaining(target));
            setCurrentTime(new Date());
        };

        updateCountdown(); // Initial calculation
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [showCountdown, gameStatus]);

    // Render badge variant
    if (variant === 'badge') {
        return (
            <div className='flex items-center gap-2'>
                <Badge variant={statusConfig.badgeVariant} className='flex items-center gap-1'>
                    <StatusIcon className={`h-3 w-3`} />
                    {statusConfig.text}
                </Badge>

                {showCountdown && timeRemaining && !timeRemaining.isExpired && (
                    <Badge variant='outline' className='flex items-center gap-1'>
                        <Timer className='h-3 w-3' />
                        {formatTimeRemaining(timeRemaining)}
                    </Badge>
                )}
            </div>
        );
    }

    // Render card variant
    if (variant === 'card') {
        return (
            <Card className='w-full'>
                <CardContent className='p-4'>
                    <div className='mb-3 flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                            <div className={`rounded-full p-2 ${statusConfig.color}`}>
                                <StatusIcon className='h-4 w-4 text-white' />
                            </div>
                            <div>
                                <h4 className='font-semibold'>{gameStatus.name}</h4>
                                <p className='text-muted-foreground text-sm'>{statusConfig.description}</p>
                            </div>
                        </div>
                        <Badge variant={statusConfig.badgeVariant}>{statusConfig.text}</Badge>
                    </div>

                    {showCountdown && timeRemaining && !timeRemaining.isExpired && (
                        <div className='space-y-2'>
                            <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                                <Clock className='h-4 w-4' />
                                <span>Time remaining: {formatTimeRemaining(timeRemaining)}</span>
                            </div>

                            {/* Detailed countdown */}
                            <div className='grid grid-cols-4 gap-2 text-center'>
                                <div className='bg-muted rounded p-2'>
                                    <div className='text-lg font-bold'>{timeRemaining.days}</div>
                                    <div className='text-muted-foreground text-xs'>Days</div>
                                </div>
                                <div className='bg-muted rounded p-2'>
                                    <div className='text-lg font-bold'>{timeRemaining.hours}</div>
                                    <div className='text-muted-foreground text-xs'>Hours</div>
                                </div>
                                <div className='bg-muted rounded p-2'>
                                    <div className='text-lg font-bold'>{timeRemaining.minutes}</div>
                                    <div className='text-muted-foreground text-xs'>Minutes</div>
                                </div>
                                <div className='bg-muted rounded p-2'>
                                    <div className='text-lg font-bold'>{timeRemaining.seconds}</div>
                                    <div className='text-muted-foreground text-xs'>Seconds</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status messages */}
                    {gameStatus.status === 'PENDING' && gameStatus.startDate && (
                        <div className='mt-2 flex items-center gap-2 rounded bg-yellow-50 p-2'>
                            <Calendar className='h-4 w-4 text-yellow-600' />
                            <span className='text-sm text-yellow-700'>
                                Starts: {gameStatus.startDate.toLocaleString()}
                            </span>
                        </div>
                    )}

                    {gameStatus.status === 'ACTIVE' && gameStatus.endDate && (
                        <div className='mt-2 flex items-center gap-2 rounded bg-green-50 p-2'>
                            <AlertTriangle className='h-4 w-4 text-green-600' />
                            <span className='text-sm text-green-700'>Ends: {gameStatus.endDate.toLocaleString()}</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Render inline variant
    return (
        <div className='flex items-center gap-2'>
            <StatusIcon className={`h-4 w-4 ${statusConfig.color.replace('bg-', 'text-')}`} />
            <span className='text-sm font-medium'>{statusConfig.text}</span>

            {showCountdown && timeRemaining && !timeRemaining.isExpired && (
                <span className='text-muted-foreground text-sm'>({formatTimeRemaining(timeRemaining)})</span>
            )}
        </div>
    );
}

// Notification component for status changes
export function GameStatusNotification({ gameStatus, onDismiss }: { gameStatus: GameStatus; onDismiss: () => void }) {
    const statusConfig = getStatusConfig(gameStatus.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div
            className={`rounded-lg border-l-4 p-4 ${statusConfig.color.replace('bg-', 'border-')} bg-background shadow-md`}>
            <div className='flex items-start gap-3'>
                <StatusIcon className={`mt-0.5 h-5 w-5 ${statusConfig.color.replace('bg-', 'text-')}`} />
                <div className='flex-1'>
                    <h4 className='font-semibold'>{gameStatus.name}</h4>
                    <p className='text-muted-foreground text-sm'>Status changed to {statusConfig.text.toLowerCase()}</p>
                    <p className='text-muted-foreground mt-1 text-xs'>{new Date().toLocaleString()}</p>
                </div>
                <button onClick={onDismiss} className='text-muted-foreground hover:text-foreground'>
                    <XCircle className='h-4 w-4' />
                </button>
            </div>
        </div>
    );
}

// Batch status indicator for multiple games
export function GameStatusBatch({ gameStatuses }: { gameStatuses: GameStatus[] }) {
    const statusCounts = gameStatuses.reduce(
        (acc, game) => {
            acc[game.status] = (acc[game.status] || 0) + 1;

            return acc;
        },
        {} as Record<string, number>
    );

    return (
        <div className='flex flex-wrap gap-2'>
            {Object.entries(statusCounts).map(([status, count]) => {
                const config = getStatusConfig(status as GameStatus['status']);
                const StatusIcon = config.icon;

                return (
                    <Badge key={status} variant={config.badgeVariant} className='flex items-center gap-1'>
                        <StatusIcon className='h-3 w-3' />
                        {config.text} ({count})
                    </Badge>
                );
            })}
        </div>
    );
}
