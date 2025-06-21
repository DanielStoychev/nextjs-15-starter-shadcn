import { Alert, AlertDescription } from '@/registry/new-york-v4/ui/alert';
import { Button } from '@/registry/new-york-v4/ui/button';

import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
    message: string;
    retry?: () => void;
    className?: string;
}

export default function ErrorMessage({ message, retry, className }: ErrorMessageProps) {
    return (
        <Alert variant='destructive' className={className}>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription className='flex items-center justify-between'>
                <span>{message}</span>
                {retry && (
                    <Button variant='outline' size='sm' onClick={retry} className='ml-2'>
                        <RefreshCw className='mr-1 h-3 w-3' />
                        Retry
                    </Button>
                )}
            </AlertDescription>
        </Alert>
    );
}
