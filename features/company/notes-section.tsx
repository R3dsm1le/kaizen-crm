"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addNoteAction } from "@/app/actions/companies";
import type { CompanyWithRelations } from "@/services/company-service";

export function NotesSection({
  company,
  onChanged,
}: {
  company: CompanyWithRelations;
  onChanged: () => Promise<void>;
}) {
  const [note, setNote] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const addNote = async () => {
    if (!note.trim()) return;
    setSaving(true);
    try {
      await addNoteAction(company.id, note);
      setNote("");
      await onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add note");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</h3>
      {company.notes && (
        <p className="whitespace-pre-wrap rounded-md bg-muted/50 px-3 py-2 text-[13px] leading-relaxed">
          {company.notes}
        </p>
      )}
      <div className="space-y-2">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note…"
          className="min-h-16"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void addNote();
          }}
        />
        {note.trim() && (
          <Button size="sm" variant="secondary" onClick={addNote} disabled={saving}>
            {saving ? "Adding…" : "Add note"}
          </Button>
        )}
      </div>
    </section>
  );
}
