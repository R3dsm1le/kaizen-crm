"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  if (!supabase) {
    return (
      <div className="flex h-svh items-center justify-center p-8">
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          Authentication is not configured — the workspace runs in open local mode.{" "}
          <Link href="/" className="text-brand hover:underline">
            Continue to the app
          </Link>
          .
        </p>
      </div>
    );
  }

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      // First run: offer signup if the account doesn't exist yet.
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        toast.error(error.message);
        return;
      }
      toast.success("Account created. Check your inbox if email confirmation is enabled.");
    }
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex h-svh items-center justify-center p-8">
      <form onSubmit={signIn} className="w-full max-w-xs space-y-4">
        <div className="space-y-1">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand text-base font-semibold text-brand-foreground">
            改
          </div>
          <h1 className="pt-2 text-lg font-semibold tracking-tight">Kaizen</h1>
          <p className="text-sm text-muted-foreground">Sign in to your workspace.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Continue"}
        </Button>
        <p className="text-xs text-muted-foreground">
          New here? Signing in with fresh credentials creates your account.
        </p>
      </form>
    </div>
  );
}
