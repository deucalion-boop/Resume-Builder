import "server-only";

import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAdminAudit } from "@/features/admin/shared/server/audit";
import type { z } from "zod";
import type { announcementSchema, faqSchema, ticketActionSchema, ticketListSchema } from "@/features/admin/shared/schemas";
import { sendTransactionalEmail } from "@/lib/email";

type TicketListInput = z.infer<typeof ticketListSchema>;
type TicketAction = z.infer<typeof ticketActionSchema>;

export async function listSupportTickets(input: TicketListInput) {
  const where: Prisma.SupportTicketWhereInput = {
    ...(input.q ? { OR: [
      { email: { contains: input.q, mode: "insensitive" } },
      { subject: { contains: input.q, mode: "insensitive" } },
    ] } : {}),
    ...(input.status === "ALL" ? {} : { status: input.status }),
    ...(input.type === "ALL" ? {} : { type: input.type }),
  };
  const [items, total, counts] = await prisma.$transaction([
    prisma.supportTicket.findMany({
      where, orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      skip: (input.page - 1) * input.pageSize, take: input.pageSize,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { messages: true } },
      },
    }),
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.groupBy({ by: ["status"], orderBy: { status: "asc" }, _count: { _all: true } }),
  ]);
  return {
    items, counts, pagination: { page: input.page, pageSize: input.pageSize, total, pages: Math.max(1, Math.ceil(total / input.pageSize)) },
  };
}

export async function getSupportTicket(id: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, name: true, email: true, status: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true, email: true } } } },
    },
  });
  if (!ticket) throw new Error("NOT_FOUND");
  return ticket;
}

export async function performTicketAction(request: Request, actorId: string, ticketId: string, action: TicketAction) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error("NOT_FOUND");
  if (action.action === "update") {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: action.status, priority: action.priority, assignedToId: actorId,
        resolvedAt: ["RESOLVED", "CLOSED"].includes(action.status) ? new Date() : null,
      },
    });
  } else {
    await prisma.supportMessage.create({ data: { ticketId, authorId: actorId, body: action.body, isInternal: action.internal } });
    if (!action.internal) {
      await sendTransactionalEmail({
        to: ticket.email,
        subject: `Update on your support request: ${ticket.subject}`,
        heading: "Our support team replied",
        message: action.body,
      });
    }
  }
  const summary = action.action === "update"
    ? `Updated “${ticket.subject}” to ${action.status.toLowerCase().replaceAll("_", " ")}.`
    : `Added an ${action.internal ? "internal note" : "administrator response"} to “${ticket.subject}”.`;
  await writeAdminAudit({
    request, actorId, category: "SUPPORT", action: `support.${action.action}`, summary,
    targetType: "SupportTicket", targetId: ticketId,
  });
  return { ok: true, summary };
}

export async function getSupportContent() {
  const [faqs, announcements] = await Promise.all([
    prisma.faq.findMany({ orderBy: [{ category: "asc" }, { position: "asc" }, { updatedAt: "desc" }] }),
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, include: { author: { select: { name: true, email: true } } } }),
  ]);
  return { faqs, announcements };
}

export async function saveFaq(request: Request, actorId: string, input: z.infer<typeof faqSchema>) {
  const faq = input.id
    ? await prisma.faq.update({ where: { id: input.id }, data: input })
    : await prisma.faq.create({ data: input });
  await writeAdminAudit({
    request, actorId, category: "SUPPORT", action: input.id ? "faq.update" : "faq.create",
    summary: `${input.id ? "Updated" : "Created"} FAQ “${faq.question}”.`, targetType: "Faq", targetId: faq.id,
  });
  return faq;
}

export async function deleteFaq(request: Request, actorId: string, id: string) {
  const faq = await prisma.faq.delete({ where: { id } });
  await writeAdminAudit({
    request, actorId, category: "SUPPORT", severity: "WARNING", action: "faq.delete",
    summary: `Deleted FAQ “${faq.question}”.`, targetType: "Faq", targetId: faq.id,
  });
}

export async function saveAnnouncement(request: Request, actorId: string, input: z.infer<typeof announcementSchema>) {
  const data = { title: input.title, message: input.message, kind: input.kind, active: input.active, endsAt: input.endsAt ? new Date(input.endsAt) : null, authorId: actorId };
  const announcement = input.id
    ? await prisma.announcement.update({ where: { id: input.id }, data })
    : await prisma.announcement.create({ data });
  await writeAdminAudit({
    request, actorId, category: "SYSTEM", action: input.id ? "announcement.update" : "announcement.create",
    summary: `${input.id ? "Updated" : "Created"} announcement “${announcement.title}”.`,
    targetType: "Announcement", targetId: announcement.id,
  });
  return announcement;
}

export async function deleteAnnouncement(request: Request, actorId: string, id: string) {
  const announcement = await prisma.announcement.delete({ where: { id } });
  await writeAdminAudit({
    request, actorId, category: "SYSTEM", severity: "WARNING", action: "announcement.delete",
    summary: `Deleted announcement “${announcement.title}”.`, targetType: "Announcement", targetId: id,
  });
}
