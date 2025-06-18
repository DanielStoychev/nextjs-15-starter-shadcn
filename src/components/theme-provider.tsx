'use client';

import * as React from 'react';

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

// Removed incorrect import: import type { ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    return (
        <NextThemesProvider
            {...props}
            forcedTheme='dark' // Enforce dark theme
            enableSystem={false} // Disable system preference
            storageKey='ui-theme-dark-only' // Change storage key to avoid conflicts if old one exists
        >
            {children}
        </NextThemesProvider>
    );
}
