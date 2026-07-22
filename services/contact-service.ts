import { desc, eq } from "drizzle-orm";
import { contacts, db, type Contact, type NewContact } from "@/db";
import { TimelineService } from "./timeline-service";

export const ContactService = {
  async listByCompany(companyId: string): Promise<Contact[]> {
    return db.query.contacts.findMany({
      where: eq(contacts.companyId, companyId),
      orderBy: [desc(contacts.isDecisionMaker), desc(contacts.createdAt)],
    });
  },

  async create(input: NewContact): Promise<Contact> {
    const [contact] = await db.insert(contacts).values(input).returning();
    await TimelineService.record(input.companyId, "contact_added", `Contact added: ${input.name}`);
    return contact;
  },

  async update(id: string, input: Partial<NewContact>): Promise<Contact> {
    const [contact] = await db.update(contacts).set(input).where(eq(contacts.id, id)).returning();
    return contact;
  },

  async remove(id: string): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  },

  /** Best email target: decision maker first, then any contact with an email. */
  async primaryContact(companyId: string): Promise<Contact | null> {
    const list = await this.listByCompany(companyId);
    return list.find((c) => c.isDecisionMaker && c.email) ?? list.find((c) => c.email) ?? null;
  },
};
