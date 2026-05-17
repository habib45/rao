import { NextResponse } from "next/server";

// Simple admin authentication (in production, use proper auth with database)
const ADMIN_CREDENTIALS = {
  email: "admin@admin.com",
  password: "Password@123",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate credentials
    if (email !== ADMIN_CREDENTIALS.email || password !== ADMIN_CREDENTIALS.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Set auth cookie with minimal configuration
    const response = NextResponse.json({
      id: "1",
      email: ADMIN_CREDENTIALS.email,
      role: "admin",
      name: "Admin User",
    });

    response.cookies.set("admin_token", "authenticated", {
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
