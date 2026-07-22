"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, messages } from "@/db";
import { assertAuthenticated } from "@/lib/auth";
import { CompanyResearchService } from "@/services/company-research-service";
import { EmailDeliveryService } from "@/services/email-delivery-service";
import { OutreachGenerationService } from "@/services/outreach-generation-service";
import { TimelineService } from "@/services/timeline-service";

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function generateResearchAction(companyId: string) {
  await assertAuthenticated();
  await CompanyResearchService.researchCompany(companyId);
  revalidateAll();
}

export async function generateOutreachAction(companyId: string) {
  await assertAuthenticated();
  await OutreachGenerationService.generateForCompany(companyId);
  revalidateAll();
}

export async function updateMessageAction(
  id: string,
  input: { subject?: string; body?: string; toEmail?: string }
) {
  await assertAuthenticated();
  const message = await db.query.messages.findFirst({ where: eq(messages.id, id) });
  if (!message) throw new Error("Message not found");
  if (message.status === "sent") throw new Error("Sent messages cannot be edited");

  await db.update(messages).set(input).where(eq(messages.id, id));
  await TimelineService.record(message.companyId, "email_edited", "Draft edited", {
    description: message.subject ?? message.kind,
  });
  revalidateAll();
}

export async function sendMessageAction(id: string) {
  await assertAuthenticated();
  await EmailDeliveryService.sendMessage(id);
  revalidateAll();
}

export async function queueMessageAction(id: string) {
  await assertAuthenticated();
  await EmailDeliveryService.queueMessage(id);
  revalidateAll();
}

export async function deleteMessageAction(id: string) {
  await assertAuthenticated();
  const message = await db.query.messages.findFirst({ where: eq(messages.id, id) });
  if (message?.status === "sent") throw new Error("Sent messages cannot be deleted");
  await db.delete(messages).where(eq(messages.id, id));
  revalidateAll();
}
