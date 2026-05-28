import webpush from "web-push";
import { cleanEnvValue } from "@/lib/server/supabase-config";
import type { User } from "@/lib/store";

function configureVapid(): boolean {
  const publicKey = cleanEnvValue(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  const privateKey = cleanEnvValue(process.env.VAPID_PRIVATE_KEY);
  const subject = cleanEnvValue(process.env.VAPID_SUBJECT) || "mailto:bessmotorss@gmail.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendWebPushToUser(
  user: User,
  payload: { title: string; body: string; url?: string }
): Promise<boolean> {
  const sub = user.pushSubscription;
  if (!sub?.endpoint) return false;
  if (!configureVapid()) return false;

  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch {
    return false;
  }
}

export function getVapidPublicKey(): string | null {
  return cleanEnvValue(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) || null;
}
