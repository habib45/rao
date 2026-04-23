import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockGetUser, mockCreateServerClient, mockCookiesStore } = vi.hoisted(() => {
  const mockGetUser = vi.fn();
  const mockCreateServerClient = vi.fn(() => ({
    auth: { getUser: mockGetUser },
  }));
  const mockCookiesStore = { getAll: vi.fn(() => []), set: vi.fn() };
  return { mockGetUser, mockCreateServerClient, mockCookiesStore };
});

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mockCreateServerClient }));
vi.mock("next/headers", () => ({ cookies: vi.fn(() => mockCookiesStore) }));

// ── Imports after mocks ───────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { getAdminUser, requireAdmin } from "../auth";

const adminUser = {
  id: "user-1",
  email: "admin@example.com",
  app_metadata: { role: "admin" },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAdminUser", () => {
  it("returns user when app_metadata.role is admin", async () => {
    mockGetUser.mockResolvedValue({ data: { user: adminUser } });
    const user = await getAdminUser();
    expect(user).toEqual(adminUser);
  });

  it("returns null when getUser returns no user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const user = await getAdminUser();
    expect(user).toBeNull();
  });

  it("returns null when user has no app_metadata", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-2", app_metadata: {} } },
    });
    const user = await getAdminUser();
    expect(user).toBeNull();
  });

  it("returns null when role is editor (not admin)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-3", app_metadata: { role: "editor" } } },
    });
    const user = await getAdminUser();
    expect(user).toBeNull();
  });

  it("returns null when role is undefined", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-4", app_metadata: {} } },
    });
    const user = await getAdminUser();
    expect(user).toBeNull();
  });
});

describe("requireAdmin", () => {
  it("returns user when admin role is present", async () => {
    mockGetUser.mockResolvedValue({ data: { user: adminUser } });
    const user = await requireAdmin();
    expect(user).toEqual(adminUser);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("calls redirect to /admin/login when user is null", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/admin/login");
  });

  it("calls redirect when role is not admin", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "u1", app_metadata: { role: "user" } } },
    });
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/admin/login");
  });
});
