/**
 * Standardized error envelope for the Next.js admin API routes.
 *
 * Goal: keep the JSON response shape consistent across handlers so the admin
 * client can rely on `{ error: string, ...details }` instead of branching on
 * status codes / free-form strings.
 */

import { NextResponse } from "next/server";

interface ErrorBody {
  error: string;
  [k: string]: unknown;
}

export function unauthorized(details: Record<string, unknown> = {}): NextResponse<ErrorBody> {
  return NextResponse.json({ error: "Unauthorized", ...details }, { status: 401 });
}

export function forbidden(details: Record<string, unknown> = {}): NextResponse<ErrorBody> {
  return NextResponse.json({ error: "Forbidden", ...details }, { status: 403 });
}

export function badRequest(details: Record<string, unknown> = {}): NextResponse<ErrorBody> {
  return NextResponse.json({ error: "Bad Request", ...details }, { status: 400 });
}

export function gatewayError(details: Record<string, unknown> = {}): NextResponse<ErrorBody> {
  return NextResponse.json({ error: "Upstream Gateway Error", ...details }, { status: 502 });
}

export function tooManyRequests(details: Record<string, unknown> = {}): NextResponse<ErrorBody> {
  return NextResponse.json({ error: "Too Many Requests", ...details }, { status: 429 });
}

export function notFound(details: Record<string, unknown> = {}): NextResponse<ErrorBody> {
  return NextResponse.json({ error: "Not Found", ...details }, { status: 404 });
}

export function internalError(details: Record<string, unknown> = {}): NextResponse<ErrorBody> {
  return NextResponse.json({ error: "Internal Server Error", ...details }, { status: 500 });
}
