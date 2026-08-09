import { AdminPageHeader } from "@/features/admin/shared/components/page-header";
import { SupportCenter } from "@/features/admin/support/components/support-center";
import { getSupportContent, listSupportTickets } from "@/features/admin/support/server/support-service";

export default async function AdminSupportPage() {
  const [tickets, content] = await Promise.all([
    listSupportTickets({ q: "", page: 1, pageSize: 50, status: "ALL", type: "ALL" }),
    getSupportContent(),
  ]);
  return <><AdminPageHeader eyebrow="Customer operations" title="Support center" description="Manage feedback, contact and recovery requests, technical reports, internal notes, FAQs, and announcements." /><SupportCenter initialTickets={tickets.items} faqs={content.faqs} announcements={content.announcements} /></>;
}
