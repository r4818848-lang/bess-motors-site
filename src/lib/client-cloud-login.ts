"use client";

import { persistSession } from "@/lib/auth";
import { saveClientCredentials } from "@/lib/client-credentials";
import { mergeClientPortalIntoDb, type ClientPortalSlice } from "@/lib/client-portal";
import type { User } from "@/lib/store";

export async function loginClientViaCloudApi(
  phone: string,
  plate: string
): Promise<{ user: User; portal: ClientPortalSlice } | null> {
  const res = await fetch("/api/auth/client-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, plate }),
  });
  const data = (await res.json()) as {
    ok?: boolean;
    error?: string;
    token?: string;
    portal?: ClientPortalSlice;
    user?: User;
  };
  if (!res.ok) {
    if (res.status === 503 || data.error === "cloud_disabled") return null;
    return null;
  }
  if (!data.ok || !data.token || !data.portal || !data.user) return null;

  mergeClientPortalIntoDb(data.portal);
  persistSession(data.token, "client", data.user.id);
  saveClientCredentials(phone, plate);
  return { user: data.portal.user, portal: data.portal };
}
