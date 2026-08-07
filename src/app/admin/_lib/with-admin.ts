/**
 * withAdmin(handler) — gate a route handler behind a verified admin session.
 *
 * Use:
 *   export const POST = withAdmin(async (request, ctx, session) => { ... });
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

    if (options.role) {
      const allowed = Array.isArray(options.role)
        ? options.role
        : [options.role];
      if (!allowed.includes(session.role)) {
        return forbidden({ reason: `Role '${session.role}' is not permitted` });
      }
    }

    return handler(request, context, session);
  };
}
