import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon?: ReactNode;
    title?: string;
    message: string;
    action?: ReactNode;
    className?: string;
}

export default function EmptyState({ icon, title, message, action, className }: EmptyStateProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center px-4 py-12 text-center', className)}>
            {icon && <div className='mb-4 text-gray-400'>{icon}</div>}
            {title && <h3 className='mb-2 text-lg font-semibold text-gray-900'>{title}</h3>}
            <p className='mb-4 max-w-md text-gray-600'>{message}</p>
            {action}
        </div>
    );
}
