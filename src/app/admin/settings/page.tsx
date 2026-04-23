import { requireAdmin } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { SettingsForm } from "./_components/SettingsForm";

export default async function AdminSettingsPage() {
  const user = await requireAdmin();

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <SettingsForm />
      </div>
    </AdminShell>
  );
}
