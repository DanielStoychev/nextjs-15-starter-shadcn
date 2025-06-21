'use client';

import { useState } from 'react';

import { Button } from '@/registry/new-york-v4/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/registry/new-york-v4/ui/dialog';
import { InfoCircledIcon } from '@radix-ui/react-icons';

interface GameRulesButtonProps {
    title: string;
    description: string;
    gameName?: string;
}

export function GameRulesButton({ title, description, gameName }: GameRulesButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant='ghost' size='icon' className='h-6 w-6'>
                    <InfoCircledIcon className='h-4 w-4' />
                    <span className='sr-only'>View game rules</span>
                </Button>
            </DialogTrigger>
            <DialogContent className='max-h-[80vh] overflow-y-auto sm:max-w-[600px]'>
                <DialogHeader>
                    <DialogTitle className='text-xl font-semibold'>{title}</DialogTitle>
                    <DialogDescription className='pt-4 text-base leading-relaxed whitespace-pre-wrap'>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                {/* Add some general rules if description seems short */}
                {description && description.length < 100 && (
                    <div className='mt-4 border-t border-gray-200 pt-4'>
                        <h4 className='mb-2 font-medium text-gray-900'>How to Play:</h4>
                        <ul className='space-y-1 text-sm text-gray-600'>
                            <li>• Join the game by paying the entry fee</li>
                            <li>• Make your predictions before the deadline</li>
                            <li>• Earn points based on prediction accuracy</li>
                            <li>• Win prizes based on your final ranking</li>
                        </ul>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
