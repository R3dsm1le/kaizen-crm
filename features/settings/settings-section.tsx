"use client";

import * as React from "react";
import { toast } from "sonner";
import { useForm, type DefaultValues, type FieldValues, type Path } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export interface SettingsField {
  name: string;
  label: string;
  type?: "text" | "password" | "number" | "textarea" | "select";
  placeholder?: string;
  description?: string;
  options?: { value: string; label: string }[];
  colSpan?: 1 | 2;
}

/**
 * Generic settings card: field definitions in, one save button out.
 * Keeps every provider section consistent and boring — in a good way.
 */
export function SettingsSection<T extends FieldValues>({
  title,
  description,
  fields,
  defaultValues,
  onSave,
}: {
  title: string;
  description?: string;
  fields: SettingsField[];
  defaultValues: DefaultValues<T>;
  onSave: (values: T) => Promise<void>;
}) {
  const form = useForm<T>({ defaultValues });

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSave(values);
      form.reset(values);
      toast.success(`${title} saved`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    }
  });

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {fields.map((field) => (
              <div
                key={field.name}
                className={field.colSpan === 2 || field.type === "textarea" ? "col-span-2 space-y-1.5" : "space-y-1.5"}
              >
                <Label htmlFor={`${title}-${field.name}`}>{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea
                    id={`${title}-${field.name}`}
                    placeholder={field.placeholder}
                    {...form.register(field.name as Path<T>)}
                  />
                ) : field.type === "select" ? (
                  <SelectField form={form} field={field} />
                ) : (
                  <Input
                    id={`${title}-${field.name}`}
                    type={field.type ?? "text"}
                    placeholder={field.placeholder}
                    autoComplete={field.type === "password" ? "off" : undefined}
                    {...form.register(field.name as Path<T>, {
                      ...(field.type === "number" ? { valueAsNumber: true } : {}),
                    })}
                  />
                )}
                {field.description && (
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    {field.description}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              variant={form.formState.isDirty ? "default" : "secondary"}
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SelectField<T extends FieldValues>({
  form,
  field,
}: {
  form: ReturnType<typeof useForm<T>>;
  field: SettingsField;
}) {
  const value = form.watch(field.name as Path<T>) as string;
  return (
    <Select
      value={value}
      onValueChange={(v) =>
        form.setValue(field.name as Path<T>, v as never, { shouldDirty: true })
      }
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {field.options?.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
