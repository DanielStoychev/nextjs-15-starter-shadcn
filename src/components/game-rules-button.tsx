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
}

export function GameRulesButton({ title, description }: GameRulesButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant='ghost' size='icon' className='h-6 w-6'>
                    <InfoCircledIcon className='h-4 w-4' />
                    <span className='sr-only'>View game rules</span>
                </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[425px]'>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}
