import pino from "pino";

import { env } from "./env.js";

/**
 * Shared application logger.
 *
 * Pretty transport is for local terminals. Disable with LOG_PRETTY=false on
 * hosted runtimes so logs stay as JSON lines.
 */
const logger = pino({
  level: env.LOG_LEVEL,
  ...(env.LOG_PRETTY
    ? {
        transport: {
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:standard",
          },
          target: "pino-pretty",
        },
      }
    : {}),
});

export { logger };
