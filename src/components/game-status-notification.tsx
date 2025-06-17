"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/registry/new-york-v4/ui/alert-dialog";
import { Button } from "@/registry/new-york-v4/ui/button";

interface GameStatusNotificationProps {
  status: "success" | "info" | "warning" | "error";
  message: string;
  title?: string;
  showAsDialog?: boolean;
  dialogOpen?: boolean;
  onDialogClose?: () => void;
}

export default function GameStatusNotification({
  status,
  message,
  title,
  showAsDialog = false,
  dialogOpen,
  onDialogClose,
}: GameStatusNotificationProps) {
  useEffect(() => {
    if (!showAsDialog) {
      switch (status) {
        case "success":
          toast.success(title || "Success!", { description: message });
          break;
        case "info":
          toast.info(title || "Info", { description: message });
          break;
        case "warning":
          toast.warning(title || "Warning", { description: message });
          break;
        case "error":
          toast.error(title || "Error!", { description: message });
          break;
        default:
          toast(title || "Notification", { description: message });
      }
    }
  }, [status, message, title, showAsDialog]);

  if (showAsDialog) {
    return (
      <AlertDialog open={dialogOpen} onOpenChange={onDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {title || "Game Status Update"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction asChild>
              <Button onClick={onDialogClose}>Got it!</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return null; // Render nothing if not showing as dialog
}
