"use client";

import * as React from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCompanyAction } from "@/app/actions/companies";
import type { CompanyWithRelations } from "@/services/company-service";

const FIELDS = [
  { key: "website", label: "Website" },
  { key: "industry", label: "Industry" },
  { key: "country", label: "Country" },
  { key: "city", label: "City" },
  { key: "employees", label: "Employees" },
  { key: "linkedinUrl", label: "LinkedIn" },
] as const;

/** Inline-editable company fields — edit, blur, saved. No modal. */
export function DetailsSection({
  company,
  onChanged,
}: {
  company: CompanyWithRelations;
  onChanged: () => Promise<void>;
}) {
  const save = async (key: string, value: string) => {
    const current = (company[key as keyof CompanyWithRelations] as string | null) ?? "";
    if (value === current) return;
    try {
      await updateCompanyAction(company.id, { [key]: value });
      await onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    }
  };

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Details
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1">
            <Label htmlFor={`field-${field.key}`}>{field.label}</Label>
            <Input
              id={`field-${field.key}`}
              defaultValue={(company[field.key] as string | null) ?? ""}
              onBlur={(e) => void save(field.key, e.target.value.trim())}
              placeholder="—"
              className="h-7 border-transparent px-1.5 shadow-none hover:border-input focus-visible:border-input"
            />
          </div>
        ))}
        <div className="space-y-1">
          <Label htmlFor="field-nextAction">Next action</Label>
          <Input
            id="field-nextAction"
            defaultValue={company.nextAction ?? ""}
            onBlur={(e) => void save("nextAction", e.target.value.trim())}
            placeholder="e.g. Call after proposal"
            className="h-7 border-transparent px-1.5 shadow-none hover:border-input focus-visible:border-input"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="field-nextActionAt">Next action date</Label>
          <Input
            id="field-nextActionAt"
            type="date"
            defaultValue={
              company.nextActionAt ? new Date(company.nextActionAt).toISOString().slice(0, 10) : ""
            }
            onBlur={(e) => {
              void (async () => {
                try {
                  await updateCompanyAction(company.id, {
                    nextActionAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                  });
                  await onChanged();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Failed to save");
                }
              })();
            }}
            className="h-7 border-transparent px-1.5 shadow-none hover:border-input focus-visible:border-input"
          />
        </div>
      </div>
    </section>
  );
}
