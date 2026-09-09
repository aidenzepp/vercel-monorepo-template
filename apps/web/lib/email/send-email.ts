import "server-only";
import { logger } from "@workspace/utils/logger";
import { result } from "@workspace/utils/result";
import { Resend } from "resend";

import { env } from "@/env";
import type { AuthEmailMessage } from "@/lib/auth/auth-foundation";

const resend = new Resend(env.RESEND_API_KEY);

const sendEmail = async ({
  subject,
  text,
  to,
}: AuthEmailMessage): Promise<void> => {
  const response = await result.trycatch(
    async () =>
      await resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        subject,
        text,
        to,
      })
  );

  if (!response.ok) {
    logger.error({ error: response.error }, "Email delivery request failed");
    throw response.error;
  }

  if (response.value.error) {
    const error = new Error(response.value.error.message, {
      cause: response.value.error,
    });
    logger.error({ error }, "Email provider rejected delivery");
    throw error;
  }
};

export { sendEmail };
