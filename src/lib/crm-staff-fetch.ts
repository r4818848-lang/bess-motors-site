import { refreshStaffSessionToken } from "@/lib/auth";

const SESSION_ROLE_KEY = "bess-session-role";
const TOKEN_KEY = "bess-jwt";
export const CRM_CLOUD_TIMEOUT_MS = 28_000;

function isStaffCloudWriter(): boolean {
  if (typeof window === "undefined") return false;
  const role = localStorage.getItem(SESSION_ROLE_KEY);
  return role === "admin" || role === "mechanic";
}

/** Staff CRM API fetch with timeout and one 401 retry after JWT refresh. */
export async function staffCrmFetch(
  url: string,
  init?: RequestInit
): Promise<Response | null> {
  if (typeof window === "undefined" || !isStaffCloudWriter()) return null;

  let token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  const doFetch = async (authToken: string): Promise<Response> => {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), CRM_CLOUD_TIMEOUT_MS);
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
      const fresh = await refreshStaffSessionToken();
      if (fresh) res = await doFetch(fresh);
    }
    return res;
  } catch {
    return null;
  }
}
