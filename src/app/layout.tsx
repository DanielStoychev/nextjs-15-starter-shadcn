import type { ReactNode } from 'react';

import type { Metadata } from 'next';
import localFont from 'next/font/local';

// Import AppFooter
import '@/app/globals.css';
// Import AppHeader
import { AppFooter } from '@/components/app-footer';
import AppHeader from '@/components/app-header';
// Changed to local ThemeProvider

import { AuthProvider } from '@/components/auth-provider';
import ErrorBoundary from '@/components/error-boundary';
import { OnboardingOverlay, OnboardingProvider, OnboardingStyles } from '@/components/onboarding';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/registry/new-york-v4/ui/sonner';

const geistSans = localFont({
    src: './fonts/GeistVF.woff',
    variable: '--font-geist-sans',
    weight: '100 900'
});
const geistMono = localFont({
    src: './fonts/GeistMonoVF.woff',
    variable: '--font-geist-mono',
    weight: '100 900'
});

export const metadata: Metadata = {
    title: {
        default: 'FootyGames.co.uk - Premier League Mini-Competitions',
        template: '%s | FootyGames.co.uk'
    },
    description:
        'Your ultimate destination for Premier League mini-competitions. Pay a small entry fee, compete, and win big cash prizes!',
    keywords: [
        'football',
        'premier league',
        'mini-competitions',
        'fantasy football',
        'predictions',
        'cash prizes',
        'online games'
    ],
    authors: [{ name: 'FootyGames.co.uk Team' }],
    creator: 'FootyGames.co.uk Team',
    publisher: 'FootyGames.co.uk',
    openGraph: {
        title: 'FootyGames.co.uk - Premier League Mini-Competitions',
        description:
            'Your ultimate destination for Premier League mini-competitions. Pay a small entry fee, compete, and win big cash prizes!',
        url: 'https://footygames.co.uk',
        siteName: 'FootyGames.co.uk',
        images: [
            {
                url: 'https://footygames.co.uk/logo.png', // Replace with actual logo path
                width: 800,
                height: 600,
                alt: 'FootyGames.co.uk Logo'
            }
        ],
        locale: 'en_GB',
        type: 'website'
    },
    twitter: {
        card: 'summary_large_image',
        title: 'FootyGames.co.uk - Premier League Mini-Competitions',
        description:
            'Your ultimate destination for Premier League mini-competitions. Pay a small entry fee, compete, and win big cash prizes!',
        images: ['https://footygames.co.uk/logo.png'] // Replace with actual logo path
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1
        }
    },
    icons: {
        icon: '/favicon.ico',
        shortcut: '/favicon.ico',
        apple: '/favicon.ico'
    },
    manifest: '/site.webmanifest' // You might need to create this file
};

const Layout = ({ children }: Readonly<{ children: ReactNode }>) => {
    return (
        // ? https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app
        // ? https://react.dev/reference/react-dom/client/hydrateRoot#suppressing-unavoidable-hydration-mismatch-errors
        <html suppressHydrationWarning lang='en'>
            <body
                className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground overscroll-none antialiased`}>
                <AuthProvider>
                    <ThemeProvider attribute='class'>
                        <OnboardingProvider>
                            <ErrorBoundary>
                                <AppHeader data-onboarding='navigation' /> {/* Render AppHeader */}
                                {children}
                                <OnboardingOverlay />
                                <OnboardingStyles />
                                <Toaster />
                                <AppFooter /> {/* Render AppFooter */}
                            </ErrorBoundary>
                        </OnboardingProvider>
                    </ThemeProvider>
                </AuthProvider>
            </body>
        </html>
    );
};

export default Layout;
