'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

import { Button } from '@/registry/new-york-v4/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/registry/new-york-v4/ui/card';

import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error boundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <Card className='mx-auto my-8 max-w-lg'>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2 text-red-600'>
                            <AlertTriangle className='h-5 w-5' />
                            Something went wrong
                        </CardTitle>
                        <CardDescription>An unexpected error occurred. Please try refreshing the page.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className='mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800'>
                                <strong>Error:</strong> {this.state.error.message}
                            </div>
                        )}
                        <div className='flex gap-2'>
                            <Button
                                onClick={() => this.setState({ hasError: false, error: undefined })}
                                className='flex items-center gap-2'>
                                <RefreshCw className='h-4 w-4' />
                                Try Again
                            </Button>
                            <Button variant='outline' onClick={() => window.location.reload()}>
                                Refresh Page
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return this.props.children;
    }
}
