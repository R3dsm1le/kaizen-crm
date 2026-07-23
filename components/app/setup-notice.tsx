"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * First-run screen shown when no database is configured yet.
 * Paste a Postgres connection string; the server validates it, applies
 * the schema migrations and saves it — no env editing required.
 */
export function SetupNotice() {
  const [databaseUrl, setDatabaseUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ databaseUrl }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Setup failed");
      }
      toast.success("Database connected — welcome to Kaizen.");
      window.location.href = "/";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Setup failed");
      setBusy(false);
    }
  };

  return (
    <div className="flex h-svh items-center justify-center p-8">
      <div className="w-full max-w-md space-y-5">
        <div className="space-y-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand text-base font-semibold text-brand-foreground">
            改
          </div>
          <h1 className="pt-1 text-lg font-semibold tracking-tight">Welcome to Kaizen</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            One step before your workspace opens: connect a database. Create a free project at{" "}
            <span className="font-medium text-foreground">supabase.com</span> (or use any Postgres),
            copy its connection string and paste it below. Tables are created automatically.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="setup-url">Postgres connection string</Label>
            <Input
              id="setup-url"
              type="password"
              required
              autoFocus
              placeholder="postgresql://user:password@host:5432/postgres"
              value={databaseUrl}
              onChange={(e) => setDatabaseUrl(e.target.value)}
              autoComplete="off"
            />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Supabase: click “Connect” and copy a pooler string — the host ends in
              pooler.supabase.com. Avoid the direct db.…supabase.co URL: it is IPv6-only and
              often unreachable.
            </p>
          </div>
          <Button type="submit" disabled={busy || !databaseUrl.trim()} className="w-full">
            {busy ? "Connecting & creating tables…" : "Connect database"}
          </Button>
        </form>

        <p className="text-xs leading-relaxed text-muted-foreground/70">
          Everything else — AI, email, lead sources, API keys — is configured later inside Settings.
          Every integration is optional.
        </p>
      </div>
    </div>
  );
}
