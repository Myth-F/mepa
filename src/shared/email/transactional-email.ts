import { env } from "@/shared/config/env";

export interface TransactionalEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export type SendTransactionalEmail = (message: TransactionalEmail) => Promise<void>;

export const sendTransactionalEmail: SendTransactionalEmail = async (message) => {
  if (!env.EMAIL_WEBHOOK_URL) {
    if (env.NODE_ENV === "production") {
      throw new Error("EMAIL_WEBHOOK_URL is required to deliver transactional emails.");
    }
    console.info(`[email preview] ${message.subject}\n${message.text}`);
    return;
  }

  const response = await fetch(env.EMAIL_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(env.EMAIL_WEBHOOK_TOKEN ? { authorization: `Bearer ${env.EMAIL_WEBHOOK_TOKEN}` } : {}),
    },
    body: JSON.stringify({ from: env.EMAIL_FROM, ...message }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Transactional email webhook returned ${response.status}.`);
  }
};
