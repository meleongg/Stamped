import { Redis } from "@upstash/redis";

let writeClient: Redis | null = null;
let readClient: Redis | null = null;

const getRestUrl = (): string => {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  if (!url) {
    throw new Error(
      "Missing KV_REST_API_URL (or UPSTASH_REDIS_REST_URL) environment variable.",
    );
  }
  return url;
};

/** Read/write token for create and update routes. */
export const getWriteRedis = (): Redis => {
  if (!writeClient) {
    const token =
      process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!token) {
      throw new Error(
        "Missing KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_TOKEN) environment variable.",
      );
    }
    writeClient = new Redis({ url: getRestUrl(), token });
  }
  return writeClient;
};

/** Read-only token for shared map pages and OG images when available. */
export const getReadRedis = (): Redis => {
  if (!readClient) {
    const token =
      process.env.KV_REST_API_READ_ONLY_TOKEN ??
      process.env.KV_REST_API_TOKEN ??
      process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!token) {
      throw new Error("Missing KV REST token environment variable.");
    }
    readClient = new Redis({ url: getRestUrl(), token });
  }
  return readClient;
};
