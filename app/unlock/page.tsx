"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** One prompt, no accounts: enter the workspace access code once per device. */
export default function UnlockPage() {
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Wrong access code.");
      window.location.href = "/";
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      setBusy(false);
    }
  };

  return (
    <div className="flex h-svh items-center justify-center p-8">
      <form onSubmit={submit} className="w-full max-w-xs space-y-4">
        <div className="space-y-1">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand text-base font-semibold text-brand-foreground">
            改
          </div>
          <h1 className="pt-2 text-lg font-semibold tracking-tight">Kaizen</h1>
          <p className="text-sm text-muted-foreground">
            This workspace is private. Enter the access code.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="access-code">Access code</Label>
          <Input
            id="access-code"
            type="password"
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy || !code.trim()}>
          {busy ? "Unlocking…" : "Unlock"}
        </Button>
      </form>
    </div>
  );
}
