import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";

interface ErrorMessageProps {
  error: Error | ApiError | null | unknown;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({ error, onRetry, className }: ErrorMessageProps) {
  const message =
    error instanceof Error ? error.message : "Something went wrong. Please try again.";

  const isForbidden = error instanceof ApiError && error.isForbidden;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center",
        className,
      )}
    >
      <AlertCircle className="size-8 text-destructive" />
      <p className="text-sm font-medium text-destructive">
        {isForbidden ? "You don't have permission to view this." : message}
      </p>
      {onRetry && !isForbidden && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
