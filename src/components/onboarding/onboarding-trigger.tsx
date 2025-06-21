'use client';

import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useOnboarding } from './onboarding-provider';
import { BookOpen, CheckCircle, Play } from 'lucide-react';

interface OnboardingTriggerProps {
    flowId: string;
    variant?: 'button' | 'badge' | 'link';
    size?: 'sm' | 'lg' | 'default';
    className?: string;
    children?: React.ReactNode;
}

export function OnboardingTrigger({
    flowId,
    variant = 'button',
    size = 'default',
    className = '',
    children
}: OnboardingTriggerProps) {
    const { startFlow, isFlowCompleted } = useOnboarding();
    const completed = isFlowCompleted(flowId);

    const handleStart = () => {
        startFlow(flowId);
    };

    const getFlowName = (id: string) => {
        switch (id) {
            case 'new-user-welcome':
                return 'Platform Tour';
            case 'first-game-entry':
                return 'First Game Guide';
            case 'admin-dashboard':
                return 'Admin Tour';
            default:
                return 'Guide';
        }
    };

    if (variant === 'badge') {
        return (
            <Badge
                variant={completed ? 'secondary' : 'default'}
                className={`cursor-pointer ${className}`}
                onClick={handleStart}>
                {completed ? (
                    <>
                        <CheckCircle className='mr-1 h-3 w-3' />
                        {getFlowName(flowId)} Complete
                    </>
                ) : (
                    <>
                        <Play className='mr-1 h-3 w-3' />
                        Start {getFlowName(flowId)}
                    </>
                )}
            </Badge>
        );
    }

    if (variant === 'link') {
        return (
            <button
                onClick={handleStart}
                className={`text-sm text-blue-600 underline hover:text-blue-800 ${className}`}>
                {children || (completed ? `Replay ${getFlowName(flowId)}` : `Start ${getFlowName(flowId)}`)}
            </button>
        );
    }

    return (
        <Button
            onClick={handleStart}
            variant={completed ? 'outline' : 'default'}
            size={size}
            className={`gap-2 ${className}`}
            disabled={completed}>
            {completed ? (
                <>
                    <CheckCircle className='h-4 w-4' />
                    {children || `${getFlowName(flowId)} Complete`}
                </>
            ) : (
                <>
                    <BookOpen className='h-4 w-4' />
                    {children || `Start ${getFlowName(flowId)}`}
                </>
            )}
        </Button>
    );
}

// Pre-built triggers for common flows
export const OnboardingTriggers = {
    WelcomeTour: (props: Omit<OnboardingTriggerProps, 'flowId'>) => (
        <OnboardingTrigger flowId='new-user-welcome' {...props} />
    ),

    FirstGameGuide: (props: Omit<OnboardingTriggerProps, 'flowId'>) => (
        <OnboardingTrigger flowId='first-game-entry' {...props} />
    ),

    AdminTour: (props: Omit<OnboardingTriggerProps, 'flowId'>) => (
        <OnboardingTrigger flowId='admin-dashboard' {...props} />
    )
};

// Onboarding status indicator for dashboard
export function OnboardingStatus() {
    const { getCompletedFlows } = useOnboarding();
    const completedFlows = getCompletedFlows();

    const totalFlows = 3; // Update this when adding more flows
    const completionRate = (completedFlows.length / totalFlows) * 100;

    if (completionRate === 100) {
        return (
            <div className='flex items-center gap-2 text-sm text-green-600'>
                <CheckCircle className='h-4 w-4' />
                All guides completed
            </div>
        );
    }

    return (
        <div className='flex items-center gap-2 text-sm text-blue-600'>
            <BookOpen className='h-4 w-4' />
            {completedFlows.length} of {totalFlows} guides completed
        </div>
    );
}
