"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createCompanyAction } from "@/app/actions/companies";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  website: z.string().optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function NewCompanyDialog({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "" } });

  // "n" anywhere opens the dialog (keyboard-first).
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, [contenteditable], select")) return;
      if (e.key === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const submit = form.handleSubmit(async (values) => {
    try {
      const { id } = await createCompanyAction(values);
      setOpen(false);
      form.reset();
      toast.success("Lead added");
      router.push(`?company=${id}`, { scroll: false });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add lead");
    }
  });

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          <Button size="sm">
            <PlusIcon /> New lead
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New lead</DialogTitle>
          <DialogDescription>Just a name is enough — enrich the rest later.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="nc-name">Company name</Label>
            <Input id="nc-name" autoFocus {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nc-website">Website</Label>
            <Input id="nc-website" placeholder="acme.com" {...form.register("website")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nc-industry">Industry</Label>
              <Input id="nc-industry" {...form.register("industry")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nc-country">Country</Label>
              <Input id="nc-country" {...form.register("country")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Adding…" : "Add lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
