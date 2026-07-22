"use client";

import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md space-y-3 text-center">
        <h2 className="text-base font-semibold">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred."}
        </p>
        <p className="text-xs text-muted-foreground/70">
          If this mentions a connection, check DATABASE_URL in .env.local and that migrations ran
          (npm run db:migrate).
        </p>
        <Button variant="outline" size="sm" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
