import React from 'react';
import Link from 'next/link'; // Import Link component

export function AppFooter() {
  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 text-center text-sm text-muted-foreground">
      <div className="container mx-auto flex flex-col sm:flex-row justify-center items-center gap-2">
        <p>&copy; {new Date().getFullYear()} FootyGames.co.uk. All rights reserved.</p>
        <span className="hidden sm:inline">|</span>
        <Link href="/legal/terms" className="hover:text-foreground transition-colors">Terms & Conditions</Link>
        <span className="hidden sm:inline">|</span>
        <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
      </div>
    </footer>
  );
}
