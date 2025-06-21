'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';

type OnboardingStep = {
    id: string;
    title: string;
    description: string;
    target?: string; // CSS selector for the target element
    position?: 'top' | 'bottom' | 'left' | 'right';
    action?: () => void;
    canSkip?: boolean;
};

type OnboardingFlow = {
    id: string;
    name: string;
    steps: OnboardingStep[];
    autoStart?: boolean;
};

type OnboardingContextType = {
    // Current state
    currentFlow: OnboardingFlow | null;
    currentStepIndex: number;
    isActive: boolean;

    // Flow management
    startFlow: (flowId: string) => void;
    stopFlow: () => void;
    nextStep: () => void;
    previousStep: () => void;
    skipStep: () => void;
    skipFlow: () => void;

    // Step management
    getCurrentStep: () => OnboardingStep | null;
    isFirstStep: () => boolean;
    isLastStep: () => boolean;

    // Completion tracking
    markFlowCompleted: (flowId: string) => void;
    isFlowCompleted: (flowId: string) => boolean;
    getCompletedFlows: () => string[];

    // Tooltip management
    showTooltip: (stepId: string, content: string, target: string) => void;
    hideTooltip: () => void;
    tooltipData: { stepId: string; content: string; target: string } | null;
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

// Define onboarding flows
const ONBOARDING_FLOWS: OnboardingFlow[] = [
    {
        id: 'new-user-welcome',
        name: 'Welcome to FootyGames',
        autoStart: true,
        steps: [
            {
                id: 'welcome',
                title: 'Welcome to FootyGames! ⚽',
                description: "Let's take a quick tour to get you started with our football prediction games.",
                canSkip: true
            },
            {
                id: 'dashboard-overview',
                title: 'Your Dashboard',
                description:
                    'This is your personal dashboard where you can see your stats, recent activity, and game recommendations.',
                target: '[data-onboarding="dashboard"]',
                position: 'bottom'
            },
            {
                id: 'navigation',
                title: 'Navigation',
                description: 'Use the navigation to explore games, view leaderboards, and access your profile.',
                target: '[data-onboarding="navigation"]',
                position: 'bottom'
            },
            {
                id: 'games-section',
                title: 'Browse Games',
                description: 'Explore available prediction games and join the ones that interest you.',
                target: '[data-onboarding="games-link"]',
                position: 'bottom'
            },
            {
                id: 'notifications',
                title: 'Stay Updated',
                description: 'Check your notifications for game updates, results, and winnings.',
                target: '[data-onboarding="notifications"]',
                position: 'left'
            },
            {
                id: 'complete',
                title: "You're All Set! 🎉",
                description: "You're ready to start playing! Browse the games and make your first prediction.",
                canSkip: false
            }
        ]
    },
    {
        id: 'first-game-entry',
        name: 'Your First Game',
        steps: [
            {
                id: 'game-types',
                title: 'Game Types',
                description:
                    'We offer different types of prediction games. Each has its own rules and prize structure.',
                target: '[data-onboarding="game-filters"]',
                position: 'bottom'
            },
            {
                id: 'game-card',
                title: 'Game Information',
                description: 'Each game card shows the entry fee, prize pool, deadline, and number of participants.',
                target: '[data-onboarding="game-card"]:first-child',
                position: 'top'
            },
            {
                id: 'payment-process',
                title: 'Joining a Game',
                description:
                    'Click "Pay & Play" to join a game. You\'ll be redirected to our secure payment processor.',
                target: '[data-onboarding="pay-button"]',
                position: 'top'
            },
            {
                id: 'game-rules',
                title: 'Game Rules',
                description: 'Make sure to read the game rules and understand how winners are determined.',
                target: '[data-onboarding="game-details"]',
                position: 'right'
            }
        ]
    },
    {
        id: 'admin-dashboard',
        name: 'Admin Dashboard Tour',
        steps: [
            {
                id: 'admin-overview',
                title: 'Admin Dashboard',
                description: 'Welcome to the admin dashboard where you can manage users, games, and system operations.',
                target: '[data-onboarding="admin-stats"]',
                position: 'bottom'
            },
            {
                id: 'user-management',
                title: 'User Management',
                description: 'Monitor user activity, manage roles, and handle user-related operations.',
                target: '[data-onboarding="user-management"]',
                position: 'right'
            },
            {
                id: 'game-management',
                title: 'Game Management',
                description: 'Create, edit, and manage game instances. Control game status and batch operations.',
                target: '[data-onboarding="game-management"]',
                position: 'right'
            },
            {
                id: 'results-processing',
                title: 'Results Management',
                description: 'Process game results, handle manual overrides, and view audit logs.',
                target: '[data-onboarding="results-management"]',
                position: 'right'
            },
            {
                id: 'job-scheduler',
                title: 'Job Management',
                description: 'Monitor and control automated jobs like fixture updates and result processing.',
                target: '[data-onboarding="job-management"]',
                position: 'right'
            }
        ]
    }
];

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const [currentFlow, setCurrentFlow] = useState<OnboardingFlow | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [completedFlows, setCompletedFlows] = useState<string[]>([]);
    const [tooltipData, setTooltipData] = useState<{ stepId: string; content: string; target: string } | null>(null);

    // Load completed flows from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('onboarding-completed-flows');
        if (stored) {
            try {
                setCompletedFlows(JSON.parse(stored));
            } catch (error) {
                console.error('Failed to parse completed flows:', error);
            }
        }
    }, []);

    // Auto-start onboarding for new users
    useEffect(() => {
        if (session?.user && !isFlowCompleted('new-user-welcome')) {
            // Delay to ensure page is loaded
            const timer = setTimeout(() => {
                const welcomeFlow = ONBOARDING_FLOWS.find((flow) => flow.id === 'new-user-welcome');
                if (welcomeFlow && welcomeFlow.autoStart) {
                    startFlow('new-user-welcome');
                }
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [session]);

    const startFlow = (flowId: string) => {
        const flow = ONBOARDING_FLOWS.find((f) => f.id === flowId);
        if (!flow) return;

        setCurrentFlow(flow);
        setCurrentStepIndex(0);
        setIsActive(true);
    };

    const stopFlow = () => {
        setCurrentFlow(null);
        setCurrentStepIndex(0);
        setIsActive(false);
        setTooltipData(null);
    };

    const nextStep = () => {
        if (!currentFlow || currentStepIndex >= currentFlow.steps.length - 1) {
            // End of flow
            if (currentFlow) {
                markFlowCompleted(currentFlow.id);
            }
            stopFlow();

            return;
        }

        setCurrentStepIndex((prev) => prev + 1);
    };

    const previousStep = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex((prev) => prev - 1);
        }
    };

    const skipStep = () => {
        nextStep();
    };

    const skipFlow = () => {
        if (currentFlow) {
            markFlowCompleted(currentFlow.id);
        }
        stopFlow();
    };
    const getCurrentStep = (): OnboardingStep | null => {
        if (!currentFlow || !isActive) return null;

        return currentFlow.steps[currentStepIndex] || null;
    };

    const isFirstStep = (): boolean => {
        return currentStepIndex === 0;
    };
    const isLastStep = (): boolean => {
        if (!currentFlow) return false;

        return currentStepIndex === currentFlow.steps.length - 1;
    };

    const markFlowCompleted = (flowId: string) => {
        const newCompleted = [...completedFlows];
        if (!newCompleted.includes(flowId)) {
            newCompleted.push(flowId);
            setCompletedFlows(newCompleted);
            localStorage.setItem('onboarding-completed-flows', JSON.stringify(newCompleted));
        }
    };

    const isFlowCompleted = (flowId: string): boolean => {
        return completedFlows.includes(flowId);
    };

    const getCompletedFlows = (): string[] => {
        return [...completedFlows];
    };

    const showTooltip = (stepId: string, content: string, target: string) => {
        setTooltipData({ stepId, content, target });
    };

    const hideTooltip = () => {
        setTooltipData(null);
    };

    const contextValue: OnboardingContextType = {
        currentFlow,
        currentStepIndex,
        isActive,
        startFlow,
        stopFlow,
        nextStep,
        previousStep,
        skipStep,
        skipFlow,
        getCurrentStep,
        isFirstStep,
        isLastStep,
        markFlowCompleted,
        isFlowCompleted,
        getCompletedFlows,
        showTooltip,
        hideTooltip,
        tooltipData
    };

    return <OnboardingContext.Provider value={contextValue}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }

    return context;
}

// Export flows for external access
export { ONBOARDING_FLOWS };
