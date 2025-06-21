'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { HelpCircle, X } from 'lucide-react';

interface HelpTooltipProps {
    content: string;
    title?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    trigger?: 'hover' | 'click';
    className?: string;
    children?: React.ReactNode;
}

export function HelpTooltip({
    content,
    title,
    position = 'top',
    trigger = 'hover',
    className,
    children
}: HelpTooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const calculatePosition = () => {
        if (!triggerRef.current || !tooltipRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        let top = 0;
        let left = 0;

        switch (position) {
            case 'top':
                top = triggerRect.top - tooltipRect.height - 8;
                left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
                break;
            case 'bottom':
                top = triggerRect.bottom + 8;
                left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
                break;
            case 'left':
                top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
                left = triggerRect.left - tooltipRect.width - 8;
                break;
            case 'right':
                top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
                left = triggerRect.right + 8;
                break;
        }

        // Adjust for viewport boundaries
        if (left < 8) left = 8;
        if (left + tooltipRect.width > viewport.width - 8) {
            left = viewport.width - tooltipRect.width - 8;
        }
        if (top < 8) top = 8;
        if (top + tooltipRect.height > viewport.height - 8) {
            top = viewport.height - tooltipRect.height - 8;
        }

        setTooltipPosition({ top, left });
    };

    useEffect(() => {
        if (isVisible) {
            calculatePosition();
            window.addEventListener('scroll', calculatePosition);
            window.addEventListener('resize', calculatePosition);

            return () => {
                window.removeEventListener('scroll', calculatePosition);
                window.removeEventListener('resize', calculatePosition);
            };
        }
    }, [isVisible]);

    const handleMouseEnter = () => {
        if (trigger === 'hover') {
            setIsVisible(true);
        }
    };

    const handleMouseLeave = () => {
        if (trigger === 'hover') {
            setIsVisible(false);
        }
    };

    const handleClick = () => {
        if (trigger === 'click') {
            setIsVisible(!isVisible);
        }
    };

    return (
        <>
            <div
                ref={triggerRef}
                className={`inline-flex items-center gap-1 ${className || ''}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}>
                {children || (
                    <Button
                        variant='ghost'
                        size='sm'
                        className='text-muted-foreground hover:text-foreground h-5 w-5 p-0'>
                        <HelpCircle className='h-4 w-4' />
                    </Button>
                )}
            </div>

            {isVisible && (
                <>
                    {/* Backdrop for click-to-close */}
                    {trigger === 'click' && (
                        <div className='fixed inset-0 z-[100]' onClick={() => setIsVisible(false)} />
                    )}

                    {/* Tooltip */}
                    <div
                        ref={tooltipRef}
                        className='fixed z-[101] max-w-xs'
                        style={{
                            top: tooltipPosition.top,
                            left: tooltipPosition.left
                        }}>
                        <Card className='border-2 border-blue-200 bg-white shadow-lg'>
                            <CardContent className='p-3'>
                                <div className='flex items-start justify-between gap-2'>
                                    <div className='flex-1'>
                                        {title && <h4 className='mb-1 text-sm font-semibold'>{title}</h4>}
                                        <p className='text-muted-foreground text-sm'>{content}</p>
                                    </div>

                                    {trigger === 'click' && (
                                        <Button
                                            variant='ghost'
                                            size='sm'
                                            onClick={() => setIsVisible(false)}
                                            className='h-4 w-4 flex-shrink-0 p-0'>
                                            <X className='h-3 w-3' />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Arrow */}
                        <div
                            className={`absolute h-2 w-2 rotate-45 border bg-white ${
                                position === 'top'
                                    ? 'top-full left-1/2 -translate-x-1/2 -translate-y-1/2 border-r-0 border-b-0'
                                    : position === 'bottom'
                                      ? 'bottom-full left-1/2 -translate-x-1/2 translate-y-1/2 border-t-0 border-l-0'
                                      : position === 'left'
                                        ? 'top-1/2 left-full -translate-x-1/2 -translate-y-1/2 border-t-0 border-r-0'
                                        : 'top-1/2 right-full translate-x-1/2 -translate-y-1/2 border-b-0 border-l-0'
                            }`}
                        />
                    </div>
                </>
            )}
        </>
    );
}

// Quick help tooltips for common UI elements
export const HelpTooltips = {
    GameEntry: () => (
        <HelpTooltip
            title='Joining Games'
            content="Click 'Pay & Play' to join a game. You'll be redirected to secure payment processing and can start making predictions once payment is confirmed."
            position='top'
            trigger='click'
        />
    ),

    GameDeadline: () => (
        <HelpTooltip
            title='Entry Deadline'
            content='This is when entries close for the game. Make sure to join before this time to participate.'
            position='top'
        />
    ),

    PrizePool: () => (
        <HelpTooltip
            title='Prize Pool'
            content='Total winnings available for this game (80% of all entry fees). Winners share the prize pool based on their performance and game rules.'
            position='top'
        />
    ),

    LeaderboardRanking: () => (
        <HelpTooltip
            title='Your Ranking'
            content='Your current position among all players. Rankings are updated in real-time based on your game performance.'
            position='right'
        />
    ),

    GameStatus: () => (
        <HelpTooltip
            title='Game Status'
            content='Shows whether the game is open for entries, in progress, or completed. Only active games accept new entries.'
            position='bottom'
        />
    ),

    NotificationSettings: () => (
        <HelpTooltip
            title='Notification Preferences'
            content='Control what notifications you receive. You can enable/disable alerts for game starts, results, winnings, and deadlines.'
            position='left'
            trigger='click'
        />
    )
};
