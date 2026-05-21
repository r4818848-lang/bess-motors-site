export type SmsProvider = "smsapi" | "twilio" | "none";

export function getSmsProvider(): SmsProvider {
  const forced = process.env.SMS_PROVIDER?.toLowerCase();
  if (forced === "smsapi" && process.env.SMSAPI_TOKEN) return "smsapi";
  if (forced === "twilio" && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return "twilio";
  }
  if (process.env.SMSAPI_TOKEN) return "smsapi";
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) return "twilio";
  return "none";
}

export function isSmsConfigured(): boolean {
  return getSmsProvider() !== "none";
}

/** E.164 +48... -> 48XXXXXXXXX for SMSAPI */
export function toSmsDigits(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("48")) return d;
  if (d.length === 9) return `48${d}`;
  return d;
}

export function buildResetMessage(code: string, locale: "pl" | "ru"): string {
  if (locale === "pl") {
    return `BESS MOTORS — kod resetu hasla: ${code}. Wazny 10 min. Nie udostepniaj nikomu.`;
  }
  return `BESS MOTORS — kod восстановления пароля: ${code}. Действует 10 мин. Никому не сообщайте.`;
}

export async function sendSms(phone: string, message: string): Promise<void> {
  const provider = getSmsProvider();
  if (provider === "none") {
    throw new Error("SMS_NOT_CONFIGURED");
  }
  if (provider === "smsapi") {
    const { sendSmsApi } = await import("./smsapi");
    await sendSmsApi(phone, message);
    return;
  }
  const { sendTwilio } = await import("./twilio");
  await sendTwilio(phone, message);
}
