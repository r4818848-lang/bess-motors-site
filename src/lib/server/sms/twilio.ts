import { toSmsDigits } from "./index";

export async function sendTwilio(phone: string, message: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !authToken || !from) {
    throw new Error("TWILIO credentials missing");
  }

  const digits = toSmsDigits(phone);
  const to = digits.startsWith("+") ? digits : `+${digits}`;

  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: message,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error("[Twilio]", res.status, err);
    throw new Error("SMS_SEND_FAILED");
  }
}
