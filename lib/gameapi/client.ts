import "server-only";

// Thin typed client for the G2Bulk game top-up API
// (https://api.g2bulk.com/docs). The API key is a private credential, never
// exposed to the frontend — it's read straight from the server env here.
//
// Auth: most endpoints are public (games, catalogue, fields, servers, eta,
// checkPlayerId); getMe, order-creation and order history require the
// X-API-Key header.

const BASE_URL = (process.env.G2BULK_BASE_URL || "https://api.g2bulk.com/v1").replace(/\/$/, "");

function apiKey(): string {
  const key = process.env.G2BULK_API_KEY;
  if (!key) throw new Error("G2BULK_API_KEY is not set");
  return key;
}

export function isConfigured(): boolean {
  return Boolean(process.env.G2BULK_API_KEY);
}

export class G2BulkError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "G2BulkError";
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = init;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string> | undefined),
  };
  if (auth) finalHeaders["X-API-Key"] = apiKey();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    cache: "no-store",
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const message =
      (data as { message?: string })?.message || `G2Bulk request failed (HTTP ${res.status})`;
    throw new G2BulkError(message, res.status, data);
  }
  return data as T;
}

export type G2BulkGame = { id: number; code: string; name: string; image_url: string };
export type G2BulkCatalogueItem = { id: number; name: string; amount: number };

export function getMe() {
  return request<{
    success: boolean;
    user_id: number;
    username: string;
    first_name: string;
    balance: number;
  }>("/getMe");
}

export function listGames() {
  return request<{ success: boolean; games: G2BulkGame[] }>("/games", { auth: false });
}

export function getCatalogue(gameCode: string) {
  return request<{
    success: boolean;
    game: { code: string; name: string; image_url: string };
    catalogues: G2BulkCatalogueItem[];
  }>(`/games/${encodeURIComponent(gameCode)}/catalogue`, { auth: false });
}

export function getFields(gameCode: string) {
  return request<{ code: string; info: { fields: string[]; notes?: string } }>(
    "/games/fields",
    { method: "POST", auth: false, body: JSON.stringify({ game: gameCode }) },
  );
}

/** Null when the game doesn't need a server selection (provider returns 403). */
export async function getServers(gameCode: string) {
  try {
    return await request<{ code: string; servers: Record<string, string> }>(
      "/games/servers",
      { method: "POST", auth: false, body: JSON.stringify({ game: gameCode }) },
    );
  } catch (e) {
    if (e instanceof G2BulkError && e.status === 403) return null;
    throw e;
  }
}

export function checkPlayerId(input: {
  game: string;
  user_id: string;
  server_id?: string;
  charname?: string;
}) {
  return request<{ valid: string; name?: string; openid?: string }>(
    "/games/checkPlayerId",
    { method: "POST", auth: false, body: JSON.stringify(input) },
  );
}

export type CreateOrderInput = {
  catalogue_name: string;
  player_id: string;
  server_id?: string;
  charname?: string;
  remark?: string;
  callback_url: string;
};

export type CreateOrderResponse = {
  success: boolean;
  message: string;
  order: {
    order_id: number;
    game: string;
    catalogue: string;
    player_id: string;
    player_name?: string;
    price: number;
    status: string;
  };
};

export function createTopUpOrder(
  gameCode: string,
  input: CreateOrderInput,
  idempotencyKey?: string,
) {
  return request<CreateOrderResponse>(`/games/${encodeURIComponent(gameCode)}/order`, {
    method: "POST",
    body: JSON.stringify(input),
    headers: idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : undefined,
  });
}
