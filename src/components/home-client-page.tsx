"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/registry/new-york-v4/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/new-york-v4/ui/card";
import Link from "next/link";

export default function HomeClientPage() {
  const { data: session } = useSession();

  return (
    <main className="flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center p-4 sm:p-8">
      <Card className="w-full max-w-2xl text-center bg-card text-card-foreground border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl sm:text-4xl font-bold mb-4">
            Welcome, {session?.user?.name || session?.user?.email || "Player"}!
          </CardTitle>
          <p className="text-lg text-muted-foreground">
            Ready to dive into the world of Premier League mini-competitions?
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground px-6 py-3 text-base font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground px-6 py-3 text-base font-semibold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105">
              <Link href="/competitions">Explore Competitions</Link>
            </Button>
          </div>
          <Button onClick={() => signOut()} variant="ghost" className="mt-4 text-muted-foreground hover:text-foreground">
            Sign out
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
