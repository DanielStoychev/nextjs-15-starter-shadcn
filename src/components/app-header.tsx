"use client";

import Link from "next/link";
import Image from "next/image"; // Import Image component
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react"; // Import NextAuth hooks
import React from "react"; // Import React

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/registry/new-york-v4/ui/navigation-menu";
import { Button } from "@/registry/new-york-v4/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/registry/new-york-v4/ui/sheet"; // Import Sheet components
import { MenuIcon } from "lucide-react"; // Import MenuIcon
import { ModeToggle } from "@/components/mode-toggle"; // Import ModeToggle

export default function AppHeader() { // Renamed component and made default export
  const pathname = usePathname();
  const { data: session } = useSession(); // Get session data

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" className="mr-6 flex items-center">
          <Image src="/logo.png" alt="FootyGames.co.uk Logo" width={64} height={64} className="rounded-full" /> {/* Logo */}
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex"> {/* Hide on small screens */}
          <NavigationMenuList className="gap-2">
            <NavigationMenuItem>
              <NavigationMenuLink asChild data-active={pathname === '/'}>
                <Link href='/' className="text-foreground hover:text-accent-orange">Home</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            {session && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild data-active={pathname === '/dashboard'}>
                  <Link href='/dashboard' className="text-foreground hover:text-accent-orange">Dashboard</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}
            <NavigationMenuItem>
              <NavigationMenuLink asChild data-active={pathname === '/competitions'}>
                <Link href='/competitions' className="text-foreground hover:text-accent-orange">Competitions</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink asChild data-active={pathname === '/leaderboards'}>
                <Link href='/leaderboards' className="text-foreground hover:text-accent-orange">Leaderboards</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-2"> {/* Hide on small screens */}
          <ModeToggle /> {/* Theme Toggle */}
          {session ? (
            <Button onClick={() => signOut()} variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground">
              Sign out
            </Button>
          ) : (
            <React.Fragment>
              <Button asChild className="bg-transparent border border-accent-orange text-accent-orange transition-all duration-300 transform hover:scale-105 hover:bg-accent-orange hover:text-foreground">
                <Link href="/auth/register">Sign up</Link>
              </Button>
              <Button asChild className="bg-transparent border border-accent-orange text-accent-orange transition-all duration-300 transform hover:scale-105 hover:bg-accent-orange hover:text-foreground">
                <Link href="/auth/login">Login</Link>
              </Button>
            </React.Fragment>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center"> {/* Show on small screens */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-background text-foreground"> {/* Darker background for mobile sheet */}
              <SheetTitle className="sr-only">Mobile Navigation</SheetTitle> {/* Visually hidden title for accessibility */}
              <SheetDescription className="sr-only">Main navigation links for mobile devices.</SheetDescription> {/* Visually hidden description */}
              <div className="flex flex-col items-start gap-4 p-4">
                <Link href="/" className="flex items-center">
                  <Image src="/logo.png" alt="FootyGames.co.uk Logo" width={64} height={64} className="rounded-full" />
                </Link>
                <Link href="/" className="text-lg font-medium text-foreground hover:text-accent-orange">Home</Link>
                {session && (
                  <Link href="/dashboard" className="text-lg font-medium text-foreground hover:text-accent-orange">Dashboard</Link>
                )}
                <Link href="/competitions" className="text-lg font-medium text-foreground hover:text-accent-orange">Competitions</Link>
                <Link href="/leaderboards" className="text-lg font-medium text-foreground hover:text-accent-orange">Leaderboards</Link>
                <ModeToggle /> {/* Theme Toggle */}
                {session ? (
                  <Button onClick={() => signOut()} variant="outline" className="w-full justify-start border-border text-foreground hover:bg-accent hover:text-accent-foreground">
                    Sign out
                  </Button>
                ) : (
                  <Button asChild className="w-full justify-start bg-transparent border border-accent-orange text-accent-orange transition-all duration-300 transform hover:scale-105 hover:bg-accent-orange hover:text-foreground">
                    <Link href="/auth/login">Sign in</Link>
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
