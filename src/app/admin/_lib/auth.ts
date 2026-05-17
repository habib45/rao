import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import "server-only";

export async function getAdminUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  
  if (!token || token.value !== "authenticated") {
    return null;
  }

  // Return a mock user object since we're using simple cookie-based auth
  return {
    id: "1",
    email: "admin@admin.com",
    role: "admin",
    name: "Admin User",
  };
}

export async function requireAdmin() {
  const user = await getAdminUser();
  if (!user) {
    redirect("/admin/login");
  }
  return user;
}
