import type { GsmOrderStatus } from "@prisma/client";

// Forward-only workflow, mirrors the GSM spec's status pipeline. PENDING is
// never reachable from here (createGsmOrderForUser writes orders in as PAID).
//
// A plain constant, deliberately NOT in lib/actions/gsm-admin.ts — a
// "use server" file may only export async functions (every other export
// value is treated as a server action reference), so a plain object export
// there breaks the whole module at runtime ("A 'use server' file can only
// export async functions, found object"). Both the server action
// (setGsmOrderStatus) and the admin UI (which needs it to render the valid
// next-status options) import this shared, framework-safe module instead.
export const GSM_ALLOWED_NEXT: Record<GsmOrderStatus, GsmOrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["UNDER_REVIEW", "IN_PROGRESS", "REJECTED", "CANCELLED"],
  UNDER_REVIEW: ["IN_PROGRESS", "REJECTED", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "REJECTED", "CANCELLED"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};
