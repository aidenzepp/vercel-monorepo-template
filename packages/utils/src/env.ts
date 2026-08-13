import { z } from "zod";

/**
 * Parse an explicit environment snapshot with a Zod schema.
 *
 * Pass direct `process.env.MY_KEY` property reads in `variables` so bundlers
 * can see each key. Do not pass `process.env` as a whole object.
 */
const createEnv = <TSchema extends z.ZodType>(
  schema: TSchema,
  variables: unknown
): z.infer<TSchema> => schema.parse(variables);

/**
 * Default workspace environment contract.
 *
 * Extend this schema (and the `variables` snapshot below) when a key is truly
 * workspace-wide. Product-specific secrets (including database URLs) belong in
 * the owning app/package via a local `createEnv` call.
 */
const EnvSchema = z.object({
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  LOG_PRETTY: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
});

type Env = z.infer<typeof EnvSchema>;

/**
 * Captures environment values through static property reads.
 */
const variables = {
  LOG_LEVEL: process.env.LOG_LEVEL,
  LOG_PRETTY: process.env.LOG_PRETTY,
} as const satisfies Record<keyof Env, unknown>;

const env: Env = createEnv(EnvSchema, variables);

export type { Env };
export { createEnv, env, EnvSchema };
