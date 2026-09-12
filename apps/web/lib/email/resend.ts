import "server-only";
import { Resend } from "resend";

import { env } from "@/env";

/**
 * Server-only Resend client configured from the web application's environment.
 *
 * @see https://resend.com/docs/send-with-nextjs
 */
const resend = new Resend(env.RESEND_API_KEY);

export { resend };
