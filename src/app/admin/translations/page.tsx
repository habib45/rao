import { requireAdmin } from "@/app/admin/_lib/auth";
import { AdminShell } from "@/app/admin/_components/AdminShell";
import { TranslationsEditor } from "./_components/TranslationsEditor";

export default async function AdminTranslationsPage() {
  const user = await requireAdmin();

  return (
    <AdminShell userEmail={user.email ?? ""}>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Translations</h1>
        <TranslationsEditor />
      </div>
    </AdminShell>
  );
}
