"use client";

import * as React from "react";
import { toast } from "sonner";
import { CrownIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createContactAction, deleteContactAction, updateContactAction } from "@/app/actions/contacts";
import type { CompanyWithRelations } from "@/services/company-service";

export function ContactsSection({
  company,
  onChanged,
}: {
  company: CompanyWithRelations;
  onChanged: () => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const addContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSaving(true);
    try {
      await createContactAction({
        companyId: company.id,
        name: String(form.get("name") ?? ""),
        title: String(form.get("title") ?? "") || undefined,
        email: String(form.get("email") ?? ""),
        phone: String(form.get("phone") ?? "") || undefined,
        linkedinUrl: String(form.get("linkedinUrl") ?? "") || undefined,
        isDecisionMaker: form.get("isDecisionMaker") === "on",
      });
      await onChanged();
      setOpen(false);
      toast.success("Contact added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add contact");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Contacts
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost">
              <PlusIcon /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New contact</DialogTitle>
            </DialogHeader>
            <form onSubmit={addContact} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="c-name">Name</Label>
                  <Input id="c-name" name="name" required autoFocus />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-title">Title</Label>
                  <Input id="c-title" name="title" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-email">Email</Label>
                  <Input id="c-email" name="email" type="email" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-phone">Phone</Label>
                  <Input id="c-phone" name="phone" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="c-linkedin">LinkedIn</Label>
                  <Input id="c-linkedin" name="linkedinUrl" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch name="isDecisionMaker" />
                Decision maker
              </label>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? "Adding…" : "Add contact"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {company.contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No contacts yet — add one so outreach has a recipient.
        </p>
      ) : (
        <div className="space-y-1">
          {company.contacts.map((contact) => (
            <div
              key={contact.id}
              className="group flex items-center justify-between gap-2 rounded-md px-1 py-1.5"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[13px] font-medium">
                  {contact.name}
                  {contact.isDecisionMaker && (
                    <Badge variant="brand" className="gap-0.5">
                      <CrownIcon className="size-2.5" /> DM
                    </Badge>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {[contact.title, contact.email, contact.phone].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {!contact.isDecisionMaker && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1.5 text-[11px]"
                    onClick={() =>
                      void updateContactAction(contact.id, { isDecisionMaker: true }).then(onChanged)
                    }
                  >
                    Make DM
                  </Button>
                )}
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="size-6 text-muted-foreground hover:text-destructive"
                  onClick={() => void deleteContactAction(contact.id).then(onChanged)}
                >
                  <Trash2Icon className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
