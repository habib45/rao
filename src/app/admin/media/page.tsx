import { requireAdmin } from "../_lib/auth";
import { AdminShell } from "../_components/AdminShell";
import { MediaPageClient } from "./MediaPageClient";

export default async function AdminMediaPage() {
  const user = await requireAdmin();

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <MediaPageClient />
    </AdminShell>
  );
}
