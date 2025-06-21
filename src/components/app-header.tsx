'use client';

// Import NextAuth hooks
import React from 'react';

import Image from 'next/image';
import Link from 'next/link';
// Import Image component
import { usePathname } from 'next/navigation';

import { HeaderNotificationBell } from '@/components/notifications/header-notification-bell';
import { Button } from '@/registry/new-york-v4/ui/button';
// Import React

import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList
} from '@/registry/new-york-v4/ui/navigation-menu';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/registry/new-york-v4/ui/sheet';

// Import Sheet components
import { MenuIcon } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';

// Import MenuIcon
// import { ModeToggle } from "@/components/mode-toggle"; // Import ModeToggle - Removed

export default function AppHeader() {
    // Renamed component and made default export
    const pathname = usePathname();
    const { data: session } = useSession(); // Get session data

    return (
        <header className='bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur'>
            <div className='container flex h-20 items-center justify-between'>
                <Link href='/' className='mr-6 flex items-center'>
                    <Image
                        src='/logo.png'
                        alt='FootyGames.co.uk Logo'
                        width={64}
                        height={64}
                        className='rounded-full'
                    />{' '}
                    {/* Logo */}
                </Link>

                {/* Desktop Navigation */}
                <NavigationMenu className='hidden md:flex'>
                    {' '}
                    {/* Hide on small screens */}
                    <NavigationMenuList className='gap-2'>
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild data-active={pathname === '/'}>
                                <Link href='/' className='text-foreground hover:text-accent-orange'>
                                    Home
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuLink asChild data-active={pathname === '/games'}>
                                <Link
                                    href='/games'
                                    className='text-foreground hover:text-accent-orange'
                                    data-onboarding='games-link'>
                                    Games
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                        {session && (
                            <NavigationMenuItem>
                                <NavigationMenuLink asChild data-active={pathname === '/dashboard'}>
                                    <Link href='/dashboard' className='text-foreground hover:text-accent-orange'>
                                        Dashboard
                                    </Link>
                                </NavigationMenuLink>
                            </NavigationMenuItem>
                        )}

                        <NavigationMenuItem>
                            <NavigationMenuLink asChild data-active={pathname === '/leaderboards'}>
                                <Link href='/leaderboards' className='text-foreground hover:text-accent-orange'>
                                    Leaderboards
                                </Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>

                {/* Desktop Auth Buttons */}
                <div className='hidden items-center gap-2 md:flex'>
                    {' '}
                    {/* Hide on small screens */}
                    {/* <ModeToggle /> */} {/* Theme Toggle - Removed */}
                    {session && (
                        <div data-onboarding='notifications'>
                            <HeaderNotificationBell />
                        </div>
                    )}
                    {session ? (
                        <Button
                            onClick={() => signOut()}
                            variant='outline'
                            className='border-border text-foreground hover:bg-accent hover:text-accent-foreground'>
                            Sign out
                        </Button>
                    ) : (
                        <React.Fragment>
                            <Button
                                asChild
                                className='border-accent-orange text-accent-orange hover:bg-accent-orange hover:text-foreground transform border bg-transparent transition-all duration-300 hover:scale-105'>
                                <Link href='/auth/register'>Sign up</Link>
                            </Button>
                            <Button
                                asChild
                                className='border-accent-orange text-accent-orange hover:bg-accent-orange hover:text-foreground transform border bg-transparent transition-all duration-300 hover:scale-105'>
                                <Link href='/auth/login'>Login</Link>
                            </Button>
                        </React.Fragment>
                    )}
                </div>

                {/* Mobile Navigation */}
                <div className='flex items-center gap-2 md:hidden'>
                    {' '}
                    {/* Show on small screens */}
                    {session && (
                        <div>
                            <HeaderNotificationBell />
                        </div>
                    )}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant='ghost' size='icon'>
                                <MenuIcon className='h-6 w-6' />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side='right' className='bg-background text-foreground'>
                            {' '}
                            {/* Darker background for mobile sheet */}
                            <SheetTitle className='sr-only'>Mobile Navigation</SheetTitle>{' '}
                            {/* Visually hidden title for accessibility */}
                            <SheetDescription className='sr-only'>
                                Main navigation links for mobile devices.
                            </SheetDescription>{' '}
                            {/* Visually hidden description */}
                            <div className='flex flex-col items-start gap-4 p-4'>
                                <Link href='/' className='flex items-center'>
                                    <Image
                                        src='/logo.png'
                                        alt='FootyGames.co.uk Logo'
                                        width={64}
                                        height={64}
                                        className='rounded-full'
                                    />
                                </Link>
                                <Link href='/' className='text-foreground hover:text-accent-orange text-lg font-medium'>
                                    Home
                                </Link>
                                <Link
                                    href='/games'
                                    className='text-foreground hover:text-accent-orange text-lg font-medium'>
                                    Games
                                </Link>
                                {session && (
                                    <Link
                                        href='/dashboard'
                                        className='text-foreground hover:text-accent-orange text-lg font-medium'>
                                        Dashboard
                                    </Link>
                                )}
                                <Link
                                    href='/leaderboards'
                                    className='text-foreground hover:text-accent-orange text-lg font-medium'>
                                    Leaderboards
                                </Link>
                                {/* <ModeToggle /> */} {/* Theme Toggle - Removed */}
                                {session ? (
                                    <Button
                                        onClick={() => signOut()}
                                        variant='outline'
                                        className='border-border text-foreground hover:bg-accent hover:text-accent-foreground w-full justify-start'>
                                        Sign out
                                    </Button>
                                ) : (
                                    <Button
                                        asChild
                                        className='border-accent-orange text-accent-orange hover:bg-accent-orange hover:text-foreground w-full transform justify-start border bg-transparent transition-all duration-300 hover:scale-105'>
                                        <Link href='/auth/login'>Sign in</Link>
                                    </Button>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
