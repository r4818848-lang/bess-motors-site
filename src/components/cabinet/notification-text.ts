import type { ClientNotification } from "@/lib/store";
import type { TranslationKeys } from "@/lib/i18n/translations";

export function resolveNotificationForWatcher(
  n: ClientNotification,
  t: TranslationKeys
): { title: string; body: string; href: string } {
  const cn = t.clientNotifications;
  if (n.type === "status_change" && n.statusKey) {
    return {
      title: cn.statusTitle,
      body: cn.statusBody
        .replace("{order}", n.workOrderNumber ?? "")
        .replace("{status}", t.repairStatus[n.statusKey]),
      href: `/cabinet?tab=orders&order=${n.workOrderId ?? ""}`,
    };
  }
  if (n.type === "sign_required") {
    return {
      title: cn.signTitle,
      body: cn.signBody.replace("{order}", n.workOrderNumber ?? ""),
      href: `/cabinet?tab=orders&order=${n.workOrderId ?? ""}`,
    };
  }
  const kind = n.appointmentKind ?? "created";
  return {
    title:
      kind === "confirmed"
        ? cn.appointmentConfirmedTitle
        : kind === "rescheduled"
          ? cn.appointmentRescheduledTitle
          : cn.appointmentCreatedTitle,
    body: (kind === "confirmed" ? cn.appointmentConfirmedBody : cn.appointmentCreatedBody)
      .replace("{date}", n.appointmentDate ?? "")
      .replace("{time}", n.appointmentTime ?? ""),
    href: `/cabinet?tab=appointments`,
  };
}
