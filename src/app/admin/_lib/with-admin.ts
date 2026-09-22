/**
 * withAdmin(handler) — gate a route handler behind a verified admin session.
 *
 * Use:
 *   export const POST = withAdmin(async (request, ctx, session) => { ... });
 *
 * Routes are admin-only by default. A route editors may also call has to opt
 * in explicitly:
 *   export const POST = withAdmin(handler, { role: ["admin", "editor"] });
 *
 * On success: handler runs with the verified session as the third argument.
 * On failure: returns a 401 (or 403 when role is wrong) envelope from
 * src/lib/api/errors.ts without invoking the handler.
 */

import { NextRequest } from "next/server";
import { getAdminUser } from "@/app/admin/_lib/auth";
import { forbidden, unauthorized } from "@/lib/api/errors";
import type { AdminRole, AdminSession } from "@/app/admin/_lib/jwt";

export interface WithAdminOptions {
  role?: AdminRole | AdminRole[];
}

/** Opt-in for content-authoring routes editors are allowed to call. */
export const EDITOR_OR_ADMIN: WithAdminOptions = { role: ["admin", "editor"] };

// Match Next.js 15's route context shape. `params` is a Promise; dynamic
// route segments are strings (catch-all routes can also be string[]).
export type RouteContext<P = Record<string, string | string[]>> = {
  params: Promise<P>;
};

type Handler<P> = (
  request: NextRequest,
  context: RouteContext<P>,
  session: AdminSession,
) => Promise<Response> | Response;

export function withAdmin<P = Record<string, string | string[]>>(
  handler: Handler<P>,
  options: WithAdminOptions = {},
) {
  return async (request: NextRequest, context: RouteContext<P>) => {
    const session = await getAdminUser();
    if (!session) return unauthorized();

    const role = options.role ?? "admin";
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(session.role)) {
      return forbidden({ reason: `Role '${session.role}' is not permitted` });
    }

    return handler(request, context, session);
  };
}
