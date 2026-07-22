"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAuthenticated } from "@/lib/auth";
import { ContactService } from "@/services/contact-service";

const contactInputSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  title: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  linkedinUrl: z.string().optional(),
  isDecisionMaker: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function createContactAction(input: z.infer<typeof contactInputSchema>) {
  await assertAuthenticated();
  const data = contactInputSchema.parse(input);
  await ContactService.create({ ...data, email: data.email || null });
  revalidatePath("/", "layout");
}

export async function updateContactAction(
  id: string,
  input: Partial<z.infer<typeof contactInputSchema>>
) {
  await assertAuthenticated();
  await ContactService.update(id, { ...input, email: input.email || null });
  revalidatePath("/", "layout");
}

export async function deleteContactAction(id: string) {
  await assertAuthenticated();
  await ContactService.remove(id);
  revalidatePath("/", "layout");
}
