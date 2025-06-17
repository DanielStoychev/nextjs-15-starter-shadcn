import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/registry/new-york-v4/ui/card";
import type { Metadata } from 'next';
import prisma from "@/lib/prisma"; // Import prisma client

export const metadata: Metadata = {
  title: 'Admin Dashboard',
  description: 'Admin panel for FootyGames.co.uk. Manage users, games, entries, and transactions.',
};

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) { // Ensure session and email exist
    redirect("/api/auth/signin"); // Redirect to sign-in if not authenticated
  }

  // Fetch the user directly from the database to get the latest role
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      role: true,
    },
  });

  // Check if user exists and has ADMIN role
  if (!dbUser || dbUser.role !== "ADMIN") {
    redirect("/api/auth/signin"); // Redirect if not admin
  }

  return (
    <main className="flex min-h-[calc(100vh-14rem)] flex-col items-center p-4 sm:p-8">
      <Card className="w-full max-w-4xl bg-card text-card-foreground border-border shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl sm:text-4xl font-bold mb-4">
            Admin Dashboard
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Welcome, {session.user?.name || session.user?.email}! Manage your FootyGames.co.uk platform here.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <p className="text-muted-foreground">
            This is the main administration area. You can manage various aspects of the platform from here.
          </p>
          {/* Placeholder for admin navigation/summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground">User Management</h3>
              <p className="text-sm text-muted-foreground">View and manage user accounts.</p>
            </Card>
            <Card className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground">Game Management</h3>
              <p className="text-sm text-muted-foreground">Create and configure game instances.</p>
            </Card>
            <Card className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground">Entries & Results</h3>
              <p className="text-sm text-muted-foreground">Monitor game entries and process results.</p>
            </Card>
            <Card className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground">Transactions</h3>
              <p className="text-sm text-muted-foreground">View payment and prize transactions.</p>
            </Card>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
