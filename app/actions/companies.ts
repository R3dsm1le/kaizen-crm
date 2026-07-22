"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAuthenticated } from "@/lib/auth";
import { CompanyService } from "@/services/company-service";
import { LeadDiscoveryService } from "@/services/lead-discovery-service";
import { FollowUpService } from "@/services/follow-up-service";
import { ReplyDetectionService } from "@/services/reply-detection-service";
import { STAGES, type Stage } from "@/types";

const companyInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  website: z.string().optional().or(z.literal("")),
  industry: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  employees: z.string().optional(),
  linkedinUrl: z.string().optional(),
  notes: z.string().optional(),
  nextAction: z.string().optional(),
});

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function createCompanyAction(input: z.infer<typeof companyInputSchema>) {
  await assertAuthenticated();
  const data = companyInputSchema.parse(input);
  const company = await CompanyService.create({ ...data, source: "manual" });
  revalidateAll();
  return { id: company.id };
}

export async function updateCompanyAction(
  id: string,
  input: Partial<z.infer<typeof companyInputSchema>> & {
    tags?: string[];
    nextActionAt?: string | null;
  }
) {
  await assertAuthenticated();
  const { nextActionAt, ...rest } = input;
  await CompanyService.update(id, {
    ...rest,
    ...(nextActionAt !== undefined
      ? { nextActionAt: nextActionAt ? new Date(nextActionAt) : null }
      : {}),
  });
  revalidateAll();
}

export async function deleteCompanyAction(id: string) {
  await assertAuthenticated();
  await CompanyService.remove(id);
  revalidateAll();
}

export async function moveStageAction(id: string, stage: Stage) {
  await assertAuthenticated();
  if (!STAGES.includes(stage)) throw new Error("Invalid stage");
  await CompanyService.moveStage(id, stage);
  revalidateAll();
}

export async function addNoteAction(id: string, note: string) {
  await assertAuthenticated();
  if (!note.trim()) return;
  await CompanyService.addNote(id, note.trim());
  revalidateAll();
}

export async function importCsvAction(csvContent: string) {
  await assertAuthenticated();
  const result = await LeadDiscoveryService.importCsv(csvContent);
  revalidateAll();
  return result;
}

export async function scheduleFollowUpAction(companyId: string, dateIso: string) {
  await assertAuthenticated();
  await FollowUpService.scheduleManual(companyId, new Date(dateIso));
  revalidateAll();
}

export async function markRepliedAction(companyId: string) {
  await assertAuthenticated();
  await ReplyDetectionService.markReplied(companyId);
  revalidateAll();
}

export async function getCompanyAction(id: string) {
  await assertAuthenticated();
  return CompanyService.get(id);
}
