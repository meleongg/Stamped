import { NextRequest, NextResponse } from "next/server";
import {
  getPublicShare,
  ShareStoreError,
  updateShare,
} from "@/app/lib/shareStore";
import { parseSharePayloadBody } from "@/app/utils/sharePayload";

const requestOrigin = (request: NextRequest): string => {
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return request.nextUrl.origin;
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const share = await getPublicShare(id);
    if (!share) {
      return NextResponse.json({ error: "Share not found." }, { status: 404 });
    }
    return NextResponse.json({
      id: share.id,
      name: share.name,
      data: share.data,
      expiresAt: share.expiresAt,
    });
  } catch {
    return NextResponse.json({ error: "Share not found." }, { status: 404 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const editToken = typeof body?.editToken === "string" ? body.editToken : "";
    if (!editToken) {
      return NextResponse.json(
        { error: "Missing edit token." },
        { status: 401 },
      );
    }
    const payload = parseSharePayloadBody(body);
    const result = await updateShare(
      id,
      editToken,
      payload,
      requestOrigin(request),
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ShareStoreError) {
      const status =
        error.code === "unauthorized"
          ? 401
          : error.code === "not_found" || error.code === "expired"
            ? 404
            : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    const message =
      error instanceof Error ? error.message : "Could not update share link.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
