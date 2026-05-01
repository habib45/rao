import { requireAdmin } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { NewsletterPageClient } from "./_components/NewsletterPageClient";

export default async function AdminNewsletterPage() {
  const user = await requireAdmin();

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Newsletter</h1>
        <NewsletterPageClient />
      </div>
    </AdminShell>
  );
}
