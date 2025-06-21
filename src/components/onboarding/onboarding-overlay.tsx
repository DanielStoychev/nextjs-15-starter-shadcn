'use client';

import React, { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { useOnboarding } from './onboarding-provider';
import { ChevronLeft, ChevronRight, SkipForward, X } from 'lucide-react';

export function OnboardingOverlay() {
    const {
        currentFlow,
        currentStepIndex,
        isActive,
        getCurrentStep,
        nextStep,
        previousStep,
        skipStep,
        skipFlow,
        isFirstStep,
        isLastStep
    } = useOnboarding();

    const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);
    const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});

    const currentStep = getCurrentStep();

    // Update highlighted element and overlay position
    useEffect(() => {
        if (!isActive || !currentStep?.target) {
            setHighlightedElement(null);
            setOverlayStyle({});

            return;
        }

        const element = document.querySelector(currentStep.target);
        if (element) {
            setHighlightedElement(element);

            // Calculate position for overlay
            const rect = element.getBoundingClientRect();
            const style: React.CSSProperties = {};

            switch (currentStep.position) {
                case 'top':
                    style.top = rect.top - 10;
                    style.left = rect.left + rect.width / 2;
                    style.transform = 'translate(-50%, -100%)';
                    break;
                case 'bottom':
                    style.top = rect.bottom + 10;
                    style.left = rect.left + rect.width / 2;
                    style.transform = 'translateX(-50%)';
                    break;
                case 'left':
                    style.top = rect.top + rect.height / 2;
                    style.left = rect.left - 10;
                    style.transform = 'translate(-100%, -50%)';
                    break;
                case 'right':
                    style.top = rect.top + rect.height / 2;
                    style.left = rect.right + 10;
                    style.transform = 'translateY(-50%)';
                    break;
                default:
                    // Center of screen
                    style.top = '50%';
                    style.left = '50%';
                    style.transform = 'translate(-50%, -50%)';
            }

            setOverlayStyle(style);
        }
    }, [isActive, currentStep]);

    // Add highlight effect to targeted element
    useEffect(() => {
        if (highlightedElement) {
            highlightedElement.classList.add('onboarding-highlight');
            highlightedElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });
        }

        return () => {
            if (highlightedElement) {
                highlightedElement.classList.remove('onboarding-highlight');
            }
        };
    }, [highlightedElement]);

    if (!isActive || !currentStep || !currentFlow) {
        return null;
    }

    return (
        <>
            {/* Backdrop */}
            <div className='onboarding-backdrop fixed inset-0 z-[9998] bg-black/50' />

            {/* Tooltip/Step Card */}
            <div className='fixed z-[9999] max-w-sm' style={overlayStyle}>
                <Card className='border-2 border-blue-200 bg-white shadow-xl'>
                    <CardHeader className='pb-3'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                                <CardTitle className='text-lg'>{currentStep.title}</CardTitle>
                                <Badge variant='secondary' className='text-xs'>
                                    {currentStepIndex + 1} of {currentFlow.steps.length}
                                </Badge>
                            </div>
                            <Button variant='ghost' size='sm' onClick={skipFlow} className='h-8 w-8 p-0'>
                                <X className='h-4 w-4' />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className='pt-0'>
                        <p className='text-muted-foreground mb-4 text-sm'>{currentStep.description}</p>

                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                                {!isFirstStep() && (
                                    <Button variant='outline' size='sm' onClick={previousStep} className='h-8'>
                                        <ChevronLeft className='mr-1 h-4 w-4' />
                                        Back
                                    </Button>
                                )}

                                {currentStep.canSkip && (
                                    <Button
                                        variant='ghost'
                                        size='sm'
                                        onClick={skipStep}
                                        className='text-muted-foreground h-8'>
                                        <SkipForward className='mr-1 h-4 w-4' />
                                        Skip
                                    </Button>
                                )}
                            </div>

                            <Button onClick={nextStep} size='sm' className='h-8'>
                                {isLastStep() ? 'Finish' : 'Next'}
                                {!isLastStep() && <ChevronRight className='ml-1 h-4 w-4' />}
                            </Button>
                        </div>

                        {/* Progress indicator */}
                        <div className='mt-3 mb-1'>
                            <div className='text-muted-foreground mb-1 flex justify-between text-xs'>
                                <span>Progress</span>
                                <span>{Math.round(((currentStepIndex + 1) / currentFlow.steps.length) * 100)}%</span>
                            </div>
                            <div className='h-1 w-full rounded-full bg-gray-200'>
                                <div
                                    className='h-1 rounded-full bg-blue-600 transition-all duration-300'
                                    style={{ width: `${((currentStepIndex + 1) / currentFlow.steps.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className='fixed right-4 bottom-4 z-[9999]'>
                <Card className='bg-black/80 p-2 text-xs text-white'>
                    <div className='flex flex-col gap-1'>
                        <div>
                            <kbd className='rounded bg-white/20 px-1'>Esc</kbd> Skip tour
                        </div>
                        <div>
                            <kbd className='rounded bg-white/20 px-1'>←</kbd> Previous •{' '}
                            <kbd className='rounded bg-white/20 px-1'>→</kbd> Next
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
}

// Add global CSS for highlighting
export function OnboardingStyles() {
    return (
        <style jsx global>{`
            .onboarding-highlight {
                position: relative;
                z-index: 9999 !important;
                box-shadow:
                    0 0 0 4px rgba(59, 130, 246, 0.5),
                    0 0 0 8px rgba(59, 130, 246, 0.2) !important;
                border-radius: 8px !important;
                transition: all 0.3s ease !important;
            }

            .onboarding-backdrop {
                pointer-events: none;
            }

            .onboarding-highlight {
                pointer-events: auto;
            }
        `}</style>
    );
}
