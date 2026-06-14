import { NextResponse } from "next/server";

const MYSQL_API_URL = process.env.MYSQL_API_URL ?? "http://localhost:4000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // Forward to API Gateway for authentication
    const res = await fetch(`${MYSQL_API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, rememberMe }),
    });

    if (!res.ok) {
      const error = await res.json() as { error?: string };
      return NextResponse.json(
        { error: error.error || "Invalid credentials" },
        { status: res.status }
      );
    }

    const data = await res.json() as {
      id: string;
      email: string;
      role: string;
      name: string;
      username?: string;
    };

    // Set auth cookie
    const response = NextResponse.json({
      id: data.id,
      email: data.email,
      role: data.role,
      name: data.name,
      username: data.username,
    });

    response.cookies.set("admin_token", "authenticated", {
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24, // 30 days if remember me, else 24 hours
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (_error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
