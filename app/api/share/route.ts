import { NextRequest, NextResponse } from "next/server";
import {
  checkCreateRateLimit,
  createShare,
  ShareStoreError,
} from "@/app/lib/shareStore";
import { parseSharePayloadBody } from "@/app/utils/sharePayload";

const clientIp = (request: NextRequest): string =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  request.headers.get("x-real-ip") ??
  "unknown";

const requestOrigin = (request: NextRequest): string => {
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return request.nextUrl.origin;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = parseSharePayloadBody(body);
    await checkCreateRateLimit(clientIp(request));
    const result = await createShare(payload, requestOrigin(request));
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ShareStoreError) {
      const status = error.code === "rate_limited" ? 429 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    const message =
      error instanceof Error ? error.message : "Could not create share link.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
