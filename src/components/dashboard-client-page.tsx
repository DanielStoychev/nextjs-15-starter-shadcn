"use client";

import { useState } from "react";
import { Session } from "next-auth"; // Import Session type
import { Button } from "@/registry/new-york-v4/ui/button";
import { signOut } from "next-auth/react";
import { PayButton } from "@/components/pay-button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/registry/new-york-v4/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/registry/new-york-v4/ui/tabs";
import { MyGamesTable } from "@/components/my-games-table";
import { ProfileEditForm } from "@/components/user-profile-form";
import { ProfileViewer } from "@/components/profile-viewer";
import GameStatusNotification from "@/components/game-status-notification"; // Import GameStatusNotification

interface DashboardClientPageProps {
  session: Session | null;
}

export function DashboardClientPage({ session }: DashboardClientPageProps) {
  if (!session) {
    // This case should ideally be handled by the server component redirect,
    // but as a fallback or for client-side navigation, we can show a message.
    return (
      <main className="flex min-h-[calc(100vh-14rem)] flex-col items-center p-8">
        <h1 className="text-4xl font-bold mb-8">Access Denied</h1>
        <p className="text-lg text-gray-500 mb-4">Please sign in to view the dashboard.</p>
        <Button onClick={() => signOut()}>Sign In</Button>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-14rem)] flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-8">User Dashboard</h1>

      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle>Welcome, {session.user?.name || session.user?.email}!</CardTitle>
          <CardDescription>Manage your competitions and profile here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="my-games">My Games</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="p-4">
              <h3 className="text-2xl font-semibold mb-4">Your Overview</h3>
              <p className="text-md text-gray-500 mb-8">Your active games and statistics will appear here.</p>
              {/* Pay Entry Fee Button */}
              <PayButton />
              {/* Placeholder for Game Status Notification */}
              <div className="mt-8">
                <GameStatusNotification
                  status="info"
                  title="Game Update"
                  message="You are currently in Round 5 of Last Man Standing!"
                  showAsDialog={false} // Set to true to show as dialog
                />
                <GameStatusNotification
                  status="success"
                  title="New Round Started!"
                  message="Round 6 of Table Predictor has just begun. Make your predictions!"
                  showAsDialog={false}
                />
                <GameStatusNotification
                  status="warning"
                  title="Action Required"
                  message="Your predictions for Weekly Score Predictor are due in 24 hours."
                  showAsDialog={false}
                />
                <GameStatusNotification
                  status="error"
                  title="Eliminated!"
                  message="Unfortunately, you have been eliminated from the Race to 33 competition."
                  showAsDialog={false}
                />
              </div>
            </TabsContent>
            <TabsContent value="my-games" className="p-4">
              <h3 className="text-2xl font-semibold mb-4">My Games</h3>
              <MyGamesTable />
            </TabsContent>
            <TabsContent value="profile" className="p-4">
              <ProfileSection />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}

function ProfileSection() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <>
      <h3 className="text-2xl font-semibold mb-4">Profile Settings</h3>
      {isEditing ? (
        <ProfileEditForm onCancel={() => setIsEditing(false)} onSuccess={() => setIsEditing(false)} />
      ) : (
        <ProfileViewer onEdit={() => setIsEditing(true)} />
      )}
    </>
  );
}
