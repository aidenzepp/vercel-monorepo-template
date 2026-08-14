import pino from "pino";

/**
 * Shared application logger.
 *
 * Pretty transport is limited to local development. Deployed runtimes receive
 * newline-delimited JSON.
 */
const loggerOptions: pino.LoggerOptions = {
  level: "info",
};

if (process.env.NODE_ENV === "development") {
  loggerOptions.transport = {
    options: {
      colorize: true,
      ignore: "pid,hostname",
      translateTime: "SYS:standard",
    },
    target: "pino-pretty",
  };
}

const logger = pino(loggerOptions);

export { logger };
