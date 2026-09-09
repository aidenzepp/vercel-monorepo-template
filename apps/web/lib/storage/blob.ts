import "server-only";
import { del, put } from "@vercel/blob";
import type { PutCommandOptions } from "@vercel/blob";
import { result } from "@workspace/utils/result";

import { env } from "@/env";

type PrivatePutOptions = Omit<PutCommandOptions, "access" | "token">;

const putPrivateBlob = async (
  pathname: string,
  body: Parameters<typeof put>[1],
  options: PrivatePutOptions = {}
) =>
  await result.trycatch(
    async () =>
      await put(pathname, body, {
        ...options,
        access: "private",
        token: env.BLOB_READ_WRITE_TOKEN,
      })
  );

const deleteBlob = async (urlOrPathname: string | string[]) =>
  await result.trycatch(async () => {
    await del(urlOrPathname, { token: env.BLOB_READ_WRITE_TOKEN });
  });

const blobStorage = {
  delete: deleteBlob,
  put: putPrivateBlob,
} as const;

export { blobStorage, deleteBlob, putPrivateBlob };
