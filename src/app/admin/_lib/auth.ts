import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminSession, type AdminSession } from "@/app/admin/_lib/jwt";

/**
 * Reads the signed JWT from the admin_token cookie and returns the embedded
 * session, or null if absent / invalid. Used by both page (RSC) and route
 * handlers via withAdmin().
 */
export async function getAdminUser(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return await verifyAdminSession(token);
}

/**
 * RSC helper: redirects to /admin/login when the session is missing or
 * invalid. Pages should call this at the top of the render so protected
 * views never flash before redirect.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminUser();
  if (!session) redirect("/admin/login");
  return session;
}
