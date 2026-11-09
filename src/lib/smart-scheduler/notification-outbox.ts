import type { Client } from "pg";

/**
 * Delivery of scheduler_notification_log.
 * The booking transaction records a pending row. Sending happens after commit.
 * A second worker cannot claim a row that is already sending inside its lease.
 * Status sent means this process recorded a successful handoff.
 * Telegram and the other providers do not offer an idempotency key this code can enforce,
 * so a crash after the provider accepts the message and before status becomes sent can deliver twice.
 * That is at-least-once with a bounded retry, not exactly-once.
 */
export const NOTIFICATION_MAX_ATTEMPTS = 5;

export function notificationRetryDelayMs(attempt: number): number {
  const step = Math.max(0, attempt - 1);
  return Math.min(60_000, 1000 * 2 ** step);
}

type Claimed = { event_key: string; attempt_count: number; max_attempts: number };

export async function deliverNotification(
  client: Client,
  eventKey: string,
  send: () => Promise<void>,
  worker = `worker-${process.pid}`
): Promise<"sent" | "pending" | "failed" | "busy" | "skipped"> {
  const claimed = await claim(client, worker, eventKey);
  if (!claimed) return "skipped";
  return finishClaim(client, claimed, worker, send);
}

export async function retryPendingNotifications(
  client: Client,
  send: (eventKey: string) => Promise<void>,
  worker = `retry-${process.pid}`,
  limit = 20
): Promise<number> {
  let delivered = 0;
  for (let index = 0; index < limit; index++) {
    const claimed = await claim(client, worker, null);
    if (!claimed) break;
    const result = await finishClaim(client, claimed, worker, () => send(claimed.event_key));
    if (result === "sent") delivered += 1;
  }
  return delivered;
}

async function claim(client: Client, worker: string, eventKey: string | null): Promise<Claimed | null> {
  const claimed = await client.query<Claimed>("select * from scheduler_claim_notification($1, $2)", [worker, eventKey]);
  return claimed.rows[0] ?? null;
}

async function finishClaim(
  client: Client,
  claimed: Claimed,
  worker: string,
  send: () => Promise<void>
): Promise<"sent" | "pending" | "failed" | "busy"> {
  try {
    await send();
    const marked = await client.query(
      `update scheduler_notification_log
       set status = 'sent', send_count = send_count + 1, delivered_at = now(), locked_by = null, locked_until = null, last_error = null, updated_at = now()
       where event_key = $1 and status = 'sending' and locked_by = $2`,
      [claimed.event_key, worker]
    );
    return (marked.rowCount ?? 0) > 0 ? "sent" : "busy";
  } catch (error) {
    const message = (error instanceof Error ? error.message : "send_failed").slice(0, 500);
    const delay = notificationRetryDelayMs(claimed.attempt_count);
    const failed = claimed.attempt_count >= claimed.max_attempts;
    await client.query(
      `update scheduler_notification_log
       set status = $3,
           last_error = $4,
           error_history = error_history || jsonb_build_array(jsonb_build_object('at', now(), 'attempt', attempt_count, 'error', $4::text)),
           next_attempt_at = now() + make_interval(secs => $5::double precision / 1000.0),
           locked_by = null,
           locked_until = null,
           updated_at = now()
       where event_key = $1 and locked_by = $2`,
      [claimed.event_key, worker, failed ? "failed" : "pending", message, String(delay)]
    );
    return failed ? "failed" : "pending";
  }
}
