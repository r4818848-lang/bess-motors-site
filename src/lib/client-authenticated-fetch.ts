import { refreshClientSessionToken } from "@/lib/auth";

const TOKEN_KEY = "bess-jwt";
const CLIENT_FETCH_TIMEOUT_MS = 28_000;

/** Client API fetch with timeout and one 401 retry after JWT refresh. */
export async function clientAuthenticatedFetch(
  url: string,
  init?: RequestInit
): Promise<Response | null> {
  if (typeof window === "undefined") return null;

  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const doFetch = async (authToken: string): Promise<Response> => {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), CLIENT_FETCH_TIMEOUT_MS);
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${authToken}`);
    try {
      return await fetch(url, { ...init, headers, signal: ac.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    let res = await doFetch(token);
    if (res.status === 401) {
      const fresh = await refreshClientSessionToken();
      if (fresh) res = await doFetch(fresh);
    }
    return res;
  } catch {
    return null;
  }
}
