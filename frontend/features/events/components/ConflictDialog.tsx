"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConflictDialogProps {
  open: boolean;
  message: string;
  onIgnore: () => void;
  onCancel: () => void;
}

export function ConflictDialog({ open, message, onIgnore, onCancel }: ConflictDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="size-5" />
            <DialogTitle className="text-amber-700">Scheduling Conflict</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300">
          You can override the conflict and create the event anyway, or go back and adjust the times.
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Go back & adjust
          </Button>
          <Button
            onClick={onIgnore}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            Create anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
