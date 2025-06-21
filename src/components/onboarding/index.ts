// Onboarding system exports
export { OnboardingProvider, useOnboarding, ONBOARDING_FLOWS } from './onboarding-provider';
export { OnboardingOverlay, OnboardingStyles } from './onboarding-overlay';
export { GettingStartedGuide, GettingStartedQuickAccess } from './getting-started-guide';
export { HelpTooltip, HelpTooltips } from './help-tooltip';
export { OnboardingTrigger, OnboardingTriggers, OnboardingStatus } from './onboarding-trigger';

// Keyboard shortcuts for onboarding
export const ONBOARDING_SHORTCUTS = {
    SKIP_FLOW: 'Escape',
    NEXT_STEP: 'ArrowRight',
    PREVIOUS_STEP: 'ArrowLeft',
    CLOSE_TOOLTIP: 'Escape'
};

// Utility functions
export const onboardingUtils = {
    /**
     * Add data attributes to elements for onboarding targeting
     */
    addDataAttributes: (element: HTMLElement, id: string) => {
        element.setAttribute('data-onboarding', id);
    },
    /**
     * Check if user is new (registered within last 7 days)
     */
    isNewUser: (registrationDate: Date) => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        return registrationDate > weekAgo;
    },

    /**
     * Get onboarding completion percentage
     */
    getCompletionPercentage: (completedFlows: string[], totalFlows: number) => {
        return Math.round((completedFlows.length / totalFlows) * 100);
    }
};
