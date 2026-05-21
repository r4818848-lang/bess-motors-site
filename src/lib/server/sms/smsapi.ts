import { toSmsDigits } from "./index";

/** https://www.smsapi.com/ — popular in Poland */
export async function sendSmsApi(phone: string, message: string): Promise<void> {
  const token = process.env.SMSAPI_TOKEN;
  if (!token) throw new Error("SMSAPI_TOKEN missing");

  const from = process.env.SMSAPI_FROM || "BESS MOTORS";
  const to = toSmsDigits(phone);

  const body = new URLSearchParams({
    to,
    message,
    from,
    format: "json",
    encoding: "utf-8",
  });

  const res = await fetch("https://api.smsapi.com/sms.do", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("[SMSAPI]", res.status, text);
    throw new Error("SMS_SEND_FAILED");
  }

  try {
    const json = JSON.parse(text) as { error?: number; message?: string };
    if (json.error) {
      console.error("[SMSAPI]", json);
      throw new Error("SMS_SEND_FAILED");
    }
  } catch {
    if (text.includes("ERROR")) {
      console.error("[SMSAPI]", text);
      throw new Error("SMS_SEND_FAILED");
    }
  }
}
