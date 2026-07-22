"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { importCsvAction } from "@/app/actions/companies";

export function CsvImportDialog() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const onFile = async (file: File) => {
    setBusy(true);
    try {
      const content = await file.text();
      const result = await importCsvAction(content);
      const skipped = result.processed - result.succeeded - result.failed;
      toast.success(
        `Imported ${result.succeeded} lead${result.succeeded === 1 ? "" : "s"}` +
          (skipped > 0 ? `, ${skipped} duplicate${skipped === 1 ? "" : "s"} skipped` : "") +
          (result.failed > 0 ? `, ${result.failed} failed` : "")
      );
      if (result.errors.length) {
        toast.warning(result.errors.slice(0, 3).join("\n"));
      }
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UploadIcon /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import leads from CSV</DialogTitle>
          <DialogDescription>
            Columns are matched loosely — company, website, industry, country, city, employees,
            linkedin, plus optional contact name/title/email. Duplicates (same domain) are skipped.
          </DialogDescription>
        </DialogHeader>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-brand/50 hover:bg-accent"
        >
          <UploadIcon className="size-5" />
          {busy ? "Importing…" : "Choose a .csv file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onFile(file);
            e.target.value = "";
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
