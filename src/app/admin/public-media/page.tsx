import { requireAdmin } from "../_lib/auth";
import { AdminShell } from "../_components/AdminShell";
import { PublicMediaClient } from "./PublicMediaClient";

export default async function PublicMediaPage() {
  const user = await requireAdmin();

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <PublicMediaClient />
    </AdminShell>
  );
}
